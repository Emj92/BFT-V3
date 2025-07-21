# barriere-frei24.de - Barrierefreiheits-Prüftool

Ein Webapplikation zur Überprüfung von Webseiten auf Barrierefreiheit nach WCAG 2.1 (Level AA) und BITV 2.0 Standards.

## Funktionen

- Analyse von Webseiten auf Barrierefreiheit
- Prüfung nach WCAG 2.1 Level AA und BITV 2.0 Standards
- Detaillierte Berichte mit Fehleranalyse und Verbesserungsvorschlägen
- Technische Prüfungen für:
  - Alternativtexte für Bilder
  - Semantisches HTML
  - Tastaturbedienung
  - Sichtbarer Fokus
  - Farbkontraste
  - ARIA-Rollen
  - Formular-Labels
  - Autoplay-Videos
  - Dokumentsprache
  - Blink-Elemente
  - Überschriftenhierarchie

## Technologien

- Next.js (App Router)
- TypeScript
- TailwindCSS mit Dark Mode
- ShadCN UI Komponenten
- Puppeteer für Webseitenanalyse
- axe-core für Accessibility-Audits
- Prisma mit PostgreSQL Datenbank

## Installation

1. Repository klonen
2. Abhängigkeiten installieren:
   ```
   npm install
   ```
3. Umgebungsvariablen in `.env` konfigurieren:
   ```
   DATABASE_URL="postgresql://erwin:erolfni1992da@188.245.101.122:5432/barrieredb"
   ```
4. Prisma Client generieren:
   ```
   npx prisma generate
   ```
5. Entwicklungsserver starten:
   ```
   npm run dev
   ```

## Erweiterungsmöglichkeiten

- PDF-Export für Berichte
- Benutzeranmeldung für gespeicherte Scans
- Limitierung der Anzahl an Scans pro IP
- Vergleich von Scans über Zeit
- Detaillierte Empfehlungen zur Behebung von Problemen
- API-Zugang für automatisierte Tests
- Pro-Version mit erweiterten Funktionen

## Lizenz

© 2025 barriere-frei24.de - Alle Rechte vorbehalten
