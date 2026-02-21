'use client'

import { motion } from 'framer-motion'
import { SearchBar }    from '@/components/public/SearchBar'
import { ThreeHero }    from '@/components/animations/ThreeHero'
import type { Airport } from '@/types'

interface HeroSectionProps {
  airports: Airport[]
}

export function HeroSection({ airports }: HeroSectionProps) {
  return (
    <section className="relative min-h-[88vh] overflow-hidden bg-gradient-to-br from-[#080f20] via-[#0d1c3d] to-[#0a1628] py-28 text-white flex items-center">

      {/* ── Three.js 3D background ──────────────────────────────────────────── */}
      <ThreeHero />

      {/* ── Radial glow overlays ────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full bg-brand-600/10 blur-3xl" />
        <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />
      </div>

      {/* ── Subtle grid overlay ─────────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="relative mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'backOut' }}
          className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-200 backdrop-blur-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-300" />
          </span>
          Nr. 1 Flughafen-Parking in Deutschland
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="max-w-3xl text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl"
        >
          Valet-Parking
          <br />
          <span className="bg-gradient-to-r from-blue-300 via-indigo-300 to-blue-200 bg-clip-text text-transparent">
            stressfrei &amp; sicher.
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60"
        >
          Vergleichen Sie Parkplatz-Anbieter, buchen Sie online und genießen Sie
          komfortablen Shuttle- oder Valet-Service — direkt am Flughafen.
        </motion.p>

        {/* Glass search widget */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.38, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="mt-10"
        >
          <SearchBar airports={airports} glass />
        </motion.div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.58 }}
          className="mt-10 flex flex-wrap items-center gap-6"
        >
          {[
            { val: '50+',     lbl: 'Flughäfen' },
            { val: '200k+',   lbl: 'Buchungen' },
            { val: '4.9 ★',   lbl: 'Bewertung' },
            { val: '24/7',    lbl: 'Support' },
          ].map(({ val, lbl }) => (
            <div key={lbl} className="flex flex-col">
              <span className="text-2xl font-black text-white">{val}</span>
              <span className="text-xs font-medium uppercase tracking-widest text-white/40">{lbl}</span>
            </div>
          ))}

          <div className="ml-auto hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/50 backdrop-blur-sm lg:flex">
            <svg className="h-3.5 w-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            SSL-gesichert · Kostenlose Stornierung
          </div>
        </motion.div>
      </div>
    </section>
  )
}
