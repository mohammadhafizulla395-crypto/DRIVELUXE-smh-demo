'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { profileSchema, type ProfileInput } from '@/lib/validations'
import { authApi, ApiError } from '@/lib/api'
import { useAuthStore } from '@/store/auth-store'

export function ProfileForm() {
  const { user, setUser } = useAuthStore()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      phone: user?.phone ?? '',
    },
  })

  const [serverError, setServerError] = useState('')

  const onSubmit = async (data: ProfileInput) => {
    setServerError('')
    try {
      const { user: updated } = await authApi.updateProfile(data)
      setUser(updated)
      toast({ title: 'Profile updated', description: 'Your changes were saved.' })
    } catch (err) {
      const e = err as ApiError
      setServerError(e.message)
    }
  }

  if (!user) return null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" {...register('name')} className="bg-background/50" />
          {errors.name && <p className="text-xs text-rose-300">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input
            id="phone"
            {...register('phone')}
            placeholder="+1 555 0100"
            className="bg-background/50"
          />
          {errors.phone && <p className="text-xs text-rose-300">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          value={user.email}
          disabled
          className="bg-background/30 text-muted-foreground"
        />
        <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Save changes
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
