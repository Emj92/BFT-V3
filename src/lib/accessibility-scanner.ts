import puppeteer, { Browser, Page } from 'puppeteer'; // puppeteer Import hinzugefügt
import { readFileSync } from 'fs';
import { join } from 'path';
import { existsSync } from 'fs';
import { platform } from 'os';
import prisma from './prisma';

// Typenerweiterung für Window mit axe
declare global {
  interface Window {
    axe: any;
    axeResults: any;
    axeError: any;
  }
}

export interface ScanResult {
  url: string;
  timestamp: string;
  violations: any[];
  passes: any[];
  incomplete: any[];
  inapplicable: any[];
  score: number;
  summary: {
    violations: number;
    passes: number;
    incomplete: number;
    inapplicable: number;
  };
  wcagViolations: {
    a: number;
    aa: number;
    aaa: number;
  };
  bitvViolations: number;
  technicalChecks: {
    altTexts: boolean;
    semanticHtml: boolean;
    keyboardNavigation: boolean;
    focusVisible: boolean;
    colorContrast: boolean;
    ariaRoles: boolean;
    formLabels: boolean;
    autoplayVideos: boolean;
    documentLanguage: boolean;
    blinkElements: boolean;
    headingStructure: boolean;
  };
  detailedAnalysis: any;
  categorizedViolations: Record<string, any[]>;
  errorCategories: Record<string, DetailedErrorCategory>;
}

// Verbesserte Kategorisierung basierend auf modernen Accessibility Checkern
interface DetailedErrorCategory {
  id: string;
  name: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  wcagPrinciple: 'perceivable' | 'operable' | 'understandable' | 'robust';
}

const ERROR_CATEGORIES: Record<string, DetailedErrorCategory> = {
  'structure_navigation': {
    id: 'structure_navigation',
    name: 'Struktur & Navigation', 
    description: 'Überschriftenhierarchie, Listen, Landmarks und Seitenstruktur',
    priority: 'high',
    wcagPrinciple: 'perceivable'
  },
  'images_media': {
    id: 'images_media',
    name: 'Bilder & Medien',
    description: 'Alt-Texte, Bildoptimierung, Video-Untertitel',
    priority: 'critical',
    wcagPrinciple: 'perceivable'
  },
  'forms_inputs': {
    id: 'forms_inputs', 
    name: 'Formulare & Eingaben',
    description: 'Formular-Labels, Validierung, Eingabehilfen',
    priority: 'critical',
    wcagPrinciple: 'understandable'
  },
  'keyboard_focus': {
    id: 'keyboard_focus',
    name: 'Tastatur & Fokus',
    description: 'Tastaturnavigation, Fokus-Management, Tab-Reihenfolge',
    priority: 'high',
    wcagPrinciple: 'operable'
  },
  'colors_contrast': {
    id: 'colors_contrast',
    name: 'Farben & Kontrast',
    description: 'Farbkontraste, Farben-abhängige Informationen',
    priority: 'high',
    wcagPrinciple: 'perceivable'
  },
  'aria_semantics': {
    id: 'aria_semantics',
    name: 'ARIA & Semantik',
    description: 'ARIA-Rollen, semantisches HTML, Barrierefreie Namen',
    priority: 'medium',
    wcagPrinciple: 'robust'
  },
  'technical_standards': {
    id: 'technical_standards',
    name: 'Technische Standards',
    description: 'HTML-Validierung, Dokumentsprache, Meta-Informationen',
    priority: 'medium',
    wcagPrinciple: 'robust'
  },
  'interaction_ux': {
    id: 'interaction_ux',
    name: 'Interaktion & UX',
    description: 'Touch-Targets, Timing, Bewegungssteuerung',
    priority: 'medium',
    wcagPrinciple: 'operable'
  },
  'content_language': {
    id: 'content_language',
    name: 'Inhalt & Sprache',
    description: 'Sprachattribute, Leserichtung, Textverständlichkeit',
    priority: 'medium',
    wcagPrinciple: 'understandable'
  },
  'responsive_mobile': {
    id: 'responsive_mobile',
    name: 'Responsive & Mobile',
    description: 'Mobile Barrierefreiheit, Zoom-Funktionalität, Touch-Bedienung',
    priority: 'high',
    wcagPrinciple: 'operable'
  }
};

// Regel-zu-Kategorie-Mapping basierend auf axe-core Rules
const RULE_CATEGORY_MAPPING: Record<string, string> = {
  // Struktur & Navigation
  'heading-order': 'structure_navigation',
  'landmark-one-main': 'structure_navigation',
  'page-has-heading-one': 'structure_navigation',
  'landmark-unique': 'structure_navigation',
  'list': 'structure_navigation',
  'listitem': 'structure_navigation',
  'definition-list': 'structure_navigation',
  'dlitem': 'structure_navigation',
  'bypass': 'structure_navigation',
  'skip-link': 'structure_navigation',
  
  // Bilder & Medien
  'image-alt': 'images_media',
  'image-redundant-alt': 'images_media',
  'input-image-alt': 'images_media',
  'object-alt': 'images_media',
  'area-alt': 'images_media',
  'video-caption': 'images_media',
  'audio-caption': 'images_media',
  
  // Formulare & Eingaben
  'label': 'forms_inputs',
  'label-title-only': 'forms_inputs',
  'form-field-multiple-labels': 'forms_inputs',
  'select-name': 'forms_inputs',
  'input-button-name': 'forms_inputs',
  'duplicate-id-active': 'forms_inputs',
  'fieldset-legend': 'forms_inputs',
  
  // Tastatur & Fokus
  'focus-order-semantics': 'keyboard_focus',
  'focusable-content': 'keyboard_focus',
  'tabindex': 'keyboard_focus',
  'accesskeys': 'keyboard_focus',
  
  // Farben & Kontrast
  'color-contrast': 'colors_contrast',
  'color-contrast-enhanced': 'colors_contrast',
  'link-in-text-block': 'colors_contrast',
  
  // ARIA & Semantik
  'aria-valid-attr': 'aria_semantics',
  'aria-valid-attr-value': 'aria_semantics',
  'aria-roles': 'aria_semantics',
  'aria-allowed-attr': 'aria_semantics',
  'aria-required-attr': 'aria_semantics',
  'aria-required-children': 'aria_semantics',
  'aria-required-parent': 'aria_semantics',
  'aria-hidden-body': 'aria_semantics',
  'aria-hidden-focus': 'aria_semantics',
  'button-name': 'aria_semantics',
  'link-name': 'aria_semantics',
  
  // Technische Standards
  'valid-lang': 'technical_standards',
  'html-has-lang': 'technical_standards',
  'html-lang-valid': 'technical_standards',
  'html-xml-lang-mismatch': 'technical_standards',
  'document-title': 'technical_standards',
  'duplicate-id': 'technical_standards',
  'meta-refresh': 'technical_standards',
  'meta-viewport': 'technical_standards',
  
  // Interaktion & UX
  'target-size': 'interaction_ux',
  'no-autoplay-audio': 'interaction_ux',
  'blink': 'interaction_ux',
  'marquee': 'interaction_ux',
  
  // Inhalt & Sprache
  'lang': 'content_language',
  
  // Responsive & Mobile
  'meta-viewport-large': 'responsive_mobile'
};

// Verbesserte Kategorisierung der Violations
function categorizeViolations(violations: any[]): Record<string, any[]> {
  const categorized: Record<string, any[]> = {};
  
  // Initialisiere alle Kategorien
  Object.keys(ERROR_CATEGORIES).forEach(categoryId => {
    categorized[categoryId] = [];
  });
  
  violations.forEach(violation => {
    const categoryId = RULE_CATEGORY_MAPPING[violation.id] || 'aria_semantics';
    categorized[categoryId].push(violation);
  });
  
  return categorized;
}

// Detaillierte Issue-Analyse mit Prioritätseinstufung
function analyzeIssueDetails(violations: any[]): any {
  const categorized = categorizeViolations(violations);
  const analysis = {
    totalIssues: violations.length,
    criticalIssues: 0,
    highPriorityIssues: 0,
    mediumPriorityIssues: 0,
    lowPriorityIssues: 0,
    categoriesAffected: 0,
    wcagPrinciplesAffected: new Set(),
    detailedBreakdown: {} as Record<string, any>,
    recommendations: [] as string[]
  };
  
  Object.entries(categorized).forEach(([categoryId, categoryViolations]) => {
    if (categoryViolations.length > 0) {
      analysis.categoriesAffected++;
      const category = ERROR_CATEGORIES[categoryId];
      
      analysis.wcagPrinciplesAffected.add(category.wcagPrinciple);
      
      // Prioritätszählung
      categoryViolations.forEach(violation => {
        switch (violation.impact) {
          case 'critical':
            analysis.criticalIssues++;
            break;
          case 'serious':
            analysis.highPriorityIssues++;
            break;
          case 'moderate':
            analysis.mediumPriorityIssues++;
            break;
          case 'minor':
            analysis.lowPriorityIssues++;
            break;
        }
      });
      
      analysis.detailedBreakdown[categoryId] = {
        category: category,
        violations: categoryViolations,
        count: categoryViolations.length,
        severity: category.priority,
        affectedElements: categoryViolations.reduce((sum, v) => sum + v.nodes.length, 0)
      };
    }
  });
  
  // Empfehlungen basierend auf gefundenen Problemen generieren
  if (analysis.detailedBreakdown['images_media']?.count > 0) {
    analysis.recommendations.push('Ergänzen Sie fehlende Alt-Texte für Bilder und Medien');
  }
  if (analysis.detailedBreakdown['colors_contrast']?.count > 0) {
    analysis.recommendations.push('Verbessern Sie die Farbkontraste für bessere Lesbarkeit');
  }
  if (analysis.detailedBreakdown['forms_inputs']?.count > 0) {
    analysis.recommendations.push('Fügen Sie Labels und Beschreibungen für Formularfelder hinzu');
  }
  if (analysis.detailedBreakdown['structure_navigation']?.count > 0) {
    analysis.recommendations.push('Korrigieren Sie die Überschriftenstruktur und Navigation');
  }
  if (analysis.detailedBreakdown['keyboard_focus']?.count > 0) {
    analysis.recommendations.push('Stellen Sie vollständige Tastaturzugänglichkeit sicher');
  }
  
  return analysis;
}

/**
 * Cross-platform Browser-Erkennung für Puppeteer
 * Unterstützt automatische Erkennung für Linux-Server und Windows
 */
function getBrowserPaths(): string[] {
  const currentPlatform = platform();
  const paths: string[] = [];

  // Linux-Pfade (für Server-Umgebung)
  if (currentPlatform === 'linux') {
    paths.push(
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/snap/bin/chromium',
      '/opt/google/chrome/chrome',
      '/usr/local/bin/chromium',
      '/usr/local/bin/google-chrome'
    );
  }
  
  // Windows-Pfade
  else if (currentPlatform === 'win32') {
    paths.push(
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Users\\%USERNAME%\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Chromium\\Application\\chromium.exe',
      'C:\\Program Files (x86)\\Chromium\\Application\\chromium.exe'
    );
  }
  
  // macOS-Pfade
  else if (currentPlatform === 'darwin') {
    paths.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/usr/local/bin/chromium',
      '/opt/homebrew/bin/chromium'
    );
  }

  // Umgebungsvariable immer hinzufügen
  if (process.env.CHROME_PATH) {
    paths.unshift(process.env.CHROME_PATH);
  }
  
  if (process.env.CHROMIUM_PATH) {
    paths.unshift(process.env.CHROMIUM_PATH);
  }

  return paths;
}

/**
 * Finde verfügbaren Browser-Pfad
 */
function findAvailableBrowser(): string | undefined {
  const paths = getBrowserPaths();
  
  for (const path of paths) {
    try {
      // Expandiere Umgebungsvariablen in Windows-Pfaden
      const expandedPath = path.replace('%USERNAME%', process.env.USERNAME || '');
      
      if (existsSync(expandedPath)) {
        console.log(`✓ Browser gefunden: ${expandedPath}`);
        return expandedPath;
      }
    } catch (error) {
      // Pfad nicht verfügbar, weiter versuchen
      continue;
    }
  }
  
  console.log('⚠️ Kein System-Browser gefunden, verwende Puppeteer bundled Chromium');
  return undefined; // Fallback zu Puppeteer's bundled Chromium
}

/**
 * Erstelle optimierte Puppeteer-Konfiguration basierend auf Umgebung
 */
function createPuppeteerConfig(executablePath?: string) {
  const currentPlatform = platform();
  const isLinuxServer = currentPlatform === 'linux' && !process.env.DISPLAY;
  
  const baseArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--disable-gpu'
  ];

  // Linux-Server spezifische Args
  if (isLinuxServer) {
    baseArgs.push(
      '--no-zygote',
      '--single-process',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-plugins',
      '--mute-audio'
    );
  }

  const config = {
    headless: true,
    args: baseArgs,
    executablePath: executablePath || undefined,
    // Timeout-Konfiguration
    defaultViewport: { width: 1280, height: 800 },
    // Für Linux-Server: längere Timeouts
    timeout: isLinuxServer ? 60000 : 30000
  };

  return config;
}

export async function scanUrl(url: string, standard?: string): Promise<ScanResult> {
  let browser: Browser | null = null;
  
  try {
    console.log(`🔍 Starte Scan für: ${url}`);
    console.log(`🖥️ Platform: ${platform()}`);
    
    // Finde verfügbaren Browser
    const executablePath = findAvailableBrowser();
    
    // Erstelle Puppeteer-Konfiguration
    const puppeteerConfig = createPuppeteerConfig(executablePath);
    
    console.log(`🚀 Starte Browser...${executablePath ? ` (${executablePath})` : ' (bundled Chromium)'}`);
    
    // Versuche Browser zu starten mit verbessertem Error-Handling
    try {
      browser = await puppeteer.launch(puppeteerConfig);
      console.log('✓ Browser erfolgreich gestartet');
    } catch (launchError) {
      console.log(`⚠️ Browser-Start fehlgeschlagen: ${launchError}`);
      
      // Fallback: Versuche mit bundled Chromium
      if (executablePath) {
        console.log('🔄 Versuche Fallback zu bundled Chromium...');
        const fallbackConfig = createPuppeteerConfig();
        browser = await puppeteer.launch(fallbackConfig);
        console.log('✓ Fallback-Browser erfolgreich gestartet');
      } else {
        throw launchError;
      }
    }

    if (!browser) {
      throw new Error('Browser konnte nicht gestartet werden. Bitte installieren Sie Google Chrome oder Chromium.');
    }

    const page = await browser.newPage();
    
    // Set viewport size to desktop
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Inject axe-core from CDN
    await page.addScriptTag({
      url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.3/axe.min.js'
    });
    
    // Wait for axe to load
    await page.waitForFunction(() => typeof window.axe !== 'undefined', { timeout: 10000 });
    
    // Run axe analysis
    await page.evaluate(async (selectedStandard) => {
      window.axeResults = null;
      window.axeError = null;
      try {
        // Bestimme die axe-Tags basierend auf dem gewählten Standard
        let axeTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];
        
        if (selectedStandard === 'wcag21aa') {
          axeTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
        } else if (selectedStandard === 'wcag21aaa') {
          axeTags = ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag21aaa'];
        } else if (selectedStandard === 'wcag22aa') {
          axeTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];
        }
        // Für "alle" verwenden wir alle verfügbaren Tags
        
        const results = await window.axe.run(document, {
          resultTypes: ['violations', 'incomplete', 'passes', 'inapplicable'],
          runOnly: {
            type: 'tag',
            values: axeTags
          }
        });
        window.axeResults = results;
      } catch (e: any) {
        window.axeError = e instanceof Error ? e.toString() : 'Unbekannter Fehler';
      }
    }, standard || 'alle');
    
    // Wait for axe to complete
    await page.waitForFunction(() => {
      // @ts-ignore
      return window.axeResults !== null || window.axeError !== null;
    }, { timeout: 60000 });
    
    // Get the results
    const axeResults = await page.evaluate(() => {
      return {
        // @ts-ignore
        results: window.axeResults,
        // @ts-ignore
        error: window.axeError
      };
    });
    
    if (axeResults.error) {
      throw new Error(`Axe evaluation failed: ${axeResults.error}`);
    }
    
    const results = axeResults.results;
    
    // Additional custom checks
    const customChecks = await page.evaluate(() => {
      // Check for document language
      const hasLang = !!document.documentElement.lang;
      
      // Check for heading structure
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      const headingLevels = headings.map(h => parseInt(h.tagName.substring(1)));
      const hasProperHeadingStructure = headingLevels.length > 0 && 
                                       headingLevels.includes(1) && 
                                       headingLevels.every((level, i, arr) => 
                                         i === 0 || level <= arr[i-1] + 1);
      
      // Check for autoplay videos
      const videos = Array.from(document.querySelectorAll('video'));
      const hasAutoplayVideos = videos.some(video => video.hasAttribute('autoplay'));
      
      // Check for blink/marquee elements
      const hasBlinkElements = document.querySelectorAll('blink, marquee').length > 0;
      
      // Check for semantic HTML
      const hasSemanticElements = document.querySelectorAll('header, footer, nav, main, article, section, aside').length > 0;
      
      // Check for keyboard navigation
      const interactiveElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]');
      const hasKeyboardNavigation = interactiveElements.length > 0;
      
      return {
        documentLanguage: hasLang,
        headingStructure: hasProperHeadingStructure,
        autoplayVideos: !hasAutoplayVideos,
        blinkElements: !hasBlinkElements,
        semanticHtml: hasSemanticElements,
        keyboardNavigation: hasKeyboardNavigation
      };
    });
    
    // Calculate score and summary
    const violationCount = results.violations.length;
    const passCount = results.passes.length;
    const incompleteCount = results.incomplete.length;
    const inapplicableCount = results.inapplicable.length;
    
    const totalChecks = violationCount + passCount + incompleteCount;
    const score = Math.round((passCount / (totalChecks || 1)) * 100) / 100;
    
    // Count WCAG violations by level
    const wcagViolations = {
      a: results.violations.filter((v: any) => v.tags.includes('wcag2a') || v.tags.includes('wcag21a')).length,
      aa: results.violations.filter((v: any) => v.tags.includes('wcag2aa') || v.tags.includes('wcag21aa')).length,
      aaa: results.violations.filter((v: any) => v.tags.includes('wcag2aaa') || v.tags.includes('wcag21aaa')).length
    };
    
    // Count BITV violations (approximation based on WCAG AA)
    const bitvViolations = wcagViolations.a + wcagViolations.aa;
    
    // Technical checks
    const technicalChecks = {
      altTexts: !results.violations.some((v: any) => v.id === 'image-alt'),
      semanticHtml: customChecks.semanticHtml,
      keyboardNavigation: customChecks.keyboardNavigation && !results.violations.some((v: any) => v.id === 'keyboard-navigable'),
      focusVisible: !results.violations.some((v: any) => v.id === 'focus-visible'),
      colorContrast: !results.violations.some((v: any) => v.id === 'color-contrast'),
      ariaRoles: !results.violations.some((v: any) => v.id.includes('aria')),
      formLabels: !results.violations.some((v: any) => v.id === 'label'),
      autoplayVideos: customChecks.autoplayVideos,
      documentLanguage: customChecks.documentLanguage,
      blinkElements: customChecks.blinkElements,
      headingStructure: customChecks.headingStructure
    };
    
    // Verbesserte Analyse der Ergebnisse
    const detailedAnalysis = analyzeIssueDetails(results.violations);
    const categorizedViolations = categorizeViolations(results.violations);
    
    const scanResult: ScanResult = {
      url,
      timestamp: new Date().toISOString(),
      violations: results.violations,
      passes: results.passes,
      incomplete: results.incomplete,
      inapplicable: results.inapplicable,
      score,
      summary: {
        violations: violationCount,
        passes: passCount,
        incomplete: incompleteCount,
        inapplicable: inapplicableCount
      },
      wcagViolations,
      bitvViolations,
      technicalChecks,
      // Neue detaillierte Analyse hinzufügen
      detailedAnalysis,
      categorizedViolations,
      errorCategories: ERROR_CATEGORIES
    };
    
    // Save to database - Improved version with proper error handling
    try {
      console.log('Attempting to save scan to database...');
      
      // Note: Die Scan-Speicherung wird jetzt über die neue Scan-API gehandhabt
      // Diese Funktion wird hauptsächlich für direkte Scans ohne API verwendet
      // oder als Fallback für bestehende Scans
      
    } catch (error) {
      console.error('Failed to save scan to database:', error);
      // Scan-Ergebnis trotzdem zurückgeben, auch wenn Speichern fehlschlägt
    }
    
    return scanResult;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Neue Funktion für komplette Scan-Ausführung mit Datenbank-Integration
export async function executeScanWithDatabase(
  scanId: string,
  url: string,
  standard?: string
): Promise<void> {
  try {
    console.log(`Starting scan execution for ID: ${scanId}, URL: ${url}`);

    // Scan-Status auf RUNNING setzen
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'RUNNING',
        startedAt: new Date()
      }
    });

    // Scan durchführen
    const scanResult = await scanUrl(url, standard);

    // Scan-Ergebnisse in Datenbank speichern
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        results: scanResult as any,
        score: scanResult.score,
        violations: scanResult.summary.violations,
        warnings: scanResult.summary.incomplete,
        passes: scanResult.summary.passes,
        incomplete: scanResult.summary.incomplete
      }
    });

    // Issues in separate Tabelle speichern
    if (scanResult.violations && scanResult.violations.length > 0) {
      for (const violation of scanResult.violations) {
        try {
          // Vereinfachte Issue-Speicherung
          // TODO: In Produktion sollten Standards und Rules referenziert werden
          await prisma.issue.create({
            data: {
              type: 'VIOLATION',
              selector: violation.target ? violation.target.join(', ') : null,
              html: violation.html || null,
              message: violation.description || violation.help,
              impact: getImpactScore(violation.impact),
              scanId: scanId,
              // Temporärer Workaround für Rule-Referenz
              ruleId: 'temp-rule-id', // TODO: Echte Rule-IDs implementieren
              status: 'OPEN'
            }
          });
        } catch (issueError) {
          console.error('Fehler beim Speichern einer Issue:', issueError);
          // Weiter mit nächster Issue
        }
      }
    }

    console.log(`Scan ${scanId} erfolgreich abgeschlossen`);

  } catch (error) {
    console.error(`Fehler beim Ausführen des Scans ${scanId}:`, error);

    // Scan-Status auf FAILED setzen
    try {
      await prisma.scan.update({
        where: { id: scanId },
        data: {
          status: 'FAILED',
          completedAt: new Date()
        }
      });
    } catch (updateError) {
      console.error('Fehler beim Aktualisieren des Scan-Status:', updateError);
    }

    throw error;
  }
}

// Hilfsfunktion für Impact-Score-Konvertierung
function getImpactScore(impact: string): number {
  switch (impact?.toLowerCase()) {
    case 'critical': return 1.0;
    case 'serious': return 0.8;
    case 'moderate': return 0.6;
    case 'minor': return 0.4;
    default: return 0.5;
  }
}

// Verbesserte Scan-API Integration
export async function scanWithApi(
  url: string,
  options: {
    userId?: string,
    websiteId?: string,
    standard?: string
  } = {}
): Promise<{ scanId: string, status: string }> {
  try {
    console.log('Starting API-based scan for:', url);

    // Erstelle einen Scan-Eintrag in der Datenbank
    const response = await fetch('/api/scans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        url,
        websiteId: options.websiteId,
        standard: options.standard
      })
    });

    if (!response.ok) {
      throw new Error(`API-Fehler: ${response.status}`);
    }

    const data = await response.json();
    const scanId = data.scan.id;

    // Scan im Hintergrund ausführen
    // In Produktion würde dies über eine Queue laufen
    setTimeout(async () => {
      try {
        await executeScanWithDatabase(scanId, url, options.standard);
      } catch (error) {
        console.error('Background scan failed:', error);
      }
    }, 100);

    return {
      scanId,
      status: 'RUNNING'
    };

  } catch (error) {
    console.error('Fehler beim API-basierten Scan:', error);
    throw error;
  }
}
