import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(180deg, #1E2E59 0%, #000000 100%)' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl text-white">Agentur Krüger</h1>
          <p className="text-white/40 text-sm mt-2 font-sans">Agency Dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
          <h2 className="font-serif text-xl text-white mb-6">Anmelden</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="name@agenturkrueger.de"
                className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/8
                  text-white placeholder:text-white/30 focus:outline-none focus:ring-2
                  focus:ring-brand-cream/30 focus:border-brand-cream/40 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Passwort</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/8
                  text-white placeholder:text-white/30 focus:outline-none focus:ring-2
                  focus:ring-brand-cream/30 focus:border-brand-cream/40 transition-all"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-4 py-2">{error}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              Anmelden
            </Button>
          </form>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          © 2026 Agentur Krüger GmbH
        </p>
      </div>
    </div>
  )
}
