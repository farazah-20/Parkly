'use client'

import { useFieldArray, useForm } from 'react-hook-form'
import { Plus, Trash2, Send, Download } from 'lucide-react'
import { Button }          from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { formatCurrency }  from '@/lib/utils'
import type { InvoiceFormData, InvoiceLineItem } from '@/types'

interface InvoiceGeneratorProps {
  customerId: string
  bookingId?: string
  onSave:     (data: InvoiceFormData) => Promise<void>
  onSend?:    (data: InvoiceFormData) => Promise<void>
  loading?:   boolean
}

export function InvoiceGenerator({
  customerId,
  bookingId,
  onSave,
  onSend,
  loading,
}: InvoiceGeneratorProps) {
  const { register, control, handleSubmit, watch } = useForm<InvoiceFormData>({
    defaultValues: {
      customer_id:     customerId,
      booking_id:      bookingId,
      tax_rate:        19,
      recipient_email: '',
      items: [{ description: 'Parkgebühr', quantity: 1, unit_price: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const items    = watch('items') as InvoiceLineItem[]
  const tax_rate = watch('tax_rate')

  const subtotal  = items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unit_price)), 0)
  const taxAmount = (subtotal * tax_rate) / 100
  const total     = subtotal + taxAmount

  return (
    <div className="space-y-6">
      {/* Header fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Empfänger E-Mail"
          type="email"
          {...register('recipient_email')}
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Fälligkeitsdatum</label>
          <input
            type="date"
            {...register('due_date')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Line items */}
      <div className="space-y-2">
        <div className="hidden grid-cols-[1fr_80px_100px_80px] gap-2 text-xs font-medium uppercase text-gray-500 sm:grid">
          <span>Beschreibung</span>
          <span className="text-right">Menge</span>
          <span className="text-right">Einzelpreis</span>
          <span />
        </div>

        {fields.map((field, idx) => (
          <div key={field.id} className="grid items-start gap-2 sm:grid-cols-[1fr_80px_100px_40px]">
            <Input
              placeholder="Leistungsbeschreibung"
              {...register(`items.${idx}.description`)}
            />
            <Input
              type="number"
              min="1"
              placeholder="1"
              {...register(`items.${idx}.quantity`)}
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              {...register(`items.${idx}.unit_price`)}
            />
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => remove(idx)}
              disabled={fields.length === 1}
              className="mt-1 text-red-400 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => append({ description: '', quantity: 1, unit_price: 0 })}
        >
          <Plus className="h-4 w-4" />
          Position hinzufügen
        </Button>
      </div>

      {/* Totals */}
      <div className="ml-auto w-full max-w-xs space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Nettobetrag</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between gap-2 text-gray-600">
          <div className="flex items-center gap-1">
            <span>MwSt.</span>
            <input
              type="number"
              min="0"
              max="100"
              {...register('tax_rate')}
              className="w-12 rounded border border-gray-300 px-1 py-0.5 text-xs"
            />
            <span>%</span>
          </div>
          <span>{formatCurrency(taxAmount)}</span>
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-900">
          <span>Gesamtbetrag</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <Textarea label="Anmerkungen / Zahlungsbedingungen" {...register('notes')} />

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" type="button" onClick={handleSubmit(onSave)} loading={loading}>
          <Download className="h-4 w-4" />
          Entwurf speichern
        </Button>
        {onSend && (
          <Button type="button" onClick={handleSubmit(data => onSend(data))} loading={loading}>
            <Send className="h-4 w-4" />
            Rechnung versenden
          </Button>
        )}
      </div>
    </div>
  )
}
