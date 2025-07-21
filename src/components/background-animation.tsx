"use client"

import { useEffect, useState } from 'react'

interface Shape {
  id: number
  type: 'circle' | 'square' | 'triangle'
  x: number
  y: number
  size: number
  opacity: number
  color: string
  speed: number
  direction: number
  rotation: number
  rotationSpeed: number
}

export default function BackgroundAnimation() {
  const [shapes, setShapes] = useState<Shape[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // Erstelle geometrische Formen
    const createShapes = () => {
      const newShapes: Shape[] = []
      const colors = [
        'rgba(59, 130, 246, 0.1)', // blue
        'rgba(139, 92, 246, 0.1)', // purple  
        'rgba(236, 72, 153, 0.1)', // pink
        'rgba(16, 185, 129, 0.1)', // emerald
        'rgba(245, 158, 11, 0.1)', // amber
        'rgba(99, 102, 241, 0.1)', // indigo
      ]
      
      for (let i = 0; i < 8; i++) {
        newShapes.push({
          id: i,
          type: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)] as 'circle' | 'square' | 'triangle',
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: Math.random() * 150 + 75, // 75-225px
          opacity: Math.random() * 0.15 + 0.05, // 0.05-0.2 (reduziert für größere Formen)
          color: colors[Math.floor(Math.random() * colors.length)],
          speed: Math.random() * 0.3 + 0.1, // 0.1-0.4 (langsamer für größere Formen)
          direction: Math.random() * 360,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 1.5, // -0.75 to 0.75 (langsamere Rotation)
        })
      }
      setShapes(newShapes)
    }

    createShapes()
    
    // Animation Loop
    const animate = () => {
      setShapes(prevShapes => 
        prevShapes.map(shape => {
          let newX = shape.x + Math.cos(shape.direction * Math.PI / 180) * shape.speed
          let newY = shape.y + Math.sin(shape.direction * Math.PI / 180) * shape.speed
          
          // Bounce off edges
          if (newX < -shape.size || newX > window.innerWidth + shape.size) {
            shape.direction = 180 - shape.direction
            newX = shape.x + Math.cos(shape.direction * Math.PI / 180) * shape.speed
          }
          if (newY < -shape.size || newY > window.innerHeight + shape.size) {
            shape.direction = -shape.direction
            newY = shape.y + Math.sin(shape.direction * Math.PI / 180) * shape.speed
          }
          
          return {
            ...shape,
            x: newX,
            y: newY,
            rotation: shape.rotation + shape.rotationSpeed,
          }
        })
      )
    }

    const interval = setInterval(animate, 16) // ~60fps
    
    // Handle window resize
    const handleResize = () => {
      createShapes()
    }
    
    window.addEventListener('resize', handleResize)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Prevent hydration issues
  if (!isClient) {
    return null
  }

  const renderShape = (shape: Shape) => {
    const baseStyle = {
      position: 'absolute' as const,
      left: `${shape.x}px`,
      top: `${shape.y}px`,
      width: `${shape.size}px`,
      height: `${shape.size}px`,
      opacity: shape.opacity,
      transform: `rotate(${shape.rotation}deg)`,
      transition: 'all 0.016s linear',
      pointerEvents: 'none' as const,
    }

    switch (shape.type) {
      case 'circle':
        return (
          <div
            key={shape.id}
            style={{
              ...baseStyle,
              backgroundColor: shape.color,
              borderRadius: '50%',
              border: `2px solid ${shape.color.replace('0.1', '0.2')}`,
            }}
          />
        )
      case 'square':
        return (
          <div
            key={shape.id}
            style={{
              ...baseStyle,
              backgroundColor: shape.color,
              border: `2px solid ${shape.color.replace('0.1', '0.2')}`,
            }}
          />
        )
      case 'triangle':
        return (
          <div
            key={shape.id}
            style={{
              ...baseStyle,
              width: 0,
              height: 0,
              backgroundColor: 'transparent',
              borderLeft: `${shape.size / 2}px solid transparent`,
              borderRight: `${shape.size / 2}px solid transparent`,
              borderBottom: `${shape.size}px solid ${shape.color}`,
            }}
          />
        )
      default:
        return null
    }
  }

  return (
    <div 
      className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none -z-10"
      aria-hidden="true"
    >
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/5 via-transparent to-purple-50/5 dark:from-blue-950/10 dark:via-transparent dark:to-purple-950/10"></div>
      
      {/* Animated geometric shapes */}
      {shapes.map(renderShape)}
      
      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-0 opacity-5 dark:opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(99, 102, 241, 0.2) 1px, transparent 0)',
          backgroundSize: '60px 60px'
        }}
      ></div>
    </div>
  )
} 