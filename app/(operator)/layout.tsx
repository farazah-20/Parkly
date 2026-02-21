import { redirect }           from 'next/navigation'
import { createClient }       from '@/lib/supabase/server'
import { OperatorSidebar }    from '@/components/shared/OperatorSidebar'

export default async function OperatorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/operator-login')

  // Check role
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()
  const profile = profileRaw as any

  if (!profile || !['operator', 'admin'].includes(profile.role)) {
    redirect('/')
  }

  // Fetch tenant name for sidebar
  let tenantName: string | undefined
  if (profile.tenant_id) {
    const { data: tenantRaw } = await supabase.from('tenants').select('name').eq('id', profile.tenant_id).single()
    tenantName = (tenantRaw as any)?.name
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <OperatorSidebar tenantName={tenantName} />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}
