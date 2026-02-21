'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { DriverFormData } from '@/types'

const schema = z.object({
  first_name:     z.string().min(2),
  last_name:      z.string().min(2),
  email:          z.string().email('Ungültige E-Mail-Adresse'),
  phone:          z.string().optional(),
  license_number: z.string().optional(),
  create_account: z.boolean().default(false),
  password:       z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface DriverFormProps {
  initialValues?: Partial<DriverFormData>
  onSubmit:       (data: DriverFormData) => Promise<void>
  onCancel?:      () => void
  loading?:       boolean
}

export function DriverForm({ initialValues, onSubmit, onCancel, loading }: DriverFormProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues as FormValues,
  })

  const createAccount = watch('create_account')

  return (
    <form onSubmit={handleSubmit(data => onSubmit(data as DriverFormData))} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Vorname"   {...register('first_name')} error={errors.first_name?.message} />
        <Input label="Nachname"  {...register('last_name')}  error={errors.last_name?.message}  />
        <Input label="E-Mail"    type="email" {...register('email')} error={errors.email?.message} className="sm:col-span-2" />
        <Input label="Telefon"   type="tel"   {...register('phone')}          placeholder="+49 ..." />
        <Input label="Führerschein-Nr." {...register('license_number')} />
      </div>

      {/* Option to create a login account for the driver */}
      <div className="rounded-lg border border-gray-200 p-4 space-y-3">
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" {...register('create_account')} className="h-4 w-4 rounded border-gray-300 text-brand-600" />
          <span className="text-sm font-medium text-gray-700">Login-Zugang für Fahrer erstellen</span>
        </label>

        {createAccount && (
          <Input
            label="Initiales Passwort"
            type="password"
            {...register('password')}
            hint="Der Fahrer kann das Passwort nach dem ersten Login ändern."
          />
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Abbrechen</Button>
        )}
        <Button type="submit" loading={loading}>
          <UserPlus className="h-4 w-4" />
          {initialValues ? 'Speichern' : 'Fahrer anlegen'}
        </Button>
      </div>
    </form>
  )
}
