'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, X, User, LogOut, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { APP_NAME } from '@/lib/constants'

interface NavbarProps {
  user?: { email?: string } | null
}

const NAV_LINKS = [
  { href: '/search', label: 'Parkplätze' },
  { href: '/#how-it-works', label: 'So funktionierts' },
]

function ParklyLogo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 shadow-md shadow-brand-600/25 transition-all group-hover:scale-105">
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-white" aria-hidden="true">
          <path d="M5 3h6a4 4 0 010 8H5V3z" fill="white" fillOpacity="0.95"/>
          <path d="M5 11h3.5v6H5z" fill="white" fillOpacity="0.7"/>
        </svg>
      </div>
      <span className="text-lg font-black tracking-tight text-gray-900">{APP_NAME}</span>
    </Link>
  )
}

export function Navbar({ user }: NavbarProps) {
  const [open, setOpen] = useState(false)
  const pathname        = usePathname()
  const router          = useRouter()
  const supabase        = createClient()

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100/80 bg-white/95 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <ParklyLogo />
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href}
                className={`relative px-3 py-2 text-sm font-medium transition-colors ${active ? 'text-brand-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {label}
                {active && (
                  <motion.div layoutId="nav-pill" className="absolute inset-x-2 -bottom-[13px] h-0.5 rounded-full bg-brand-600" />
                )}
              </Link>
            )
          })}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link href="/customer/dashboard" className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-brand-300 hover:text-brand-600">
                <User className="h-3.5 w-3.5" /> Mein Konto
              </Link>
              <button onClick={logout} title="Abmelden" className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">Anmelden</Link>
              <Link href="/auth/register" className="flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 active:scale-95">
                Registrieren <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>
        <button aria-label="Menü" className="flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 md:hidden" onClick={() => setOpen(v => !v)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22, ease: [0.21, 0.47, 0.32, 0.98] }} className="overflow-hidden border-t border-gray-100 bg-white md:hidden">
            <div className="flex flex-col gap-1 px-4 py-4">
              {NAV_LINKS.map(({ href, label }) => (
                <Link key={href} href={href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">{label}</Link>
              ))}
              <div className="my-2 border-t border-gray-100" />
              {user ? (
                <>
                  <Link href="/customer/dashboard" className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Mein Konto</Link>
                  <button onClick={logout} className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50">Abmelden</button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Anmelden</Link>
                  <Link href="/auth/register" className="mt-1 rounded-lg bg-brand-600 px-3 py-2.5 text-center text-sm font-semibold text-white">Registrieren</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
