import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

// Globaler SSE-Verbindungs-Manager
class SSEManager {
  private connections = new Map<string, ResponseController[]>()
  
  addConnection(userId: string, controller: ResponseController) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, [])
    }
    this.connections.get(userId)!.push(controller)
    
  }
  
  removeConnection(userId: string, controller: ResponseController) {
    const userConnections = this.connections.get(userId) || []
    const filtered = userConnections.filter(c => c !== controller)
    
    if (filtered.length === 0) {
      this.connections.delete(userId)
    } else {
      this.connections.set(userId, filtered)
    }
    
  }
  
  broadcastToUser(userId: string, event: any) {
    const userConnections = this.connections.get(userId) || []
    const eventData = `data: ${JSON.stringify(event)}\n\n`
    
    userConnections.forEach(controller => {
      try {
        controller.enqueue(new TextEncoder().encode(eventData))
      } catch (error) {
        console.error('SSE: Error sending event to user', userId, error)
        this.removeConnection(userId, controller)
      }
    })
  }
  
  broadcastToAll(event: any) {
    this.connections.forEach((controllers, userId) => {
      this.broadcastToUser(userId, event)
    })
  }
  
  getTotalConnections() {
    let total = 0
    this.connections.forEach(controllers => {
      total += controllers.length
    })
    return total
  }
  
  getUserConnectionCount(userId: string) {
    return this.connections.get(userId)?.length || 0
  }
}

// Globale SSE-Manager-Instanz
export const sseManager = new SSEManager()

interface ResponseController {
  enqueue(chunk: Uint8Array): void
}

export async function GET(request: NextRequest) {
  try {
    // JWT-Token aus Cookie auslesen (konsistent mit anderen API-Routen)
    const token = cookies().get('auth-token')?.value
    
    if (!token) {
      return new Response('Unauthorized - No token', { status: 401 })
    }

    // Token verifizieren
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'barrierefrei-secret-key'
    ) as { id: string }

    // Benutzer aus der Datenbank laden
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })
    
    if (!user) {
      return new Response('User not found', { status: 404 })
    }
    
    const userId = user.id
    
    // SSE Headers setzen
    const headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    }

    const stream = new ReadableStream({
      start(controller: ResponseController) {
        // User zur SSE-Verbindung hinzufügen
        sseManager.addConnection(userId, controller)
        
        // Heartbeat alle 30 Sekunden
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(new TextEncoder().encode(
              `data: ${JSON.stringify({ 
                type: 'heartbeat', 
                timestamp: Date.now(),
                connectionCount: sseManager.getUserConnectionCount(userId)
              })}\n\n`
            ))
          } catch (error) {
            clearInterval(heartbeat)
            sseManager.removeConnection(userId, controller)
          }
        }, 30000)

        // Cleanup bei Verbindungsabbruch
        const cleanup = () => {
          clearInterval(heartbeat)
          sseManager.removeConnection(userId, controller)
        }
        
        // Event-Listener für Abbruch
        request.signal.addEventListener('abort', cleanup)
        
        // Initiale Verbindung bestätigen
        try {
          controller.enqueue(new TextEncoder().encode(
            `data: ${JSON.stringify({ 
              type: 'connected', 
              userId,
              timestamp: Date.now(),
              message: 'SSE-Verbindung hergestellt'
            })}\n\n`
          ))
        } catch (error) {
          cleanup()
        }
      }
    })

    return new Response(stream, { headers })
    
  } catch (error) {
    console.error('SSE: Error in GET handler:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
} 