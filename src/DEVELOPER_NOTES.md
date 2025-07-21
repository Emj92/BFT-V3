# 🔧 Entwickler-Erinnerungen & Technische Hinweise

## 🚨 **Bekannte Probleme & Lösungen**

### **1. UI-Komponenten Import-Fehler**
```
Cannot find module '@/components/ui/...' or its corresponding type declarations
```
**Status:** Temporäres Problem, Komponenten existieren  
**Lösung:** Nach Implementierung der DB-Migrierung sollten Pfade überprüft werden

### **2. Website-Persistierung**
- ✅ **KOMPLETT GELÖST:** API-basierte Website-Verwaltung
- ✅ **IMPLEMENTIERT:** PostgreSQL mit Prisma Schema
- ✅ **MIGRIERT:** useWebsites Hook auf API mit localStorage-Fallback
- ✅ **FUNKTIONAL:** CRUD-Operationen über /api/websites/*

### **3. Disclaimer-System**
- ✅ **IMPLEMENTIERT:** `FirstScanDisclaimer` Komponente
- ✅ **INTEGRIERT:** In accessibility-check Seite
- **Funktionalität:** Zeigt einmalig beim ersten Scan rechtlichen Hinweis

### **4. Scan-Management (NEU)**
- ✅ **IMPLEMENTIERT:** `/api/scans` GET/POST Endpoints
- ✅ **FUNKTIONAL:** Background-Scan mit `executeScanWithDatabase()`
- ✅ **INTEGRIERT:** Credit-System für Scan-Limits
- ✅ **SPEICHERUNG:** Issues in separate DB-Tabelle

---

## 📁 **Wichtige Dateien & Funktionen**

### **Neue/Geänderte Dateien:**
```
components/first-scan-disclaimer.tsx  [NEU]
hooks/useWebsites.ts                  [NEU]
components/app-sidebar.tsx            [GEÄNDERT]
app/(app)/accessibility-check/page.tsx [GEÄNDERT]
```

### **Disclaimer-System:**
```typescript
// Hook für Disclaimer-Logik
useFirstScanDisclaimer()
- shouldShow: boolean
- markAsAccepted: () => void

// localStorage Keys:
'disclaimerAccepted': 'true'
'disclaimerAcceptedDate': ISO-String
```

### **Website-Management:**
```typescript
// Hook für Website-Verwaltung
useWebsites()
- websites: Website[]
- addWebsite(name, url): Website
- removeWebsite(id): void
- updateWebsite(id, updates): void

// localStorage Key:
'userWebsites': Website[]

interface Website {
  id: string
  name: string
  url: string
  addedAt: string
  lastScan?: string
}
```

---

## 🔗 **Integration-Punkte**

### **Sidebar Integration:**
- `useWebsites()` Hook ersetzt alte Website-Array
- Persistierung automatisch bei Add/Remove
- ID-basierte Verwaltung statt name/value-Pairs

### **Scan-Integration:**
- Disclaimer prüft `localStorage.disclaimerAccepted`
- Bei erstem Scan: Dialog vor Scan-Start
- Nach Akzeptierung: Automatischer Scan-Start

---

## 🎯 **Nächste Entwicklungsschritte**

### **1. Sofort (Diese Woche):**
```bash
# 1. Prisma Schema erweitern
# 2. Website-Model implementieren
# 3. Migration von localStorage zu DB
# 4. Auth-System verbessern
```

### **2. Prisma Schema Erweiterung:**
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  websites  Website[]
  scans     Scan[]
}

model Website {
  id        String   @id @default(cuid())
  name      String
  url       String
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  scans     Scan[]
}

model Scan {
  id         String   @id @default(cuid())
  websiteId  String
  website    Website  @relation(fields: [websiteId], references: [id])
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  results    Json
  score      Float
  standard   String
  createdAt  DateTime @default(now())
}
```

### **3. API-Routen erstellen:**
```
app/api/websites/route.ts         [GET, POST]
app/api/websites/[id]/route.ts    [PUT, DELETE]
app/api/scans/route.ts            [GET, POST]
app/api/scans/[id]/route.ts       [GET, DELETE]
```

---

## 🔒 **Security-Überlegungen**

### **Aktuell implementiert:**
- localStorage für temporäre Daten
- Basic Input-Validation
- XSS-Schutz durch Next.js

### **TODO für Produktion:**
- Rate-Limiting für Scanner
- Input-Sanitization erweitern
- CSRF-Protection
- API-Authentication
- Data-Encryption for sensitive data

---

## 📊 **Performance-Notizen**

### **Scanner-Performance:**
```javascript
// Aktuelle Timeout-Settings:
page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
page.waitForFunction(..., { timeout: 60000 })

// TODO: Optimierungen
- Background-Jobs für große Scans
- Queue-System implementieren
- Result-Caching
- Progressive Scanning
```

### **UI-Performance:**
- Lazy-Loading für große Listen
- Virtualisierung für Scan-Ergebnisse
- Image-Optimization
- Code-Splitting optimieren

---

## 🧪 **Testing-Strategy**

### **Unit Tests (TODO):**
```javascript
// Testen:
- useWebsites Hook
- useFirstScanDisclaimer Hook
- Website-Management Funktionen
- Scanner-Core-Logic

// Framework: Jest + React Testing Library
```

### **Integration Tests (TODO):**
```javascript
// Testen:
- Vollständiger Scan-Workflow
- Website Add/Remove Flow
- Disclaimer-Workflow
- API-Endpunkte

// Framework: Playwright oder Cypress
```

---

## 🔧 **Development-Commands**

### **Lokale Entwicklung:**
```bash
npm run dev              # Development Server
npm run build           # Production Build
npm run start           # Production Server
npm run type-check      # TypeScript Check
```

### **Database-Commands:**
```bash
npx prisma migrate dev  # Run Migrations
npx prisma studio      # DB Admin Interface
npx prisma generate    # Generate Client
npx prisma reset       # Reset Database
```

---

## 📝 **Code-Style & Conventions**

### **TypeScript:**
```typescript
// Strikte Types verwenden
interface Props {
  required: string
  optional?: number
}

// Hooks immer mit 'use' prefix
const useCustomHook = () => { ... }

// Event-Handler mit 'handle' prefix
const handleClick = () => { ... }
```

### **React-Patterns:**
```jsx
// Custom Hooks für Logic
// Components für UI
// Contexts für Global State
// Props destructuring
// Conditional rendering mit &&
```

---

## 🚀 **Deployment-Notizen**

### **Environment Variables:**
```env
DATABASE_URL=           # Postgres/MySQL URL
NEXTAUTH_SECRET=       # NextAuth Secret
CHROME_PATH=           # Chrome für Scanner
NODE_ENV=production    # Environment
```

### **Production-Checklist:**
- [ ] Environment Variables gesetzt
- [ ] Database migriert
- [ ] HTTPS konfiguriert
- [ ] Error-Monitoring aktiv
- [ ] Backup-System läuft
- [ ] Performance-Monitoring aktiv

---

**Letztes Update:** November 2024  
**Entwickler:** barriere-frei24.de Team 