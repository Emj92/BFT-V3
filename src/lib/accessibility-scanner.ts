import puppeteer, { Browser, Page } from 'puppeteer'; // puppeteer Import hinzugefügt
import { readFileSync } from 'fs';
import { join } from 'path';
import { existsSync } from 'fs';
import { platform } from 'os';
import prisma from './prisma';

// Performance-Optimierungen
const SCAN_CACHE = new Map<string, { result: ScanResult; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten Cache

// Cache-Clearing Funktion
export function clearScanCache() {
  SCAN_CACHE.clear();

}

// Browser-Pool für bessere Performance
let browserPool: Browser[] = [];
const MAX_BROWSERS = 3;

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
    // Erweiterte Checks basierend auf externen Tools
    landmarkStructure: boolean;
    skipLinks: boolean;
    focusOrder: boolean;
    altTextQuality: boolean;
    formValidation: boolean;
    keyboardTraps: boolean;
    textSpacing: boolean;
    colorContrastEnhanced: boolean;
    linkPurpose: boolean;
    headingNesting: boolean;
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
        return expandedPath;
      }
    } catch (error) {
      // Pfad nicht verfügbar, weiter versuchen
      continue;
    }
  }
  
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

// Cache-Funktionen
export function getCachedScanResult(url: string): ScanResult | null {
  const cached = SCAN_CACHE.get(url);
  if (cached) {
    const age = Date.now() - cached.timestamp;
    if (age < CACHE_DURATION) {
      return cached.result;
    } else {
      SCAN_CACHE.delete(url);
    }
  }
  return null;
}

export function cacheScanResult(url: string, result: ScanResult) {
  SCAN_CACHE.set(url, {
    result,
    timestamp: Date.now()
  });
  
  // Cleanup alter Cache-Einträge
  const now = Date.now();
  for (const [key, value] of SCAN_CACHE.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      SCAN_CACHE.delete(key);
    }
  }
}

// Browser-Pool Management
async function getBrowserFromPool(): Promise<Browser> {
  if (browserPool.length > 0) {
    const browser = browserPool.pop()!;
    try {
      // Teste ob Browser noch funktioniert
      await browser.version();
      return browser;
    } catch {
      // Browser ist nicht mehr verwendbar, erstelle neuen
    }
  }
  
  // Erstelle neuen Browser
    const executablePath = findAvailableBrowser();
    const puppeteerConfig = createPuppeteerConfig(executablePath);
  return await puppeteer.launch(puppeteerConfig);
}

async function returnBrowserToPool(browser: Browser) {
  if (browserPool.length < MAX_BROWSERS) {
    browserPool.push(browser);
      } else {
    await browser.close();
  }
}

export async function scanUrl(url: string, standard?: string, useCache: boolean = true): Promise<ScanResult> {
  // Prüfe Cache zuerst
  if (useCache) {
    const cachedResult = getCachedScanResult(url);
    if (cachedResult) {
      return cachedResult;
    }
  }
  
  let browser: Browser | null = null;
  
  try {
    // Verwende Browser-Pool für bessere Performance
    browser = await getBrowserFromPool();

    const page = await browser.newPage();
    
    // Set viewport size to desktop
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Inject axe-core from CDN
    // Stabile axe-core Version verwenden
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
        // Erweiterte axe-Tags für vollständige Abdeckung wie externe Tools
        let axeTags = [
          'wcag2a', 'wcag2aa', 'wcag2aaa', 
          'wcag21a', 'wcag21aa', 'wcag21aaa',
          'wcag22a', 'wcag22aa', 'wcag22aaa',
          'best-practice', 'experimental', 'ACT'
        ];
        
        if (selectedStandard === 'wcag21aa') {
          axeTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];
        } else if (selectedStandard === 'wcag21aaa') {
          axeTags = ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag21aaa', 'best-practice'];
        } else if (selectedStandard === 'wcag22aa') {
          axeTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa', 'best-practice'];
        }
        
        // VOLLSTÄNDIGE axe-Konfiguration - ALLE REGELN wie externe Scanner
        const results = await window.axe.run(document, {
          resultTypes: ['violations', 'incomplete', 'passes', 'inapplicable']
          // KEINE Einschränkung - ALLE verfügbaren Regeln testen!
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
      console.error('Axe evaluation error:', axeResults.error);
      throw new Error(`Axe evaluation failed: ${axeResults.error}`);
    }
    
    if (!axeResults.results) {
      throw new Error('Keine Scan-Ergebnisse von axe-core erhalten');
    }
    
    const results = axeResults.results;
    
    // KRITISCH: Behandle "incomplete" Ergebnisse als Violations (wie externe Scanner)
    const criticalIncompletes = results.incomplete.filter((item: any) => 
      item.impact === 'serious' || item.impact === 'critical' ||
      item.id === 'duplicate-id-aria' ||
      item.id === 'link-in-text-block' ||
      item.id === 'region' ||
      item.id === 'landmark-unique' ||
      item.id === 'heading-order' ||
      item.id === 'link-name'
    );
    
    // Füge kritische "incomplete" als Violations hinzu
    results.violations = [...results.violations, ...criticalIncompletes];
    
    // ZUSÄTZLICHE CUSTOM VIOLATIONS für fehlende axe-Regeln
    const customViolations = await page.evaluate(() => {
      const violations = [];
      
      // 1. Prüfe ob alle Inhalte in Landmarks sind (region rule)
      const allContent = document.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6, img, a, button, input, form, section, article');
      let contentOutsideLandmarks = 0;
      
      allContent.forEach(element => {
        const landmarkParent = element.closest('main, header, nav, footer, aside, [role="main"], [role="banner"], [role="navigation"], [role="contentinfo"], [role="complementary"], [role="search"]');
        if (!landmarkParent && element.offsetParent !== null) {
          contentOutsideLandmarks++;
        }
      });
      
      if (contentOutsideLandmarks > 5) { // Mehr als 5 Elemente außerhalb von Landmarks
        violations.push({
          id: 'region-custom',
          impact: 'moderate',
          tags: ['wcag2a', 'wcag131'],
          description: 'Ensures all page content is contained by landmarks',
          help: 'All page content should be contained by landmarks',
          nodes: [{ impact: 'moderate', message: `${contentOutsideLandmarks} elements are not within landmark regions` }]
        });
      }
      
      // 2. Prüfe Landmark-Eindeutigkeit
      const navElements = document.querySelectorAll('nav, [role="navigation"]');
      if (navElements.length > 1) {
        const hasUniqueLabels = Array.from(navElements).every(el => 
          el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')
        );
        if (!hasUniqueLabels) {
          violations.push({
            id: 'landmark-unique-custom',
            impact: 'moderate',
            tags: ['wcag2a'],
            description: 'Landmarks should have a unique role or role/label/title combination',
            help: 'Ensure landmarks are unique',
            nodes: [{ impact: 'moderate', message: 'Multiple navigation landmarks without unique labels' }]
          });
        }
      }
      
      // 3. Prüfe Heading-Reihenfolge
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      const headingLevels = headings.map(h => parseInt(h.tagName.substring(1)));
      let hasSkippedLevel = false;
      
      for (let i = 1; i < headingLevels.length; i++) {
        if (headingLevels[i] > headingLevels[i-1] + 1) {
          hasSkippedLevel = true;
          break;
        }
      }
      
      if (hasSkippedLevel) {
        violations.push({
          id: 'heading-order-custom',
          impact: 'moderate',
          tags: ['wcag2a', 'wcag131'],
          description: 'Ensures the order of headings is semantically correct',
          help: 'Heading levels should only increase by one',
          nodes: [{ impact: 'moderate', message: 'Heading level skips detected' }]
        });
      }
      
      // 4. Prüfe Link-Text Qualität
      const links = document.querySelectorAll('a[href]');
      let badLinkCount = 0;
      
      links.forEach(link => {
        const text = (link.textContent || '').trim();
        const ariaLabel = link.getAttribute('aria-label') || '';
        const title = link.getAttribute('title') || '';
        
        const emptyLink = !text && !ariaLabel && !title;
        const vagueTexts = ['hier', 'more', 'click', 'read more', 'weiterlesen', 'link'];
        const hasVagueText = vagueTexts.some(vague => text.toLowerCase().includes(vague.toLowerCase()));
        
        if (emptyLink || hasVagueText || (text.length < 3 && !ariaLabel && !title)) {
          badLinkCount++;
        }
      });
      
      if (badLinkCount > 0) {
        violations.push({
          id: 'link-name-custom',
          impact: 'serious',
          tags: ['wcag2a', 'wcag244'],
          description: 'Ensures links have discernible text',
          help: 'Links must have discernible text',
          nodes: [{ impact: 'serious', message: `${badLinkCount} links with poor or missing text` }]
        });
      }
      
      return violations;
    });
    
    // Füge Custom Violations hinzu
    results.violations = [...results.violations, ...customViolations];
    
    // Erweiterte Custom Checks basierend auf externen Accessibility-Tools
    const customChecks = await page.evaluate(() => {
      const results = {
        documentLanguage: false,
        headingStructure: false,
        autoplayVideos: false,
        blinkElements: false,
        semanticHtml: false,
        keyboardNavigation: false,
        // Neue erweiterte Checks
        landmarkStructure: false,
        skipLinks: false,
        focusOrder: false,
        altTextQuality: false,
        formValidation: false,
        keyboardTraps: false,
        textSpacing: false,
        colorContrastEnhanced: false,
        linkPurpose: false,
        headingNesting: false
      };

      // 1. Dokumentsprache prüfen
      results.documentLanguage = !!document.documentElement.lang;
      
      // 2. Erweiterte Überschriften-Struktur (wie externes Tool)
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      const headingLevels = headings.map(h => parseInt(h.tagName.substring(1)));
      results.headingStructure = headingLevels.length > 0 && headingLevels.includes(1);
      
      // 3. Überschriften-Verschachtelung prüfen (WCAG 2.4.10)
      let properNesting = true;
      for (let i = 1; i < headingLevels.length; i++) {
        if (headingLevels[i] > headingLevels[i-1] + 1) {
          properNesting = false;
          break;
        }
      }
      results.headingNesting = properNesting;
      
      // 4. AGGRESSIVE Landmark-Struktur prüfen (EXAKT wie accessibilitychecker.org)
      const landmarks = {
        main: document.querySelectorAll('main, [role="main"]').length,
        banner: document.querySelectorAll('header, [role="banner"]').length,
        navigation: document.querySelectorAll('nav, [role="navigation"]').length,
        contentinfo: document.querySelectorAll('footer, [role="contentinfo"]').length
      };
      
      // Prüfe ob ALLE Inhalte in Landmarks sind (wie externes Tool)
      const allContent = document.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6, img, a, button, input, form');
      let contentInLandmarks = 0;
      
      allContent.forEach(element => {
        const landmarkParent = element.closest('main, header, nav, footer, aside, [role="main"], [role="banner"], [role="navigation"], [role="contentinfo"], [role="complementary"], [role="search"]');
        if (landmarkParent) contentInLandmarks++;
      });
      
      // STRENGE Landmark-Prüfung
      const landmarkCoverage = allContent.length > 0 ? (contentInLandmarks / allContent.length) : 1;
      results.landmarkStructure = landmarks.main === 1 && landmarks.banner >= 1 && landmarkCoverage >= 0.8;
      
      // 5. Skip-Links prüfen
      const skipLinks = Array.from(document.querySelectorAll('a[href^="#"]'));
      let validSkipLinks = 0;
      skipLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href !== '#') {
          const target = document.querySelector(href);
          if (target) validSkipLinks++;
        }
      });
      results.skipLinks = skipLinks.length === 0 || validSkipLinks > 0;
      
      // 6. Fokusreihenfolge prüfen
      const focusableElements = document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      let focusOrderValid = true;
      let highestTabIndex = 0;
      focusableElements.forEach(element => {
        const tabIndex = parseInt(element.getAttribute('tabindex') || '0');
        if (tabIndex > 0) {
          if (tabIndex < highestTabIndex) focusOrderValid = false;
          highestTabIndex = Math.max(highestTabIndex, tabIndex);
        }
      });
      results.focusOrder = focusOrderValid;
      
      // 7. Alt-Text Qualität prüfen (nicht nur Existenz)
      const images = document.querySelectorAll('img');
      let qualityAltTexts = 0;
      images.forEach(img => {
        const alt = img.getAttribute('alt');
        if (alt !== null) {
          // Prüfe auf sinnvolle Alt-Texte
          if (alt.length > 3 && !alt.toLowerCase().includes('image') && 
              !alt.toLowerCase().includes('picture') && !alt.toLowerCase().includes('photo')) {
            qualityAltTexts++;
          }
        }
      });
      results.altTextQuality = images.length === 0 || (qualityAltTexts / images.length) > 0.7;
      
      // 8. Formular-Validierung erweitert
      const forms = document.querySelectorAll('form');
      let formValidationScore = 0;
      forms.forEach(form => {
        const inputs = form.querySelectorAll('input, select, textarea');
        let validInputs = 0;
        inputs.forEach(input => {
          const hasLabel = form.querySelector(`label[for="${input.id}"]`) || 
                          input.closest('label') ||
                          input.getAttribute('aria-label') ||
                          input.getAttribute('aria-labelledby') ||
                          input.getAttribute('title');
          if (hasLabel) validInputs++;
        });
        if (inputs.length === 0 || validInputs === inputs.length) formValidationScore++;
      });
      results.formValidation = forms.length === 0 || formValidationScore === forms.length;
      
      // 9. Keyboard-Traps erkennen
      const modals = document.querySelectorAll('[role="dialog"], [role="alertdialog"], .modal, .popup');
      let hasKeyboardTraps = false;
      modals.forEach(modal => {
        const style = window.getComputedStyle(modal);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          const focusableInModal = modal.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
          if (focusableInModal.length === 0) hasKeyboardTraps = true;
        }
      });
      results.keyboardTraps = !hasKeyboardTraps;
      
      // 10. Text-Spacing prüfen (WCAG 2.1.4.12)
      const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
      let textSpacingIssues = 0;
      textElements.forEach(element => {
        const style = window.getComputedStyle(element);
        const lineHeight = parseFloat(style.lineHeight);
        const fontSize = parseFloat(style.fontSize);
        if (lineHeight > 0 && fontSize > 0 && lineHeight / fontSize < 1.5) {
          textSpacingIssues++;
        }
      });
      results.textSpacing = textSpacingIssues < textElements.length * 0.1;
      
      // 11. Erweiterte Farbkontrast-Heuristik
      let contrastIssues = 0;
      const coloredElements = document.querySelectorAll('*');
      Array.from(coloredElements).slice(0, 100).forEach(element => {
        const style = window.getComputedStyle(element);
        const color = style.color;
        const backgroundColor = style.backgroundColor;
        if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
          // Sehr vereinfachte Kontrastprüfung
          if (color === backgroundColor) contrastIssues++;
        }
      });
      results.colorContrastEnhanced = contrastIssues === 0;
      
      // 12. AGGRESSIVE Link-Purpose prüfen (EXAKT wie externes Tool)
      const links = document.querySelectorAll('a[href]');
      let linkErrors = [];
      
      links.forEach(link => {
        const text = (link.textContent || '').trim();
        const ariaLabel = link.getAttribute('aria-label') || '';
        const title = link.getAttribute('title') || '';
        
        // SEHR STRENGE Prüfung wie externes Tool
        const emptyLink = !text && !ariaLabel && !title;
        const vagueTexts = ['hier', 'more', 'click', 'read more', 'weiterlesen', 'link', 'hier klicken', 'klick hier', 'weiter', 'next', 'previous', 'zurück'];
        const hasVagueText = vagueTexts.some(vague => text.toLowerCase().includes(vague.toLowerCase()));
        const tooShort = text.length < 3 && !ariaLabel && !title;
        
        if (emptyLink || hasVagueText || tooShort) {
          linkErrors.push(link);
        }
      });
      
      // Ein einziger schlechter Link = Fehler (wie externes Tool)
      results.linkPurpose = linkErrors.length === 0;
      
      // 13. Link-Farbunterscheidung prüfen (WCAG 1.4.1)
      let linkColorIssues = 0;
      links.forEach(link => {
        const style = window.getComputedStyle(link);
        const parentStyle = window.getComputedStyle(link.parentElement || document.body);
        
        const linkColor = style.color;
        const parentColor = parentStyle.color;
        const linkDecoration = style.textDecoration;
        
        // Prüfe ob Link sich von umgebendem Text unterscheidet
        if (linkColor === parentColor && !linkDecoration.includes('underline')) {
          linkColorIssues++;
        }
      });
      
      // Erweitere linkPurpose um Farbunterscheidung
      results.linkPurpose = results.linkPurpose && linkColorIssues === 0;
      
      // Bestehende Checks
      results.autoplayVideos = !document.querySelectorAll('video[autoplay]').length;
      results.blinkElements = !document.querySelectorAll('blink, marquee').length;
      results.semanticHtml = document.querySelectorAll('header, footer, nav, main, article, section, aside').length > 0;
      results.keyboardNavigation = focusableElements.length > 0;
      
      return results;
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
    
    // Erweiterte Technical Checks
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
      headingStructure: customChecks.headingStructure,
      // Neue erweiterte Checks
      landmarkStructure: customChecks.landmarkStructure,
      skipLinks: customChecks.skipLinks,
      focusOrder: customChecks.focusOrder,
      altTextQuality: customChecks.altTextQuality,
      formValidation: customChecks.formValidation,
      keyboardTraps: customChecks.keyboardTraps,
      textSpacing: customChecks.textSpacing,
      colorContrastEnhanced: customChecks.colorContrastEnhanced,
      linkPurpose: customChecks.linkPurpose,
      headingNesting: customChecks.headingNesting
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
      
      // Note: Die Scan-Speicherung wird jetzt über die neue Scan-API gehandhabt
      // Diese Funktion wird hauptsächlich für direkte Scans ohne API verwendet
      // oder als Fallback für bestehende Scans
      
    } catch (error) {
      console.error('Failed to save scan to database:', error);
      // Scan-Ergebnis trotzdem zurückgeben, auch wenn Speichern fehlschlägt
    }
    
    // Cache das Ergebnis
    if (useCache) {
      cacheScanResult(url, scanResult);
    }
    
    return scanResult;
  } finally {
    if (browser) {
      await returnBrowserToPool(browser);
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
          // Speichere Issue mit korrekten Rule-IDs
          await prisma.issue.create({
            data: {
              type: 'VIOLATION',
              selector: violation.target ? violation.target.join(', ') : null,
              html: violation.html || null,
              message: violation.description || violation.help,
              impact: getImpactScore(violation.impact),
              scanId: scanId,
              ruleId: violation.id || 'unknown-rule', // Verwende echte axe Rule-ID
              status: 'OPEN'
            }
          });
        } catch (issueError) {
          console.error('Fehler beim Speichern einer Issue:', issueError);
          // Weiter mit nächster Issue
        }
      }
    }

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
