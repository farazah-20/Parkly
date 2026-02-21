import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

/** GET /api/cash-register?date=yyyy-MM-dd */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profileRaw } = await supabase.from('profiles').select('role, tenant_id').eq('id', user.id).single()
  const profile = profileRaw as any
  if (!['operator', 'admin'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const date = new URL(request.url).searchParams.get('date') ?? format(new Date(), 'yyyy-MM-dd')

  const [{ data: cashRaw }, { data: paymentsRaw }] = await Promise.all([
    supabase.from('daily_cash').select('*').eq('tenant_id', profile!.tenant_id!).eq('date', date).single(),
    supabase
      .from('payments')
      .select('*, booking:bookings(booking_number, customer:profiles(first_name,last_name))')
      .eq('tenant_id', profile!.tenant_id!)
      .gte('created_at', `${date}T00:00:00Z`)
      .lte('created_at', `${date}T23:59:59Z`)
      .order('created_at', { ascending: false }),
  ])
  const cash     = cashRaw     as any
  const payments = paymentsRaw as any[] | null

  return NextResponse.json({ cash, payments })
}

/** POST /api/cash-register – record a payment & update daily totals */
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
  const { booking_id, invoice_id, amount, method } = body
  const date = format(new Date(), 'yyyy-MM-dd')

  // Ensure daily_cash row exists
  const { data: existingCashRaw } = await supabase.from('daily_cash').select('id').eq('tenant_id', profile!.tenant_id!).eq('date', date).single()
  const existingCash = existingCashRaw as any
  if (!existingCash) {
    await (supabase as any).from('daily_cash').insert({ tenant_id: profile!.tenant_id!, date })
  }

  const { data: cashRaw } = await supabase.from('daily_cash').select('*').eq('tenant_id', profile!.tenant_id!).eq('date', date).single()
  const cash = cashRaw as any

  // Update daily totals
  const field = `total_${method}`
  await (supabase as any).from('daily_cash').update({
    [field]: (cash?.[field] ?? 0) + amount,
  }).eq('id', cash!.id)

  // Insert payment record
  const { data: paymentRaw, error } = await (supabase as any).from('payments').insert({
    tenant_id:     profile!.tenant_id!,
    booking_id:    booking_id   ?? null,
    invoice_id:    invoice_id   ?? null,
    daily_cash_id: cash!.id,
    amount,
    method,
    status:        'paid',
    processed_by:  user.id,
    processed_at:  new Date().toISOString(),
  }).select().single()
  const payment = paymentRaw as any

  if (error) return NextResponse.json({ error: (error as any).message }, { status: 500 })

  // Mark booking as paid
  if (booking_id) {
    await (supabase as any).from('bookings').update({ payment_status: 'paid', payment_method: method }).eq('id', booking_id)
  }

  return NextResponse.json({ data: payment }, { status: 201 })
}

/** PATCH /api/cash-register – close the day */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profileRaw } = await supabase.from('profiles').select('role, tenant_id').eq('id', user.id).single()
  const profile = profileRaw as any
  if (!['operator', 'admin'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const date = format(new Date(), 'yyyy-MM-dd')

  const { data: dataRaw, error } = await (supabase as any)
    .from('daily_cash')
    .update({
      closing_balance: body.closing_balance,
      notes:           body.notes ?? null,
      closed_by:       user.id,
      closed_at:       new Date().toISOString(),
    })
    .eq('tenant_id', profile!.tenant_id!)
    .eq('date', date)
    .select()
    .single()
  const data = dataRaw as any

  if (error) return NextResponse.json({ error: (error as any).message }, { status: 500 })

  return NextResponse.json({ data })
}
