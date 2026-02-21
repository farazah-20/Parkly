'use client'

import { useEffect, useState } from 'react'
import type { User }           from '@supabase/supabase-js'
import { createClient }        from '@/lib/supabase/client'
import type { Profile }        from '@/types'

interface AuthState {
  user:    User | null
  profile: Profile | null
  loading: boolean
}

export function useAuth(): AuthState {
  const supabase = createClient()
  const [state, setState] = useState<AuthState>({ user: null, profile: null, loading: true })

  useEffect(() => {
    let cancelled = false

    const fetchProfile = async (userId: string) => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
      return data as Profile | null
    }

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (cancelled) return
      if (user) {
        const profile = await fetchProfile(user.id)
        if (!cancelled) setState({ user, profile, loading: false })
      } else {
        setState({ user: null, profile: null, loading: false })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (cancelled) return
      const user = session?.user ?? null
      if (user) {
        const profile = await fetchProfile(user.id)
        setState({ user, profile, loading: false })
      } else {
        setState({ user: null, profile: null, loading: false })
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return state
}
