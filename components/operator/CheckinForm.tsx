'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ClipboardCheck, LogIn, LogOut } from 'lucide-react'
import { Button }          from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/input'
import { SignatureCanvas } from './SignatureCanvas'
import type { CheckinFormData } from '@/types'

const schema = z.object({
  parking_spot:   z.string().optional(),
  mileage:        z.coerce.number().min(0, 'Ungültig'),
  fuel_level:     z.coerce.number().min(0).max(100),
  condition:      z.enum(['excellent', 'good', 'fair', 'damaged']),
  notes:          z.string().optional(),
  signatory_name: z.string().min(2, 'Name des Unterzeichners erforderlich'),
})

type FormValues = z.infer<typeof schema>

interface CheckinFormProps {
  bookingId: string
  mode:      'checkin' | 'checkout'
  onSubmit:  (data: CheckinFormData) => Promise<void>
}

const CONDITION_OPTIONS = [
  { value: 'excellent', label: 'Sehr gut'      },
  { value: 'good',      label: 'Gut'            },
  { value: 'fair',      label: 'Befriedigend'   },
  { value: 'damaged',   label: 'Beschädigt'     },
]

const FUEL_OPTIONS = [
  { value: '0',   label: 'Leer (0%)'    },
  { value: '25',  label: '¼ voll (25%)' },
  { value: '50',  label: '½ voll (50%)' },
  { value: '75',  label: '¾ voll (75%)' },
  { value: '100', label: 'Voll (100%)'  },
]

export function CheckinForm({ bookingId, mode, onSubmit }: CheckinFormProps) {
  const [signature,   setSignature]   = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [sigError,    setSigError]    = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fuel_level: 100, condition: 'excellent' },
  })

  const handleSave = async (values: FormValues) => {
    if (!signature) {
      setSigError(true)
      return
    }
    setSigError(false)
    setSubmitting(true)
    try {
      await onSubmit({
        booking_id:     bookingId,
        parking_spot:   values.parking_spot,
        mileage:        values.mileage,
        fuel_level:     values.fuel_level,
        condition:      values.condition,
        notes:          values.notes,
        signature,
        signatory_name: values.signatory_name,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const Icon = mode === 'checkin' ? LogIn : LogOut

  return (
    <form onSubmit={handleSubmit(handleSave)} className="space-y-5">
      <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
        <Icon className="h-5 w-5 text-brand-600" />
        {mode === 'checkin' ? 'Fahrzeug-Annahme (Check-in)' : 'Fahrzeug-Ausgabe (Check-out)'}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Kilometerstand"
          type="number"
          {...register('mileage')}
          error={errors.mileage?.message}
        />
        <Select
          label="Tankfüllstand"
          options={FUEL_OPTIONS}
          {...register('fuel_level')}
          error={errors.fuel_level?.message}
        />
        <Select
          label="Fahrzeugzustand"
          options={CONDITION_OPTIONS}
          {...register('condition')}
          error={errors.condition?.message}
        />
        <Input
          label="Stellplatznummer (optional)"
          {...register('parking_spot')}
        />
      </div>

      <Textarea
        label="Bemerkungen / Schäden"
        placeholder="z.B. Kratzer am linken Kotflügel..."
        {...register('notes')}
      />

      <div className="space-y-3">
        <Input
          label="Name des Unterzeichners"
          placeholder="Max Mustermann"
          {...register('signatory_name')}
          error={errors.signatory_name?.message}
        />
        <SignatureCanvas
          label="Unterschrift des Kunden"
          onSave={sig => { setSignature(sig); setSigError(false) }}
        />
        {sigError && (
          <p className="text-xs text-red-600">Bitte unterschreiben Sie das Protokoll.</p>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" size="lg" loading={submitting}>
          <ClipboardCheck className="h-4 w-4" />
          Protokoll speichern
        </Button>
      </div>
    </form>
  )
}
