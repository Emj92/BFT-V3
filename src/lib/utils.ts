import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatiert eine URL, indem sichergestellt wird, dass sie mit http:// oder https:// beginnt
 */
export function formatUrl(url: string): string {
  if (!url) return url;
  
  url = url.trim();
  
  // Füge http:// hinzu, wenn kein Protokoll angegeben ist
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  return url;
}

/**
 * Normalisiert eine URL für Duplikat-Prüfung
 * Entfernt www, trailing slashes und normalisiert auf https
 */
export function normalizeUrlForDuplicateCheck(url: string): string {
  if (!url) return url;
  
  url = url.trim();
  
  // Füge https:// hinzu, wenn kein Protokoll angegeben ist
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  try {
    const urlObj = new URL(url);
    
    // Entferne www. am Anfang
    let hostname = urlObj.hostname;
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    
    // Immer https verwenden
    urlObj.protocol = 'https:';
    urlObj.hostname = hostname;
    
    // Entferne trailing slash vom pathname außer bei root
    if (urlObj.pathname !== '/' && urlObj.pathname.endsWith('/')) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }
    
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Überprüft, ob eine URL gültig ist
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Formatiert Preise im deutschen Format
 * - Rundet auf volle Zahlen auf
 * - Verwendet Kommas als Dezimaltrennzeichen
 * - Zeigt immer zwei Dezimalstellen an
 * @param price Preis als Zahl
 * @returns Formatierter Preis (z.B. "92,00€")
 */
export function formatGermanPrice(price: number): string {
  // Auf volle Zahlen aufrunden
  const roundedPrice = Math.ceil(price);
  
  // Deutsche Formatierung mit Komma als Dezimaltrennzeichen
  const formatted = roundedPrice.toLocaleString('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return formatted;
}
