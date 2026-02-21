import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** POST /api/checkin – save checkin or checkout protocol */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profileRaw } = await supabase.from('profiles').select('role, tenant_id').eq('id', user.id).single()
  const profile = profileRaw as any
  if (!['operator', 'driver', 'admin'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const {
    booking_id,
    mode, // 'checkin' | 'checkout'
    parking_spot,
    mileage,
    fuel_level,
    condition,
    notes,
    photos = [],
    signature,
    signatory_name,
  } = body

  const now = new Date().toISOString()

  const upsertData: Record<string, unknown> = {
    booking_id,
    tenant_id:    profile!.tenant_id!,
    parking_spot: parking_spot ?? null,
    [`${mode}_at`]:             now,
    [`${mode}_mileage`]:        mileage,
    [`${mode}_fuel_level`]:     fuel_level,
    [`${mode}_condition`]:      condition,
    [`${mode}_notes`]:          notes    ?? null,
    [`${mode}_photos`]:         photos,
    [`${mode}_signature`]:      signature,
    [`${mode}_signature_name`]: signatory_name,
    [`${mode}_signed_at`]:      now,
  }

  // Find driver id if current user is a driver
  if (profile?.role === 'driver') {
    const { data: driverRaw } = await supabase.from('drivers').select('id').eq('profile_id', user.id).single()
    const driver = driverRaw as any
    if (driver) upsertData.driver_id = driver.id
  }

  const { data: dataRaw, error } = await (supabase as any)
    .from('checkin_protocols')
    .upsert(upsertData, { onConflict: 'booking_id' })
    .select()
    .single()
  const data = dataRaw as any

  if (error) return NextResponse.json({ error: (error as any).message }, { status: 500 })

  // Update booking status
  const newStatus = mode === 'checkin' ? 'checked_in' : 'completed'
  await (supabase as any).from('bookings').update({ status: newStatus }).eq('id', booking_id)

  return NextResponse.json({ data }, { status: 201 })
}

/** GET /api/checkin?booking_id=… */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bookingId = new URL(request.url).searchParams.get('booking_id')
  if (!bookingId) return NextResponse.json({ error: 'booking_id required' }, { status: 400 })

  const { data: dataRaw, error } = await supabase
    .from('checkin_protocols')
    .select('*')
    .eq('booking_id', bookingId)
    .single()
  const data = dataRaw as any

  if (error) return NextResponse.json({ error: (error as any).message }, { status: 404 })

  return NextResponse.json({ data })
}
