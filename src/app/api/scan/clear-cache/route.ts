import { NextRequest, NextResponse } from 'next/server';
import { clearScanCache } from '@/lib/accessibility-scanner';

export async function POST(request: NextRequest) {
  try {
    // Cache leeren
    clearScanCache();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Scanner-Cache erfolgreich geleert' 
    });
  } catch (error) {
    console.error('Fehler beim Cache-Clearing:', error);
    return NextResponse.json(
      { error: 'Fehler beim Cache-Clearing' },
      { status: 500 }
    );
  }
}
