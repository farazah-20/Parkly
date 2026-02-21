import { createClient }  from '@/lib/supabase/server'
import { Badge }         from '@/components/ui/badge'
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table'
import { formatDate, formatCurrency }       from '@/lib/utils'
import { BOOKING_STATUS_LABELS }            from '@/lib/constants'

export const metadata = { title: 'Meine Buchungen' }

export default async function CustomerBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: bookingsRaw } = await supabase
    .from('bookings')
    .select('*, parking_lot:parking_lots(name, airport:airports(city, iata_code)), vehicle:vehicles(*)')
    .eq('customer_id', user!.id)
    .order('created_at', { ascending: false })
  const bookings = bookingsRaw as any[] | null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Meine Buchungen</h1>

      <Table>
        <Thead>
          <Tr>
            <Th>Buchungs-Nr.</Th>
            <Th>Parkplatz</Th>
            <Th>Fahrzeug</Th>
            <Th>Anreise</Th>
            <Th>Rückreise</Th>
            <Th>Betrag</Th>
            <Th>Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          {(bookings ?? []).map((b: any) => (
            <Tr key={b.id}>
              <Td className="font-mono text-xs">{b.booking_number}</Td>
              <Td>
                <p className="font-medium text-gray-900">{(b.parking_lot as any)?.name}</p>
                <p className="text-xs text-gray-400">{(b.parking_lot as any)?.airport?.city}</p>
              </Td>
              <Td>
                {(b.vehicle as any)
                  ? `${(b.vehicle as any).make} ${(b.vehicle as any).model} · ${(b.vehicle as any).license_plate}`
                  : '—'}
              </Td>
              <Td>{formatDate(b.dropoff_date, 'dd.MM.yy HH:mm')}</Td>
              <Td>{formatDate(b.pickup_date,  'dd.MM.yy HH:mm')}</Td>
              <Td className="font-medium">{formatCurrency(b.total_amount)}</Td>
              <Td>
                <Badge
                  variant={
                    b.status === 'completed' ? 'success' :
                    b.status === 'cancelled' ? 'danger'  :
                    b.status === 'confirmed' ? 'info'    : 'warning'
                  }
                >
                  {BOOKING_STATUS_LABELS[b.status]}
                </Badge>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {!bookings?.length && (
        <p className="text-center text-sm text-gray-400 py-8">Keine Buchungen vorhanden.</p>
      )}
    </div>
  )
}
