'use client'

import { ShieldX, ArrowLeft, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/ui-store'

export function AdminForbidden() {
  const { navigate } = useUIStore()
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="text-center max-w-md">
        <div className="grid place-items-center h-16 w-16 rounded-2xl bg-rose-500/10 text-rose-300 mx-auto mb-6">
          <ShieldX className="h-8 w-8" />
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-rose-300 font-semibold mb-2">
          403 · Forbidden
        </p>
        <h1 className="text-3xl font-bold tracking-tight mb-3">
          Administrator access required
        </h1>
        <p className="text-muted-foreground mb-8">
          This console is separate from the main site and restricted to authorized
          administrators. Your account doesn&apos;t have permission to view it.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate('home')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to main site
          </Button>
          <Button onClick={() => navigate('admin-login')} className="bg-primary text-primary-foreground">
            <ExternalLink className="h-4 w-4 mr-2" /> Admin sign in
          </Button>
        </div>
      </div>
    </div>
  )
}
