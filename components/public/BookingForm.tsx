'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Car, Plane, CreditCard, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, calcParkingDays, calcBookingTotal } from '@/lib/utils'
import type { ParkingLot, BookingFormData } from '@/types'

const step1Schema = z.object({
  make:          z.string().min(2, 'Marke erforderlich'),
  model:         z.string().min(1, 'Modell erforderlich'),
  year:          z.coerce.number().min(1990).max(new Date().getFullYear() + 1),
  color:         z.string().min(2, 'Farbe erforderlich'),
  license_plate: z.string().min(2, 'Kennzeichen erforderlich'),
})

const step2Schema = z.object({
  flight_number:    z.string().min(2, 'Flugnummer erforderlich'),
  flight_departure: z.string().optional(),
  flight_arrival:   z.string().optional(),
})

const step3Schema = z.object({
  payment_method: z.enum(['cash', 'card', 'online', 'invoice']),
  notes:          z.string().optional(),
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>
type Step3Data = z.infer<typeof step3Schema>

const STEPS = [
  { label: 'Fahrzeug',      icon: Car        },
  { label: 'Flug',          icon: Plane       },
  { label: 'Zahlung',       icon: CreditCard  },
  { label: 'Bestätigung',   icon: CheckCircle },
]

const ease = [0.21, 0.47, 0.32, 0.98] as const

interface BookingFormProps {
  lot:      ParkingLot
  checkin:  string
  checkout: string
  onSubmit: (data: BookingFormData) => Promise<void>
}

export function BookingForm({ lot, checkin, checkout, onSubmit }: BookingFormProps) {
  const [step,       setStep]       = useState(0)
  const [direction,  setDirection]  = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [formData,   setFormData]   = useState<Partial<BookingFormData>>({
    dropoff_date: checkin,
    pickup_date:  checkout,
  })

  const days  = calcParkingDays(checkin, checkout)
  const total = calcBookingTotal(lot.price_per_day, days)

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) })
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema) })
  const form3 = useForm<Step3Data>({ resolver: zodResolver(step3Schema), defaultValues: { payment_method: 'online' } })

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1)
    setStep(next)
  }

  const nextStep = (data: Partial<BookingFormData>) => {
    setFormData(prev => ({ ...prev, ...data }))
    goTo(step + 1)
  }

  const handleFinalSubmit = async (data: Step3Data) => {
    const fullData = { ...formData, ...data } as BookingFormData
    setSubmitting(true)
    try {
      await onSubmit(fullData)
      goTo(3)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="flex flex-1 items-center">
              <motion.div
                animate={{
                  backgroundColor: i < step ? '#22c55e' : i === step ? '#2563eb' : '#f3f4f6',
                  color: i <= step ? '#ffffff' : '#9ca3af',
                }}
                transition={{ duration: 0.3 }}
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium"
              >
                <Icon className="h-4 w-4" />
              </motion.div>
              <span className={`ml-2 hidden text-xs font-medium sm:block ${i === step ? 'text-brand-700' : 'text-gray-400'}`}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <motion.div
                  animate={{ backgroundColor: i < step ? '#86efac' : '#e5e7eb' }}
                  transition={{ duration: 0.3 }}
                  className="mx-2 flex-1 h-0.5"
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Summary bar */}
      <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm">
        <span className="font-medium text-gray-700">{lot.name}</span>
        <span className="font-semibold text-gray-900">{days} Tage · {formatCurrency(total)}</span>
      </div>

      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.3, ease }}
            >
              <Card>
                <CardHeader><CardTitle>Fahrzeugdaten</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={form1.handleSubmit(d => nextStep(d))} className="grid gap-4 sm:grid-cols-2">
                    <Input label="Marke" {...form1.register('make')} error={form1.formState.errors.make?.message} />
                    <Input label="Modell" {...form1.register('model')} error={form1.formState.errors.model?.message} />
                    <Input label="Jahr" type="number" {...form1.register('year')} error={form1.formState.errors.year?.message} />
                    <Input label="Farbe" {...form1.register('color')} error={form1.formState.errors.color?.message} />
                    <Input label="Kennzeichen" {...form1.register('license_plate')} className="sm:col-span-2" error={form1.formState.errors.license_plate?.message} />
                    <div className="sm:col-span-2 flex justify-end">
                      <Button type="submit">Weiter</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.3, ease }}
            >
              <Card>
                <CardHeader><CardTitle>Fluginformationen</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={form2.handleSubmit(d => nextStep(d))} className="grid gap-4">
                    <Input label="Flugnummer" placeholder="z.B. LH 400" {...form2.register('flight_number')} error={form2.formState.errors.flight_number?.message} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Abflugzeit (optional)</label>
                        <input type="datetime-local" {...form2.register('flight_departure')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Ankunftszeit (optional)</label>
                        <input type="datetime-local" {...form2.register('flight_arrival')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <Button variant="outline" type="button" onClick={() => goTo(0)}>Zurück</Button>
                      <Button type="submit">Weiter</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.3, ease }}
            >
              <Card>
                <CardHeader><CardTitle>Zahlungsmethode &amp; Zusammenfassung</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={form3.handleSubmit(handleFinalSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {([['online', 'Online (Kreditkarte)'], ['cash', 'Barzahlung vor Ort'], ['card', 'EC-Karte vor Ort'], ['invoice', 'Auf Rechnung']] as const).map(([val, lbl]) => (
                        <label key={val} className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-gray-200 p-3 hover:border-brand-400 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50">
                          <input type="radio" value={val} {...form3.register('payment_method')} className="sr-only" />
                          <CreditCard className="h-5 w-5 text-gray-400" />
                          <span className="text-center text-xs font-medium text-gray-700">{lbl}</span>
                        </label>
                      ))}
                    </div>
                    <Textarea label="Anmerkungen (optional)" {...form3.register('notes')} />
                    <div className="rounded-lg bg-gray-50 p-4 space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600"><span>Preis/Tag</span><span>{formatCurrency(lot.price_per_day)}</span></div>
                      <div className="flex justify-between text-gray-600"><span>Tage</span><span>{days}</span></div>
                      <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-900"><span>Gesamt</span><span>{formatCurrency(total)}</span></div>
                    </div>
                    <div className="flex justify-between">
                      <Button variant="outline" type="button" onClick={() => goTo(1)}>Zurück</Button>
                      <Button type="submit" loading={submitting}>Kostenpflichtig buchen</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'backOut' }}
            >
              <Card>
                <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 12 }}
                  >
                    <CheckCircle className="h-16 w-16 text-green-500" />
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="text-xl font-bold text-gray-900"
                  >
                    Buchung erfolgreich!
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    className="text-gray-500"
                  >
                    Sie erhalten in Kürze eine Bestätigungs-E-Mail.
                  </motion.p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
