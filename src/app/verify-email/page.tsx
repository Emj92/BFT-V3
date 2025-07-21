'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Bestätigungstoken fehlt')
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage(data.message)
        } else {
          setStatus('error')
          setMessage(data.error || 'Bestätigung fehlgeschlagen')
        }
      } catch (error) {
        setStatus('error')
        setMessage('Fehler bei der Bestätigung')
      }
    }

    verifyEmail()
  }, [token])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
              {status === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
              {status === 'error' && <XCircle className="h-6 w-6 text-red-500" />}
              E-Mail-Bestätigung
            </CardTitle>
            <CardDescription>
              {status === 'loading' && 'Ihre E-Mail wird bestätigt...'}
              {status === 'success' && 'E-Mail erfolgreich bestätigt'}
              {status === 'error' && 'Bestätigung fehlgeschlagen'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6 text-sm text-gray-600">
              {message}
            </p>
            
            {status === 'success' && (
              <div className="space-y-3">
                <p className="text-sm text-green-600">
                  Sie können sich jetzt anmelden und alle Funktionen nutzen.
                </p>
                <Link href="/login">
                  <Button className="w-full">
                    Zur Anmeldung
                  </Button>
                </Link>
              </div>
            )}
            
            {status === 'error' && (
              <div className="space-y-3">
                <p className="text-sm text-red-600">
                  Bitte kontaktieren Sie den Support oder versuchen Sie sich erneut zu registrieren.
                </p>
                <div className="flex gap-2">
                  <Link href="/register" className="flex-1">
                    <Button variant="outline" className="w-full">
                      Neu registrieren
                    </Button>
                  </Link>
                  <Link href="/support" className="flex-1">
                    <Button variant="outline" className="w-full">
                      Support
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 