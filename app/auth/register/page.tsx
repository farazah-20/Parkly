'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Car, Mail, Lock, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button }       from '@/components/ui/button'
import { Input }        from '@/components/ui/input'
import { APP_NAME }     from '@/lib/constants'

export default function RegisterPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Update profile
    if (data.user) {
      await supabase.from('profiles').update({
        first_name: firstName,
        last_name:  lastName,
        role:       'customer',
      }).eq('id', data.user.id)
    }

    router.push('/customer/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600">
            <Car className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Konto erstellen</h1>
          <p className="mt-1 text-sm text-gray-500">Kostenlos bei {APP_NAME} registrieren</p>
        </div>

        <form onSubmit={handleRegister} className="rounded-2xl bg-white p-8 shadow-sm border border-gray-200 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Vorname"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              required
              leading={<User className="h-4 w-4" />}
            />
            <Input
              label="Nachname"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              required
            />
          </div>

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
            autoComplete="new-password"
            required
            hint="Mindestens 8 Zeichen"
            leading={<Lock className="h-4 w-4" />}
          />

          <Button type="submit" loading={loading} className="w-full">
            Kostenlos registrieren
          </Button>

          <p className="text-center text-sm text-gray-500">
            Bereits ein Konto?{' '}
            <Link href="/auth/login" className="font-medium text-brand-600 hover:underline">
              Anmelden
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
