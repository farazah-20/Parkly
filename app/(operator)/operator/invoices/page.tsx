'use client'

import { useState, useEffect } from 'react'
import { Plus, Send, Eye } from 'lucide-react'
import { createClient }     from '@/lib/supabase/client'
import { Button }           from '@/components/ui/button'
import { Modal }            from '@/components/ui/modal'
import { Badge }            from '@/components/ui/badge'
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/table'
import { InvoiceGenerator } from '@/components/operator/InvoiceGenerator'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Invoice, InvoiceFormData } from '@/types'

const STATUS_VARIANT: Record<string, any> = {
  draft:     'default',
  sent:      'info',
  paid:      'success',
  overdue:   'danger',
  cancelled: 'danger',
}

const STATUS_LABELS: Record<string, string> = {
  draft:     'Entwurf',
  sent:      'Versendet',
  paid:      'Bezahlt',
  overdue:   'Überfällig',
  cancelled: 'Storniert',
}

export default function InvoicesPage() {
  const supabase = createClient()
  const [invoices,  setInvoices]  = useState<Invoice[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showNew,   setShowNew]   = useState(false)
  const [tenantId,  setTenantId]  = useState<string>('')
  const [saving,    setSaving]    = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profileRaw }  = await supabase.from('profiles').select('tenant_id').eq('id', user!.id).single()
    const profile = profileRaw as any
    setTenantId(profile?.tenant_id ?? '')
    const { data: dataRaw } = await supabase
      .from('invoices')
      .select('*, customer:profiles(first_name,last_name), booking:bookings(booking_number)')
      .eq('tenant_id', profile!.tenant_id!)
      .order('created_at', { ascending: false })
    const data = dataRaw as any[] | null
    setInvoices((data as Invoice[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const saveInvoice = async (data: InvoiceFormData, status: 'draft' | 'sent' = 'draft') => {
    setSaving(true)
    const subtotal  = data.items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
    const taxAmount = (subtotal * data.tax_rate) / 100
    await (supabase as any).from('invoices').insert({
      tenant_id:       tenantId,
      booking_id:      data.booking_id   || null,
      customer_id:     data.customer_id  || null,
      subtotal,
      tax_rate:        data.tax_rate,
      tax_amount:      taxAmount,
      total:           subtotal + taxAmount,
      items:           data.items,
      notes:           data.notes        || null,
      due_date:        data.due_date     || null,
      recipient_email: data.recipient_email,
      status,
      sent_at:         status === 'sent' ? new Date().toISOString() : null,
    })
    setSaving(false)
    setShowNew(false)
    fetchData()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Rechnungswesen</h1>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4" />
          Neue Rechnung
        </Button>
      </div>

      <Table>
        <Thead>
          <Tr>
            <Th>Rechnungs-Nr.</Th>
            <Th>Kunde</Th>
            <Th>Betrag</Th>
            <Th>Fälligkeit</Th>
            <Th>Status</Th>
            <Th>Aktionen</Th>
          </Tr>
        </Thead>
        <Tbody>
          {loading ? (
            <Tr><Td className="py-8 text-center text-gray-400">Laden…</Td></Tr>
          ) : invoices.map(inv => (
            <Tr key={inv.id}>
              <Td className="font-mono text-xs">{inv.invoice_number}</Td>
              <Td>{(inv.customer as any)?.first_name} {(inv.customer as any)?.last_name}</Td>
              <Td className="font-medium">{formatCurrency(inv.total)}</Td>
              <Td>{inv.due_date ? formatDate(inv.due_date) : '—'}</Td>
              <Td>
                <Badge variant={STATUS_VARIANT[inv.status]}>
                  {STATUS_LABELS[inv.status]}
                </Badge>
              </Td>
              <Td>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" title="Vorschau">
                    <Eye className="h-4 w-4" />
                  </Button>
                  {inv.status === 'draft' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Versenden"
                      onClick={async () => {
                        await (supabase as any).from('invoices').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', inv.id)
                        fetchData()
                      }}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Neue Rechnung erstellen" size="xl">
        <InvoiceGenerator
          customerId=""
          onSave={data => saveInvoice(data, 'draft')}
          onSend={data => saveInvoice(data, 'sent')}
          loading={saving}
        />
      </Modal>
    </div>
  )
}
