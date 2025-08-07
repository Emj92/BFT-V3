import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// Claude API Configuration - Aktualisiert mit neuerer Version
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

// Rate limiting configuration
const RATE_LIMITS = {
  HOURLY: 5,
  DAILY: 20,
  MONTHLY: {
    FREE: 10,
    STARTER: 10,
    PRO: 100,
    ENTERPRISE: 500
  }
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    // Token aus Cookies extrahieren
    const token = cookies().get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    // Token verifizieren
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'barrierefrei-secret-key') as { id: string };
    const userId = decoded.id;

    // Benutzer abrufen
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    // Request-Body parsen
    const { message, chatHistory } = await request.json();
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Nachricht ist erforderlich' }, { status: 400 });
    }

    // Credits prüfen und verwenden (1 Credit für WCAG Coach)
    if (user.credits < 5) {
      return NextResponse.json({ 
        error: 'Nicht genügend Credits',
        message: 'Sie benötigen 5 Credits für die WCAG Coach Nutzung.',
        creditsRequired: 5,
        creditsAvailable: user.credits
      }, { status: 402 }); // Payment Required
    }

    // Credits abziehen
    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: user.credits - 5
      }
    });

    // Credit-Transaktion protokollieren
    await prisma.creditTransaction.create({
      data: {
        userId,
        amount: -5,
        type: 'WCAG_COACH',
        description: 'WCAG Coach - KI-Beratung'
      }
    });

    // Erweiterner Claude API System-Prompt
    const systemPrompt = `Du bist ein Experte für Web-Barrierefreiheit und hilfst deutschen Website-Betreibern dabei, ihre Websites nach WCAG 2.1 AA und BITV 2.0 Standards zugänglich zu machen. 

Deine Aufgaben:
- Gib präzise, praxisnahe Anleitungen für gängige Page Builder (Elementor, Divi, etc.)
- Erkläre Barrierefreiheits-Probleme verständlich
- Zeige konkrete Umsetzungsschritte auf
- Nenne relevante Tools und Plugins
- Antworte auf Deutsch
- Halte dich an die WCAG 2.1 AA Richtlinien

Du bist ein AI-Assistent, der sich auf Web-Barrierefreiheit spezialisiert hat. Du wirst Benutzern helfen, Barrierefreiheits-Tipps auf ihren Websites umzusetzen. Du musst zunächst bestimmen, welches Content-Management-System (CMS) oder welchen Page Builder der Benutzer verwendet (z.B. Elementor, Divi) und dann maßgeschneiderte Empfehlungen basierend auf diesen Informationen geben.

Stil: Freundlich, fachlich kompetent, strukturiert mit Schritt-für-Schritt-Anleitungen.

Wenn der Benutzer sein System noch nicht erwähnt hat, frage explizit nach:

Bitte geben Sie Informationen über Ihre Website und das Content-Management-System oder den Page Builder an, den Sie verwenden (z.B. WordPress mit Elementor, WordPress mit Divi, Wix, Squarespace, etc.).

Sobald der Benutzer antwortet, analysiere die Informationen, die er bereitstellt. Achte besonders auf Erwähnungen spezifischer CMS oder Page Builder. Wenn der Benutzer sein System nicht erwähnt, stelle Nachfragen zur Klärung.

Basierend auf der Antwort des Benutzers und den Barrierefreiheits-Richtlinien, gib Empfehlungen für die Implementierung von Barrierefreiheits-Features. Berücksichtige dabei:

1. Spezifische Features oder Einschränkungen des erwähnten CMS oder Page Builders
2. Häufige Barrierefreiheitsprobleme im Zusammenhang mit der Plattform des Benutzers
3. Schritt-für-Schritt-Anleitungen zur Implementierung von Barrierefreiheits-Verbesserungen

Präsentiere deine Empfehlungen in folgendem Format:

**Platform:** [Erwähne das spezifische CMS oder den Page Builder, den der Benutzer verwendet]

**Barrierefreiheits-Tipps:**
1. [Erste Empfehlung]
   - [Erklärung]
   - [Umsetzungsschritte]

2. [Zweite Empfehlung]
   - [Erklärung]
   - [Umsetzungsschritte]

[Fahre mit weiteren Empfehlungen nach Bedarf fort]

Nach den Empfehlungen, biete an, Fragen zu beantworten oder weitere Klarstellungen zu geben:

Haben Sie Fragen zu diesen Empfehlungen oder benötigen Sie weitere Klarstellungen zur Umsetzung auf Ihrer [spezifisches CMS oder Page Builder erwähnen] Website?

Sei hilfsbereit, geduldig und gründlich in deinen Erklärungen. Wenn der Benutzer um Klarstellungen bittet oder zusätzliche Fragen hat, gib detaillierte und spezifische Antworten, die auf sein CMS oder seinen Page Builder zugeschnitten sind.`;

    // Chat-Verlauf für Claude formatieren
    const messages = [];
    
    if (chatHistory && Array.isArray(chatHistory)) {
      chatHistory.forEach((msg: ChatMessage) => {
        if (msg.role === 'user') {
          messages.push({
            role: 'user',
            content: msg.content
          });
        } else if (msg.role === 'assistant') {
          messages.push({
            role: 'assistant',
            content: msg.content
          });
        }
      });
    }

    // Aktuelle Nachricht hinzufügen
    messages.push({
      role: 'user',
      content: message
    });

    // Prüfe auf gültigen API-Key
    if (!CLAUDE_API_KEY) {
      return NextResponse.json({ 
        response: 'Der WCAG Coach ist derzeit nicht verfügbar. Bitte wenden Sie sich an den Support.',
        success: false,
        error: 'KI-Service nicht konfiguriert'
      }, { status: 200 }); // Status 200 damit Frontend die Nachricht anzeigt
    }


    // Claude API-Anfrage mit neuem Modell
    const claudeResponse = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022', // Neueres Modell
        max_tokens: 2500, // Erhöhte Token-Anzahl für detailliertere Antworten
        temperature: 0.7,
        system: systemPrompt,
        messages
      })
    });


    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      
      // Fallback-Antwort statt Fehler
      const fallbackMessage = `Entschuldigung, ich kann Ihnen momentan nicht weiterhelfen. 

**Mögliche Ursachen:**
- Der KI-Service ist temporär nicht verfügbar
- API-Konfiguration fehlt

**Was Sie tun können:**
1. Versuchen Sie es in ein paar Minuten erneut
2. Kontaktieren Sie den Support über das Support-Ticket System
3. Nutzen Sie die WCAG-Bibliothek für häufige Fragen

**Häufige WCAG-Probleme:**
- **Alt-Texte**: Fügen Sie beschreibende alt-Attribute zu Bildern hinzu
- **Kontrast**: Stellen Sie sicher, dass Text mindestens 4.5:1 Kontrast hat
- **Tastaturnavigation**: Alle interaktiven Elemente müssen per Tastatur erreichbar sein
- **Überschriften**: Verwenden Sie eine logische H1-H6 Struktur

Bitte versuchen Sie es später erneut.`;

      return NextResponse.json({
        response: fallbackMessage,
        success: true,
        fallback: true
      }, { status: 200 });
    }

    const claudeData = await claudeResponse.json();
    
    const assistantMessage = claudeData.content?.[0]?.text || claudeData.message || 'Entschuldigung, ich konnte keine Antwort generieren.';


    // Session in Datenbank speichern - mit Fallback für fehlende Tabelle
    try {
      await prisma.wcagSession.create({
        data: {
          userId,
          userMessage: message,
          assistantResponse: assistantMessage,
          createdAt: new Date()
        }
      });
    } catch (error) {
      console.error('Fehler beim Speichern der WCAG Session (ignoriert):', error);
      // Fortfahren auch wenn Speichern fehlschlägt
    }

    return NextResponse.json({
      response: assistantMessage,
      success: true,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('WCAG Coach API Error:', error);
    return NextResponse.json({ 
      error: 'Interner Serverfehler', 
      message: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
    }, { status: 500 });
  }
} 