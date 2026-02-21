import { redirect }          from 'next/navigation'
import { createClient }      from '@/lib/supabase/server'
import { CustomerSidebar }   from '@/components/shared/CustomerSidebar'

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div className="flex h-screen overflow-hidden">
      <CustomerSidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}
