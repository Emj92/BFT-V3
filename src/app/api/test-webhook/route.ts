import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 WEBHOOK TEST CALLED!')
    console.log('⏰ Timestamp:', new Date().toISOString())
    console.log('🌐 Request URL:', request.url)
    console.log('📥 Headers:', JSON.stringify(Object.fromEntries(request.headers), null, 2))

    // Test ob Webhook-URL erreichbar ist
    const webhookUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/webhooks/mollie`
    console.log('🔗 Webhook URL:', webhookUrl)

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
    console.log('🧪 WEBHOOK TEST POST CALLED!')
    
    const body = await request.text()
    console.log('📊 Raw body:', body)
    
    // Versuche verschiedene Content-Types zu parsen
    const contentType = request.headers.get('content-type')
    console.log('📋 Content-Type:', contentType)
    
    if (contentType?.includes('application/json')) {
      const jsonData = JSON.parse(body)
      console.log('📄 JSON data:', jsonData)
    } else if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = new URLSearchParams(body)
      console.log('📝 Form data:', Object.fromEntries(formData))
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