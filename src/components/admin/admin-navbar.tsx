'use client'

import { useEffect, useState } from 'react'
import { Shield, LogOut, ExternalLink } from 'lucide-react'
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
import { useAuthStore } from '@/store/auth-store'
import { useUIStore } from '@/store/ui-store'
import { cn } from '@/lib/utils'

export function AdminNavbar() {
  const { user, logout } = useAuthStore()
  const { navigate } = useUIStore()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
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

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-background/90 backdrop-blur-xl border-b border-white/10'
          : 'bg-background/60 backdrop-blur-md',
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Branding — distinct from the main site */}
        <button
          onClick={() => navigate('admin')}
          className="flex items-center gap-2.5"
          aria-label="Admin dashboard"
        >
          <span className="grid place-items-center h-9 w-9 rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Shield className="h-5 w-5" />
          </span>
          <div className="leading-tight text-left">
            <p className="text-sm font-bold tracking-tight">
              DriveLuxe <span className="text-gradient-gold">Admin</span>
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Console
            </p>
          </div>
        </button>

        {/* right side */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('home')}
            className="text-muted-foreground hover:text-foreground hidden sm:flex"
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            View site
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
                  <span className="text-sm font-medium max-w-[120px] truncate hidden sm:block">
                    {user.name}
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
                    <span className="text-[10px] uppercase tracking-wide text-primary mt-1">
                      Administrator
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
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
      </nav>
    </header>
  )
}
