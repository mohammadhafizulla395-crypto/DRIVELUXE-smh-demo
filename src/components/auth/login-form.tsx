'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { AuthShell } from './auth-shell'
import { loginSchema, type LoginInput } from '@/lib/validations'
import { authApi, ApiError } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
import { useUIStore } from '@/store/ui-store'

export function LoginForm() {
  const { setUser } = useAuthStore()
  const { navigate } = useUIStore()
  const { toast } = useToast()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: LoginInput) => {
    setServerError('')
    try {
      const { user } = await authApi.login(data)
      setUser(user)
      toast({ title: `Welcome back, ${user.name.split(' ')[0]}!` })
      navigate('home')
    } catch (err) {
      const e = err as ApiError
      if (e.status === 401) {
        setServerError(e.message)
      } else {
        toast({
          title: 'Could not log in',
          description: e.message,
          variant: 'destructive',
        })
      }
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to manage your bookings and drive."
      footer={
        <>
          New to DriveLuxe?{' '}
          <button
            onClick={() => navigate('register')}
            className="text-primary font-medium hover:underline"
          >
            Create an account
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {serverError}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              {...register('email')}
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className="pl-9 bg-background/50"
            />
          </div>
          {errors.email && <p className="text-xs text-rose-300">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              {...register('password')}
              type="password"
              placeholder="Your password"
              autoComplete="current-password"
              className="pl-9 bg-background/50"
            />
          </div>
          {errors.password && <p className="text-xs text-rose-300">{errors.password.message}</p>}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...
            </>
          ) : (
            'Log in'
          )}
        </Button>

        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Demo accounts</p>
          <p>Admin: admin@driveluxe.com / admin123</p>
          <p>User: rider@driveluxe.com / rider123</p>
        </div>
      </form>
    </AuthShell>
  )
}
