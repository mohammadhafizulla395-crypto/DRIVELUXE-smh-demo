'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Mail, Lock, Shield, ArrowLeft, Car, KeyRound, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { adminAuthApi, ApiError } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'
import { useUIStore } from '@/store/ui-store'
import { cn } from '@/lib/utils'

type Step = 1 | 2 | 3

export function AdminLoginForm() {
  const { setUser } = useAuthStore()
  const { navigate } = useUIStore()
  const { toast } = useToast()
  const [step, setStep] = useState<Step>(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const goToStep = (s: Step) => {
    setError('')
    setStep(s)
  }

  const handleStep1Next = () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    goToStep(2)
  }

  const handleStep2Next = () => {
    if (!password) {
      setError('Password is required.')
      return
    }
    goToStep(3)
  }

  const handleFinalSubmit = async () => {
    if (!/^\d{6}$/.test(pin)) {
      setError('Admin PIN must be exactly 6 digits.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const { user } = await adminAuthApi.login({ email, password, pin })
      setUser(user)
      toast({
        title: 'Welcome, Administrator',
        description: 'Three-layer authentication complete.',
      })
      navigate('admin')
    } catch (err) {
      const e = err as ApiError
      setError(e.message)
      // On auth failure, go back to step 1 for security
      if (e.status === 401) {
        setPin('')
        goToStep(1)
      }
    } finally {
      setSubmitting(false)
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
              Three-layer secure access. Authorized personnel only.
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    'grid place-items-center h-8 w-8 rounded-full text-xs font-semibold border transition-all',
                    step === s
                      ? 'bg-primary text-primary-foreground border-primary'
                      : step > s
                        ? 'bg-primary/20 text-primary border-primary/40'
                        : 'border-white/10 text-muted-foreground',
                  )}
                >
                  {step > s ? <Check className="h-4 w-4" /> : s}
                </div>
                {s < 3 && (
                  <div className={cn('h-px w-8', step > s ? 'bg-primary/40' : 'bg-white/10')} />
                )}
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-card/70 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
            <AnimatePresence mode="wait">
              {/* Step 1: Email */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-1">Step 1 of 3</p>
                    <h2 className="text-lg font-semibold">Admin Email</h2>
                    <p className="text-sm text-muted-foreground">Enter your administrator email address.</p>
                  </div>
                  {error && (
                    <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200" role="alert">
                      {error}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Admin email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@driveluxe.com"
                        autoComplete="email"
                        className="pl-9 bg-background/50"
                        onKeyDown={(e) => e.key === 'Enter' && handleStep1Next()}
                        autoFocus
                      />
                    </div>
                  </div>
                  <Button onClick={handleStep1Next} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11">
                    Continue
                  </Button>
                </motion.div>
              )}

              {/* Step 2: Password */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-1">Step 2 of 3</p>
                    <h2 className="text-lg font-semibold">Password</h2>
                    <p className="text-sm text-muted-foreground">Enter your account password.</p>
                  </div>
                  {error && (
                    <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200" role="alert">
                      {error}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Your password"
                        autoComplete="current-password"
                        className="pl-9 bg-background/50"
                        onKeyDown={(e) => e.key === 'Enter' && handleStep2Next()}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => goToStep(1)} className="flex-1 h-11">
                      Back
                    </Button>
                    <Button onClick={handleStep2Next} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-11">
                      Continue
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: PIN */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-1">Step 3 of 3</p>
                    <h2 className="text-lg font-semibold">Admin PIN</h2>
                    <p className="text-sm text-muted-foreground">Enter your 6-digit administrator PIN.</p>
                  </div>
                  {error && (
                    <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200" role="alert">
                      {error}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="pin">6-digit PIN</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <Input
                        id="pin"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="••••••"
                        className="pl-9 bg-background/50 tracking-[0.5em] text-center font-mono text-lg"
                        onKeyDown={(e) => e.key === 'Enter' && handleFinalSubmit()}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => goToStep(2)} className="flex-1 h-11">
                      Back
                    </Button>
                    <Button
                      onClick={handleFinalSubmit}
                      disabled={submitting}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-11"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-4 w-4" /> Sign in
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Demo credentials */}
          <div className="mt-6 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-muted-foreground text-center">
            <p className="font-medium text-foreground mb-1">Demo admin (3-step)</p>
            <p>Email: admin@driveluxe.com · Password: admin123 · PIN: 246810</p>
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
          DriveLuxe Admin Console · Three-Layer Secure Access
        </span>
      </footer>
    </div>
  )
}
