#!/bin/bash

echo "🔧 Repariere Next.js Build-Probleme..."

# 1. Erstelle fehlende Manifest-Dateien falls sie nicht existieren
if [ ! -f ".next/prerender-manifest.json" ]; then
    echo "📄 Erstelle fehlende prerender-manifest.json"
    echo '{}' > .next/prerender-manifest.json
fi

if [ ! -f ".next/routes-manifest.json" ]; then
    echo "📄 Erstelle fehlende routes-manifest.json"
    echo '{"version":3,"pages404":true,"basePath":"","redirects":[],"rewrites":[],"headers":[],"staticRoutes":[],"dynamicRoutes":[],"dataRoutes":[],"i18n":null}' > .next/routes-manifest.json
fi

# 2. Erstelle build-manifest.json falls fehlend
if [ ! -f ".next/build-manifest.json" ]; then
    echo "📄 Erstelle fehlende build-manifest.json"
    echo '{"polyfillFiles":[],"devFiles":[],"ampDevFiles":[],"lowPriorityFiles":[],"rootMainFiles":[],"pages":{},"ampFirstPages":[]}' > .next/build-manifest.json
fi

# 3. Stelle sicher, dass alle nötigen Ordner existieren
mkdir -p .next/server/pages
mkdir -p .next/static
mkdir -p logs

echo "✅ Build-Reparatur abgeschlossen!"

# 4. Teste den Build
if [ -f ".next/standalone/server.js" ]; then
    echo "✅ Standalone Build gefunden - verwende ecosystem.config.js"
    echo "   Führe aus: pm2 start ecosystem.config.js"
else
    echo "⚠️  Kein Standalone Build - verwende Backup-Konfiguration"
    echo "   Führe aus: pm2 start ecosystem.backup.config.js"
fi 