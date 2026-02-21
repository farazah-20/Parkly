import { createClient }  from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, Thead, Tbody, Tr, Th, Td }         from '@/components/ui/table'
import { Badge }         from '@/components/ui/badge'
import { formatDate, formatCurrency }               from '@/lib/utils'
import { PAYMENT_METHOD_LABELS }                    from '@/lib/constants'
import { Banknote }      from 'lucide-react'
import { format }        from 'date-fns'

export const metadata = { title: 'Tageskasse' }

export default async function CashRegisterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profileRaw }  = await supabase.from('profiles').select('tenant_id').eq('id', user!.id).single()
  const profile = profileRaw as any

  const today = format(new Date(), 'yyyy-MM-dd')

  const [{ data: cashRaw }, { data: paymentsRaw }] = await Promise.all([
    supabase.from('daily_cash').select('*').eq('tenant_id', profile!.tenant_id!).eq('date', today).single(),
    supabase
      .from('payments')
      .select('*, booking:bookings(booking_number)')
      .eq('tenant_id', profile!.tenant_id!)
      .gte('created_at', `${today}T00:00:00Z`)
      .lte('created_at', `${today}T23:59:59Z`)
      .order('created_at', { ascending: false }),
  ])
  const cash = cashRaw as any
  const payments = paymentsRaw as any[] | null

  const totals = {
    cash:    payments?.filter((p: any) => p.method === 'cash').reduce((s: number, p: any) => s + p.amount, 0)    ?? 0,
    card:    payments?.filter((p: any) => p.method === 'card').reduce((s: number, p: any) => s + p.amount, 0)    ?? 0,
    online:  payments?.filter((p: any) => p.method === 'online').reduce((s: number, p: any) => s + p.amount, 0)  ?? 0,
    invoice: payments?.filter((p: any) => p.method === 'invoice').reduce((s: number, p: any) => s + p.amount, 0) ?? 0,
  }
  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tageskasse</h1>
        <p className="text-sm text-gray-500">{format(new Date(), 'dd.MM.yyyy')}</p>
      </div>

      {/* Daily totals */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Bar',      value: totals.cash,    color: 'text-green-600',  bg: 'bg-green-50'  },
          { label: 'EC-Karte', value: totals.card,    color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { label: 'Online',   value: totals.online,  color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Rechnung', value: totals.invoice, color: 'text-amber-600',  bg: 'bg-amber-50'  },
        ].map(({ label, value, color, bg }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 py-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
                <Banknote className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(value)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tagesumsatz</CardTitle>
          <span className="text-2xl font-bold text-gray-900">{formatCurrency(grandTotal)}</span>
        </CardHeader>
      </Card>

      {/* Payment list */}
      <Card>
        <CardHeader><CardTitle>Zahlungen heute</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <Thead>
              <Tr>
                <Th>Buchungs-Nr.</Th>
                <Th>Betrag</Th>
                <Th>Zahlungsart</Th>
                <Th>Uhrzeit</Th>
              </Tr>
            </Thead>
            <Tbody>
              {payments?.map((p: any) => (
                <Tr key={p.id}>
                  <Td className="font-mono text-xs">{(p.booking as any)?.booking_number ?? '—'}</Td>
                  <Td className="font-medium text-gray-900">{formatCurrency(p.amount)}</Td>
                  <Td>
                    <Badge variant={p.method === 'cash' ? 'success' : p.method === 'card' ? 'info' : p.method === 'online' ? 'purple' : 'warning'}>
                      {PAYMENT_METHOD_LABELS[p.method]}
                    </Badge>
                  </Td>
                  <Td>{formatDate(p.created_at, 'HH:mm')}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          {!payments?.length && (
            <p className="py-8 text-center text-sm text-gray-400">Noch keine Zahlungen heute.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
