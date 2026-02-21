import { createClient }  from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge }         from '@/components/ui/badge'
import { formatDate }    from '@/lib/utils'
import { BOOKING_STATUS_LABELS } from '@/lib/constants'
import { Car }           from 'lucide-react'
import Link              from 'next/link'

export const metadata = { title: 'Fahrer Dashboard' }

export default async function DriverDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Find driver record
  const { data: driverRaw } = await supabase
    .from('drivers')
    .select('*')
    .eq('profile_id', user!.id)
    .single()
  const driver = driverRaw as any

  // Today's assignments
  const today = new Date().toISOString().split('T')[0]
  const { data: bookingsRaw } = await supabase
    .from('bookings')
    .select('*, parking_lot:parking_lots(name), customer:profiles(first_name,last_name), vehicle:vehicles(*)')
    .eq('driver_id', driver?.id ?? '')
    .or(`dropoff_date.gte.${today}T00:00:00,pickup_date.gte.${today}T00:00:00`)
    .in('status', ['confirmed', 'checked_in'])
    .order('dropoff_date')
    .limit(20)
  const bookings = bookingsRaw as any[] | null

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Meine Aufgaben heute</h1>

      {bookings && bookings.length > 0 ? (
        <div className="space-y-3">
          {bookings.map((b: any) => (
            <Card key={b.id}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                    <Car className="h-5 w-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {(b.vehicle as any)?.make} {(b.vehicle as any)?.model} · {(b.vehicle as any)?.license_plate}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(b.customer as any)?.first_name} {(b.customer as any)?.last_name}
                      {' · '}
                      {(b.parking_lot as any)?.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      Anreise: {formatDate(b.dropoff_date, 'dd.MM. HH:mm')}
                      {' · '}
                      Abreise: {formatDate(b.pickup_date, 'dd.MM. HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={b.status === 'confirmed' ? 'info' : 'purple'}>
                    {BOOKING_STATUS_LABELS[b.status]}
                  </Badge>
                  <Link
                    href={`/driver/checkin?booking=${b.id}`}
                    className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
                  >
                    {b.status === 'confirmed' ? 'Check-in starten' : 'Check-out starten'}
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center text-gray-400">
          <Car className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3">Keine Aufgaben für heute.</p>
        </div>
      )}
    </div>
  )
}
