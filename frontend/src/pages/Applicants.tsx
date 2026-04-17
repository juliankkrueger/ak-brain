import { useEffect, useState, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { api } from '../api/client'
import { Layout } from '../components/Layout'
import { useAuth, isAdmin } from '../hooks/useAuth'

interface Applicant {
  id: string
  customer_id: string | null
  customer_name: string | null
  first_name: string
  last_name: string
  email: string
  phone: string
  position: string
  status: Status
  notes: string | null
  created_at: string
}

interface Stats {
  byStatus: { status: string; count: number }[]
  monthly: { year: number; month: number; count: number }[]
}

type Status = 'offen' | 'kontaktiert' | 'eingestellt' | 'disqualifiziert'
type TabFilter = 'alle' | Status

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; dot: string }> = {
  offen:           { label: 'Offen',           color: 'text-blue-700',  bg: 'bg-blue-50 border-blue-200',   dot: 'bg-blue-500' },
  kontaktiert:     { label: 'Kontaktiert',     color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  eingestellt:     { label: 'Eingestellt',     color: 'text-green-700', bg: 'bg-green-50 border-green-200', dot: 'bg-green-500' },
  disqualifiziert: { label: 'Disqualifiziert', color: 'text-gray-500',  bg: 'bg-gray-50 border-gray-200',   dot: 'bg-gray-400' },
}

const MONTH_NAMES = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(' ')
  const letters = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : name.slice(0, 2)
  return (
    <div className="w-9 h-9 rounded-full bg-brand-navy flex items-center justify-center
      text-white text-xs font-semibold flex-shrink-0">
      {letters.toUpperCase()}
    </div>
  )
}

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
      border ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function StatusSelect({ value, onChange }: { value: Status; onChange: (s: Status) => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as Status)}
      onClick={e => e.stopPropagation()}
      className="text-xs rounded-lg border border-gray-200 bg-white px-2 py-1.5
        text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-blue/20 cursor-pointer"
    >
      {(Object.keys(STATUS_CONFIG) as Status[]).map(s => (
        <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
      ))}
    </select>
  )
}

interface DetailDrawerProps {
  applicant: Applicant | null
  onClose: () => void
  onStatusChange: (id: string, status: Status) => void
  onDelete: (id: string) => void
  isAdmin: boolean
}

function DetailDrawer({ applicant, onClose, onStatusChange, onDelete, isAdmin: adminUser }: DetailDrawerProps) {
  if (!applicant) return null
  const cfg = STATUS_CONFIG[applicant.status]
  const fullName = `${applicant.first_name} ${applicant.last_name}`.trim()

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-y-auto">
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Initials name={fullName || 'Bewerber'} />
            <div>
              <h3 className="font-serif text-xl text-brand-blue">{fullName || '—'}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{applicant.position || 'Keine Stelle angegeben'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 flex-1">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Status</p>
            <div className="flex items-center gap-3">
              <StatusBadge status={applicant.status} />
              <StatusSelect
                value={applicant.status}
                onChange={s => onStatusChange(applicant.id, s)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Kunde</p>
              <p className="text-sm text-brand-dark font-medium">{applicant.customer_name || <span className="text-gray-400 font-normal">Nicht zugeordnet</span>}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Eingegangen</p>
              <p className="text-sm text-brand-dark">
                {new Date(applicant.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {applicant.email && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">E-Mail</p>
              <a href={`mailto:${applicant.email}`}
                className="text-sm text-brand-blue hover:underline">{applicant.email}</a>
            </div>
          )}
          {applicant.phone && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Telefon</p>
              <a href={`tel:${applicant.phone}`}
                className="text-sm text-brand-blue hover:underline">{applicant.phone}</a>
            </div>
          )}
          {applicant.notes && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Notizen</p>
              <p className="text-sm text-brand-dark whitespace-pre-wrap">{applicant.notes}</p>
            </div>
          )}
        </div>

        {adminUser && (
          <div className="px-6 pb-6 pt-2 border-t border-gray-100">
            <button
              onClick={() => { onDelete(applicant.id); onClose(); }}
              className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              Bewerber löschen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function Applicants() {
  const { user } = useAuth()
  const admin = isAdmin(user?.role || '')
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [tab, setTab] = useState<TabFilter>('alle')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Applicant | null>(null)
  const [webhookToken, setWebhookToken] = useState<string | null>(null)
  const [showWebhook, setShowWebhook] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    const [a, s] = await Promise.all([
      api.get<Applicant[]>('/applicants'),
      api.get<Stats>('/applicants/stats'),
    ])
    setApplicants(a)
    setStats(s)
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  useEffect(() => {
    if (admin) {
      api.get<{ token: string } | null>('/applicants/webhook-token')
        .then(t => t && setWebhookToken(t.token))
        .catch(() => {})
    }
  }, [admin])

  const handleStatusChange = async (id: string, status: Status) => {
    await api.patch(`/applicants/${id}/status`, { status })
    setApplicants(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null)
  }

  const handleDelete = async (id: string) => {
    await api.delete(`/applicants/${id}`)
    setApplicants(prev => prev.filter(a => a.id !== id))
  }

  const filtered = tab === 'alle' ? applicants : applicants.filter(a => a.status === tab)

  const countFor = (s: Status) => applicants.filter(a => a.status === s).length

  const chartData = (() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const m = d.getMonth() + 1
      const y = d.getFullYear()
      const entry = stats?.monthly.find(x => x.month === m && x.year === y)
      return { name: MONTH_NAMES[m - 1], Bewerber: entry?.count ?? 0 }
    })
  })()

  const webhookUrl = webhookToken
    ? `${window.location.origin}/api/webhooks/applicants?token=${webhookToken}`
    : null

  const copyWebhookUrl = () => {
    if (!webhookUrl) return
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'alle', label: `Alle (${applicants.length})` },
    { key: 'offen', label: `Offen (${countFor('offen')})` },
    { key: 'kontaktiert', label: `Kontaktiert (${countFor('kontaktiert')})` },
    { key: 'eingestellt', label: `Eingestellt (${countFor('eingestellt')})` },
    { key: 'disqualifiziert', label: `Disqualifiziert (${countFor('disqualifiziert')})` },
  ]

  return (
    <Layout>
      <div className="p-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-3xl font-serif text-brand-blue">Bewerber</h2>
            <p className="text-sm text-gray-500 mt-1">Alle eingehenden Bewerbungen im Überblick</p>
          </div>
          {admin && webhookUrl && (
            <button
              onClick={() => setShowWebhook(v => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200
                text-sm text-brand-dark hover:bg-gray-50 transition-colors font-medium"
            >
              <svg className="w-4 h-4 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Webhook-URL
            </button>
          )}
        </div>

        {/* Webhook URL Box */}
        {showWebhook && webhookUrl && (
          <div className="mb-6 p-5 bg-brand-navy/5 border border-brand-navy/15 rounded-xl">
            <p className="text-sm font-medium text-brand-dark mb-2">
              Webhook-URL — in dein Formular (z.B. Typeform, Tally, Jotform) eintragen:
            </p>
            <div className="flex items-center gap-3">
              <code className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-3 py-2.5
                text-brand-dark font-mono break-all">
                {webhookUrl}
              </code>
              <button
                onClick={copyWebhookUrl}
                className="px-4 py-2.5 rounded-lg bg-brand-blue text-white text-sm font-medium
                  hover:bg-brand-navy transition-colors flex-shrink-0"
              >
                {copied ? '✓ Kopiert' : 'Kopieren'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              POST-Request · JSON-Body · Felder: <code className="bg-white px-1 rounded">first_name</code>, <code className="bg-white px-1 rounded">last_name</code>, <code className="bg-white px-1 rounded">email</code>, <code className="bg-white px-1 rounded">phone</code>, <code className="bg-white px-1 rounded">position</code>, <code className="bg-white px-1 rounded">firma</code>
            </p>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {(Object.keys(STATUS_CONFIG) as Status[]).map(s => {
            const cfg = STATUS_CONFIG[s]
            const count = countFor(s)
            return (
              <button
                key={s}
                onClick={() => setTab(s)}
                className={`text-left p-5 rounded-xl border transition-all hover:shadow-md
                  ${tab === s ? `${cfg.bg} shadow-sm` : 'bg-white border-gray-100 hover:border-gray-200'}`}
              >
                <div className={`flex items-center gap-2 mb-3`}>
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{cfg.label}</span>
                </div>
                <p className={`text-3xl font-serif ${tab === s ? cfg.color : 'text-brand-dark'}`}>{count}</p>
              </button>
            )
          })}
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-6">
          <h3 className="text-base font-serif text-brand-blue mb-4">Bewerbungseingang — letzte 6 Monate</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                cursor={{ fill: '#f9fafb' }}
              />
              <Bar dataKey="Bewerber" fill="#11396D" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          {/* Tabs */}
          <div className="flex items-center gap-1 px-4 pt-4 pb-0 border-b border-gray-100 overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors
                  ${tab === t.key
                    ? 'text-brand-blue border-b-2 border-brand-blue bg-brand-blue/5'
                    : 'text-gray-500 hover:text-brand-dark hover:bg-gray-50'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-gray-400">Noch keine Bewerber in dieser Kategorie</p>
              {admin && (
                <p className="text-xs text-gray-400 mt-1">
                  Trage die Webhook-URL in dein Bewerbungsformular ein
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(a => {
                const fullName = `${a.first_name} ${a.last_name}`.trim()
                return (
                  <div
                    key={a.id}
                    onClick={() => setSelected(a)}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <Initials name={fullName || 'B'} />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-dark truncate">{fullName || '—'}</p>
                      <p className="text-xs text-gray-500 truncate">{a.email || 'Keine E-Mail'}</p>
                    </div>

                    <div className="hidden md:block w-44 flex-shrink-0">
                      <p className="text-sm text-brand-dark truncate">{a.position || '—'}</p>
                    </div>

                    <div className="hidden lg:block w-40 flex-shrink-0">
                      <p className="text-sm text-gray-600 truncate">{a.customer_name || <span className="text-gray-400">Nicht zugeordnet</span>}</p>
                    </div>

                    <div className="hidden sm:block w-28 flex-shrink-0 text-right">
                      <p className="text-xs text-gray-400">
                        {new Date(a.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>

                    <div onClick={e => e.stopPropagation()}>
                      <StatusSelect
                        value={a.status}
                        onChange={s => handleStatusChange(a.id, s)}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <DetailDrawer
        applicant={selected}
        onClose={() => setSelected(null)}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        isAdmin={admin}
      />
    </Layout>
  )
}
