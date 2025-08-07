import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {

    // Test ob Webhook-URL erreichbar ist
    const webhookUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/webhooks/mollie`

    return NextResponse.json({
      success: true,
      message: 'Webhook test successful',
      timestamp: new Date().toISOString(),
      webhookUrl: webhookUrl,
      environment: process.env.NODE_ENV
    })

  } catch (error) {
    console.error('❌ Webhook test error:', error)
    return NextResponse.json({ error: 'Webhook test failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    
    const body = await request.text()
    
    // Versuche verschiedene Content-Types zu parsen
    const contentType = request.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      const jsonData = JSON.parse(body)
    } else if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = new URLSearchParams(body)
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook POST test successful',
      receivedContentType: contentType,
      bodyLength: body.length
    })

  } catch (error) {
    console.error('❌ Webhook POST test error:', error)
    return NextResponse.json({ error: 'Webhook POST test failed' }, { status: 500 })
  }
}