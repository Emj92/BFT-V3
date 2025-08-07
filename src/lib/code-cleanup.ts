import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface CleanupStats {
  filesProcessed: number;
  consoleStatementsRemoved: number;
  todosFound: number;
  duplicatesFound: number;
}

// Debug-Ausgaben bereinigen
export function cleanupDebugStatements(projectPath: string): CleanupStats {
  const stats: CleanupStats = {
    filesProcessed: 0,
    consoleStatementsRemoved: 0,
    todosFound: 0,
    duplicatesFound: 0
  };

  function processDirectory(dirPath: string) {
    const items = readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = join(dirPath, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        processDirectory(fullPath);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx')) {
        processFile(fullPath);
      }
    }
  }

  function processFile(filePath: string) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      let newContent = content;
      let changes = 0;

      // Entferne console.log/warn Statements (behalte console.error in catch-Blöcken)
      const lines = content.split('\n');
      const newLines: string[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        // Prüfe auf console-Statements
        if (trimmedLine.match(/^\s*console\.(log|warn)\s*\(/)) {
          // Entferne console.log und console.warn
          changes++;
          stats.consoleStatementsRemoved++;
          continue; // Überspringe diese Zeile
        } else if (trimmedLine.match(/^\s*console\.error\s*\(/)) {
          // Prüfe ob console.error in catch-Block ist
          let inCatchBlock = false;
          for (let j = Math.max(0, i - 10); j < i; j++) {
            if (lines[j] && lines[j].includes('catch')) {
              inCatchBlock = true;
              break;
            }
          }
          if (!inCatchBlock) {
            // Entferne console.error außerhalb von catch-Blöcken
            changes++;
            stats.consoleStatementsRemoved++;
            continue;
          }
        }
        
        newLines.push(line);
      }

      // Zähle TODOs
      const todoMatches = content.match(/\/\/\s*TODO|\/\/\s*FIXME|\/\/\s*HACK|\/\/\s*XXX/gi);
      if (todoMatches) {
        stats.todosFound += todoMatches.length;
      }

      // Schreibe Datei nur wenn Änderungen vorgenommen wurden
      if (changes > 0) {
        newContent = newLines.join('\n');
        writeFileSync(filePath, newContent, 'utf-8');
      }

      stats.filesProcessed++;
    } catch (error) {
      console.error(`❌ Fehler beim Verarbeiten von ${filePath}:`, error);
    }
  }

  processDirectory(projectPath);
  return stats;
}

// Code-Duplikate finden
export function findCodeDuplicates(projectPath: string): string[] {
  const duplicates: string[] = [];
  const codeBlocks = new Map<string, string[]>();

  function processDirectory(dirPath: string) {
    const items = readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = join(dirPath, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        processDirectory(fullPath);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        analyzeFile(fullPath);
      }
    }
  }

  function analyzeFile(filePath: string) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      // Suche nach Funktionen und größeren Code-Blöcken
      for (let i = 0; i < lines.length - 8; i++) {
        const block = lines.slice(i, i + 8).join('\n').trim();
        if (block.length > 100 && 
            !block.includes('//') && 
            !block.includes('console.') &&
            !block.includes('import ') &&
            !block.includes('export ')) {
          
          const normalizedBlock = block.replace(/\s+/g, ' ').trim();
          if (codeBlocks.has(normalizedBlock)) {
            codeBlocks.get(normalizedBlock)!.push(`${filePath}:${i + 1}`);
          } else {
            codeBlocks.set(normalizedBlock, [`${filePath}:${i + 1}`]);
          }
        }
      }
    } catch (error) {
      console.error(`Fehler beim Analysieren von ${filePath}:`, error);
    }
  }

  processDirectory(projectPath);

  // Finde Duplikate
  for (const [block, locations] of codeBlocks.entries()) {
    if (locations.length > 1) {
      duplicates.push(`Duplikat gefunden in: ${locations.join(', ')}\n${block.substring(0, 150)}...`);
    }
  }

  return duplicates;
}

// Performance-Optimierungen für Produktion
export function optimizeForProduction() {
  // Deaktiviere console.log in Produktion
  if (process.env.NODE_ENV === 'production') {
    console.log = () => {};
    console.warn = () => {};
  }
}

// Caching-System für Scanner-Ergebnisse
const SCAN_CACHE = new Map<string, any>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten

export function getCachedScanResult(url: string): any | null {
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

export function cacheScanResult(url: string, result: any) {
  SCAN_CACHE.set(url, {
    result,
    timestamp: Date.now()
  });
}

// Bereinige Cache regelmäßig
export function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of SCAN_CACHE.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      SCAN_CACHE.delete(key);
    }
  }
}
