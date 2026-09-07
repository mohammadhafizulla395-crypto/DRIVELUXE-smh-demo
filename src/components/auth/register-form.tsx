'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Mail, Lock, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { AuthShell } from './auth-shell'
import { registerSchema, type RegisterInput } from '@/lib/validations'
import { authApi, ApiError } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
import { useUIStore } from '@/store/ui-store'

export function RegisterForm() {
  const { setUser } = useAuthStore()
  const { setView } = useUIStore()
  const { toast } = useToast()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = async (data: RegisterInput) => {
    setServerError('')
    try {
      const { user } = await authApi.register(data)
      setUser(user)
      toast({ title: 'Welcome to DriveLuxe!', description: `Account created for ${user.name}.` })
      setView('home')
    } catch (err) {
      const e = err as ApiError
      if (e.status === 409) {
        setServerError(e.message)
      } else if (e.fields) {
        setServerError(e.message)
      } else {
        toast({
          title: 'Could not create account',
          description: e.message,
          variant: 'destructive',
        })
      }
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join DriveLuxe and book your first ride in minutes."
      footer={
        <>
          Already have an account?{' '}
          <button
            onClick={() => setView('login')}
            className="text-primary font-medium hover:underline"
          >
            Log in
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

        <Field label="Full name" error={errors.name?.message}>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              {...register('name')}
              placeholder="Alex Rider"
              autoComplete="name"
              className="pl-9 bg-background/50"
            />
          </div>
        </Field>

        <Field label="Email" error={errors.email?.message}>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              {...register('email')}
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className="pl-9 bg-background/50"
            />
          </div>
        </Field>

        <Field label="Password" error={errors.password?.message}>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              {...register('password')}
              type="password"
              placeholder="At least 6 characters"
              autoComplete="new-password"
              className="pl-9 bg-background/50"
            />
          </div>
        </Field>

        <Field label="Confirm password" error={errors.confirmPassword?.message}>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              {...register('confirmPassword')}
              type="password"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              className="pl-9 bg-background/50"
            />
          </div>
        </Field>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...
            </>
          ) : (
            'Create account'
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Try the demo admin: <span className="text-foreground">admin@driveluxe.com</span> /{' '}
          <span className="text-foreground">admin123</span>
        </p>
      </form>
    </AuthShell>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={label}>{label}</Label>
      {children}
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </div>
  )
}
