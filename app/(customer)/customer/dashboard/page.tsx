import { createClient }  from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge }         from '@/components/ui/badge'
import { formatDate, formatCurrency, fullName } from '@/lib/utils'
import { BOOKING_STATUS_LABELS } from '@/lib/constants'
import { CalendarDays, Car, MapPin } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Mein Dashboard' }

export default async function CustomerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profileRaw }, { data: bookingsRaw }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase
      .from('bookings')
      .select('*, parking_lot:parking_lots(name, address, airport:airports(city, iata_code)), vehicle:vehicles(*)')
      .eq('customer_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])
  const profile  = profileRaw  as any
  const bookings = bookingsRaw as any[] | null

  const upcoming  = bookings?.filter((b: any) => b.status === 'confirmed' || b.status === 'pending') ?? []
  const completed = bookings?.filter((b: any) => b.status === 'completed') ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Willkommen, {fullName(profile?.first_name, profile?.last_name) || user?.email}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">Ihre bevorstehenden Buchungen im Überblick.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Aktive Buchungen',   value: upcoming.length,  icon: CalendarDays },
          { label: 'Abgeschlossene',     value: completed.length, icon: Car          },
          { label: 'Gesamt ausgegeben',  value: formatCurrency(bookings?.reduce((s: number, b: any) => s + b.total_amount, 0) ?? 0), icon: MapPin },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                <Icon className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Letzte Buchungen</CardTitle>
          <Link href="/customer/bookings" className="text-sm text-brand-600 hover:underline">
            Alle anzeigen →
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {bookings && bookings.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {bookings.slice(0, 5).map((b: any) => (
                <li key={b.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Car className="h-8 w-8 rounded-lg bg-gray-100 p-1.5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{(b.parking_lot as any)?.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(b.dropoff_date)} – {formatDate(b.pickup_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden font-medium text-gray-700 sm:block">
                      {formatCurrency(b.total_amount)}
                    </span>
                    <Badge
                      variant={
                        b.status === 'completed' ? 'success' :
                        b.status === 'cancelled' ? 'danger'  :
                        b.status === 'confirmed' ? 'info'    : 'warning'
                      }
                    >
                      {BOOKING_STATUS_LABELS[b.status]}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-12 text-center text-sm text-gray-400">
              Noch keine Buchungen.{' '}
              <Link href="/" className="text-brand-600 hover:underline">Jetzt buchen →</Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
