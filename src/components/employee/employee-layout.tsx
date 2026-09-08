'use client'

import { useState, useEffect } from 'react'
import { useUIStore, type ViewName } from '@/store/ui-store'
import { useEmployeeStore } from '@/store/employee-store'
import { cn } from '@/lib/utils'
import {
  Briefcase,
  LayoutDashboard,
  CheckSquare,
  CalendarCheck,
  LifeBuoy,
  Phone,
  BookOpen,
  BarChart3,
  Clock,
  LogOut,
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
  { label: 'Dashboard', view: 'employee', icon: LayoutDashboard },
  { label: "Today's Tasks", view: 'employee-tasks', icon: CheckSquare },
  { label: 'Bookings', view: 'employee-bookings', icon: CalendarCheck },
  { label: 'Support Tickets', view: 'employee-tickets', icon: LifeBuoy },
  { label: 'Customer Calls', view: 'employee-calls', icon: Phone },
  { label: 'Knowledge Base', view: 'employee-knowledge', icon: BookOpen },
  { label: 'My Performance', view: 'employee-performance', icon: BarChart3 },
  { label: 'Attendance', view: 'employee-attendance', icon: Clock },
]

function breadcrumbFor(view: ViewName): string {
  const map: Partial<Record<ViewName, string>> = {
    employee: 'Dashboard',
    'employee-tasks': "Today's Tasks",
    'employee-bookings': 'Bookings',
    'employee-tickets': 'Support Tickets',
    'employee-calls': 'Customer Calls',
    'employee-knowledge': 'Knowledge Base',
    'employee-performance': 'My Performance',
    'employee-attendance': 'Attendance',
  }
  return map[view] ?? 'Dashboard'
}

/** Pretty-print an EmployeeRole. */
function roleLabel(role: string): string {
  switch (role) {
    case 'support':
      return 'Support Agent'
    case 'fleet':
      return 'Fleet Coordinator'
    case 'customer_care':
      return 'Customer Care'
    default:
      return role
  }
}

export function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { view, navigate } = useUIStore()
  const { employee, logout } = useEmployeeStore()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Keyboard shortcut: Cmd/Ctrl+[ to toggle the sidebar.
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
    navigate('employee-login')
  }

  const initials = employee
    ? employee.name
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
        type="button"
        onClick={() => navigate('employee')}
        className="flex items-center gap-2.5 px-4 h-16 border-b border-white/10 shrink-0"
        aria-label="Employee dashboard"
      >
        <span className="grid place-items-center h-9 w-9 rounded-lg bg-teal-500/15 ring-1 ring-teal-400/30 text-teal-300 shadow-lg shadow-teal-500/10">
          <Briefcase className="h-5 w-5" />
        </span>
        {!collapsed && (
          <div className="leading-tight text-left">
            <p className="text-sm font-bold tracking-tight">
              Drive<span className="text-teal-300">Luxe</span>
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Employee
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
              type="button"
              onClick={() => {
                navigate(item.view)
                setMobileOpen(false)
              }}
              title={collapsed ? item.label : undefined}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                collapsed && 'justify-center',
                active
                  ? 'bg-teal-500/10 text-teal-300 ring-1 ring-teal-400/20'
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
          type="button"
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
          type="button"
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
            <PanelLeftClose
              className={cn(
                'h-4 w-4 transition-transform',
                collapsed && 'rotate-180',
              )}
            />
          </Button>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm min-w-0">
            <Briefcase className="h-4 w-4 text-teal-300 shrink-0" aria-hidden="true" />
            <span className="text-muted-foreground hidden sm:inline">Employee</span>
            <span className="text-muted-foreground hidden sm:inline">/</span>
            <span className="font-medium truncate">{breadcrumbFor(view)}</span>
          </div>

          {/* Right cluster */}
          <div className="ml-auto flex items-center gap-2">
            {employee && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 border border-white/10 hover:border-white/20 transition-colors"
                    aria-label="Account menu"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-teal-500/15 text-teal-300 text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium max-w-[120px] truncate hidden sm:block">
                      {employee.name.split(' ')[0]}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-60 bg-popover border-white/10"
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{employee.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {employee.employeeId}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide text-teal-300 mt-1">
                        {roleLabel(employee.role)}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('employee-performance')}>
                    <BarChart3 className="mr-2 h-4 w-4" /> My performance
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('employee-attendance')}>
                    <Clock className="mr-2 h-4 w-4" /> Attendance
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('home')}>
                    <ExternalLink className="mr-2 h-4 w-4" /> View main site
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-rose-300 focus:text-rose-200"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
