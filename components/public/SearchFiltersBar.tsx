'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react'

const SORT_OPTIONS = [
  { value: 'price_asc',  label: 'Preis: günstigste zuerst' },
  { value: 'price_desc', label: 'Preis: teuerste zuerst'   },
  { value: 'distance',   label: 'Entfernung'                },
]

interface SearchFiltersBarProps {
  resultCount: number
  days:        number
}

export function SearchFiltersBar({ resultCount, days }: SearchFiltersBarProps) {
  const router     = useRouter()
  const params     = useSearchParams()

  const sort    = params.get('sort')    ?? 'price_asc'
  const valet   = params.get('valet')   === '1'
  const shuttle = params.get('shuttle') === '1'
  const covered = params.get('covered') === '1'

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString())
    if (value === null) next.delete(key)
    else next.set(key, value)
    router.push(`/search?${next.toString()}`)
  }

  const toggleFilter = (key: string, current: boolean) =>
    update(key, current ? null : '1')

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-5">
      {/* Result count */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">
          {resultCount} Anbieter
        </p>
        <p className="text-xs text-gray-400">{days} {days === 1 ? 'Tag' : 'Tage'}</p>
      </div>

      {/* Sort */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
          <ArrowUpDown className="h-3 w-3" /> Sortierung
        </label>
        <div className="space-y-1">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => update('sort', opt.value)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                sort === opt.value
                  ? 'bg-brand-50 font-medium text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
          <SlidersHorizontal className="h-3 w-3" /> Filter
        </label>
        <div className="space-y-2">
          {[
            { key: 'valet',   label: 'Valet-Service',       active: valet   },
            { key: 'shuttle', label: 'Shuttle-Transfer',     active: shuttle },
            { key: 'covered', label: 'Überdachte Stellplätze', active: covered },
          ].map(({ key, label, active }) => (
            <label key={key} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-0.5">
              <div
                onClick={() => toggleFilter(key, active)}
                className={`relative h-4 w-4 flex-shrink-0 cursor-pointer rounded border-2 transition-colors ${
                  active ? 'border-brand-600 bg-brand-600' : 'border-gray-300 bg-white'
                }`}
              >
                {active && (
                  <svg className="absolute inset-0 h-full w-full p-0.5 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span
                onClick={() => toggleFilter(key, active)}
                className="text-sm text-gray-600 select-none"
              >
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
