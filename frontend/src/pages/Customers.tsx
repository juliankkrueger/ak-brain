import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { Layout } from '../components/Layout'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth, canEdit } from '../hooks/useAuth'
import { CustomerForm } from '../components/CustomerForm'

interface Customer {
  id: string
  name: string
  practice_type: string | null
  location: string | null
  status: string
  package_type: string | null
  price_monthly: number | null
  price_setup: number | null
  contract_start: string | null
  modules: string[]
}

function formatEuro(value: number | null) {
  if (!value) return '—'
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
}

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filtered, setFiltered] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const load = () => {
    api.get<Customer[]>('/customers').then(data => {
      setCustomers(data)
      setFiltered(data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      customers.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.location || '').toLowerCase().includes(q) ||
        (c.practice_type || '').toLowerCase().includes(q)
      )
    )
  }, [search, customers])

  return (
    <Layout>
      <div className="p-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-serif text-brand-blue">Kunden</h2>
            <p className="text-sm text-gray-500 mt-1">{customers.length} Kunden gesamt</p>
          </div>
          {user && canEdit(user.role) && (
            <Button variant="secondary" onClick={() => setShowForm(true)}>
              + Neuer Kunde
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="mb-5 max-w-sm">
          <Input
            placeholder="Suchen nach Name, Ort, Typ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Kunde</th>
                  <th className="text-left px-6 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Paket</th>
                  <th className="text-left px-6 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Monatlich</th>
                  <th className="text-left px-6 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Start</th>
                  <th className="px-6 py-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-brand-dark">{c.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {[c.practice_type, c.location].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge label="" variant="status" value={c.status} />
                    </td>
                    <td className="px-6 py-4">
                      {c.package_type
                        ? <Badge label="" variant="package" value={c.package_type} />
                        : <span className="text-xs text-gray-300">—</span>
                      }
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-brand-dark">{formatEuro(c.price_monthly)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {c.contract_start
                          ? new Date(c.contract_start).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })
                          : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/kunden/${c.id}`)}
                        className="text-xs text-brand-blue hover:text-brand-navy font-medium transition-colors"
                      >
                        Details →
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                      {search ? 'Keine Treffer' : 'Noch keine Kunden angelegt'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <CustomerForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load() }}
        />
      )}
    </Layout>
  )
}
