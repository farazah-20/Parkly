'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, ParkingSquare, CalendarDays, Users,
  ClipboardCheck, Banknote, FileText, Car, LogOut, ChevronLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { APP_NAME } from '@/lib/constants'

const NAV_ITEMS = [
  { label: 'Dashboard',    href: '/operator/dashboard',    icon: LayoutDashboard  },
  { label: 'Parkplätze',   href: '/operator/parking',      icon: ParkingSquare    },
  { label: 'Buchungen',    href: '/operator/bookings',      icon: CalendarDays     },
  { label: 'Fahrer',       href: '/operator/drivers',       icon: Users            },
  { label: 'Check-in/out', href: '/operator/checkin',       icon: ClipboardCheck   },
  { label: 'Tageskasse',   href: '/operator/cash-register', icon: Banknote         },
  { label: 'Rechnungen',   href: '/operator/invoices',      icon: FileText         },
]

interface SidebarProps {
  tenantName?: string
}

export function OperatorSidebar({ tenantName }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/operator-login')
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-gray-700 px-5 py-4">
        <Car className="h-6 w-6 text-brand-400" />
        <div>
          <p className="text-sm font-bold">{APP_NAME}</p>
          {tenantName && <p className="text-xs text-gray-400 truncate">{tenantName}</p>}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-brand-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-700 px-3 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Abmelden
        </button>
      </div>
    </aside>
  )
}
