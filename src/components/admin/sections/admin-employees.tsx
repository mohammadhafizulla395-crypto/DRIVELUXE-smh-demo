'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  UserPlus, Search, X, Ban, CheckCircle2, KeyRound, Briefcase, Loader2,
} from 'lucide-react'
import { adminApi, ApiError, type AdminTableQuery } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import {
  AdminPageHeader, AdminTableSkeleton, AdminPagination, AdminEmptyState,
} from '../admin-ui'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter,
} from '@/components/ui/drawer'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Employee } from '@/types'

const ROLE_LABELS: Record<string, string> = {
  support: 'Support',
  fleet: 'Fleet',
  customer_care: 'Customer Care',
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  suspended: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  inactive: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
}

interface EmployeeRow extends Employee {
  _count?: { reports: number; assignedTickets: number }
}

export function AdminEmployees() {
  const { toast } = useToast()
  const [rows, setRows] = useState<EmployeeRow[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [loadedKey, setLoadedKey] = useState('')
  const loaded = loadedKey !== ''
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [role, setRole] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [actionTarget, setActionTarget] = useState<{ employee: EmployeeRow; action: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [newRole, setNewRole] = useState('support')

  // Create form state
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'support' })

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [search])

  const queryKey = `${debounced}|${role}|${status}|${sort}|${page}`

  const load = useCallback(() => {
    const q: AdminTableQuery = {
      search: debounced || undefined,
      role: role !== 'all' ? role : undefined,
      status: status !== 'all' ? status : undefined,
      sort, page, limit: 10,
    }
    adminApi.employees.list(q).then((res) => {
      setRows(res.employees as EmployeeRow[])
      setPagination(res.pagination)
      setLoadedKey(queryKey)
    }).catch((err) => {
      const e = err as ApiError
      toast({ title: 'Load failed', description: e.message, variant: 'destructive' })
      setRows([])
      setLoadedKey(queryKey)
    })
  }, [debounced, role, status, sort, page, queryKey, toast])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async () => {
    if (!form.name || !form.email) {
      toast({ title: 'Name and email are required', variant: 'destructive' })
      return
    }
    setBusy(true)
    try {
      const res = await adminApi.employees.create({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        role: form.role,
      })
      toast({
        title: 'Employee created',
        description: `${res.employee.employeeId} — temp password: emp123`,
      })
      setForm({ name: '', email: '', phone: '', role: 'support' })
      setCreateOpen(false)
      load()
    } catch (err) {
      const e = err as ApiError
      toast({ title: 'Could not create employee', description: e.message, variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const confirmAction = async () => {
    if (!actionTarget) return
    setBusy(true)
    try {
      const data: Record<string, string> = { action: actionTarget.action }
      if (actionTarget.action === 'change_role') data.role = newRole
      await adminApi.employees.manage(actionTarget.employee.id, data)
      toast({ title: 'Action completed' })
      setActionTarget(null)
      load()
    } catch (err) {
      const e = err as ApiError
      toast({ title: 'Action failed', description: e.message, variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Employees"
        description="Create and manage employee accounts. Employees never self-register."
        actions={
          <Button onClick={() => setCreateOpen(true)} className="bg-primary text-primary-foreground">
            <UserPlus className="h-4 w-4 mr-2" /> Add employee
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, or email…"
            className="pl-9 bg-card/40"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={role} onValueChange={(v) => { setRole(v); setPage(1) }}>
          <SelectTrigger className="w-[150px] bg-card/40"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="support">Support</SelectItem>
            <SelectItem value="fleet">Fleet</SelectItem>
            <SelectItem value="customer_care">Customer Care</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-[150px] bg-card/40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1) }}>
          <SelectTrigger className="w-[150px] bg-card/40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="tickets">Most tickets resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!loaded ? (
        <AdminTableSkeleton cols={6} rows={8} />
      ) : rows.length === 0 ? (
        <AdminEmptyState title="No employees found" description="Create your first employee to get started." />
      ) : (
        <Card className="border-white/10 overflow-hidden p-0">
          <div className="overflow-x-auto scroll-dark">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Employee ID</th>
                  <th className="text-left font-medium px-4 py-3">Name</th>
                  <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Role</th>
                  <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Tickets</th>
                  <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">Rating</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-right font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((emp) => (
                  <tr key={emp.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono text-xs">{emp.employeeId}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant="outline" className="border-white/10">{ROLE_LABELS[emp.role] ?? emp.role}</Badge>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                      {emp.ticketsResolved}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-amber-300">
                      {emp.customerRating > 0 ? emp.customerRating.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[emp.status] ?? STATUS_STYLES.inactive}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {emp.status === 'active' ? (
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-300 hover:bg-rose-500/10" onClick={() => setActionTarget({ employee: emp, action: 'suspend' })} aria-label="Suspend">
                            <Ban className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-300 hover:bg-emerald-500/10" onClick={() => setActionTarget({ employee: emp, action: 'activate' })} aria-label="Activate">
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setActionTarget({ employee: emp, action: 'reset_password' })} aria-label="Reset password">
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setNewRole(emp.role); setActionTarget({ employee: emp, action: 'change_role' }) }} aria-label="Change role">
                          <Briefcase className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <AdminPagination page={pagination.page} totalPages={pagination.totalPages} onPage={setPage} />

      {/* Create drawer */}
      <Drawer open={createOpen} onOpenChange={setCreateOpen}>
        <DrawerContent className="bg-background border-white/10 max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Add new employee</DrawerTitle>
          </DrawerHeader>
          <div className="px-6 pb-6 overflow-y-auto scroll-dark space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full name">
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-card/40" placeholder="Sara Chen" />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-card/40" placeholder="sara@driveluxe.com" />
              </Field>
              <Field label="Phone (optional)">
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-card/40" placeholder="+1 555 0201" />
              </Field>
              <Field label="Role">
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger className="bg-card/40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="fleet">Fleet</SelectItem>
                    <SelectItem value="customer_care">Customer Care</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <p className="text-xs text-muted-foreground">
              A unique Employee ID (EMP-XXXX) will be auto-generated. The default password is <span className="text-foreground font-medium">emp123</span> — the employee should change it on first login.
            </p>
          </div>
          <DrawerFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={busy} className="bg-primary text-primary-foreground">
              {busy ? <Loader2Small /> : <UserPlus className="h-4 w-4 mr-2" />}
              Create employee
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Action confirm dialog */}
      <AlertDialog open={!!actionTarget} onOpenChange={(o) => !o && setActionTarget(null)}>
        <AlertDialogContent className="bg-background border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionTarget?.action === 'suspend' && 'Suspend this employee?'}
              {actionTarget?.action === 'activate' && 'Activate this employee?'}
              {actionTarget?.action === 'reset_password' && 'Reset password?'}
              {actionTarget?.action === 'change_role' && 'Change role?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionTarget?.employee && (
                <span>
                  {actionTarget.employee.employeeId} — {actionTarget.employee.name}
                  {actionTarget.action === 'reset_password' && '. New temp password will be: emp123'}
                  {actionTarget.action === 'change_role' && '. Select the new role below.'}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {actionTarget?.action === 'change_role' && (
            <div className="py-2">
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="bg-card/40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="fleet">Fleet</SelectItem>
                  <SelectItem value="customer_care">Customer Care</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction} disabled={busy} className="bg-primary text-primary-foreground">
              {busy ? 'Working…' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function Loader2Small() {
  return <Loader2 className="h-4 w-4 animate-spin mr-2" />
}
