import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Layout } from '../components/Layout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { useToast } from '../components/Toast'
import { useAuth } from '../hooks/useAuth'

interface User {
  id: string
  name: string
  email: string
  role: string
  created_at: string
}

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'sales', label: 'Sales' },
  { value: 'manager', label: 'Manager' },
  { value: 'creative', label: 'Creative' },
]

function UserForm({
  onClose,
  onSaved,
  editUser,
}: {
  onClose: () => void
  onSaved: () => void
  editUser?: User
}) {
  const [form, setForm] = useState({
    name: editUser?.name || '',
    email: editUser?.email || '',
    password: '',
    role: editUser?.role || 'creative',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!editUser && form.password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen haben')
      return
    }
    setLoading(true)
    try {
      const payload: Record<string, string> = { name: form.name, role: form.role }
      if (!editUser) payload.email = form.email
      if (form.password) payload.password = form.password
      if (editUser) {
        await api.put(`/users/${editUser.id}`, payload)
        toast('Benutzer aktualisiert')
      } else {
        await api.post('/users', payload)
        toast('Benutzer angelegt')
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-serif text-brand-blue">
            {editUser ? 'Benutzer bearbeiten' : 'Neuer Benutzer'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <Input label="Name" value={form.name} onChange={e => set('name', e.target.value)} required />
          {!editUser && (
            <Input label="E-Mail" type="email" value={form.email}
              onChange={e => set('email', e.target.value)} required />
          )}
          <Input
            label={editUser ? 'Neues Passwort (leer = unverändert)' : 'Passwort *'}
            type="password"
            value={form.password}
            onChange={e => set('password', e.target.value)}
            required={!editUser}
            placeholder="min. 8 Zeichen"
          />
          <div>
            <label className="block text-sm font-medium text-brand-dark/70 mb-1">Rolle</label>
            <select value={form.role} onChange={e => set('role', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-brand-dark
                focus:outline-none focus:ring-2 focus:ring-brand-blue/30">
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Abbrechen</Button>
            <Button type="submit" variant="secondary" loading={loading} className="flex-1">
              {editUser ? 'Speichern' : 'Anlegen'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<User | undefined>()
  const [deleting, setDeleting] = useState<string | null>(null)
  const { user: currentUser } = useAuth()
  const { toast } = useToast()

  const load = () => {
    api.get<User[]>('/users').then(setUsers).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (u: User) => {
    if (!confirm(`Benutzer "${u.name}" wirklich löschen?`)) return
    setDeleting(u.id)
    try {
      await api.delete(`/users/${u.id}`)
      toast(`${u.name} gelöscht`, 'info')
      load()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Fehler beim Löschen', 'error')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <Layout>
      <div className="p-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-serif text-brand-blue">Benutzerverwaltung</h2>
            <p className="text-sm text-gray-500 mt-1">{users.length} Benutzer</p>
          </div>
          <Button variant="secondary" onClick={() => { setEditUser(undefined); setShowForm(true) }}>
            + Neuer Benutzer
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-6 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider">E-Mail</th>
                  <th className="text-left px-6 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Rolle</th>
                  <th className="text-left px-6 py-3.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Erstellt</th>
                  <th className="px-6 py-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-brand-dark">{u.name}</span>
                        {u.id === currentUser?.id && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-brand-cream/60 text-brand-dark">Du</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                    <td className="px-6 py-4">
                      <Badge label="" variant="role" value={u.role} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(u.created_at).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => { setEditUser(u); setShowForm(true) }}
                          className="text-xs text-brand-blue hover:text-brand-navy font-medium transition-colors"
                        >
                          Bearbeiten
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDelete(u)}
                            disabled={deleting === u.id}
                            className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors disabled:opacity-50"
                          >
                            Löschen
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                      Noch keine Benutzer angelegt
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <UserForm
          editUser={editUser}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load() }}
        />
      )}
    </Layout>
  )
}
