import { NextRequest, NextResponse } from 'next/server'

// DEPRECATED: WCAG Coach nutzt jetzt das Credit-System
// Diese API wird nicht mehr verwendet

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    error: 'WCAG Sessions API ist veraltet. Nutzen Sie das Credit-System.',
    deprecated: true 
  }, { status: 410 })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: 'WCAG Sessions API ist veraltet. Nutzen Sie das Credit-System.',
    deprecated: true 
  }, { status: 410 })
} 