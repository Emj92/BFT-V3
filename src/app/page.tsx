"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatUrl, isValidUrl } from '@/lib/utils';
import ScanResults from '@/components/scan-results';
import Navbar from '@/components/navbar';
import { HomepageDisclaimer, useHomepageDisclaimer } from '@/components/homepage-disclaimer';
import type { ScanResult } from '@/lib/accessibility-scanner';
import Link from 'next/link';
import { UserPlus, Lock } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamischer Import der BackgroundAnimation
const BackgroundAnimation = dynamic(() => import('@/components/background-animation'), {
  ssr: false
})

export default function Home() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ScanResult | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [dailyScanLimit] = useState(3); // Limit für nicht-registrierte Nutzer
  
  // Homepage-Disclaimer
  const { shouldShow: showDisclaimer, markAsAccepted } = useHomepageDisclaimer()
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)

  // Prüfe Registrierungsstatus
  useEffect(() => {
    const checkRegistration = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          setIsRegistered(true);
        }
      } catch (error) {
        // Benutzer ist nicht registriert
        setIsRegistered(false);
      }
    };
    
    checkRegistration();
  }, []);

  // Prüfe Scan-Limit für nicht-registrierte Nutzer
  useEffect(() => {
    if (!isRegistered) {
      const today = new Date().toDateString();
      const scanData = localStorage.getItem('dailyScans');
      
      if (scanData) {
        const parsed = JSON.parse(scanData);
        if (parsed.date === today) {
          setScanCount(parsed.count);
        } else {
          // Neuer Tag, zurücksetzen
          localStorage.setItem('dailyScans', JSON.stringify({ date: today, count: 0 }));
          setScanCount(0);
        }
      } else {
        localStorage.setItem('dailyScans', JSON.stringify({ date: today, count: 0 }));
        setScanCount(0);
      }
    }
  }, [isRegistered]);

  // Aktualisiere Scan-Count nach erfolgreichem Scan
  const incrementScanCount = () => {
    if (!isRegistered) {
      const today = new Date().toDateString();
      const newCount = scanCount + 1;
      localStorage.setItem('dailyScans', JSON.stringify({ date: today, count: newCount }));
      setScanCount(newCount);
    }
  };

  // Zeige Disclaimer wenn nötig
  useEffect(() => {
    if (showDisclaimer) {
      setDisclaimerOpen(true)
    }
  }, [showDisclaimer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prüfe Scan-Limit für nicht-registrierte Nutzer
    if (!isRegistered && scanCount >= dailyScanLimit) {
      setError(`Tägliches Scan-Limit erreicht (${dailyScanLimit} Scans). Registrieren Sie sich für unbegrenzte Scans.`);
      return;
    }
    
    // Prüfe ob Disclaimer gezeigt werden muss
    if (showDisclaimer && !disclaimerOpen) {
      setDisclaimerOpen(true)
      return
    }
    
    if (!url) {
      setError('Bitte geben Sie eine URL ein');
      return;
    }
    
    const formattedUrl = formatUrl(url);
    
    if (!isValidUrl(formattedUrl)) {
      setError('Bitte geben Sie eine gültige URL ein');
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: formattedUrl }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Scannen der Website');
      }
      
      const data = await response.json();
      // Stelle sicher, dass die Ergebnisse echt sind und von der tatsächlichen Prüfung stammen
      if (!data || !data.violations || !data.passes) {
        throw new Error('Die Prüfungsergebnisse sind unvollständig oder fehlerhaft');
      }
      setResults(data);
      incrementScanCount(); // Inkrementiere den Scan-Count
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <BackgroundAnimation />
      <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 pt-16 relative z-10">
        <Navbar />
      <div className="max-w-3xl w-full">
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <div className="space-y-2">
            <Label htmlFor="url" className="text-foreground">Website URL</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                type="text"
                placeholder="z.B. www.ihre-website.de"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-card border-border text-foreground"
                aria-describedby={error ? "url-error" : undefined}
              />
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                {isLoading ? 'Wird geprüft...' : 'Prüfen'}
              </Button>
            </div>
            {error && (
              <p id="url-error" className="text-red-500 text-sm mt-1">{error}</p>
            )}
            {!isRegistered && (
              <p className="text-xs text-muted-foreground mt-1">
                Kostenlose Scans heute: {scanCount}/{dailyScanLimit} • 
                <Link href="/register" className="text-primary hover:underline ml-1">
                  Für unbegrenzte Scans registrieren
                </Link>
              </p>
            )}
          </div>
        </form>
        
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-foreground">Ihre Website wird auf Barrierefreiheit geprüft...</p>
            <p className="text-muted-foreground text-sm mt-2">Dies kann bis zu einer Minute dauern.</p>
          </div>
        )}
        
        {results && !isLoading && (
          <>
            <ScanResults results={results} showFullDetails={isRegistered} />
            
            {!isRegistered && results.violations && results.violations.length > 0 && (
              <Card className="mt-6 border-primary/50">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Lock className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-xl">Vollständige Fehlerliste freischalten</CardTitle>
                  <CardDescription className="text-base">
                    Registrieren Sie sich kostenlos, um die vollständige Liste aller gefundenen Barrierefreiheitsprobleme zu sehen
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="font-medium text-primary mb-1">Detaillierte Fehleranalyse</div>
                      <div className="text-muted-foreground">Sehen Sie alle {results.violations.length} gefundenen Probleme</div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="font-medium text-primary mb-1">Lösungsvorschläge</div>
                      <div className="text-muted-foreground">Konkrete Schritte zur Behebung</div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="font-medium text-primary mb-1">WCAG-Referenzen</div>
                      <div className="text-muted-foreground">Verlinkung zu den Standards</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                      <Link href="/register">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Kostenlos registrieren
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link href="/login">
                        Bereits registriert? Anmelden
                      </Link>
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    ✅ Kostenlos • ✅ Keine Kreditkarte erforderlich • ✅ Sofortiger Zugang
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
        
        {/* Wichtige Infobox über Barrierefreiheit-Pflicht */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center mt-0.5">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                Wichtiger Hinweis: Barrierefreiheit wird ab 28.06.2025 Pflicht!
              </h3>
              <p className="text-amber-700 dark:text-amber-300 text-sm">
                Ab dem 28. Juni 2025 sind auch private Unternehmen zur digitalen Barrierefreiheit verpflichtet. 
                Vermeiden Sie kostspielige Abmahnungen und machen Sie Ihre Website jetzt barrierefrei. 
                Nutzen Sie unser Tool, um Ihre Website zu prüfen und alle notwendigen Anpassungen zu identifizieren.
              </p>
            </div>
          </div>
        </div>
        
        {!results && !isLoading && (
          <div className="bg-card rounded-lg p-6 mt-8 border border-primary/50">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Warum Barrierefreiheit wichtig ist</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2 text-primary">WCAG 2.1 Konformität</h3>
                <p className="text-muted-foreground text-sm">
                  Die Web Content Accessibility Guidelines (WCAG) 2.1 definieren, wie Webinhalte für Menschen mit Behinderungen zugänglicher gemacht werden können.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2 text-primary">BITV 2.0 Anforderungen</h3>
                <p className="text-muted-foreground text-sm">
                  Die Barrierefreie-Informationstechnik-Verordnung (BITV 2.0) ist die deutsche Umsetzung der europäischen Richtlinien zur Barrierefreiheit.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2 text-primary">Rechtliche Verpflichtung</h3>
                <p className="text-muted-foreground text-sm">
                  Für öffentliche Stellen ist Barrierefreiheit gesetzlich vorgeschrieben. Auch für private Anbieter wird dies zunehmend relevant.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2 text-primary">Größere Reichweite</h3>
                <p className="text-muted-foreground text-sm">
                  Barrierefreie Websites erreichen mehr Menschen und verbessern die Nutzererfahrung für alle Besucher.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <footer className="mt-8 text-center text-muted-foreground text-sm">
        <p> {new Date().getFullYear()} Erwin Meindl - Alle Rechte vorbehalten</p>
        <p className="mt-1">Ein Service von <a href="https://www.meindl-webdesign.de" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.meindl-webdesign.de</a></p>
      </footer>
      
      {/* Homepage-Disclaimer */}
      <HomepageDisclaimer
        open={disclaimerOpen}
        onClose={() => setDisclaimerOpen(false)}
        onAccept={() => {
          markAsAccepted()
          setDisclaimerOpen(false)
          // Nach Akzeptierung automatisch den Scan starten
          if (url) {
            setTimeout(() => {
              handleSubmit(new Event('submit') as any)
            }, 100)
          }
        }}
      />
      </main>
    </div>
  );
}
