'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CheckinForm }  from '@/components/operator/CheckinForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input }        from '@/components/ui/input'
import { Badge }        from '@/components/ui/badge'
import { formatDate }   from '@/lib/utils'
import type { Booking, CheckinFormData } from '@/types'

export default function CheckinPage() {
  const supabase = createClient()
  const [query,    setQuery]    = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selected, setSelected] = useState<Booking | null>(null)
  const [mode,     setMode]     = useState<'checkin' | 'checkout'>('checkin')

  const search = async () => {
    if (query.length < 2) return
    const { data: profileRaw } = await supabase.from('profiles').select('tenant_id').eq('id', (await supabase.auth.getUser()).data.user!.id).single()
    const profile = profileRaw as any
    const { data: dataRaw } = await (supabase as any)
      .from('bookings')
      .select('*, parking_lot:parking_lots(name), customer:profiles(first_name,last_name), vehicle:vehicles(*)')
      .eq('tenant_id', profile!.tenant_id!)
      .or(`booking_number.ilike.%${query}%,vehicles.license_plate.ilike.%${query}%`)
      .in('status', ['confirmed', 'checked_in'])
      .limit(10)
    const data = dataRaw as any[] | null
    setBookings((data as Booking[]) ?? [])
  }

  const handleCheckin = async (data: CheckinFormData) => {
    if (!selected) return
    const { data: protocolRaw } = await (supabase as any).from('checkin_protocols').upsert({
      booking_id:                  selected.id,
      tenant_id:                   (selected as any).tenant_id,
      [`${mode}_at`]:              new Date().toISOString(),
      [`${mode}_mileage`]:         data.mileage,
      [`${mode}_fuel_level`]:      data.fuel_level,
      [`${mode}_condition`]:       data.condition,
      [`${mode}_notes`]:           data.notes,
      [`${mode}_signature`]:       data.signature,
      [`${mode}_signature_name`]:  data.signatory_name,
      [`${mode}_signed_at`]:       new Date().toISOString(),
      parking_spot:                data.parking_spot,
    }, { onConflict: 'booking_id' }).select().single()
    const protocol = protocolRaw as any

    // Update booking status
    const newStatus = mode === 'checkin' ? 'checked_in' : 'completed'
    await (supabase as any).from('bookings').update({ status: newStatus }).eq('id', selected.id)

    setSelected(null)
    setBookings([])
    setQuery('')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Check-in / Check-out</h1>

      {!selected ? (
        <Card>
          <CardHeader><CardTitle>Buchung suchen</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Buchungs-Nr. oder Kennzeichen..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
                leading={<Search className="h-4 w-4" />}
                className="flex-1"
              />
              <button
                onClick={search}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Suchen
              </button>
            </div>

            {bookings.length > 0 && (
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {bookings.map((b: any) => (
                  <li key={b.id}>
                    <button
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                      onClick={() => {
                        setSelected(b)
                        setMode(b.status === 'confirmed' ? 'checkin' : 'checkout')
                      }}
                    >
                      <div>
                        <p className="font-medium text-gray-900">{b.booking_number}</p>
                        <p className="text-xs text-gray-500">
                          {(b.customer as any)?.first_name} {(b.customer as any)?.last_name}
                          {' · '}
                          {(b.vehicle as any)?.license_plate}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{formatDate(b.dropoff_date)}</span>
                        <Badge variant={b.status === 'confirmed' ? 'info' : 'purple'}>
                          {b.status === 'confirmed' ? 'Check-in' : 'Check-out'}
                        </Badge>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Buchung {selected.booking_number}</CardTitle>
              <p className="mt-0.5 text-sm text-gray-500">
                {(selected.customer as any)?.first_name} {(selected.customer as any)?.last_name}
                {' · '}
                {(selected.vehicle as any)?.make} {(selected.vehicle as any)?.model}
                {' · '}
                {(selected.vehicle as any)?.license_plate}
              </p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Zurück
            </button>
          </CardHeader>
          <CardContent>
            <CheckinForm
              bookingId={selected.id}
              mode={mode}
              onSubmit={handleCheckin}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
