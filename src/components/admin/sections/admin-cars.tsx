'use client'

import { useEffect, useState } from 'react'
import {
  Plus,
  Search,
  Archive,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Pencil,
  ArchiveRestore,
  Loader2,
} from 'lucide-react'
import { adminApi } from '@/lib/api'
import type { AdminTableQuery, ApiError } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { cn, formatCurrency } from '@/lib/utils'
import {
  carSchema,
  carTypes,
  transmissions,
  fuels,
  type CarInput,
} from '@/lib/validations'
import type { Car } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerDescription,
} from '@/components/ui/drawer'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  AdminPageHeader,
  AdminTableSkeleton,
  AdminPagination,
  AdminEmptyState,
} from '../admin-ui'

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name' },
  { value: 'price', label: 'Price' },
  { value: 'year', label: 'Year' },
] as const

type SortValue = (typeof SORTS)[number]['value']

const PAGE_SIZE = 10

const emptyForm: CarInput = {
  name: '',
  brand: '',
  type: 'Sedan',
  transmission: 'Automatic',
  fuel: 'Petrol',
  seats: 5,
  year: new Date().getFullYear(),
  pricePerDay: 100,
  image: '',
  features: '',
  description: '',
  available: true,
  featured: false,
  rating: 4.5,
}

function toForm(car: Car): CarInput {
  return {
    name: car.name,
    brand: car.brand,
    type: car.type,
    transmission: car.transmission,
    fuel: car.fuel,
    seats: car.seats,
    year: car.year,
    pricePerDay: car.pricePerDay,
    image: car.image,
    features: car.features,
    description: car.description,
    available: car.available,
    featured: car.featured,
    rating: car.rating,
  }
}

type ConfirmState = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  destructive: boolean
  onConfirm: () => Promise<void>
}

const noConfirm: ConfirmState = {
  open: false,
  title: '',
  description: '',
  confirmLabel: 'Confirm',
  destructive: false,
  onConfirm: async () => {},
}

export function AdminCars() {
  const { toast } = useToast()

  const [cars, setCars] = useState<Car[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  // query state
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sort, setSort] = useState<SortValue>('newest')
  const [archived, setArchived] = useState(false)
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)

  // selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingCar, setEditingCar] = useState<Car | null>(null)
  const [form, setForm] = useState<CarInput>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // confirm dialog state
  const [confirm, setConfirm] = useState<ConfirmState>(noConfirm)

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  // fetch
  useEffect(() => {
    let active = true
    setLoading(true)
    const q: AdminTableQuery = {
      search: search || undefined,
      type: typeFilter === 'all' ? undefined : typeFilter,
      sort,
      archived,
      page,
      limit: PAGE_SIZE,
    }
    adminApi.cars
      .list(q)
      .then((res) => {
        if (!active) return
        setCars(res.cars)
        setTotalPages(res.pagination.totalPages)
        setSelectedIds(new Set())
      })
      .catch((err) => {
        const e = err as ApiError
        toast({
          title: 'Failed to load cars',
          description: e.message,
          variant: 'destructive',
        })
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [search, typeFilter, sort, archived, page, reloadKey, toast])

  const reload = () => setReloadKey((k) => k + 1)

  // ---------- selection ----------
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allSelected = cars.length > 0 && cars.every((c) => selectedIds.has(c.id))
  const someSelected = cars.some((c) => selectedIds.has(c.id))

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(cars.map((c) => c.id)))
  }

  const clearSelection = () => setSelectedIds(new Set())

  // ---------- drawer ----------
  const openCreate = () => {
    setEditingCar(null)
    setForm(emptyForm)
    setErrors({})
    setDrawerOpen(true)
  }

  const openEdit = (car: Car) => {
    setEditingCar(car)
    setForm(toForm(car))
    setErrors({})
    setDrawerOpen(true)
  }

  function setField<K extends keyof CarInput>(key: K, value: CarInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const submitForm = async () => {
    setErrors({})
    const parsed = carSchema.safeParse(form)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const k = issue.path[0]
        if (typeof k === 'string' && !fieldErrors[k]) {
          fieldErrors[k] = issue.message
        }
      }
      setErrors(fieldErrors)
      return
    }
    setSaving(true)
    try {
      if (editingCar) {
        const res = await adminApi.cars.update(editingCar.id, parsed.data)
        toast({
          title: 'Car updated',
          description: `${res.car.brand} ${res.car.name} saved.`,
        })
      } else {
        const res = await adminApi.cars.create(parsed.data)
        toast({
          title: 'Car created',
          description: `${res.car.brand} ${res.car.name} added to the fleet.`,
        })
      }
      setDrawerOpen(false)
      reload()
    } catch (err) {
      const e = err as ApiError
      if (e.fields) setErrors(e.fields)
      toast({
        title: editingCar ? 'Update failed' : 'Create failed',
        description: e.message,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // ---------- archive / restore (single) ----------
  const confirmArchive = (car: Car) => {
    setConfirm({
      open: true,
      title: car.archived ? 'Restore car?' : 'Archive car?',
      description: car.archived
        ? `${car.brand} ${car.name} will be visible again in the active fleet.`
        : `${car.brand} ${car.name} will be hidden from customers but kept in records.`,
      confirmLabel: car.archived ? 'Restore' : 'Archive',
      destructive: !car.archived,
      onConfirm: async () => {
        try {
          await adminApi.cars.archive(car.id, !car.archived)
          toast({
            title: car.archived ? 'Car restored' : 'Car archived',
            description: `${car.brand} ${car.name}.`,
          })
          reload()
        } catch (err) {
          const e = err as ApiError
          toast({
            title: 'Action failed',
            description: e.message,
            variant: 'destructive',
          })
        } finally {
          setConfirm(noConfirm)
        }
      },
    })
  }

  // ---------- bulk ----------
  const runBulk = (
    action: 'archive' | 'restore' | 'setAvailable' | 'setUnavailable',
    label: string,
  ) => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setConfirm({
      open: true,
      title: `${label} ${ids.length} car${ids.length === 1 ? '' : 's'}?`,
      description:
        action === 'archive'
          ? 'Selected cars will be hidden from customers.'
          : action === 'restore'
            ? 'Selected cars will reappear in the active fleet.'
            : action === 'setAvailable'
              ? 'Selected cars will be marked as available for booking.'
              : 'Selected cars will be marked as unavailable for booking.',
      confirmLabel: label,
      destructive: action === 'archive',
      onConfirm: async () => {
        try {
          const res = await adminApi.cars.bulk(ids, action)
          toast({
            title: 'Bulk action complete',
            description: `${res.updated} car${res.updated === 1 ? '' : 's'} updated.`,
          })
          clearSelection()
          reload()
        } catch (err) {
          const e = err as ApiError
          toast({
            title: 'Bulk action failed',
            description: e.message,
            variant: 'destructive',
          })
        } finally {
          setConfirm(noConfirm)
        }
      },
    })
  }

  const selectedCount = selectedIds.size

  return (
    <div>
      <AdminPageHeader
        title="Fleet — Cars"
        description="Add, edit, archive and manage availability across your car inventory."
        actions={
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4" /> Add car
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or brand…"
            className="pl-9 bg-card/40 border-white/10"
            aria-label="Search cars"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v)
              setPage(1)
            }}
          >
            <SelectTrigger
              className="w-[140px] bg-card/40 border-white/10"
              aria-label="Filter by type"
            >
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-white/10">
              <SelectItem value="all">All types</SelectItem>
              {carTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v) => setSort(v as SortValue)}>
            <SelectTrigger
              className="w-[140px] bg-card/40 border-white/10"
              aria-label="Sort cars"
            >
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-white/10">
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant={archived ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setArchived((a) => !a)
              setPage(1)
            }}
            className="border-white/10"
            aria-pressed={archived}
          >
            <ArchiveRestore className="h-4 w-4" />
            {archived ? 'Showing archived' : 'Show archived'}
          </Button>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-medium">{selectedCount} selected</span>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <Button
            size="sm"
            variant="outline"
            className="border-white/10"
            onClick={() => runBulk('archive', 'Archive selected')}
          >
            <Archive className="h-3.5 w-3.5" /> Archive
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-white/10"
            onClick={() => runBulk('restore', 'Restore selected')}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restore
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-white/10"
            onClick={() => runBulk('setAvailable', 'Set available')}
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Set available
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-white/10"
            onClick={() => runBulk('setUnavailable', 'Set unavailable')}
          >
            <XCircle className="h-3.5 w-3.5" /> Set unavailable
          </Button>
          <Button size="sm" variant="ghost" className="ml-auto" onClick={clearSelection}>
            Clear
          </Button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <AdminTableSkeleton cols={6} rows={6} />
      ) : cars.length === 0 ? (
        <AdminEmptyState
          title="No cars found"
          description={
            archived
              ? 'No archived cars match your filters.'
              : 'No cars match your filters. Try adjusting search or add a new car.'
          }
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add car
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden bg-card/30">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="w-10 pl-4">
                  <Checkbox
                    checked={
                      allSelected || (someSelected ? 'indeterminate' : false)
                    }
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all cars"
                  />
                </TableHead>
                <TableHead>Car</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price/day</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cars.map((car) => {
                const isSelected = selectedIds.has(car.id)
                return (
                  <TableRow
                    key={car.id}
                    className={cn(
                      'border-white/5',
                      isSelected && 'bg-primary/5',
                    )}
                  >
                    <TableCell className="pl-4">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(car.id)}
                        aria-label={`Select ${car.brand} ${car.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={car.image}
                          alt={`${car.brand} ${car.name}`}
                          className="h-10 w-14 object-cover rounded"
                        />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{car.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {car.brand}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-white/10 bg-white/5 font-normal"
                      >
                        {car.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatCurrency(car.pricePerDay)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {car.seats}
                    </TableCell>
                    <TableCell>
                      {car.available ? (
                        <Badge className="border border-emerald-500/30 bg-emerald-500/15 text-emerald-300">
                          Available
                        </Badge>
                      ) : (
                        <Badge className="border border-rose-500/30 bg-rose-500/15 text-rose-300">
                          Unavailable
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(car)}
                          aria-label={`Edit ${car.brand} ${car.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => confirmArchive(car)}
                          aria-label={
                            car.archived
                              ? `Restore ${car.brand} ${car.name}`
                              : `Archive ${car.brand} ${car.name}`
                          }
                        >
                          {car.archived ? (
                            <RotateCcw className="h-3.5 w-3.5" />
                          ) : (
                            <Archive className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {!loading && cars.length > 0 && (
        <AdminPagination page={page} totalPages={totalPages} onPage={setPage} />
      )}

      {/* Add/Edit Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
        <DrawerContent className="bg-card border-white/10 sm:max-w-md">
          <DrawerHeader className="border-b border-white/10">
            <DrawerTitle>{editingCar ? 'Edit car' : 'Add car'}</DrawerTitle>
            <DrawerDescription>
              {editingCar
                ? 'Update the details for this car.'
                : 'Fill in the details to add a new car to the fleet.'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <Field label="Name" error={errors.name}>
              <Input
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="Model S"
                className="bg-background/60 border-white/10"
              />
            </Field>
            <Field label="Brand" error={errors.brand}>
              <Input
                value={form.brand}
                onChange={(e) => setField('brand', e.target.value)}
                placeholder="Tesla"
                className="bg-background/60 border-white/10"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type" error={errors.type}>
                <Select
                  value={form.type}
                  onValueChange={(v) => setField('type', v as CarInput['type'])}
                >
                  <SelectTrigger className="bg-background/60 border-white/10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-white/10">
                    {carTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Transmission" error={errors.transmission}>
                <Select
                  value={form.transmission}
                  onValueChange={(v) =>
                    setField('transmission', v as CarInput['transmission'])
                  }
                >
                  <SelectTrigger className="bg-background/60 border-white/10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-white/10">
                    {transmissions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fuel" error={errors.fuel}>
                <Select
                  value={form.fuel}
                  onValueChange={(v) => setField('fuel', v as CarInput['fuel'])}
                >
                  <SelectTrigger className="bg-background/60 border-white/10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-white/10">
                    {fuels.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Seats" error={errors.seats}>
                <Input
                  type="number"
                  min={2}
                  max={9}
                  value={form.seats}
                  onChange={(e) => setField('seats', Number(e.target.value))}
                  className="bg-background/60 border-white/10"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Year" error={errors.year}>
                <Input
                  type="number"
                  min={1990}
                  max={new Date().getFullYear() + 1}
                  value={form.year}
                  onChange={(e) => setField('year', Number(e.target.value))}
                  className="bg-background/60 border-white/10"
                />
              </Field>
              <Field label="Price / day (USD)" error={errors.pricePerDay}>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={form.pricePerDay}
                  onChange={(e) =>
                    setField('pricePerDay', Number(e.target.value))
                  }
                  className="bg-background/60 border-white/10"
                />
              </Field>
            </div>
            <Field label="Rating (0–5)" error={errors.rating}>
              <Input
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={form.rating}
                onChange={(e) => setField('rating', Number(e.target.value))}
                className="bg-background/60 border-white/10"
              />
            </Field>
            <Field label="Image URL" error={errors.image}>
              <Input
                value={form.image}
                onChange={(e) => setField('image', e.target.value)}
                placeholder="https://…"
                className="bg-background/60 border-white/10"
              />
            </Field>
            <Field
              label="Features (comma-separated)"
              error={errors.features}
              hint="e.g. Leather seats, Sunroof, GPS"
            >
              <Input
                value={form.features}
                onChange={(e) => setField('features', e.target.value)}
                className="bg-background/60 border-white/10"
              />
            </Field>
            <Field label="Description" error={errors.description}>
              <Textarea
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                rows={3}
                className="bg-background/60 border-white/10"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-background/40 px-3 py-2.5">
                <Label htmlFor="car-available" className="text-sm">
                  Available
                </Label>
                <Switch
                  id="car-available"
                  checked={form.available}
                  onCheckedChange={(v) => setField('available', v)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-background/40 px-3 py-2.5">
                <Label htmlFor="car-featured" className="text-sm">
                  Featured
                </Label>
                <Switch
                  id="car-featured"
                  checked={form.featured}
                  onCheckedChange={(v) => setField('featured', v)}
                />
              </div>
            </div>
          </div>
          <DrawerFooter className="border-t border-white/10 flex-row justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setDrawerOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={submitForm} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingCar ? 'Save changes' : 'Create car'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Confirm dialog */}
      <AlertDialog
        open={confirm.open}
        onOpenChange={(o) => !o && setConfirm(noConfirm)}
      >
        <AlertDialogContent className="bg-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                confirm.destructive &&
                  'bg-rose-600 hover:bg-rose-600/90 text-white',
              )}
              onClick={confirm.onConfirm}
            >
              {confirm.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {hint && !error && (
        <p className="text-[11px] text-muted-foreground/70">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] text-rose-300" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
