'use client'

import { useState, useEffect } from 'react'
import { useUIStore, type ViewName } from '@/store/ui-store'
import { useAuthStore } from '@/store/auth-store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Car as CarIcon,
  CalendarCheck,
  Users,
  CreditCard,
  LifeBuoy,
  Star,
  Settings as SettingsIcon,
  Shield,
  LogOut,
  ExternalLink,
  Menu,
  PanelLeftClose,
  Search,
  Bell,
  Activity,
  Wrench,
  Briefcase,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

interface NavItem {
  label: string
  view: ViewName
  icon: typeof LayoutDashboard
}

const NAV: NavItem[] = [
  { label: 'Dashboard', view: 'admin', icon: LayoutDashboard },
  { label: 'Operations', view: 'admin-operations', icon: Activity },
  { label: 'Bookings', view: 'admin-bookings', icon: CalendarCheck },
  { label: 'Fleet', view: 'admin-cars', icon: CarIcon },
  { label: 'Maintenance', view: 'admin-maintenance', icon: Wrench },
  { label: 'Employees', view: 'admin-employees', icon: Briefcase },
  { label: 'Customers', view: 'admin-customers', icon: Users },
  { label: 'Payments', view: 'admin-payments', icon: CreditCard },
  { label: 'Reviews', view: 'admin-reviews', icon: Star },
  { label: 'Complaints', view: 'admin-complaints', icon: LifeBuoy },
  { label: 'Reports', view: 'admin-reports', icon: FileText },
  { label: 'Settings', view: 'admin-settings', icon: SettingsIcon },
]

function breadcrumbFor(view: ViewName): string {
  const map: Partial<Record<ViewName, string>> = {
    admin: 'Dashboard',
    'admin-operations': 'Operations',
    'admin-cars': 'Fleet',
    'admin-bookings': 'Bookings',
    'admin-customers': 'Customers',
    'admin-payments': 'Payments',
    'admin-complaints': 'Complaints',
    'admin-reviews': 'Reviews',
    'admin-employees': 'Employees',
    'admin-reports': 'Reports',
    'admin-maintenance': 'Maintenance',
    'admin-settings': 'Settings',
  }
  return map[view] ?? 'Dashboard'
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { view, navigate } = useUIStore()
  const { user, logout } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Keyboard: [ to toggle sidebar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '[' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCollapsed((c) => !c)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('admin-login')
  }

  const initials = user
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : ''

  const SidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <button
        onClick={() => navigate('admin')}
        className="flex items-center gap-2.5 px-4 h-16 border-b border-white/10 shrink-0"
        aria-label="Admin dashboard"
      >
        <span className="grid place-items-center h-9 w-9 rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <Shield className="h-5 w-5" />
        </span>
        {!collapsed && (
          <div className="leading-tight text-left">
            <p className="text-sm font-bold tracking-tight">
              Drive<span className="text-gradient-gold">Luxe</span>
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Admin Console
            </p>
          </div>
        )}
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scroll-dark py-4 px-2 space-y-0.5">
        {NAV.map((item) => {
          const Icon = item.icon
          const active = view === item.view
          return (
            <button
              key={item.view}
              onClick={() => {
                navigate(item.view)
                setMobileOpen(false)
              }}
              title={collapsed ? item.label : undefined}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                collapsed && 'justify-center',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-2 space-y-1">
        <button
          onClick={() => navigate('home')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors',
            collapsed && 'justify-center',
          )}
          title={collapsed ? 'View main site' : undefined}
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          {!collapsed && 'View site'}
        </button>
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 transition-colors',
            collapsed && 'justify-center',
          )}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-white/10 bg-card/30 sticky top-0 h-screen transition-[width] duration-200 shrink-0',
          collapsed ? 'w-[68px]' : 'w-60',
        )}
      >
        {SidebarContent}
      </aside>

      {/* Mobile sidebar (sheet) */}
      <div className="lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-3 left-3 z-50 h-10 w-10 bg-card/80 backdrop-blur border border-white/10"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-card border-white/10">
            {SidebarContent}
          </SheetContent>
        </Sheet>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-40 h-16 border-b border-white/10 bg-background/80 backdrop-blur-xl flex items-center gap-3 px-4 sm:px-6">
          {/* Collapse toggle (desktop) */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex h-9 w-9"
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Toggle sidebar"
          >
            <PanelLeftClose className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
          </Button>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="text-muted-foreground hidden sm:inline">Admin</span>
            <span className="text-muted-foreground hidden sm:inline">/</span>
            <span className="font-medium truncate">{breadcrumbFor(view)}</span>
          </div>

          {/* Search (decorative — operational search is per-table) */}
          <div className="ml-auto hidden md:flex items-center gap-2 px-3 h-9 rounded-md border border-white/10 bg-card/40 text-sm text-muted-foreground w-56 lg:w-72">
            <Search className="h-3.5 w-3.5" />
            <input
              type="text"
              placeholder="Quick search…"
              className="bg-transparent border-0 outline-none flex-1 placeholder:text-muted-foreground/60"
              aria-label="Quick search"
            />
            <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-white/10 text-muted-foreground/70">⌘K</kbd>
          </div>

          {/* Bell */}
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>

          {/* User */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 border border-white/10 hover:border-white/20 transition-colors">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium max-w-[100px] truncate hidden sm:block">
                    {user.name.split(' ')[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover border-white/10">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                    <span className="text-[10px] uppercase tracking-wide text-primary mt-1">
                      Administrator
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('admin-settings')}>
                  <SettingsIcon className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('home')}>
                  <ExternalLink className="mr-2 h-4 w-4" /> View main site
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-rose-300 focus:text-rose-200">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
