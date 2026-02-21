import { createClient }       from '@/lib/supabase/server'
import { ParkingLotCard }    from '@/components/public/ParkingLotCard'
import { SearchBar }         from '@/components/public/SearchBar'
import { SearchFiltersBar }  from '@/components/public/SearchFiltersBar'
import { calcParkingDays }   from '@/lib/utils'
import { MapPin, Search }    from 'lucide-react'
import { Suspense }          from 'react'

interface SearchPageProps {
  searchParams: Promise<{
    airport?:  string
    checkin?:  string
    checkout?: string
    sort?:     string
    valet?:    string
    shuttle?:  string
    covered?:  string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams
  const { airport, checkin, checkout } = sp
  const sort    = sp.sort    ?? 'price_asc'
  const valet   = sp.valet   === '1'
  const shuttle = sp.shuttle === '1'
  const covered = sp.covered === '1'

  const supabase = await createClient()

  // Fetch airports for the search bar
  const { data: airports } = await supabase.from('airports').select('*').order('city')

  // Look up airport_id from IATA code (fixes the join-filter bug)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let airportRow: any = null
  if (airport) {
    const { data } = await supabase
      .from('airports')
      .select('id, name, city')
      .eq('iata_code', airport)
      .single()
    airportRow = data
  }

  // Build the parking lots query
  let query = supabase
    .from('parking_lots')
    .select('*, airport:airports(*), tenant:tenants(*)')
    .eq('is_active', true)
    .gt('available_spots', 0)

  if (airportRow) query = query.eq('airport_id', airportRow.id)
  if (valet)      query = query.eq('valet_available', true)
  if (shuttle)    query = query.eq('shuttle_available', true)
  if (covered)    query = (query as any).contains('features', ['covered'])

  if (sort === 'price_desc') query = query.order('price_per_day', { ascending: false })
  else if (sort === 'distance') query = query.order('distance_to_airport', { ascending: true })
  else query = query.order('price_per_day', { ascending: true })

  const { data: lots } = airport && airportRow ? await query : { data: [] }

  const days = checkin && checkout ? calcParkingDays(checkin, checkout) : 1
  const hasSearch = Boolean(airport && checkin && checkout)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Sticky search header ──────────────────────────────────────────────── */}
      <div className="sticky top-[57px] z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <SearchBar
            airports={airports ?? []}
            initialValues={{
              airport:  airport  ?? '',
              checkin:  checkin  ?? '',
              checkout: checkout ?? '',
            }}
          />
        </div>
      </div>

      {/* ── Airport context strip ─────────────────────────────────────────────── */}
      {airportRow && (
        <div className="border-b border-gray-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 lg:px-8">
            <p className="flex items-center gap-1.5 text-sm text-gray-500">
              <MapPin className="h-3.5 w-3.5 text-brand-500" />
              <span className="font-medium text-gray-700">{airportRow.city}</span>
              <span>·</span>
              <span>{airportRow.name}</span>
              {checkin && checkout && (
                <>
                  <span>·</span>
                  <span>{days} {days === 1 ? 'Tag' : 'Tage'}</span>
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

          {/* ── Sidebar ───────────────────────────────────────────────────────── */}
          <aside className="w-full lg:w-64 lg:flex-shrink-0 lg:sticky lg:top-36">
            <Suspense>
              <SearchFiltersBar
                resultCount={lots?.length ?? 0}
                days={days}
              />
            </Suspense>
          </aside>

          {/* ── Results ───────────────────────────────────────────────────────── */}
          <section className="flex-1 min-w-0">
            {!hasSearch ? (
              <EmptyPrompt />
            ) : lots && lots.length > 0 ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">{lots.length}</span>{' '}
                    {lots.length === 1 ? 'Anbieter gefunden' : 'Anbieter gefunden'}
                    {' · '}
                    <span className="text-gray-400">
                      {(lots as any[]).length > 0
                        ? `${(lots as any[])[0].price_per_day?.toFixed(0)} – ${(lots as any[]).at(-1)?.price_per_day?.toFixed(0)} € / Tag`
                        : ''}
                    </span>
                  </p>
                </div>

                <div className="space-y-4">
                  {(lots as any[]).map((lot, i) => (
                    <ParkingLotCard
                      key={lot.id}
                      lot={lot}
                      checkin={checkin!}
                      checkout={checkout!}
                      days={days}
                      rank={i + 1}
                    />
                  ))}
                </div>
              </>
            ) : (
              <NoResults airport={airport} />
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function EmptyPrompt() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
        <Search className="h-7 w-7 text-brand-400" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-gray-900">Flughafen & Reisedaten wählen</h3>
      <p className="mt-1.5 max-w-xs text-sm text-gray-500">
        Wählen Sie oben einen Flughafen sowie An- und Abreisedatum, um verfügbare Parkplätze zu sehen.
      </p>
    </div>
  )
}

function NoResults({ airport }: { airport?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
        <MapPin className="h-7 w-7 text-gray-300" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-gray-900">Keine Ergebnisse</h3>
      <p className="mt-1.5 max-w-xs text-sm text-gray-500">
        {airport
          ? `Für diesen Flughafen sind aktuell keine freien Parkplätze verfügbar. Versuchen Sie andere Filter.`
          : 'Bitte wählen Sie einen Flughafen.'}
      </p>
    </div>
  )
}
