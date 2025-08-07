"use client"

import React from 'react'

interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
}

export function CircularProgress({ 
  value, 
  size = 120, 
  strokeWidth = 8, 
  className = "" 
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (value / 100) * circumference

  // Farbe basierend auf dem Wert bestimmen - konsistent mit Text
  const getColor = (value: number) => {
    if (value >= 90) return '#10b981' // Grün (sehr gut)
    if (value >= 75) return '#f97316' // Orange (gut)  
    if (value >= 60) return '#eab308' // Gelb (befriedigend)
    if (value >= 40) return '#f97316' // Orange (schlecht)
    return '#ef4444' // Rot (sehr schlecht)
  }

  const color = getColor(value)

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Hintergrund-Kreis */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted-foreground/20"
        />
        {/* Fortschritts-Kreis */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      {/* Zentraler Text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold leading-none" style={{ color }}>
          {value}%
        </span>
      </div>
    </div>
  )
}
