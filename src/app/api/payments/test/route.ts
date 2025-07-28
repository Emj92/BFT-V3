import { NextRequest, NextResponse } from 'next/server'
import { testMollieConnection } from '@/lib/mollie'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const result = await testMollieConnection()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Mollie connection successful',
        availableMethods: result.methods
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Test Mollie Connection Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 