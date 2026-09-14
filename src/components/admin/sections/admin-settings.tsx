'use client'

import { useEffect, useState } from 'react'
import { Shield, Phone, Mail, User, Database, Server, Activity, Copy, Check } from 'lucide-react'
import { adminApi, ApiError } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { AdminPageHeader } from '../admin-ui'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

interface SettingsData {
  owner: { name: string; phone: string; email: string }
  system: {
    totalCars: number
    activeBookings: number
    totalUsers: number
    totalRevenue: number
    version: string
    environment: string
  }
}

export function AdminSettings() {
  const { toast } = useToast()
  const [data, setData] = useState<SettingsData | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    adminApi
      .settings()
      .then((d) => setData(d))
      .catch((err) => {
        const e = err as ApiError
        toast({ title: 'Load failed', description: e.message, variant: 'destructive' })
      })
      .finally(() => setLoaded(true))
  }, [toast])

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 1500)
    toast({ title: 'Copied', description: label })
  }

  return (
    <div>
      <AdminPageHeader
        title="Settings"
        description="System information and owner contact details."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Owner contact */}
        <Card className="border-white/10 bg-card/40 p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Owner Contact</h2>
          </div>
          {!loaded ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full bg-white/5" />
              <Skeleton className="h-12 w-full bg-white/5" />
              <Skeleton className="h-12 w-full bg-white/5" />
            </div>
          ) : data ? (
            <div className="space-y-3">
              <ContactRow
                icon={<User className="h-4 w-4" />}
                label="Name"
                value={data.owner.name}
                onCopy={() => copy(data.owner.name, 'Name')}
                copied={copied === 'Name'}
              />
              <ContactRow
                icon={<Phone className="h-4 w-4" />}
                label="Phone"
                value={data.owner.phone}
                href={`tel:${data.owner.phone}`}
                onCopy={() => copy(data.owner.phone, 'Phone')}
                copied={copied === 'Phone'}
              />
              <ContactRow
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={data.owner.email}
                href={`mailto:${data.owner.email}`}
                onCopy={() => copy(data.owner.email, 'Email')}
                copied={copied === 'Email'}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Could not load owner info.</p>
          )}
        </Card>

        {/* System info */}
        <Card className="border-white/10 bg-card/40 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Server className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">System</h2>
          </div>
          {!loaded ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full bg-white/5" />
              ))}
            </div>
          ) : data ? (
            <div className="space-y-2.5">
              <InfoRow icon={<Database className="h-4 w-4" />} label="Total cars" value={String(data.system.totalCars)} />
              <InfoRow icon={<Activity className="h-4 w-4" />} label="Active bookings" value={String(data.system.activeBookings)} />
              <InfoRow icon={<User className="h-4 w-4" />} label="Total customers" value={String(data.system.totalUsers)} />
              <InfoRow icon={<Shield className="h-4 w-4" />} label="Total revenue" value={`$${Math.round(data.system.totalRevenue)}`} />
              <InfoRow icon={<Server className="h-4 w-4" />} label="Version" value={data.system.version} />
              <InfoRow icon={<Database className="h-4 w-4" />} label="Environment" value={data.system.environment} />
            </div>
          ) : null}
        </Card>

        {/* About */}
        <Card className="border-white/10 bg-card/40 p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">About this console</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The DriveLuxe Admin Console is a fully separated application from the customer
            website. It has its own login (<code className="text-foreground">#/admin/login</code>),
            its own layout, and its own session checks. Normal users cannot access it — only
            accounts with the <code className="text-foreground">admin</code> role. The console
            is designed for operators: operational cards over graphs, drawers over page
            changes, archive over hard-delete, and enforced status workflows for bookings,
            payments, and complaints.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => copy('admin@driveluxe.com', 'Admin email')}>
              Copy admin demo email
            </Button>
            <Button variant="outline" size="sm" onClick={() => copy('admin123', 'Admin password')}>
              Copy admin demo password
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

function ContactRow({
  icon,
  label,
  value,
  href,
  onCopy,
  copied,
}: {
  icon: React.ReactNode
  label: string
  value: string
  href?: string
  onCopy: () => void
  copied: boolean
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-background/40 p-3">
      <span className="text-primary">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        {href ? (
          <a href={href} className="text-sm font-medium hover:text-primary transition-colors break-all">
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium break-all">{value}</p>
        )}
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 shrink-0"
        onClick={onCopy}
        aria-label={`Copy ${label}`}
      >
        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground flex-1">{label}</span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  )
}
