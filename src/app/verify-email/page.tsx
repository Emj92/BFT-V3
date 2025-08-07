"use client"

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import Link from 'next/link'

// Diese Seite ist dynamisch und soll nicht statisch generiert werden
export const dynamic = 'force-dynamic'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [countdown, setCountdown] = useState(3)
  const hasAttemptedVerification = useRef(false)
  
  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Kein Bestätigungstoken gefunden')
      return
    }
    
    // Verhindere mehrfache Ausführung
    if (hasAttemptedVerification.current) return
    hasAttemptedVerification.current = true
    
    const verifyEmail = async () => {
      try {
        
        const response = await fetch(`/api/auth/verify-email?token=${token}`, {
          method: 'GET',
          cache: 'no-cache'
                    })
            const data = await response.json()
        
        if (response.ok && data.success) {
          setStatus('success')
          setMessage(data.message || 'E-Mail erfolgreich bestätigt! Sie sind jetzt angemeldet.')
          
          // Countdown für automatische Weiterleitung
          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer)
                router.push('/dashboard')
                return 0
              }
              return prev - 1
            })
          }, 1000)
          
          return () => clearInterval(timer)
        } else {
          setStatus('error')
          setMessage(data.error || 'Fehler bei der E-Mail-Bestätigung')
        }
      } catch (error) {
        console.error('Netzwerk-Fehler bei Verifizierung:', error) // Debug log
        setStatus('error')
        setMessage('Netzwerkfehler. Bitte versuchen Sie es später erneut.')
      }
    }
    
    verifyEmail()
  }, [token, router])
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'loading' && <Loader2 className="h-12 w-12 animate-spin text-blue-500" />}
            {status === 'success' && <CheckCircle className="h-12 w-12 text-green-500" />}
            {status === 'error' && <XCircle className="h-12 w-12 text-red-500" />}
          </div>
          <CardTitle>
            {status === 'loading' && 'E-Mail wird bestätigt...'}
            {status === 'success' && 'E-Mail bestätigt!'}
            {status === 'error' && 'Fehler bei der Bestätigung'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Bitte warten Sie einen Moment'}
            {status === 'success' && `Sie werden in ${countdown} Sekunden automatisch weitergeleitet`}
            {status === 'error' && 'Es gab ein Problem mit der E-Mail-Bestätigung'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              {message}
            </AlertDescription>
          </Alert>
          
          {status === 'success' && (
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Sie sind jetzt angemeldet und werden automatisch weitergeleitet.
              </p>
              <Button asChild className="w-full">
                <Link href="/dashboard">
                  Jetzt zum Dashboard
                </Link>
              </Button>
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-center space-y-2">
              <Button asChild variant="outline" className="w-full">
                <Link href="/register">
                  Neue Registrierung
                </Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/login">
                  Zum Login
                </Link>
              </Button>
            </div>
          )}
          
          {status === 'loading' && (
            <div className="text-center">
              <Button asChild variant="outline" className="w-full">
                <Link href="/">
                  Zur Startseite
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            </div>
            <CardTitle>Lädt...</CardTitle>
            <CardDescription>Bitte warten Sie einen Moment</CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}