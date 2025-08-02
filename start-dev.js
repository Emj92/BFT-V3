#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starter Script für BFE 0.195 - Barrierefreiheitsgenerator');
console.log('='.repeat(70));

// Funktion zum Ausführen von Befehlen
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`📋 Führe aus: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Befehl fehlgeschlagen mit Code ${code}`));
      } else {
        resolve();
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Funktion für SSH Tunnel
function startSSHTunnel() {
  return new Promise((resolve, reject) => {
    console.log('🔗 Starte SSH Tunnel für Datenbank...');
    
    const sshProcess = spawn('ssh', [
      '-L', '5433:localhost:5432',
      'erwinneu@188.245.101.122',
      '-N'  // Nur Port-Forwarding, keine Remote-Shell
    ], {
      stdio: 'inherit',
      shell: true
    });

    sshProcess.on('error', (error) => {
      console.error('❌ SSH Tunnel Fehler:', error.message);
      reject(error);
    });

    // Warte kurz damit der Tunnel aufgebaut wird
    setTimeout(() => {
      console.log('✅ SSH Tunnel sollte jetzt aktiv sein');
      resolve(sshProcess);
    }, 3000);

    return sshProcess;
  });
}

// Prüfe ob package.json existiert
function checkPackageJSON() {
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) {
    console.error('❌ package.json nicht gefunden. Sind Sie im richtigen Verzeichnis?');
    process.exit(1);
  }
  console.log('✅ package.json gefunden');
}

// Prüfe Umgebungsvariablen
function checkEnvironment() {
  console.log('🔧 Prüfe Umgebungsvariablen...');
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];

  let missingVars = [];
  
  // Versuche .env.local zu laden
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    console.log('✅ .env.local gefunden');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    requiredEnvVars.forEach(varName => {
      if (!envContent.includes(varName) && !process.env[varName]) {
        missingVars.push(varName);
      }
    });
  } else {
    console.log('⚠️  .env.local nicht gefunden');
    missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  }

  if (missingVars.length > 0) {
    console.log('⚠️  Fehlende Umgebungsvariablen:', missingVars.join(', '));
  } else {
    console.log('✅ Alle wichtigen Umgebungsvariablen vorhanden');
  }
}

// Hauptfunktion
async function main() {
  try {
    console.log('🔍 Führe Vorprüfungen durch...');
    checkPackageJSON();
    checkEnvironment();

    // SSH Tunnel starten
    console.log('\n📡 Starte SSH Tunnel...');
    const sshProcess = await startSSHTunnel();

    // Development Server starten
    console.log('\n🚀 Starte Development Server...');
    console.log('💡 Server wird unter http://localhost:3000 verfügbar sein');
    console.log('💡 Drücken Sie Ctrl+C um beide Prozesse zu beenden\n');

    // Behandle Ctrl+C
    process.on('SIGINT', () => {
      console.log('\n🛑 Beende Prozesse...');
      if (sshProcess && !sshProcess.killed) {
        console.log('🔒 Schließe SSH Tunnel...');
        sshProcess.kill();
      }
      console.log('👋 Auf Wiedersehen!');
      process.exit(0);
    });

    // Starte npm run dev
    await runCommand('npm', ['run', 'dev']);

  } catch (error) {
    console.error('❌ Fehler:', error.message);
    process.exit(1);
  }
}

// Zeige Hilfe an
function showHelp() {
  console.log(`
🚀 BFE-0.195 Starter Script

Dieses Script:
1. Prüft die Umgebung (package.json, .env.local)
2. Startet SSH Tunnel: ssh -L 5433:localhost:5432 erwinneu@188.245.101.122
3. Startet Development Server: npm run dev

Verwendung:
  node start-dev.js        # Startet alles
  node start-dev.js -h     # Zeigt diese Hilfe

Voraussetzungen:
- Node.js installiert
- SSH Zugang zu erwinneu@188.245.101.122
- .env.local mit DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL

Nach dem Start:
- Anwendung: http://localhost:3000
- Datenbank: localhost:5433 (über SSH Tunnel)
- Ctrl+C beendet alle Prozesse
`);
}

// Command line arguments verarbeiten
const args = process.argv.slice(2);
if (args.includes('-h') || args.includes('--help')) {
  showHelp();
  process.exit(0);
}

// Script ausführen
main();