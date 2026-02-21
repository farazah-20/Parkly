import { createClient }  from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge }         from '@/components/ui/badge'
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table'
import { formatDate, formatCurrency }       from '@/lib/utils'
import { BOOKING_STATUS_LABELS }            from '@/lib/constants'
import { CalendarDays, Car, Banknote, Users } from 'lucide-react'
import { startOfDay, endOfDay } from 'date-fns'
import { AnimatedKPIGrid } from '@/components/operator/AnimatedKPIGrid'

export const metadata = { title: 'Operator Dashboard' }

export default async function OperatorDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profileRaw }  = await supabase.from('profiles').select('tenant_id').eq('id', user!.id).single()
  const profile = profileRaw as any
  const tenantId = profile?.tenant_id

  const today     = new Date()
  const todayStart = startOfDay(today).toISOString()
  const todayEnd   = endOfDay(today).toISOString()

  const [
    { data: todayBookingsRaw },
    { data: allBookingsRaw },
    { data: driversRaw },
    { data: lotsRaw },
  ] = await Promise.all([
    supabase.from('bookings').select('*').eq('tenant_id', tenantId!).gte('created_at', todayStart).lte('created_at', todayEnd),
    supabase.from('bookings').select('*, parking_lot:parking_lots(name), customer:profiles(first_name,last_name)').eq('tenant_id', tenantId!).order('created_at', { ascending: false }).limit(10),
    supabase.from('drivers').select('id').eq('tenant_id', tenantId!).eq('is_active', true),
    supabase.from('parking_lots').select('total_capacity, available_spots').eq('tenant_id', tenantId!).eq('is_active', true),
  ])
  const todayBookings = todayBookingsRaw as any[] | null
  const allBookings   = allBookingsRaw   as any[] | null
  const drivers       = driversRaw       as any[] | null
  const lots          = lotsRaw          as any[] | null

  const todayRevenue   = todayBookings?.reduce((s: number, b: any) => s + b.total_amount, 0) ?? 0
  const totalCapacity  = lots?.reduce((s: number, l: any) => s + l.total_capacity,  0) ?? 0
  const availableSpots = lots?.reduce((s: number, l: any) => s + l.available_spots, 0) ?? 0
  const occupancy      = totalCapacity > 0 ? Math.round(((totalCapacity - availableSpots) / totalCapacity) * 100) : 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* KPI cards */}
      <AnimatedKPIGrid items={[
        { label: 'Buchungen heute', value: todayBookings?.length ?? 0,    icon: CalendarDays, color: 'text-brand-600',   bg: 'bg-brand-50'  },
        { label: 'Umsatz heute',    value: formatCurrency(todayRevenue),  icon: Banknote,     color: 'text-green-600',  bg: 'bg-green-50'  },
        { label: 'Auslastung',      value: `${occupancy} %`,              icon: Car,          color: 'text-amber-600',  bg: 'bg-amber-50'  },
        { label: 'Aktive Fahrer',   value: drivers?.length ?? 0,          icon: Users,        color: 'text-purple-600', bg: 'bg-purple-50' },
      ]} />

      {/* Recent bookings table */}
      <Card>
        <CardHeader>
          <CardTitle>Neueste Buchungen</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <Thead>
              <Tr>
                <Th>Nr.</Th>
                <Th>Kunde</Th>
                <Th>Parkplatz</Th>
                <Th>Anreise</Th>
                <Th>Betrag</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {allBookings?.map((b: any) => (
                <Tr key={b.id}>
                  <Td className="font-mono text-xs">{b.booking_number}</Td>
                  <Td>{(b.customer as any)?.first_name} {(b.customer as any)?.last_name}</Td>
                  <Td>{(b.parking_lot as any)?.name}</Td>
                  <Td>{formatDate(b.dropoff_date, 'dd.MM.yy HH:mm')}</Td>
                  <Td className="font-medium">{formatCurrency(b.total_amount)}</Td>
                  <Td>
                    <Badge variant={
                      b.status === 'completed' ? 'success' :
                      b.status === 'cancelled' ? 'danger'  :
                      b.status === 'confirmed' ? 'info'    : 'warning'
                    }>
                      {BOOKING_STATUS_LABELS[b.status]}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
