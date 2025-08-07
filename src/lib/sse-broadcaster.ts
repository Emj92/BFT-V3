import { sseManager } from '@/app/api/events/route'

export interface SSEEventData {
  type: string
  data?: any
  timestamp?: number
  userId?: string
  message?: string
}

/**
 * Sendet ein SSE-Event an einen spezifischen Benutzer
 */
export function broadcastToUser(userId: string, event: SSEEventData) {
  if (!userId || !event.type) {
    return
  }

  const eventWithTimestamp = {
    ...event,
    timestamp: event.timestamp || Date.now(),
    userId
  }

  try {
    sseManager.broadcastToUser(userId, eventWithTimestamp)
  } catch (error) {
    console.error('SSE: Error broadcasting to user', userId, error)
  }
}

/**
 * Sendet ein SSE-Event an alle verbundenen Benutzer
 */
export function broadcastToAll(event: SSEEventData) {
  if (!event.type) {
    console.error('SSE: Invalid event type for broadcastToAll', event)
    return
  }

  const eventWithTimestamp = {
    ...event,
    timestamp: event.timestamp || Date.now()
  }

  try {
    sseManager.broadcastToAll(eventWithTimestamp)
  } catch (error) {
    console.error('SSE: Error broadcasting to all users', error)
  }
}

/**
 * Sendet ein SSE-Event an alle Mitglieder eines Teams
 */
export async function broadcastToTeam(teamId: string, event: SSEEventData) {
  if (!teamId || !event.type) {
    console.error('SSE: Invalid parameters for broadcastToTeam', { teamId, event })
    return
  }

  // Team-Mitglieder aus der Datenbank laden
  try {
    const { prisma } = await import('@/lib/prisma')
    
    const teamMembers = await prisma.user.findMany({
      where: { teamId },
      select: { id: true }
    })

    const eventWithTimestamp = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      teamId
    }

    // Event an alle Team-Mitglieder senden
    teamMembers.forEach(member => {
      sseManager.broadcastToUser(member.id, eventWithTimestamp)
    })

  } catch (error) {
    console.error('SSE: Error broadcasting to team', teamId, error)
  }
}

/**
 * Hilfsfunktionen für spezifische Event-Typen
 */

export function notifyNewNotification(userId: string, notification: any) {
  broadcastToUser(userId, {
    type: 'new_notification',
    data: notification,
    message: 'Neue Benachrichtigung erhalten'
  })
}

export function notifyNotificationRead(userId: string, notificationId: string) {
  broadcastToUser(userId, {
    type: 'notification_read',
    data: { notificationId },
    message: 'Benachrichtigung als gelesen markiert'
  })
}

export function notifyTeamInvitation(userId: string, invitation: any) {
  broadcastToUser(userId, {
    type: 'team_invitation',
    data: invitation,
    message: 'Neue Team-Einladung erhalten'
  })
}

export function notifyTeamChatMessage(teamId: string, message: any) {
  broadcastToTeam(teamId, {
    type: 'team_chat_message',
    data: message,
    message: 'Neue Chat-Nachricht'
  })
}

export function notifyCreditsUpdated(userId: string, credits: any) {
  broadcastToUser(userId, {
    type: 'credits_updated',
    data: credits,
    message: 'Credits aktualisiert'
  })
}

export function notifyWebsiteScanned(userId: string, scan: any) {
  broadcastToUser(userId, {
    type: 'website_scanned',
    data: scan,
    message: 'Website-Scan abgeschlossen'
  })
}

export function notifyBundleUpdated(userId: string, bundle: any) {
  broadcastToUser(userId, {
    type: 'bundle_updated',
    data: bundle,
    message: 'Bundle aktualisiert'
  })
}

/**
 * Debug-Funktionen
 */

export function getSSEStats() {
  return {
    totalConnections: sseManager.getTotalConnections(),
    timestamp: Date.now()
  }
}

export function debugBroadcast(event: SSEEventData) {
  broadcastToAll({
    ...event,
    type: 'debug_' + event.type
  })
} 