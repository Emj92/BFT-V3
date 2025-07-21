import { NextRequest, NextResponse } from 'next/server';
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

    // Rate-Limiting prüfen
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Aktuelle Anfragen zählen - mit Fallback für fehlende Tabelle
    let hourlyCount = 0;
    let dailyCount = 0;
    let monthlyCount = 0;

    try {
      const counts = await Promise.all([
        prisma.wcagSession.count({
          where: {
            userId,
            createdAt: { gte: oneHourAgo }
          }
        }),
        prisma.wcagSession.count({
          where: {
            userId,
            createdAt: { gte: oneDayAgo }
          }
        }),
        prisma.wcagSession.count({
          where: {
            userId,
            createdAt: { gte: oneMonthAgo }
          }
        })
      ]);
      
      [hourlyCount, dailyCount, monthlyCount] = counts;
    } catch (error) {
      console.error('Fehler beim Zählen der WCAG Sessions:', error);
      // Fallback zu Standard-Werten wenn Tabelle nicht existiert
      hourlyCount = 0;
      dailyCount = 0;
      monthlyCount = 0;
    }

    // Bundle-spezifische Limits
    const bundleType = user.bundle || 'FREE';
    const monthlyLimit = RATE_LIMITS.MONTHLY[bundleType as keyof typeof RATE_LIMITS.MONTHLY];

    // Rate-Limits überprüfen
    if (hourlyCount >= RATE_LIMITS.HOURLY) {
      return NextResponse.json({ 
        error: 'Stündliches Limit erreicht', 
        message: `Sie haben Ihr stündliches Limit von ${RATE_LIMITS.HOURLY} Anfragen erreicht. Bitte warten Sie eine Stunde.`,
        rateLimitExceeded: true,
        rateLimitType: 'hourly'
      }, { status: 429 });
    }

    if (dailyCount >= RATE_LIMITS.DAILY) {
      return NextResponse.json({ 
        error: 'Tägliches Limit erreicht', 
        message: `Sie haben Ihr tägliches Limit von ${RATE_LIMITS.DAILY} Anfragen erreicht. Bitte warten Sie bis morgen.`,
        rateLimitExceeded: true,
        rateLimitType: 'daily'
      }, { status: 429 });
    }

    if (monthlyCount >= monthlyLimit) {
      return NextResponse.json({ 
        error: 'Monatliches Limit erreicht', 
        message: `Sie haben Ihr monatliches Limit von ${monthlyLimit} Anfragen erreicht. Upgraden Sie Ihr Paket für mehr Anfragen.`,
        rateLimitExceeded: true,
        rateLimitType: 'monthly',
        currentBundle: bundleType,
        upgradeAvailable: true
      }, { status: 429 });
    }

    // Erweiteter Claude API System-Prompt
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
        error: 'KI-Service nicht konfiguriert', 
        message: 'Der KI-Service ist nicht richtig konfiguriert. Bitte wenden Sie sich an den Support.'
      }, { status: 503 });
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
        temperature: 1,
        system: systemPrompt,
        messages
      })
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API Error:', errorText);
      return NextResponse.json({ 
        error: 'KI-Service temporär nicht verfügbar', 
        message: 'Unser KI-Service ist momentan nicht verfügbar. Bitte versuchen Sie es später erneut.'
      }, { status: 503 });
    }

    const claudeData = await claudeResponse.json();
    const assistantMessage = claudeData.content?.[0]?.text || 'Entschuldigung, ich konnte keine Antwort generieren.';

    // Session in Datenbank speichern - mit Fallback für fehlende Tabelle
    try {
      await prisma.wcagSession.create({
        data: {
          userId,
          userMessage: message,
          assistantResponse: assistantMessage,
          createdAt: now
        }
      });
    } catch (error) {
      console.error('Fehler beim Speichern der WCAG Session:', error);
      // Fortfahren auch wenn Speichern fehlschlägt
    }

    // Aktuelle Rate-Limit-Statistiken für Response
    const stats = {
      hourlyUsed: hourlyCount + 1,
      hourlyLimit: RATE_LIMITS.HOURLY,
      dailyUsed: dailyCount + 1,
      dailyLimit: RATE_LIMITS.DAILY,
      monthlyUsed: monthlyCount + 1,
      monthlyLimit: monthlyLimit,
      bundleType
    };

    return NextResponse.json({
      message: assistantMessage,
      stats,
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error('WCAG Coach API Error:', error);
    return NextResponse.json({ 
      error: 'Interner Serverfehler', 
      message: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
    }, { status: 500 });
  }
} 