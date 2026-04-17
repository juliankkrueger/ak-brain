import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { api } from '../api/client'
import { Layout } from '../components/Layout'
import { KPICard } from '../components/KPICard'

interface Customer {
  id: string
  name: string
  status: string
  price_monthly: number | null
  price_setup: number | null
}

interface KPI {
  customer_id: string
  month: number
  year: number
  applications: number | null
  social_reach: number | null
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

function formatEuro(value: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
}

export function Dashboard() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [kpis, setKpis] = useState<KPI[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<Customer[]>('/customers'),
      api.get<KPI[]>(`/kpis?year=${new Date().getFullYear()}`),
    ]).then(([c, k]) => {
      setCustomers(c)
      setKpis(k)
    }).finally(() => setLoading(false))
  }, [])

  const activeCustomers = customers.filter(c => c.status === 'active')
  const monthlyRevenue = activeCustomers.reduce((sum, c) => sum + (c.price_monthly || 0), 0)

  const avgApplications = kpis.length > 0
    ? Math.round(kpis.reduce((s, k) => s + (k.applications || 0), 0) / kpis.length)
    : 0

  const avgReach = kpis.length > 0
    ? Math.round(kpis.reduce((s, k) => s + (k.social_reach || 0), 0) / kpis.length)
    : 0

  // Build chart data: last 6 months
  const now = new Date()
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const m = d.getMonth() + 1
    const y = d.getFullYear()
    const monthKpis = kpis.filter(k => k.month === m && k.year === y)
    return {
      name: MONTH_NAMES[m - 1],
      Bewerbungen: monthKpis.reduce((s, k) => s + (k.applications || 0), 0),
      Reichweite: Math.round(monthKpis.reduce((s, k) => s + (k.social_reach || 0), 0) / (monthKpis.length || 1)),
    }
  })

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-serif text-brand-blue">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">Übersicht aller wichtigen Kennzahlen</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <KPICard
            title="Aktive Kunden"
            value={activeCustomers.length}
            subtitle={`${customers.length} gesamt`}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
          <KPICard
            title="Monatsumsatz"
            value={formatEuro(monthlyRevenue)}
            subtitle="Aktive Verträge"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <KPICard
            title="Ø Bewerbungen"
            value={avgApplications}
            subtitle="pro Monat / Kunde"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <KPICard
            title="Ø Reichweite"
            value={avgReach.toLocaleString('de-DE')}
            subtitle="Social Media"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-8">
          <h3 className="text-lg font-serif text-brand-blue mb-5">Bewerbungen — letzte 6 Monate</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#11396D" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#11396D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="Bewerbungen"
                stroke="#11396D"
                strokeWidth={2}
                fill="url(#colorBew)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Customers */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-serif text-brand-blue">Kunden nach Status</h3>
          </div>
          <div className="space-y-3">
            {customers.slice(0, 5).map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm font-medium text-brand-dark">{c.name}</span>
                <div className="flex items-center gap-3">
                  {c.price_monthly && (
                    <span className="text-sm text-gray-500">{formatEuro(c.price_monthly)}/Mon.</span>
                  )}
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium
                    ${c.status === 'active' ? 'bg-green-100 text-green-800' :
                      c.status === 'onboarding' ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-600'}`}>
                    {c.status === 'active' ? 'Aktiv' : c.status === 'onboarding' ? 'Onboarding' : c.status}
                  </span>
                </div>
              </div>
            ))}
            {customers.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Noch keine Kunden angelegt</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
