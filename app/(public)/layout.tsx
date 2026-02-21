import { Navbar }       from '@/components/shared/Navbar'
import { createClient } from '@/lib/supabase/server'
import { APP_NAME }     from '@/lib/constants'
import Link             from 'next/link'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={user} />
      <main className="flex-1">{children}</main>

      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 shadow-md shadow-brand-600/25">
                  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-white" aria-hidden="true">
                    <path d="M5 3h6a4 4 0 010 8H5V3z" fill="white" fillOpacity="0.95"/>
                    <path d="M5 11h3.5v6H5z" fill="white" fillOpacity="0.7"/>
                  </svg>
                </div>
                <span className="text-lg font-black tracking-tight text-gray-900">{APP_NAME}</span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-500">
                Flughafenparken einfach gemacht — finden, buchen, ankommen.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Produkt</h3>
              <ul className="mt-4 space-y-3">
                {[
                  { href: '/search',        label: 'Parkplätze suchen' },
                  { href: '/#how-it-works', label: 'So funktionierts' },
                  { href: '/auth/register', label: 'Konto erstellen' },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-gray-500 transition-colors hover:text-brand-600">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Rechtliches</h3>
              <ul className="mt-4 space-y-3">
                {[
                  { href: '/impressum',   label: 'Impressum' },
                  { href: '/datenschutz', label: 'Datenschutz' },
                  { href: '/agb',         label: 'AGB' },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-gray-500 transition-colors hover:text-brand-600">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 sm:flex-row">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} {APP_NAME} GmbH. Alle Rechte vorbehalten.
            </p>
            <p className="text-xs text-gray-400">Made with ♥ in Germany</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
