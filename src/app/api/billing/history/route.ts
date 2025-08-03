import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Einfache leere Antwort um 404-Fehler zu vermeiden
    return NextResponse.json({ 
      history: [],
      message: 'Billing history feature coming soon' 
    })
  } catch (error) {
    console.error('Error fetching billing history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}