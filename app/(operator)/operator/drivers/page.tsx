'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
import { createClient }  from '@/lib/supabase/client'
import { Button }        from '@/components/ui/button'
import { Modal }         from '@/components/ui/modal'
import { Badge }         from '@/components/ui/badge'
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table'
import { DriverForm }    from '@/components/operator/DriverForm'
import type { Driver, DriverFormData } from '@/types'

export default function DriversPage() {
  const supabase = createClient()
  const [drivers,  setDrivers]  = useState<Driver[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState<Driver | null>(null)
  const [saving,   setSaving]   = useState(false)

  const fetchDrivers = async () => {
    setLoading(true)
    const { data: profileRaw } = await supabase.from('profiles').select('tenant_id').eq('id', (await supabase.auth.getUser()).data.user!.id).single()
    const profile = profileRaw as any
    const { data: dataRaw } = await supabase.from('drivers').select('*').eq('tenant_id', profile!.tenant_id!).order('last_name')
    const data = dataRaw as any[] | null
    setDrivers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchDrivers() }, [])

  const handleSubmit = async (data: DriverFormData) => {
    setSaving(true)
    const { data: profileRaw } = await supabase.from('profiles').select('tenant_id').eq('id', (await supabase.auth.getUser()).data.user!.id).single()
    const profile = profileRaw as any

    if (editing) {
      await (supabase as any).from('drivers').update({
        first_name:     data.first_name,
        last_name:      data.last_name,
        email:          data.email,
        phone:          data.phone,
        license_number: data.license_number,
      }).eq('id', editing.id)
    } else {
      await (supabase as any).from('drivers').insert({
        tenant_id:      profile!.tenant_id!,
        first_name:     data.first_name,
        last_name:      data.last_name,
        email:          data.email,
        phone:          data.phone,
        license_number: data.license_number,
      })
    }
    setSaving(false)
    setShowForm(false)
    setEditing(null)
    fetchDrivers()
  }

  const toggleActive = async (driver: Driver) => {
    await (supabase as any).from('drivers').update({ is_active: !driver.is_active }).eq('id', driver.id)
    fetchDrivers()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Fahrerverwaltung</h1>
        <Button onClick={() => { setEditing(null); setShowForm(true) }}>
          <UserPlus className="h-4 w-4" />
          Fahrer anlegen
        </Button>
      </div>

      <Table>
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>E-Mail</Th>
            <Th>Telefon</Th>
            <Th>Führerschein-Nr.</Th>
            <Th>Status</Th>
            <Th>Aktionen</Th>
          </Tr>
        </Thead>
        <Tbody>
          {loading ? (
            <Tr><Td className="py-8 text-center text-gray-400">Laden…</Td></Tr>
          ) : drivers.map(d => (
            <Tr key={d.id}>
              <Td className="font-medium">{d.first_name} {d.last_name}</Td>
              <Td>{d.email}</Td>
              <Td>{d.phone ?? '—'}</Td>
              <Td>{d.license_number ?? '—'}</Td>
              <Td>
                <Badge variant={d.is_active ? 'success' : 'default'}>
                  {d.is_active ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </Td>
              <Td>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(d); setShowForm(true) }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(d)}>
                    {d.is_active
                      ? <ToggleRight className="h-4 w-4 text-green-500" />
                      : <ToggleLeft  className="h-4 w-4 text-gray-400" />}
                  </Button>
                </div>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null) }}
        title={editing ? 'Fahrer bearbeiten' : 'Neuen Fahrer anlegen'}
        size="md"
      >
        <DriverForm
          initialValues={editing ? (editing as any) : undefined}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditing(null) }}
          loading={saving}
        />
      </Modal>
    </div>
  )
}
