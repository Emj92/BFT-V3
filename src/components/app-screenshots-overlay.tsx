"use client"

import Image from 'next/image'
import { ReactNode } from 'react'

interface AppScreenshotsOverlayProps {
  children: ReactNode
}

function AppScreenshotsOverlay({ children }: AppScreenshotsOverlayProps) {
  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Dashboard - größtes Bild, zentral */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-20">
        <Image
          src="/dasboard.png"
          alt=""
          width={800}
          height={600}
          className="object-contain"
        />
      </div>
      
      {/* Website-Scans - links oben */}
      <div className="absolute top-10 left-10 opacity-20">
        <Image
          src="/website-scans.png"
          alt=""
          width={400}
          height={300}
          className="object-contain"
        />
      </div>
      
      {/* Accessibility Check - rechts oben */}
      <div className="absolute top-10 right-10 opacity-20">
        <Image
          src="/accessibility-check.png"
          alt=""
          width={400}
          height={300}
          className="object-contain"
        />
      </div>
      
      {/* BFE Generator - links unten */}
      <div className="absolute bottom-10 left-10 opacity-20">
        <Image
          src="/bfe-generator.png"
          alt=""
          width={400}
          height={300}
          className="object-contain"
        />
      </div>
      
      {/* WCAG Coach - rechts unten */}
      <div className="absolute bottom-10 right-10 opacity-20">
        <Image
          src="/wcga-coach.png"
          alt=""
          width={400}
          height={300}
          className="object-contain"
        />
      </div>
      
      {/* Berichte - rechts mitte */}
      <div className="absolute top-1/2 right-5 transform -translate-y-1/2 opacity-10">
        <Image
          src="/berichte.png"
          alt=""
          width={300}
          height={200}
          className="object-contain"
        />
      </div>
      
      {/* Aufgabenverwaltung - links mitte */}
      <div className="absolute top-1/2 left-5 transform -translate-y-1/2 opacity-10">
        <Image
          src="/aufgabenverwaltung.png"
          alt=""
          width={300}
          height={200}
          className="object-contain"
        />
      </div>
      
      {/* Support Tickets - oben mitte */}
      <div className="absolute top-5 left-1/2 transform -translate-x-1/2 opacity-10">
        <Image
          src="/support-tickets.png"
          alt=""
          width={300}
          height={200}
          className="object-contain"
        />
      </div>
      </div>
    </div>
  )
}

export default AppScreenshotsOverlay
export { AppScreenshotsOverlay }
