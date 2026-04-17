import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Customers } from './pages/Customers'
import { CustomerDetail } from './pages/CustomerDetail'
import { Users } from './pages/Users'
import { Applicants } from './pages/Applicants'
import { Brain } from './pages/Brain'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #1E2E59 0%, #000000 100%)' }}>
        <div className="w-8 h-8 border-2 border-brand-cream border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const { restore } = useAuth()

  useEffect(() => {
    restore()
  }, [restore])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={
          <RequireAuth><Dashboard /></RequireAuth>
        } />
        <Route path="/kunden" element={
          <RequireAuth><Customers /></RequireAuth>
        } />
        <Route path="/kunden/:id" element={
          <RequireAuth><CustomerDetail /></RequireAuth>
        } />
        <Route path="/bewerber" element={
          <RequireAuth><Applicants /></RequireAuth>
        } />
        <Route path="/brain" element={
          <RequireAuth><Brain /></RequireAuth>
        } />
        <Route path="/benutzer" element={
          <RequireAuth><Users /></RequireAuth>
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
