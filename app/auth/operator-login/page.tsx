'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Mail, Lock, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button }       from '@/components/ui/button'
import { Input }        from '@/components/ui/input'

export default function OperatorLoginPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      setError('Anmeldung fehlgeschlagen. Bitte prüfen Sie Ihre Zugangsdaten.')
      setLoading(false)
      return
    }

    // Check if user has operator/admin/driver role
    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()
    const profile = profileRaw as any

    if (!profile || !['operator', 'admin', 'driver'].includes(profile.role)) {
      await supabase.auth.signOut()
      setError('Ihr Konto hat keinen Betreiber-Zugang.')
      setLoading(false)
      return
    }

    const redirect = profile.role === 'driver' ? '/driver/dashboard' : '/operator/dashboard'
    router.push(redirect)
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">Betreiber-Login</h1>
          <p className="mt-1 text-sm text-gray-400">Zugang für Parkplatzbetreiber und Fahrer</p>
        </div>

        <form onSubmit={handleLogin} className="rounded-2xl bg-gray-800 p-8 shadow-xl border border-gray-700 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-900/40 px-4 py-3 text-sm text-red-300">{error}</div>
          )}

          <Input
            label="E-Mail"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            required
            leading={<Mail className="h-4 w-4" />}
            className="border-gray-600 bg-gray-700 text-white placeholder:text-gray-500 focus:border-brand-500"
          />

          <Input
            label="Passwort"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            leading={<Lock className="h-4 w-4" />}
            className="border-gray-600 bg-gray-700 text-white placeholder:text-gray-500 focus:border-brand-500"
          />

          <Button type="submit" loading={loading} className="w-full">
            <ShieldCheck className="h-4 w-4" />
            Sicher anmelden
          </Button>
        </form>

        <p className="text-center text-xs text-gray-500">
          Kunde?{' '}
          <Link href="/auth/login" className="text-brand-400 hover:underline">
            Zum Kunden-Login
          </Link>
        </p>
      </div>
    </div>
  )
}
