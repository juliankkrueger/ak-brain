import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { Layout } from '../components/Layout'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { CustomerForm } from '../components/CustomerForm'
import { KPIForm } from '../components/KPIForm'
import { useAuth, canEdit } from '../hooks/useAuth'

interface Customer {
  id: string
  name: string
  practice_type: string | null
  location: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  status: string
  package_type: string | null
  modules: string[]
  price_setup: number | null
  price_monthly: number | null
  contract_start: string | null
  contract_end: string | null
  notes: string | null
}

interface KPI {
  id: string
  month: number
  year: number
  applications: number | null
  google_reviews_count: number | null
  social_reach: number | null
  website_traffic: number | null
  notes: string | null
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez',
]

function formatEuro(value: number | null) {
  if (!value) return '—'
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-36 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-brand-dark">{value || '—'}</span>
    </div>
  )
}

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [kpis, setKpis] = useState<KPI[]>([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [showKPIForm, setShowKPIForm] = useState(false)

  const load = () => {
    if (!id) return
    Promise.all([
      api.get<Customer>(`/customers/${id}`),
      api.get<KPI[]>(`/kpis?customerId=${id}`),
    ]).then(([c, k]) => {
      setCustomer(c)
      setKpis(k)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  if (!customer) {
    return (
      <Layout>
        <div className="p-8 text-center text-gray-500">Kunde nicht gefunden</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-8 max-w-5xl">
        {/* Back + Header */}
        <button
          onClick={() => navigate('/kunden')}
          className="text-sm text-gray-400 hover:text-brand-blue flex items-center gap-1.5 mb-6 transition-colors"
        >
          ← Zurück zur Übersicht
        </button>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-3xl font-serif text-brand-blue">{customer.name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <Badge label="" variant="status" value={customer.status} />
              {customer.package_type && (
                <Badge label="" variant="package" value={customer.package_type} />
              )}
              {customer.location && (
                <span className="text-sm text-gray-400">{customer.location}</span>
              )}
            </div>
          </div>
          {user && canEdit(user.role) && (
            <Button variant="ghost" size="sm" onClick={() => setShowEdit(true)}>
              Bearbeiten
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Kontakt */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-base font-serif text-brand-blue mb-4">Kontakt</h3>
            <InfoRow label="Ansprechpartner" value={customer.contact_name} />
            <InfoRow label="E-Mail" value={
              customer.contact_email
                ? <a href={`mailto:${customer.contact_email}`} className="text-brand-blue hover:underline">
                    {customer.contact_email}
                  </a>
                : null
            } />
            <InfoRow label="Telefon" value={
              customer.contact_phone
                ? <a href={`tel:${customer.contact_phone}`} className="text-brand-blue hover:underline">
                    {customer.contact_phone}
                  </a>
                : null
            } />
            <InfoRow label="Praxistyp" value={customer.practice_type} />
          </div>

          {/* Vertrag */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-base font-serif text-brand-blue mb-4">Vertrag</h3>
            <InfoRow label="Setup" value={formatEuro(customer.price_setup)} />
            <InfoRow label="Monatlich" value={formatEuro(customer.price_monthly)} />
            <InfoRow label="Start" value={formatDate(customer.contract_start)} />
            <InfoRow label="Ende" value={formatDate(customer.contract_end)} />
            {customer.modules && customer.modules.length > 0 && (
              <div className="flex items-start py-2.5">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-36 flex-shrink-0 pt-0.5">Module</span>
                <div className="flex flex-wrap gap-1.5">
                  {customer.modules.map(m => (
                    <span key={m} className="text-xs px-2.5 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue font-medium">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {customer.notes && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-8">
            <h3 className="text-base font-serif text-brand-blue mb-3">Notizen</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{customer.notes}</p>
          </div>
        )}

        {/* KPIs */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-serif text-brand-blue">KPIs</h3>
            {user && canEdit(user.role) && (
              <Button variant="secondary" size="sm" onClick={() => setShowKPIForm(true)}>
                + KPI eintragen
              </Button>
            )}
          </div>

          {kpis.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Noch keine KPIs eingetragen</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Zeitraum</th>
                    <th className="text-right py-2.5 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Bewerbungen</th>
                    <th className="text-right py-2.5 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Google Bew.</th>
                    <th className="text-right py-2.5 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Reichweite</th>
                    <th className="text-right py-2.5 pl-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Website</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {kpis.map(k => (
                    <tr key={k.id} className="hover:bg-gray-50/50">
                      <td className="py-3 pr-4 text-sm font-medium text-brand-dark">
                        {MONTH_NAMES[k.month - 1]} {k.year}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-brand-dark">
                        {k.applications ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-brand-dark">
                        {k.google_reviews_count ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-brand-dark">
                        {k.social_reach?.toLocaleString('de-DE') ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-3 pl-4 text-sm text-right text-brand-dark">
                        {k.website_traffic?.toLocaleString('de-DE') ?? <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showEdit && customer && (
        <CustomerForm
          customerId={customer.id}
          initial={customer as unknown as Parameters<typeof CustomerForm>[0]['initial']}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); load() }}
        />
      )}

      {showKPIForm && (
        <KPIForm
          customerId={customer.id}
          onClose={() => setShowKPIForm(false)}
          onSaved={() => { setShowKPIForm(false); load() }}
        />
      )}
    </Layout>
  )
}
