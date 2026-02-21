import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** GET /api/parking-lots?airport=FRA&checkin=…&checkout=… */
export async function GET(request: NextRequest) {
  const url       = new URL(request.url)
  const airport   = url.searchParams.get('airport')
  const minPrice  = url.searchParams.get('minPrice')
  const maxPrice  = url.searchParams.get('maxPrice')
  const valet     = url.searchParams.get('valet')
  const shuttle   = url.searchParams.get('shuttle')

  const supabase = await createClient()

  let query = (supabase as any)
    .from('parking_lots')
    .select('*, airport:airports(*), tenant:tenants(name, logo_url)')
    .eq('is_active', true)
    .gt('available_spots', 0)
    .order('price_per_day')

  if (airport) {
    const { data: aRaw } = await supabase.from('airports').select('id').eq('iata_code', airport).single()
    const a = aRaw as any
    if (a) query = query.eq('airport_id', a.id)
  }

  if (minPrice) query = query.gte('price_per_day', Number(minPrice))
  if (maxPrice) query = query.lte('price_per_day', Number(maxPrice))
  if (valet   === 'true') query = query.eq('valet_available', true)
  if (shuttle === 'true') query = query.eq('shuttle_available', true)

  const { data: dataRaw, error } = await query
  const data = dataRaw as any[] | null
  if (error) return NextResponse.json({ error: (error as any).message }, { status: 500 })

  return NextResponse.json({ data })
}

/** POST /api/parking-lots – operator creates a new lot */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profileRaw } = await supabase.from('profiles').select('role, tenant_id').eq('id', user.id).single()
  const profile = profileRaw as any
  if (!profile?.tenant_id || !['operator', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { data: dataRaw, error } = await (supabase as any)
    .from('parking_lots')
    .insert({ ...body, tenant_id: profile.tenant_id })
    .select()
    .single()
  const data = dataRaw as any

  if (error) return NextResponse.json({ error: (error as any).message }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
