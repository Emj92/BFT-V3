import React from 'react'
import Image from 'next/image'

interface LogoProps {
  className?: string
}

export function Logo({ className = "" }: LogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/logo2.png"
        alt="barriere-frei24.de Logo"
        width={304}
        height={85}
        className="h-auto w-auto max-h-21"
        priority
      />
    </div>
  )
}
