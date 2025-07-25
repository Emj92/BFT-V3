"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"
import dynamic from 'next/dynamic'

// Dynamischer Import der Animation
const BackgroundAnimation = dynamic(() => import('@/components/background-animation'), {
  ssr: false
})

export default function PasswordResetPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Senden der E-Mail')
      }

      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative">
        <BackgroundAnimation />
        <div className="w-full max-w-md p-4 relative z-10">
          <Card className="border border-border shadow-lg bg-card">
            <CardContent className="p-6 text-center">
              <div className="mx-auto mb-4 p-3 bg-green-100 dark:bg-green-900/20 rounded-full w-fit">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-xl font-bold mb-2">E-Mail versendet</h1>
              <p className="text-muted-foreground mb-6">
                Wir haben eine E-Mail mit Anweisungen zum Zurücksetzen Ihres Passworts an <strong>{email}</strong> gesendet.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Prüfen Sie auch Ihren Spam-Ordner, falls Sie die E-Mail nicht erhalten haben.
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Zurück zur Anmeldung
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative">
      <BackgroundAnimation />
      <div className="w-full max-w-md p-4 relative z-10">
        <Card className="border border-border shadow-lg bg-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full w-fit">
              <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-xl font-bold">Passwort zurücksetzen</CardTitle>
            <CardDescription>
              Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail-Adresse</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ihre-email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "E-Mail wird gesendet..." : "Passwort zurücksetzen"}
              </Button>

              <div className="text-center text-sm">
                <Link href="/login" className="text-muted-foreground hover:text-primary">
                  <ArrowLeft className="mr-1 h-3 w-3 inline" />
                  Zurück zur Anmeldung
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 