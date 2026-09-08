'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Loader2, Lock, Briefcase, ArrowLeft, IdCard, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { employeeLoginSchema, type EmployeeLoginInput } from '@/lib/validations'
import { employeeAuthApi, ApiError } from '@/lib/api'
import { useEmployeeStore } from '@/store/employee-store'
import { useUIStore } from '@/store/ui-store'

/**
 * Employee Portal login — visually independent from both the customer
 * "Welcome back" luxury login and the admin "Authorized personnel only"
 * login. Uses Employee ID (EMP-XXXX), a Briefcase icon, and teal accents.
 */
export function EmployeeLoginForm() {
  const { setEmployee } = useEmployeeStore()
  const { navigate } = useUIStore()
  const { toast } = useToast()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeLoginInput>({
    resolver: zodResolver(employeeLoginSchema),
    defaultValues: { employeeId: '', password: '' },
  })

  const onSubmit = async (data: EmployeeLoginInput) => {
    setServerError('')
    try {
      const { employee } = await employeeAuthApi.login({
        employeeId: data.employeeId.trim(),
        password: data.password,
      })
      setEmployee(employee)
      toast({
        title: `Signed in, ${employee.name.split(' ')[0]}`,
        description: 'Employee portal ready.',
      })
      navigate('employee')
    } catch (err) {
      const e = err as ApiError
      if (e.status === 401 || e.status === 403) {
        setServerError(e.message)
      } else {
        toast({
          title: 'Could not sign in',
          description: e.message,
          variant: 'destructive',
        })
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* ambient teal-tinted background — distinct from gold (admin) and amber (customer) */}
      <div className="absolute inset-0 hero-vignette opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,oklch(0.72_0.12_195/0.10),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_85%,oklch(0.70_0.10_190/0.06),transparent_55%)]" />

      <div className="relative z-10 flex items-center justify-center flex-1 px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Branding — Briefcase + teal accent */}
          <div className="text-center mb-8">
            <div className="inline-grid place-items-center h-14 w-14 rounded-2xl bg-teal-500/15 ring-1 ring-teal-400/30 shadow-lg shadow-teal-500/10 mb-4">
              <Briefcase className="h-7 w-7 text-teal-300" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Drive<span className="text-teal-300">Luxe</span>{' '}
              <span className="text-muted-foreground font-medium">Employee</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Sign in with your Employee ID
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              {serverError && (
                <div
                  role="alert"
                  className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
                >
                  {serverError}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="employeeId">Employee ID</Label>
                <div className="relative">
                  <IdCard
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="employeeId"
                    {...register('employeeId')}
                    type="text"
                    placeholder="EMP-1001"
                    autoComplete="username"
                    autoCapitalize="characters"
                    className="pl-9 bg-background/50 font-mono tracking-wide"
                  />
                </div>
                {errors.employeeId && (
                  <p className="text-xs text-rose-300" role="alert">
                    {errors.employeeId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
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
                className="w-full h-11 bg-teal-500/15 text-teal-200 ring-1 ring-teal-400/30 hover:bg-teal-500/25 hover:text-teal-100 border border-teal-400/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing
                    in...
                  </>
                ) : (
                  <>
                    <Briefcase className="mr-2 h-4 w-4" /> Sign in to portal
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="rounded-lg border border-teal-500/20 bg-teal-500/5 px-3 py-2.5 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1 flex items-center gap-1.5">
                  <Info className="h-3 w-3 text-teal-300" /> Demo employee
                </p>
                <p className="font-mono">EMP-1001 / emp123</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <button
              type="button"
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
          <Briefcase className="h-3 w-3 text-teal-300" aria-hidden="true" />
          DriveLuxe Employee Portal · Internal Use Only
        </span>
      </footer>
    </div>
  )
}
