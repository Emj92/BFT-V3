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
