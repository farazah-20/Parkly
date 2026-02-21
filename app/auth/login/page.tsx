'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Car, Mail, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button }       from '@/components/ui/button'
import { Input }        from '@/components/ui/input'
import { APP_NAME }     from '@/lib/constants'

export default function LoginPage() {
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

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Ungültige E-Mail oder Passwort.')
      setLoading(false)
      return
    }

    router.push('/customer/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600">
            <Car className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Anmelden</h1>
          <p className="mt-1 text-sm text-gray-500">Willkommen zurück bei {APP_NAME}</p>
        </div>

        <form onSubmit={handleLogin} className="rounded-2xl bg-white p-8 shadow-sm border border-gray-200 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          <Input
            label="E-Mail"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            required
            leading={<Mail className="h-4 w-4" />}
          />

          <Input
            label="Passwort"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            leading={<Lock className="h-4 w-4" />}
          />

          <Button type="submit" loading={loading} className="w-full">
            Anmelden
          </Button>

          <p className="text-center text-sm text-gray-500">
            Noch kein Konto?{' '}
            <Link href="/auth/register" className="font-medium text-brand-600 hover:underline">
              Registrieren
            </Link>
          </p>
        </form>

        <p className="text-center text-xs text-gray-400">
          Sie sind Betreiber?{' '}
          <Link href="/auth/operator-login" className="text-brand-600 hover:underline">
            Zum Betreiber-Login
          </Link>
        </p>
      </div>
    </div>
  )
}
