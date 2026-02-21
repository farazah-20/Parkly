import { createClient }  from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge }         from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { ParkingSquare, Car, Bus, Wifi } from 'lucide-react'
import { FEATURES_LABELS } from '@/lib/constants'

export const metadata = { title: 'Parkplatz-Management' }

export default async function ParkingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profileRaw }  = await supabase.from('profiles').select('tenant_id').eq('id', user!.id).single()
  const profile = profileRaw as any

  const { data: lotsRaw } = await supabase
    .from('parking_lots')
    .select('*, airport:airports(name, city, iata_code)')
    .eq('tenant_id', profile!.tenant_id!)
    .order('name')
  const lots = lotsRaw as any[] | null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Parkplatz-Management</h1>
        {/* Add lot button – client component needed for modal */}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {lots?.map((lot: any) => {
          const occupancy = lot.total_capacity > 0
            ? Math.round(((lot.total_capacity - lot.available_spots) / lot.total_capacity) * 100)
            : 0

          return (
            <Card key={lot.id}>
              <CardHeader>
                <div>
                  <CardTitle>{lot.name}</CardTitle>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {(lot.airport as any)?.city} ({(lot.airport as any)?.iata_code})
                  </p>
                </div>
                <Badge variant={lot.is_active ? 'success' : 'default'}>
                  {lot.is_active ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Capacity bar */}
                <div>
                  <div className="mb-1 flex justify-between text-xs text-gray-500">
                    <span>{lot.available_spots} frei</span>
                    <span>{occupancy}% belegt</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        occupancy > 90 ? 'bg-red-500' : occupancy > 70 ? 'bg-amber-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${occupancy}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">{lot.total_capacity} Stellplätze gesamt</p>
                </div>

                {/* Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-400">Preis/Tag</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(lot.price_per_day)}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-400">Entfernung</p>
                    <p className="font-semibold text-gray-900">
                      {lot.distance_to_airport ? `${(lot.distance_to_airport / 1000).toFixed(1)} km` : '—'}
                    </p>
                  </div>
                </div>

                {/* Services & features */}
                <div className="flex flex-wrap gap-1.5">
                  {lot.shuttle_available && (
                    <Badge variant="info"><Bus className="mr-1 h-3 w-3" />Shuttle</Badge>
                  )}
                  {lot.valet_available && (
                    <Badge variant="purple"><Car className="mr-1 h-3 w-3" />Valet</Badge>
                  )}
                  {(lot.features as string[]).map((f: string) => (
                    <Badge key={f} variant="default">{FEATURES_LABELS[f] ?? f}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {!lots?.length && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center text-gray-400">
          <ParkingSquare className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3">Noch kein Parkplatz angelegt.</p>
        </div>
      )}
    </div>
  )
}
