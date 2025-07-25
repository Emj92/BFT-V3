"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomepageRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Umleitung zur Root-Domain (neue Homepage)
    router.replace('/')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-foreground">Wird umgeleitet...</p>
      </div>
    </div>
  )
}

