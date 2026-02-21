import { redirect }       from 'next/navigation'
import { createClient }   from '@/lib/supabase/server'
import { Car, LogOut, ClipboardCheck } from 'lucide-react'
import Link from 'next/link'

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role, first_name, last_name')
    .eq('id', user.id)
    .single()
  const profile = profileRaw as any

  if (!profile || !['driver', 'operator', 'admin'].includes(profile.role)) {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Simple top nav for driver (mobile-first) */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Car className="h-5 w-5 text-brand-600" />
          <span className="font-semibold text-gray-900">
            {profile.first_name} {profile.last_name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/driver/checkin" className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
            <ClipboardCheck className="h-4 w-4" />
            Check-in/out
          </Link>
          <form action="/auth/signout" method="POST">
            <button type="submit" className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
              <LogOut className="h-4 w-4" />
              Abmelden
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
  )
}
