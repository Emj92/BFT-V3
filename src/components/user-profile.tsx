"use client"

import { useEffect, useState } from "react"

type User = {
  name: string | null
  email: string
}

export function UserProfile() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const userData = await response.json()
          setUser(userData.user)
        }
      } catch (error) {
        console.error("Fehler beim Laden der Benutzerdaten:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <span className="text-sm font-medium">Lädt...</span>
        <span className="text-xs text-sidebar-foreground/70">Bitte warten</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium">
        {user?.name || "Angemeldeter Benutzer"}
      </span>
      <span className="text-xs text-sidebar-foreground/70">
        {user?.email || "Keine E-Mail verfügbar"}
      </span>
    </div>
  )
}
