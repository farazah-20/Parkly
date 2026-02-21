'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Tenant }  from '@/types'

export function useTenant() {
  const supabase = createClient()
  const [tenant,  setTenant]  = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
      if (!profile?.tenant_id || cancelled) { setLoading(false); return }

      const { data } = await supabase.from('tenants').select('*').eq('id', profile.tenant_id).single()
      if (!cancelled) {
        setTenant(data as Tenant)
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  const updateSettings = async (settings: Record<string, unknown>) => {
    if (!tenant) return
    const { data } = await supabase.from('tenants').update({ settings }).eq('id', tenant.id).select().single()
    if (data) setTenant(data as Tenant)
  }

  return { tenant, loading, updateSettings }
}
