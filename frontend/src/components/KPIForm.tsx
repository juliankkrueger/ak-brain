import React, { useState } from 'react'
import { api } from '../api/client'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { useToast } from './Toast'

interface Props {
  customerId: string
  onClose: () => void
  onSaved: () => void
}

const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

export function KPIForm({ customerId, onClose, onSaved }: Props) {
  const now = new Date()
  const [form, setForm] = useState({
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
    applications: '',
    google_reviews_count: '',
    social_reach: '',
    website_traffic: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/kpis', {
        customer_id: customerId,
        month: Number(form.month),
        year: Number(form.year),
        applications: form.applications ? Number(form.applications) : null,
        google_reviews_count: form.google_reviews_count ? Number(form.google_reviews_count) : null,
        social_reach: form.social_reach ? Number(form.social_reach) : null,
        website_traffic: form.website_traffic ? Number(form.website_traffic) : null,
        notes: form.notes || null,
      })
      toast('KPIs erfolgreich gespeichert')
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-serif text-brand-blue">KPIs eintragen</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-brand-dark/70 mb-1">Monat</label>
              <select value={form.month} onChange={e => set('month', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-brand-dark
                  focus:outline-none focus:ring-2 focus:ring-brand-blue/30">
                {MONTHS.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <Input label="Jahr" type="number" value={form.year}
              onChange={e => set('year', e.target.value)} min="2020" max="2030" />
          </div>

          <Input label="Bewerbungen" type="number" placeholder="0"
            value={form.applications} onChange={e => set('applications', e.target.value)} />
          <Input label="Google Bewertungen (gesamt)" type="number" placeholder="0"
            value={form.google_reviews_count} onChange={e => set('google_reviews_count', e.target.value)} />
          <Input label="Social Reichweite" type="number" placeholder="0"
            value={form.social_reach} onChange={e => set('social_reach', e.target.value)} />
          <Input label="Website-Traffic" type="number" placeholder="0"
            value={form.website_traffic} onChange={e => set('website_traffic', e.target.value)} />

          <div>
            <label className="block text-sm font-medium text-brand-dark/70 mb-1">Notizen</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-brand-dark text-sm
                focus:outline-none focus:ring-2 focus:ring-brand-blue/30 resize-none" />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Abbrechen</Button>
            <Button type="submit" variant="secondary" loading={loading} className="flex-1">Speichern</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
