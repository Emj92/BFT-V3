"use client";

import { useState } from "react";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"


export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0); // 0-100
  
  // Funktion zur Berechnung der Passwortstärke
  const calculatePasswordStrength = (pass: string): number => {
    let score = 0;
    
    if (!pass) return 0;
    
    // Länge
    if (pass.length >= 8) score += 20;
    if (pass.length >= 12) score += 10;
    
    // Komplexität
    if (/[A-Z]/.test(pass)) score += 15; // Großbuchstaben
    if (/[a-z]/.test(pass)) score += 15; // Kleinbuchstaben
    if (/[0-9]/.test(pass)) score += 15; // Zahlen
    if (/[^A-Za-z0-9]/.test(pass)) score += 25; // Sonderzeichen
    
    return Math.min(score, 100);
  };
  
  // Aktualisiere die Passwortstärke bei Änderungen
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(calculatePasswordStrength(newPassword));
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    if (!acceptedTerms) {
      setError("Bitte akzeptieren Sie die AGB und Datenschutzbestimmungen");
      setLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein");
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Registrierung fehlgeschlagen");
      }
      
      // Erfolgreich registriert, zur Login-Seite weiterleiten
      window.location.href = "/login";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>

      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-md p-2">
          <Card className="overflow-hidden border border-border shadow-lg bg-card relative z-10">
            <CardContent className="grid p-0">
              <form className="p-4 md:p-6" onSubmit={handleRegister}>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col items-center text-center mb-2">
                    <h1 className="text-xl font-bold text-foreground">Registrieren</h1>
                    <p className="text-balance text-muted-foreground text-sm">
                      Erstellen Sie ein neues barriere-frei24 Konto
                    </p>
                  </div>
                  {error && (
                    <div className="p-3 text-sm text-white bg-red-500 rounded">
                      {error}
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Vor- und Nachname"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">E-Mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@domain.de"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Passwort</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      value={password}
                      onChange={handlePasswordChange}
                      required 
                    />
                    {password && (
                      <div className="mt-1">
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${passwordStrength < 30 ? 'bg-red-500' : passwordStrength < 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${passwordStrength}%` }}
                          />
                        </div>
                        <p className="text-xs mt-1 text-muted-foreground">
                          {passwordStrength < 30 ? 'Schwaches Passwort' : 
                           passwordStrength < 60 ? 'Mittleres Passwort' : 
                           'Starkes Passwort'}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required 
                    />
                    {password && confirmPassword && (
                      <div className="flex items-center mt-1 text-xs">
                        {password === confirmPassword ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-green-500">Passwörter stimmen überein</span>
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span className="text-red-500">Passwörter stimmen nicht überein</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-start space-x-2 mb-4">
                    <div className="flex items-center h-5 mt-1">
                      <input
                        id="terms"
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="h-4 w-4 border border-gray-300 rounded text-primary focus:ring-primary"
                        required
                      />
                    </div>
                    <div className="text-sm">
                      <label htmlFor="terms" className="text-gray-300">
                        Ich akzeptiere die <Link href="/agb" className="text-primary hover:underline">AGB</Link> und <Link href="/datenschutzbestimmungen" className="text-primary hover:underline">Datenschutzbestimmungen</Link>
                      </label>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading || !acceptedTerms}>
                    {loading ? "Registrierung läuft..." : "Registrieren"}
                  </Button>
                  <div className="text-center text-sm">
                    Bereits ein Konto?{" "}
                    <Link href="/login" className="underline underline-offset-4">
                      Anmelden
                    </Link>
                  </div>
                </div>
              </form>
              <div className="hidden md:block">
                <div className="h-full w-full p-4 bg-card border-t border-border">
                
                  <div className="flex items-center justify-center h-full p-4 text-foreground">
                    <div>
                      <h2 className="text-2xl font-bold mb-4">Vorteile der Registrierung</h2>
                      <ul className="space-y-2">
                        <li className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Speichern Ihrer Scan-Ergebnisse
                        </li>
                        <li className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Zugriff auf erweiterte Funktionen
                        </li>
                        <li className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Detaillierte Fehlerberichte
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
            Mit der Registrierung akzeptieren Sie unsere <Link href="/agb">AGB</Link>{" "}
            und <Link href="/datenschutzbestimmungen">Datenschutzbestimmungen</Link>.
          </div>
        </div>
      </div>
    </div>
  );
}
