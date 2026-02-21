import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** GET /api/invoices */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profileRaw } = await supabase.from('profiles').select('role, tenant_id').eq('id', user.id).single()
  const profile = profileRaw as any

  const url    = new URL(request.url)
  const status = url.searchParams.get('status')

  let query = (supabase as any)
    .from('invoices')
    .select('*, customer:profiles(first_name,last_name,email), booking:bookings(booking_number)')
    .order('created_at', { ascending: false })

  if (profile?.role === 'customer') {
    query = query.eq('customer_id', user.id)
  } else if (profile?.tenant_id) {
    query = query.eq('tenant_id', profile.tenant_id)
  }

  if (status) query = query.eq('status', status)

  const { data: dataRaw, error } = await query
  const data = dataRaw as any[] | null
  if (error) return NextResponse.json({ error: (error as any).message }, { status: 500 })

  return NextResponse.json({ data })
}

/** POST /api/invoices – create invoice */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profileRaw } = await supabase.from('profiles').select('role, tenant_id').eq('id', user.id).single()
  const profile = profileRaw as any
  if (!['operator', 'admin'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { items, tax_rate = 19, booking_id, customer_id, due_date, notes, recipient_email, status = 'draft' } = body

  const subtotal  = (items as any[]).reduce((s: number, i: any) => s + i.quantity * i.unit_price, 0)
  const taxAmount = (subtotal * tax_rate) / 100
  const total     = subtotal + taxAmount

  const { data: dataRaw, error } = await (supabase as any).from('invoices').insert({
    tenant_id:       profile!.tenant_id!,
    booking_id:      booking_id  ?? null,
    customer_id:     customer_id ?? null,
    items,
    subtotal,
    tax_rate,
    tax_amount:      taxAmount,
    total,
    due_date:        due_date        ?? null,
    notes:           notes           ?? null,
    recipient_email: recipient_email ?? null,
    status,
    sent_at:         status === 'sent' ? new Date().toISOString() : null,
  }).select().single()
  const data = dataRaw as any

  if (error) return NextResponse.json({ error: (error as any).message }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
