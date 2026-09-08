'use client'

import { useState, useEffect } from 'react'
import { useUIStore, type ViewName } from '@/store/ui-store'
import { useAuthStore } from '@/store/auth-store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CalendarCheck,
  GitBranch,
  Star,
  Gift,
  CreditCard,
  LifeBuoy,
  Bell,
  User as UserIcon,
  LogOut,
  Car,
  Menu,
  PanelLeftClose,
  ExternalLink,
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
  { label: 'Dashboard', view: 'dashboard', icon: LayoutDashboard },
  { label: 'My Bookings', view: 'bookings', icon: CalendarCheck },
  { label: 'Booking Timeline', view: 'booking-timeline', icon: GitBranch },
  { label: 'My Reviews', view: 'my-reviews', icon: Star },
  { label: 'Reward Points', view: 'points', icon: Gift },
  { label: 'Payment History', view: 'payment-history', icon: CreditCard },
  { label: 'Support Tickets', view: 'support', icon: LifeBuoy },
  { label: 'Notifications', view: 'notifications', icon: Bell },
  { label: 'Profile', view: 'profile', icon: UserIcon },
]

function breadcrumbFor(view: ViewName): string {
  const map: Partial<Record<ViewName, string>> = {
    dashboard: 'Dashboard',
    bookings: 'My Bookings',
    'booking-timeline': 'Booking Timeline',
    'my-reviews': 'My Reviews',
    points: 'Reward Points',
    'payment-history': 'Payment History',
    support: 'Support Tickets',
    notifications: 'Notifications',
    profile: 'Profile',
  }
  return map[view] ?? 'Dashboard'
}

export function CustomerDashboardLayout({ children }: { children: React.ReactNode }) {
  const { view, navigate } = useUIStore()
  const { user, logout } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

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
    navigate('home')
  }

  const initials = user
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : ''

  const SidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <button
        onClick={() => navigate('home')}
        className="flex items-center gap-2.5 px-4 h-16 border-b border-white/10 shrink-0"
        aria-label="DriveLuxe home"
      >
        <span className="grid place-items-center h-9 w-9 rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <Car className="h-5 w-5" />
        </span>
        {!collapsed && (
          <div className="leading-tight text-left">
            <p className="text-sm font-bold tracking-tight">
              Drive<span className="text-gradient-gold">Luxe</span>
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Dashboard
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
              onClick={() => { navigate(item.view); setMobileOpen(false) }}
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
          title={collapsed ? 'Back to site' : undefined}
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          {!collapsed && 'Back to site'}
        </button>
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 transition-colors',
            collapsed && 'justify-center',
          )}
          title={collapsed ? 'Log out' : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && 'Log out'}
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

      {/* Mobile sidebar */}
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
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex h-9 w-9"
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Toggle sidebar"
          >
            <PanelLeftClose className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
          </Button>

          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="text-muted-foreground hidden sm:inline">Dashboard</span>
            <span className="text-muted-foreground hidden sm:inline">/</span>
            <span className="font-medium truncate">{breadcrumbFor(view)}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 relative"
              onClick={() => navigate('notifications')}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </Button>
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
                        {user.points} points
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('profile')}>
                    <UserIcon className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('bookings')}>
                    <CalendarCheck className="mr-2 h-4 w-4" /> My Bookings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('notifications')}>
                    <Bell className="mr-2 h-4 w-4" /> Notifications
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-rose-300 focus:text-rose-200">
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
