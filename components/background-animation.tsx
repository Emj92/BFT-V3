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

  useEffect(() => {
    const initialShapes: Shape[] = []
    for (let i = 0; i < 10; i++) {
      initialShapes.push({
        id: i,
        type: 'circle',
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 20 + 10,
        opacity: Math.random() * 0.5 + 0.5,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        speed: Math.random() * 0.5 + 0.5,
        direction: Math.random() * 2 - 1,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 1 - 0.5,
      })
    }
    setShapes(initialShapes)

    const updateShapes = () => {
      setShapes(prevShapes => prevShapes.map(shape => {
        let newX = shape.x + shape.speed * shape.direction
        let newY = shape.y + shape.speed * shape.direction

        if (newX < 0) {
          newX = 100
          shape.direction = Math.random() * 2 - 1
        } else if (newX > 100) {
          newX = 0
          shape.direction = Math.random() * 2 - 1
        }

        if (newY < 0) {
          newY = 100
          shape.direction = Math.random() * 2 - 1
        } else if (newY > 100) {
          newY = 0
          shape.direction = Math.random() * 2 - 1
        }

        shape.x = newX
        shape.y = newY
        shape.rotation += shape.rotationSpeed
        return shape
      }))
    }

    const interval = setInterval(updateShapes, 50)
    return () => clearInterval(interval)
  }, [])

  return (
    <div 
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none -z-10"
      aria-hidden="true"
    >
      {shapes.map(shape => (
        <div
          key={shape.id}
          className="absolute"
          style={{
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            width: `${shape.size}px`,
            height: `${shape.size}px`,
            backgroundColor: shape.color,
            opacity: shape.opacity,
            transform: `translate(-50%, -50%) rotate(${shape.rotation}deg)`,
            transformOrigin: 'center',
          }}
        />
      ))}
    </div>
  );
}
