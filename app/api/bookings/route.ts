import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** GET /api/bookings – list bookings for current user/tenant */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profileRaw } = await supabase.from('profiles').select('role, tenant_id').eq('id', user.id).single()
  const profile = profileRaw as any
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const url = new URL(request.url)
  const status   = url.searchParams.get('status')
  const page     = parseInt(url.searchParams.get('page') ?? '1')
  const pageSize = parseInt(url.searchParams.get('pageSize') ?? '20')
  const from     = (page - 1) * pageSize
  const to       = from + pageSize - 1

  let query = (supabase as any)
    .from('bookings')
    .select('*, parking_lot:parking_lots(name, address, airport:airports(city,iata_code)), customer:profiles(first_name,last_name,phone), vehicle:vehicles(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (profile.role === 'customer') {
    query = query.eq('customer_id', user.id)
  } else if (profile.tenant_id) {
    query = query.eq('tenant_id', profile.tenant_id)
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: (error as any).message }, { status: 500 })

  return NextResponse.json({ data, count, page, pageSize })
}

/** POST /api/bookings – create a new booking */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  const {
    parking_lot_id,
    dropoff_date,
    pickup_date,
    flight_number,
    flight_departure,
    flight_arrival,
    payment_method,
    notes,
    vehicle,
  } = body

  // Fetch lot to get price and tenant
  const { data: lotRaw } = await supabase.from('parking_lots').select('price_per_day, tenant_id, available_spots').eq('id', parking_lot_id).single()
  const lot = lotRaw as any
  if (!lot) return NextResponse.json({ error: 'Parkplatz nicht gefunden' }, { status: 404 })
  if (lot.available_spots <= 0) return NextResponse.json({ error: 'Keine freien Stellplätze' }, { status: 409 })

  const totalDays = Math.max(
    Math.ceil((new Date(pickup_date).getTime() - new Date(dropoff_date).getTime()) / (1000 * 60 * 60 * 24)),
    1,
  )

  const { data: bookingRaw, error } = await (supabase as any).from('bookings').insert({
    tenant_id:        lot.tenant_id,
    parking_lot_id,
    customer_id:      user.id,
    dropoff_date,
    pickup_date,
    flight_number:    flight_number    || null,
    flight_departure: flight_departure || null,
    flight_arrival:   flight_arrival   || null,
    total_days:       totalDays,
    price_per_day:    lot.price_per_day,
    total_amount:     lot.price_per_day * totalDays,
    payment_method:   payment_method   || null,
    notes:            notes            || null,
    status:           'pending',
  }).select().single()
  const booking = bookingRaw as any

  if (error) return NextResponse.json({ error: (error as any).message }, { status: 500 })

  // Create vehicle record
  if (vehicle) {
    await (supabase as any).from('vehicles').insert({ booking_id: booking.id, ...vehicle })
  }

  // Decrement available spots
  await (supabase as any).from('parking_lots').update({ available_spots: lot.available_spots - 1 }).eq('id', parking_lot_id)

  return NextResponse.json({ data: booking }, { status: 201 })
}
