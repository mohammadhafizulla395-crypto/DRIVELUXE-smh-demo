'use client'

import { useEffect, useState } from 'react'
import {
  Menu,
  Car,
  User as UserIcon,
  LogOut,
  CalendarCheck,
  Star,
  Gift,
  LifeBuoy,
  FileText,
  LayoutDashboard,
  CreditCard,
  Bell,
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
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useAuthStore } from '@/store/auth-store'
import { useUIStore, type ViewName } from '@/store/ui-store'
import { cn } from '@/lib/utils'

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const { view, navigate } = useUIStore()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const go = (v: ViewName) => {
    navigate(v)
    setMobileOpen(false)
  }

  const handleLogout = async () => {
    await logout()
    navigate('home')
  }

  const initials = user
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : ''

  // Guests see only Home + Fleet. Logged-in users see Dashboard + Fleet.
  const navLinks: { label: string; view: ViewName }[] = isAuthenticated
    ? [
        { label: 'Home', view: 'home' },
        { label: 'Fleet', view: 'cars' },
        { label: 'Dashboard', view: 'dashboard' },
      ]
    : [
        { label: 'Home', view: 'home' },
        { label: 'Fleet', view: 'cars' },
      ]

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-background/80 backdrop-blur-xl border-b border-white/10'
          : 'bg-transparent',
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => go('home')}
          className="flex items-center gap-2 group"
          aria-label="DriveLuxe home"
        >
          <span className="grid place-items-center h-9 w-9 rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Car className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Drive<span className="text-gradient-gold">Luxe</span>
          </span>
        </button>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              key={link.view}
              onClick={() => go(link.view)}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                view === link.view
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Desktop auth */}
        <div className="hidden lg:flex items-center gap-2">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 border border-white/10 hover:border-white/20 transition-colors">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium max-w-[100px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-popover border-white/10"
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => go('dashboard')}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go('bookings')}>
                  <CalendarCheck className="mr-2 h-4 w-4" /> My Bookings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go('booking-timeline')}>
                  <FileText className="mr-2 h-4 w-4" /> Booking Timeline
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go('my-reviews')}>
                  <Star className="mr-2 h-4 w-4" /> My Reviews
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go('points')}>
                  <Gift className="mr-2 h-4 w-4" /> Reward Points
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go('payment-history')}>
                  <CreditCard className="mr-2 h-4 w-4" /> Payment History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go('notifications')}>
                  <Bell className="mr-2 h-4 w-4" /> Notifications
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => go('refund')}>
                  <FileText className="mr-2 h-4 w-4" /> Refund Policy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go('privacy')}>
                  <FileText className="mr-2 h-4 w-4" /> Privacy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go('terms')}>
                  <FileText className="mr-2 h-4 w-4" /> Terms
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go('cookies')}>
                  <FileText className="mr-2 h-4 w-4" /> Cookies
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go('support')}>
                  <LifeBuoy className="mr-2 h-4 w-4" /> Help & Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-rose-300 focus:text-rose-200"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => go('login')}
                className="text-muted-foreground hover:text-foreground"
              >
                Log in
              </Button>
              <Button
                size="sm"
                onClick={() => go('register')}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Get started
              </Button>
            </>
          )}
        </div>

        {/* Mobile trigger */}
        <div className="lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[min(300px,85vw)] bg-background border-white/10"
            >
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span className="grid place-items-center h-8 w-8 rounded-lg bg-primary text-primary-foreground">
                    <Car className="h-4 w-4" />
                  </span>
                  Drive<span className="text-gradient-gold">Luxe</span>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <MobileLink
                    key={link.view}
                    active={view === link.view}
                    onClick={() => go(link.view)}
                  >
                    {link.label}
                  </MobileLink>
                ))}
              </div>
              <div className="mt-auto pt-6 border-t border-white/10 space-y-2">
                {isAuthenticated && user ? (
                  <>
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                      <p className="text-xs text-primary mt-1">
                        {user.points} points
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <Button variant="outline" size="sm" onClick={() => go('profile')}>
                        <UserIcon className="h-4 w-4" /> Profile
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => go('refund')}>
                        <FileText className="h-4 w-4" /> Refund
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => go('privacy')}>
                        Privacy
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => go('terms')}>
                        Terms
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => go('cookies')}>
                        Cookies
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => go('support')}>
                        <LifeBuoy className="h-4 w-4" /> Support
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-rose-300 border-rose-500/30 hover:bg-rose-500/10"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => go('login')}
                    >
                      Log in
                    </Button>
                    <Button
                      className="w-full bg-primary text-primary-foreground"
                      onClick={() => go('register')}
                    >
                      Get started
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}

function MobileLink({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-white/5',
      )}
    >
      {children}
    </button>
  )
}
