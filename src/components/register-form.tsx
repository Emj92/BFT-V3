"use client";

import { useState } from "react";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"


export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mindestens 8 Zeichen"
                        value={password}
                        onChange={handlePasswordChange}
                        required
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Passwortstärke-Anzeige */}
                    {password && (
                      <div className="space-y-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              passwordStrength < 30 ? 'bg-red-500' :
                              passwordStrength < 60 ? 'bg-yellow-500' :
                              passwordStrength < 80 ? 'bg-blue-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${passwordStrength}%` }}
                          ></div>
                        </div>
                        <p className={`text-xs ${
                          passwordStrength < 30 ? 'text-red-600' :
                          passwordStrength < 60 ? 'text-yellow-600' :
                          passwordStrength < 80 ? 'text-blue-600' :
                          'text-green-600'
                        }`}>
                          Passwortstärke: {
                            passwordStrength < 30 ? 'Schwach' :
                            passwordStrength < 60 ? 'Mittel' :
                            passwordStrength < 80 ? 'Gut' :
                            'Sehr gut'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Passwort wiederholen"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
