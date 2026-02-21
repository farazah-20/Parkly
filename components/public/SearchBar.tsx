'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Airport } from '@/types'

interface SearchBarProps {
  airports:      Airport[]
  initialValues?: { airport: string; checkin: string; checkout: string }
  glass?:        boolean   // glassmorphism style for dark hero backgrounds
}

export function SearchBar({ airports, initialValues, glass = false }: SearchBarProps) {
  const router = useRouter()
  const [airport,  setAirport]  = useState(initialValues?.airport  ?? '')
  const [checkin,  setCheckin]  = useState(initialValues?.checkin  ?? '')
  const [checkout, setCheckout] = useState(initialValues?.checkout ?? '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!airport || !checkin || !checkout) return
    router.push(`/search?${new URLSearchParams({ airport, checkin, checkout })}`)
  }

  const wrap   = glass
    ? 'flex flex-col gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-end sm:gap-2'
    : 'flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-xl sm:flex-row sm:items-end sm:gap-2'

  const lbl    = glass ? 'mb-1 block text-xs font-semibold uppercase tracking-widest text-white/60' : 'mb-1 block text-xs font-semibold uppercase tracking-widest text-gray-400'
  const iconCl = glass ? 'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50' : 'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400'
  const input  = glass
    ? 'w-full rounded-xl border border-white/20 bg-white/10 py-3 pl-10 pr-3 text-sm text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/30'
    : 'w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-3 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'

  return (
    <form onSubmit={handleSearch} className={wrap}>
      {/* Airport */}
      <div className="flex-1">
        <label className={lbl}>Flughafen</label>
        <div className="relative">
          <MapPin className={iconCl} />
          <select
            value={airport}
            onChange={e => setAirport(e.target.value)}
            className={input + ' appearance-none'}
            required
          >
            <option value="">Flughafen wählen</option>
            {airports.map(a => (
              <option key={a.id} value={a.iata_code}>
                {a.city} ({a.iata_code}) – {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Check-in */}
      <div className="flex-1">
        <label className={lbl}>Anreise</label>
        <div className="relative">
          <Calendar className={iconCl} />
          <input
            type="datetime-local"
            value={checkin}
            onChange={e => setCheckin(e.target.value)}
            className={input}
            required
          />
        </div>
      </div>

      {/* Check-out */}
      <div className="flex-1">
        <label className={lbl}>Rückreise</label>
        <div className="relative">
          <Calendar className={iconCl} />
          <input
            type="datetime-local"
            value={checkout}
            onChange={e => setCheckout(e.target.value)}
            className={input}
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className={glass ? 'whitespace-nowrap bg-white text-brand-700 hover:bg-brand-50 font-semibold shadow-lg' : 'whitespace-nowrap'}
      >
        <Search className="h-4 w-4" />
        Suchen
      </Button>
    </form>
  )
}
