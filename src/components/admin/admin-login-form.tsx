'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Loader2, Mail, Lock, Shield, ArrowLeft, Car } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { loginSchema, type LoginInput } from '@/lib/validations'
import { adminAuthApi, ApiError } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
import { useUIStore } from '@/store/ui-store'

export function AdminLoginForm() {
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
      const { user } = await adminAuthApi.login(data)
      setUser(user)
      toast({
        title: 'Welcome, Administrator',
        description: 'Signed in to the DriveLuxe admin console.',
      })
      navigate('admin')
    } catch (err) {
      const e = err as ApiError
      setServerError(e.message)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* ambient background */}
      <div className="absolute inset-0 hero-vignette opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,oklch(0.78_0.16_75/0.08),transparent_60%)]" />

      <div className="relative z-10 flex items-center justify-center flex-1 px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* branding */}
          <div className="text-center mb-8">
            <div className="inline-grid place-items-center h-14 w-14 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 mb-4">
              <Shield className="h-7 w-7" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              DriveLuxe <span className="text-gradient-gold">Admin</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Authorized personnel only. This portal is separate from the main
              site.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {serverError && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {serverError}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">Admin email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="email"
                    {...register('email')}
                    type="email"
                    placeholder="admin@driveluxe.com"
                    autoComplete="email"
                    className="pl-9 bg-background/50"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-300" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="password"
                    {...register('password')}
                    type="password"
                    placeholder="Your password"
                    autoComplete="current-password"
                    className="pl-9 bg-background/50"
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-300" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" /> Sign in to console
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Demo admin</p>
                <p>admin@driveluxe.com / admin123</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <button
              onClick={() => navigate('home')}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to main site
            </button>
          </div>
        </motion.div>
      </div>

      <footer className="relative z-10 border-t border-white/10 py-4 text-center text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Car className="h-3 w-3" aria-hidden="true" />
          DriveLuxe Admin Console · Portfolio Project
        </span>
      </footer>
    </div>
  )
}
