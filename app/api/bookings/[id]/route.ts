import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** GET /api/bookings/:id */
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id }   = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: dataRaw, error } = await supabase
    .from('bookings')
    .select('*, parking_lot:parking_lots(*, airport:airports(*), tenant:tenants(*)), customer:profiles(*), vehicle:vehicles(*), checkin_protocol:checkin_protocols(*)')
    .eq('id', id)
    .single()
  const data = dataRaw as any

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ data })
}

/** PATCH /api/bookings/:id – update status, assign driver, etc. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id }   = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profileRaw } = await supabase.from('profiles').select('role, tenant_id').eq('id', user.id).single()
  const profile = profileRaw as any

  const body = await request.json()
  const allowed = ['status', 'driver_id', 'notes', 'payment_status', 'payment_method']
  const update  = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  const { data: dataRaw, error } = await (supabase as any)
    .from('bookings')
    .update(update)
    .eq('id', id)
    .eq('tenant_id', profile?.tenant_id ?? '')
    .select()
    .single()
  const data = dataRaw as any

  if (error) return NextResponse.json({ error: (error as any).message }, { status: 500 })

  return NextResponse.json({ data })
}

/** DELETE /api/bookings/:id – cancel booking */
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id }   = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await (supabase as any)
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('customer_id', user.id)

  if (error) return NextResponse.json({ error: (error as any).message }, { status: 500 })

  return NextResponse.json({ success: true })
}
