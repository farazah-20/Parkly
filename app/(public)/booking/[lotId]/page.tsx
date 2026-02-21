import { notFound, redirect } from 'next/navigation'
import { createClient }  from '@/lib/supabase/server'
import { BookingForm }   from '@/components/public/BookingForm'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate, formatCurrency, calcParkingDays } from '@/lib/utils'
import { MapPin, Calendar } from 'lucide-react'
import type { BookingFormData } from '@/types'

interface BookingPageProps {
  params:       Promise<{ lotId: string }>
  searchParams: Promise<{ checkin?: string; checkout?: string }>
}

export default async function BookingPage({ params, searchParams }: BookingPageProps) {
  const { lotId }             = await params
  const { checkin, checkout } = await searchParams
  if (!checkin || !checkout) redirect('/search')

  const supabase = await createClient()

  // Auth guard
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?redirect=/booking/${lotId}?checkin=${checkin}&checkout=${checkout}`)

  // Fetch lot
  const { data: lotRaw } = await supabase
    .from('parking_lots')
    .select('*, airport:airports(*), tenant:tenants(*)')
    .eq('id', lotId)
    .eq('is_active', true)
    .single()
  const lot = lotRaw as any

  if (!lot) notFound()

  const days  = calcParkingDays(checkin, checkout)
  const total = lot.price_per_day * days

  async function createBooking(data: BookingFormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Create booking
    const { data: bookingRaw, error: bookingErr } = await (supabase as any).from('bookings').insert({
      tenant_id:        lot.tenant_id,
      parking_lot_id:   lot.id,
      customer_id:      user.id,
      flight_number:    data.flight_number,
      flight_departure: data.flight_departure || null,
      flight_arrival:   data.flight_arrival   || null,
      dropoff_date:     data.dropoff_date,
      pickup_date:      data.pickup_date,
      total_days:       days,
      price_per_day:    lot.price_per_day,
      total_amount:     total,
      payment_method:   data.payment_method as any,
      status:           'pending',
      notes:            data.notes,
    }).select().single()
    const booking = bookingRaw as any

    if (bookingErr || !booking) throw new Error((bookingErr as any)?.message)

    // Create vehicle
    await (supabase as any).from('vehicles').insert({
      booking_id:    booking.id,
      make:          data.make,
      model:         data.model,
      year:          data.year,
      color:         data.color,
      license_plate: data.license_plate,
    })
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Booking summary */}
        <aside className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardContent className="space-y-4 py-5">
              <h2 className="font-semibold text-gray-900">{lot.name}</h2>
              <p className="flex items-start gap-1.5 text-sm text-gray-500">
                <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                {lot.address}
              </p>
              <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
                <div className="flex items-start gap-2 text-gray-600">
                  <Calendar className="mt-0.5 h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium">Anreise</p>
                    <p>{formatDate(checkin, 'dd.MM.yyyy HH:mm')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-gray-600">
                  <Calendar className="mt-0.5 h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium">Rückreise</p>
                    <p>{formatDate(checkout, 'dd.MM.yyyy HH:mm')}</p>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>{days} Tage × {formatCurrency(lot.price_per_day)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-base">
                  <span>Gesamt</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Multi-step booking form */}
        <div className="lg:col-span-2">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">Ihre Buchung</h1>
          <BookingForm
            lot={lot as any}
            checkin={checkin}
            checkout={checkout}
            onSubmit={createBooking}
          />
        </div>
      </div>
    </div>
  )
}
