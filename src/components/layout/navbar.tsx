'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  X,
  Car,
  LayoutDashboard,
  User as UserIcon,
  LogOut,
  CalendarCheck,
  Shield,
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

const NAV_LINKS: { label: string; view: ViewName }[] = [
  { label: 'Home', view: 'home' },
  { label: 'Fleet', view: 'cars' },
]

export function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuthStore()
  const { view, setView } = useUIStore()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const go = (v: ViewName) => {
    setView(v)
    setMobileOpen(false)
  }

  const handleLogout = async () => {
    await logout()
    setView('home')
  }

  const initials = user
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : ''

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
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
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
          {isAuthenticated && (
            <button
              onClick={() => go('bookings')}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                view === 'bookings'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              My Bookings
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => go('admin')}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5',
                view === 'admin'
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Shield className="h-3.5 w-3.5" />
              Admin
            </button>
          )}
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 border border-white/10 hover:border-white/20 transition-colors">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium max-w-[120px] truncate">
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
                <DropdownMenuItem onClick={() => go('profile')}>
                  <UserIcon className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go('bookings')}>
                  <CalendarCheck className="mr-2 h-4 w-4" /> My Bookings
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => go('admin')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Admin Dashboard
                  </DropdownMenuItem>
                )}
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
        <div className="md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[280px] bg-background border-white/10"
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
                {NAV_LINKS.map((link) => (
                  <MobileLink
                    key={link.view}
                    active={view === link.view}
                    onClick={() => go(link.view)}
                  >
                    {link.label}
                  </MobileLink>
                ))}
                {isAuthenticated && (
                  <MobileLink
                    active={view === 'bookings'}
                    onClick={() => go('bookings')}
                  >
                    My Bookings
                  </MobileLink>
                )}
                {isAdmin && (
                  <MobileLink
                    active={view === 'admin'}
                    onClick={() => go('admin')}
                    icon={<Shield className="h-4 w-4" />}
                  >
                    Admin
                  </MobileLink>
                )}
              </div>
              <div className="mt-auto pt-6 border-t border-white/10 space-y-2">
                {isAuthenticated && user ? (
                  <>
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => go('profile')}
                    >
                      <UserIcon className="mr-2 h-4 w-4" /> Profile
                    </Button>
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
  icon,
}: {
  children: React.ReactNode
  active?: boolean
  onClick: () => void
  icon?: React.ReactNode
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
      {icon}
      {children}
    </button>
  )
}
