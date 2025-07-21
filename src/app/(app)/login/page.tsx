"use client"

import { LoginForm } from "@/components/login-form"
import dynamic from 'next/dynamic'

// Dynamischer Import der Animation
const BackgroundAnimation = dynamic(() => import('@/components/background-animation'), {
  ssr: false
})

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative">
      <BackgroundAnimation />
      <LoginForm />
    </div>
  )
}
