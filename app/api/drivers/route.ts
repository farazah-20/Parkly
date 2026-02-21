import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

/** GET /api/drivers */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profileRaw } = await supabase.from('profiles').select('role, tenant_id').eq('id', user.id).single()
  const profile = profileRaw as any
  if (!['operator', 'admin'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: dataRaw, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('tenant_id', profile!.tenant_id!)
    .order('last_name')
  const data = dataRaw as any[] | null

  if (error) return NextResponse.json({ error: (error as any).message }, { status: 500 })

  return NextResponse.json({ data })
}

/** POST /api/drivers – create driver + optional auth account */
export async function POST(request: NextRequest) {
  const supabase      = await createClient()
  const adminSupabase = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profileRaw } = await supabase.from('profiles').select('role, tenant_id').eq('id', user.id).single()
  const profile = profileRaw as any
  if (!['operator', 'admin'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { first_name, last_name, email, phone, license_number, create_account, password } = body

  let profileId: string | undefined

  if (create_account && password) {
    // Create Supabase auth account for the driver
    const { data: newUser, error: authErr } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 })

    profileId = newUser.user?.id

    // Update profile role
    if (profileId) {
      await (adminSupabase as any).from('profiles').update({
        first_name,
        last_name,
        role:      'driver',
        tenant_id: profile!.tenant_id,
      }).eq('id', profileId)
    }
  }

  const { data: dataRaw, error } = await (supabase as any).from('drivers').insert({
    tenant_id:      profile!.tenant_id!,
    profile_id:     profileId ?? null,
    first_name,
    last_name,
    email,
    phone:          phone          ?? null,
    license_number: license_number ?? null,
  }).select().single()
  const data = dataRaw as any

  if (error) return NextResponse.json({ error: (error as any).message }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
