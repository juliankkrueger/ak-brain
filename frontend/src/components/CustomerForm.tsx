import React, { useState } from 'react'
import { api } from '../api/client'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { useToast } from './Toast'

interface Props {
  onClose: () => void
  onSaved: () => void
  initial?: Partial<CustomerData>
  customerId?: string
}

interface CustomerData {
  name: string
  practice_type: string
  location: string
  contact_name: string
  contact_email: string
  contact_phone: string
  status: string
  package_type: string
  price_setup: string
  price_monthly: string
  contract_start: string
  contract_end: string
  notes: string
}

const PACKAGE_OPTIONS = [
  { value: '', label: '— Kein Paket —' },
  { value: 'schnellstart', label: 'Schnellstart' },
  { value: 'jahrespaket', label: 'Jahrespaket' },
  { value: 'foerdermodell', label: 'Fördermodell' },
  { value: 'individual', label: 'Individual' },
]

const STATUS_OPTIONS = [
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'active', label: 'Aktiv' },
  { value: 'paused', label: 'Pausiert' },
  { value: 'completed', label: 'Abgeschlossen' },
]

export function CustomerForm({ onClose, onSaved, initial = {}, customerId }: Props) {
  const [form, setForm] = useState<CustomerData>({
    name: initial.name || '',
    practice_type: initial.practice_type || '',
    location: initial.location || '',
    contact_name: initial.contact_name || '',
    contact_email: initial.contact_email || '',
    contact_phone: initial.contact_phone || '',
    status: initial.status || 'onboarding',
    package_type: initial.package_type || '',
    price_setup: initial.price_setup ? String(initial.price_setup) : '',
    price_monthly: initial.price_monthly ? String(initial.price_monthly) : '',
    contract_start: initial.contract_start ? String(initial.contract_start).slice(0, 10) : '',
    contract_end: initial.contract_end ? String(initial.contract_end).slice(0, 10) : '',
    notes: initial.notes || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  const set = (key: keyof CustomerData, value: string) =>
    setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        price_setup: form.price_setup ? Number(form.price_setup) : null,
        price_monthly: form.price_monthly ? Number(form.price_monthly) : null,
        contract_start: form.contract_start || null,
        contract_end: form.contract_end || null,
        package_type: form.package_type || null,
      }
      if (customerId) {
        await api.put(`/customers/${customerId}`, payload)
        toast('Kunde erfolgreich gespeichert')
      } else {
        await api.post('/customers', payload)
        toast('Kunde erfolgreich angelegt')
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-serif text-brand-blue">
            {customerId ? 'Kunde bearbeiten' : 'Neuer Kunde'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Praxisname *" value={form.name} required
                onChange={e => set('name', e.target.value)} />
            </div>
            <Input label="Praxistyp" placeholder="z.B. Physiotherapie"
              value={form.practice_type} onChange={e => set('practice_type', e.target.value)} />
            <Input label="Standort" placeholder="z.B. Hamburg"
              value={form.location} onChange={e => set('location', e.target.value)} />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-500 mb-3">Ansprechpartner</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Name" value={form.contact_name}
                onChange={e => set('contact_name', e.target.value)} />
              <Input label="Telefon" value={form.contact_phone}
                onChange={e => set('contact_phone', e.target.value)} />
              <div className="col-span-2">
                <Input label="E-Mail" type="email" value={form.contact_email}
                  onChange={e => set('contact_email', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-500 mb-3">Vertrag</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-dark/70 mb-1">Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-brand-dark
                    focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue">
                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-dark/70 mb-1">Paket</label>
                <select value={form.package_type} onChange={e => set('package_type', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-brand-dark
                    focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue">
                  {PACKAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <Input label="Setup-Preis (€)" type="number" placeholder="0"
                value={form.price_setup} onChange={e => set('price_setup', e.target.value)} />
              <Input label="Monatspreis (€)" type="number" placeholder="0"
                value={form.price_monthly} onChange={e => set('price_monthly', e.target.value)} />
              <Input label="Vertragsstart" type="date"
                value={form.contract_start} onChange={e => set('contract_start', e.target.value)} />
              <Input label="Vertragsende" type="date"
                value={form.contract_end} onChange={e => set('contract_end', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-dark/70 mb-1">Notizen</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-brand-dark
                focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue resize-none" />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
              Abbrechen
            </Button>
            <Button type="submit" variant="secondary" loading={loading} className="flex-1">
              {customerId ? 'Speichern' : 'Kunde anlegen'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
