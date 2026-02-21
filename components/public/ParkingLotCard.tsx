'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { MapPin, Bus, Car, ShieldCheck, Star } from 'lucide-react'
import { Badge }   from '@/components/ui/badge'
import { Button }  from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { FEATURES_LABELS } from '@/lib/constants'
import type { ParkingLot } from '@/types'

interface ParkingLotCardProps {
  lot:      ParkingLot
  checkin:  string
  checkout: string
  days:     number
  rank?:    number
}

export function ParkingLotCard({ lot, checkin, checkout, days, rank }: ParkingLotCardProps) {
  const total  = lot.price_per_day * days
  const params = new URLSearchParams({ checkin, checkout })

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-brand-200 transition-all sm:flex-row"
    >
      {/* Image / colour swatch */}
      <div className="relative h-44 w-full flex-shrink-0 bg-gradient-to-br from-brand-50 to-brand-100 sm:h-auto sm:w-52">
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            whileHover={{ scale: 1.08, rotate: -5 }}
            transition={{ type: 'spring', stiffness: 260 }}
          >
            <Car className="h-14 w-14 text-brand-200 group-hover:text-brand-300 transition-colors" />
          </motion.div>
        </div>

        {/* Rank badge */}
        {rank === 1 && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-white shadow">
            <Star className="h-3 w-3" /> Beliebt
          </span>
        )}

        {/* Valet badge */}
        {lot.valet_available && (
          <span className={`absolute ${rank === 1 ? 'top-10 left-3 mt-1' : 'left-3 top-3'} rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-semibold text-white`}>
            Valet
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-gray-900">{lot.name}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-brand-400" />
              {lot.distance_to_airport
                ? `${(lot.distance_to_airport / 1000).toFixed(1)} km vom Terminal`
                : lot.address}
            </p>
          </div>

          {/* Price */}
          <div className="flex-shrink-0 text-right">
            <p className="text-xs text-gray-400">ab</p>
            <p className="text-2xl font-black tabular-nums text-gray-900">
              {formatCurrency(lot.price_per_day)}
            </p>
            <p className="text-xs text-gray-400">/ Tag</p>
          </div>
        </div>

        {/* Description */}
        {lot.description && (
          <p className="mt-2 text-sm leading-relaxed text-gray-500 line-clamp-2">
            {lot.description}
          </p>
        )}

        {/* Feature badges */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {lot.shuttle_available && (
            <Badge variant="info">
              <Bus className="mr-1 h-3 w-3" /> Shuttle
            </Badge>
          )}
          {lot.valet_available && (
            <Badge variant="purple">
              <Car className="mr-1 h-3 w-3" /> Valet
            </Badge>
          )}
          {(lot.features as string[]).slice(0, 3).map(f => (
            <Badge key={f} variant="default">
              {FEATURES_LABELS[f] ?? f}
            </Badge>
          ))}
        </div>

        {/* Availability */}
        <div className="mt-3 flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
          <span className="text-sm font-medium text-green-700">
            {lot.available_spots} Stellplätze frei
          </span>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
          <div>
            <span className="text-sm text-gray-400">{days} {days === 1 ? 'Tag' : 'Tage'}: </span>
            <span className="text-base font-bold text-gray-900">{formatCurrency(total)}</span>
          </div>
          <Link href={`/booking/${lot.id}?${params.toString()}`}>
            <Button size="sm" className="gap-1.5">
              Jetzt buchen
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
