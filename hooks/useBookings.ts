'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Booking } from '@/types'

interface UseBookingsOptions {
  tenantId?:  string
  customerId?: string
  status?:    string
  limit?:     number
}

export function useBookings(options: UseBookingsOptions = {}) {
  const supabase = createClient()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = supabase
      .from('bookings')
      .select('*, parking_lot:parking_lots(name, address, airport:airports(city,iata_code)), customer:profiles(first_name,last_name), vehicle:vehicles(*)')
      .order('created_at', { ascending: false })

    if (options.tenantId)  query = query.eq('tenant_id', options.tenantId)
    if (options.customerId) query = query.eq('customer_id', options.customerId)
    if (options.status)    query = query.eq('status', options.status)
    if (options.limit)     query = query.limit(options.limit)

    const { data, error } = await query
    if (error) {
      setError(error.message)
    } else {
      setBookings((data as Booking[]) ?? [])
    }
    setLoading(false)
  }, [options.tenantId, options.customerId, options.status, options.limit])

  useEffect(() => { fetch() }, [fetch])

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('bookings').update({ status }).eq('id', id)
    fetch()
  }

  const assignDriver = async (id: string, driverId: string) => {
    await supabase.from('bookings').update({ driver_id: driverId }).eq('id', id)
    fetch()
  }

  return { bookings, loading, error, refetch: fetch, updateStatus, assignDriver }
}
