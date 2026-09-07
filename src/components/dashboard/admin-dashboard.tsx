'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  Car as CarIcon,
  CircleDollarSign,
  Users,
  CalendarCheck,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Shield,
  Save,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { StatusBadge } from '@/components/shared/status-badge'
import { carsApi, bookingsApi, adminApi, ApiError } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { carTypes, transmissions, fuels } from '@/lib/validations'
import type { Car, Booking } from '@/types'
import { useUIStore } from '@/store/ui-store'

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'] as const

export function AdminDashboard() {
  const { toast } = useToast()
  const { setView } = useUIStore()
  const [stats, setStats] = useState<{
    totalCars: number
    availableCars: number
    totalBookings: number
    totalUsers: number
    revenue: number
  } | null>(null)
  const [cars, setCars] = useState<Car[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  const [editing, setEditing] = useState<Car | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Car | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([adminApi.stats(), carsApi.list({ limit: 24 }), bookingsApi.list()])
      .then(([s, c, b]) => {
        setStats(s)
        setCars(c.cars)
        setBookings(b.bookings)
      })
      .catch(() => {
        setStats(null)
        setCars([])
        setBookings([])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (car: Car) => {
    setEditing(car)
    setDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await carsApi.remove(deleteTarget.id)
      toast({ title: 'Car deleted', description: `${deleteTarget.name} removed.` })
      setDeleteTarget(null)
      load()
    } catch (err) {
      const e = err as ApiError
      toast({ title: 'Could not delete', description: e.message, variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await bookingsApi.updateStatus(id, status)
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: status as Booking['status'] } : b)),
      )
      toast({ title: 'Status updated', description: `Booking marked as ${status}.` })
    } catch (err) {
      const e = err as ApiError
      toast({ title: 'Update failed', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-24">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="h-6 w-6 text-primary" />
        <span className="text-xs uppercase tracking-wide text-primary font-semibold">
          Admin
        </span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground mt-2">
        Manage your fleet and oversee every booking.
      </p>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 mb-10">
        <Kpi
          icon={<CarIcon className="h-5 w-5" />}
          label="Total cars"
          value={stats ? String(stats.totalCars) : '—'}
          tint="text-amber-300 bg-amber-500/10"
        />
        <Kpi
          icon={<CalendarCheck className="h-5 w-5" />}
          label="Total bookings"
          value={stats ? String(stats.totalBookings) : '—'}
          tint="text-sky-300 bg-sky-500/10"
        />
        <Kpi
          icon={<Users className="h-5 w-5" />}
          label="Users"
          value={stats ? String(stats.totalUsers) : '—'}
          tint="text-emerald-300 bg-emerald-500/10"
        />
        <Kpi
          icon={<CircleDollarSign className="h-5 w-5" />}
          label="Revenue"
          value={stats ? `$${Math.round(stats.revenue)}` : '—'}
          tint="text-primary bg-primary/10"
        />
      </div>

      <Tabs defaultValue="cars" className="w-full">
        <TabsList className="bg-card/50 border border-white/10">
          <TabsTrigger value="cars">Cars ({cars.length})</TabsTrigger>
          <TabsTrigger value="bookings">Bookings ({bookings.length})</TabsTrigger>
        </TabsList>

        {/* Cars tab */}
        <TabsContent value="cars" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Fleet management</h2>
            <Button onClick={openCreate} className="bg-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" /> Add car
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg bg-white/5" />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto scroll-dark">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-muted-foreground">
                    <tr>
                      <th className="text-left font-medium px-4 py-3">Car</th>
                      <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Type</th>
                      <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Price/day</th>
                      <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Status</th>
                      <th className="text-right font-medium px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cars.map((car) => (
                      <tr
                        key={car.id}
                        className="border-t border-white/5 hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={car.image}
                              alt={car.name}
                              className="h-10 w-16 object-cover rounded"
                            />
                            <div className="min-w-0">
                              <p className="font-medium truncate">{car.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {car.brand}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <Badge variant="outline" className="border-white/10">
                            {car.type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          ${Math.round(car.pricePerDay)}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {car.available ? (
                            <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                              Available
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-500/15 text-rose-300 border-rose-500/30">
                              Unavailable
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => openEdit(car)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-rose-300 hover:text-rose-200 hover:bg-rose-500/10"
                              onClick={() => setDeleteTarget(car)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Bookings tab */}
        <TabsContent value="bookings" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">All bookings</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg bg-white/5" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <Card className="p-10 text-center border-white/10 bg-card/40">
              <p className="text-muted-foreground">No bookings yet.</p>
            </Card>
          ) : (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto scroll-dark">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-muted-foreground">
                    <tr>
                      <th className="text-left font-medium px-4 py-3">Customer</th>
                      <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Car</th>
                      <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Dates</th>
                      <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Total</th>
                      <th className="text-left font-medium px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr
                        key={b.id}
                        className="border-t border-white/5 hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium">{b.user?.name ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">
                            {b.user?.email}
                          </p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {b.car && (
                            <div className="flex items-center gap-2">
                              <img
                                src={b.car.image}
                                alt={b.car.name}
                                className="h-8 w-12 object-cover rounded"
                              />
                              <span className="truncate max-w-[140px]">
                                {b.car.name}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                          {format(new Date(b.startDate), 'MMM d')} →{' '}
                          {format(new Date(b.endDate), 'MMM d')}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell font-medium">
                          ${b.totalPrice}
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={b.status}
                            onValueChange={(v) => handleStatusChange(b.id, v)}
                          >
                            <SelectTrigger className="w-[140px] h-8 bg-background/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((s) => (
                                <SelectItem key={s} value={s} className="capitalize">
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Car form dialog */}
      <CarFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        car={editing}
        onSaved={() => {
          setDialogOpen(false)
          load()
        }}
      />

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent className="bg-background border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this car?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.brand} {deleteTarget?.name} will be permanently
              removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mt-10 text-center">
        <Button variant="ghost" onClick={() => setView('cars')}>
          Back to fleet
        </Button>
      </div>
    </div>
  )
}

function Kpi({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  tint: string
}) {
  return (
    <Card className="p-4 border-white/10 bg-card/50">
      <div className={`grid place-items-center h-10 w-10 rounded-lg mb-3 ${tint}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </Card>
  )
}

/* ----------------------- Car form dialog ------------------------ */

function CarFormDialog({
  open,
  onOpenChange,
  car,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  car: Car | null
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    brand: '',
    type: 'Sedan' as string,
    transmission: 'Automatic' as string,
    fuel: 'Petrol' as string,
    seats: 5,
    year: new Date().getFullYear(),
    pricePerDay: 200,
    image: '',
    features: '',
    description: '',
    available: true,
    featured: false,
    rating: 4.5,
  })

  useEffect(() => {
    if (car) {
      setForm({
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
      })
    } else {
      setForm({
        name: '',
        brand: '',
        type: 'Sedan',
        transmission: 'Automatic',
        fuel: 'Petrol',
        seats: 5,
        year: new Date().getFullYear(),
        pricePerDay: 200,
        image: '',
        features: '',
        description: '',
        available: true,
        featured: false,
        rating: 4.5,
      })
    }
  }, [car, open])

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async () => {
    setSaving(true)
    try {
      if (car) {
        await carsApi.update(car.id, form)
        toast({ title: 'Car updated', description: `${form.name} saved.` })
      } else {
        await carsApi.create(form)
        toast({ title: 'Car added', description: `${form.name} added to fleet.` })
      }
      onSaved()
    } catch (err) {
      const e = err as ApiError
      toast({
        title: 'Could not save car',
        description: e.fields ? Object.values(e.fields)[0] : e.message,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scroll-dark bg-background border-white/10">
        <DialogHeader>
          <DialogTitle>{car ? 'Edit car' : 'Add new car'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <FormField label="Name">
            <Input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Model S"
              className="bg-background/50"
            />
          </FormField>
          <FormField label="Brand">
            <Input
              value={form.brand}
              onChange={(e) => set('brand', e.target.value)}
              placeholder="Tesla"
              className="bg-background/50"
            />
          </FormField>
          <FormField label="Type">
            <Select value={form.type} onValueChange={(v) => set('type', v)}>
              <SelectTrigger className="bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {carTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Transmission">
            <Select
              value={form.transmission}
              onValueChange={(v) => set('transmission', v)}
            >
              <SelectTrigger className="bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {transmissions.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Fuel">
            <Select value={form.fuel} onValueChange={(v) => set('fuel', v)}>
              <SelectTrigger className="bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fuels.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Seats">
            <Input
              type="number"
              min={2}
              max={9}
              value={form.seats}
              onChange={(e) => set('seats', Number(e.target.value))}
              className="bg-background/50"
            />
          </FormField>
          <FormField label="Year">
            <Input
              type="number"
              value={form.year}
              onChange={(e) => set('year', Number(e.target.value))}
              className="bg-background/50"
            />
          </FormField>
          <FormField label="Price per day ($)">
            <Input
              type="number"
              min={1}
              value={form.pricePerDay}
              onChange={(e) => set('pricePerDay', Number(e.target.value))}
              className="bg-background/50"
            />
          </FormField>
          <FormField label="Rating (0-5)" className="sm:col-span-2">
            <Input
              type="number"
              step={0.1}
              min={0}
              max={5}
              value={form.rating}
              onChange={(e) => set('rating', Number(e.target.value))}
              className="bg-background/50"
            />
          </FormField>
          <FormField label="Image URL" className="sm:col-span-2">
            <Input
              value={form.image}
              onChange={(e) => set('image', e.target.value)}
              placeholder="https://..."
              className="bg-background/50"
            />
          </FormField>
          <FormField label="Features (comma-separated)" className="sm:col-span-2">
            <Input
              value={form.features}
              onChange={(e) => set('features', e.target.value)}
              placeholder="Leather, Sunroof, Bose Audio"
              className="bg-background/50"
            />
          </FormField>
          <FormField label="Description" className="sm:col-span-2">
            <Textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              placeholder="A short description of the car..."
              className="bg-background/50 resize-none"
            />
          </FormField>
          <div className="sm:col-span-2 flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.available}
                onCheckedChange={(v) => set('available', v)}
              />
              Available
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.featured}
                onCheckedChange={(v) => set('featured', v)}
              />
              Featured
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !form.name || !form.brand || !form.image}
            className="bg-primary text-primary-foreground"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {car ? 'Save changes' : 'Add car'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FormField({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
