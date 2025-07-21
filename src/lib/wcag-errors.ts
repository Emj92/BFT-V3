// WCAG Fehlerbibliothek mit internen Fehlercodes

export interface WCAGError {
  code: string;
  title: string;
  description: string;
  level: 'A' | 'AA' | 'AAA';
  guideline: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  solution: string;
  examples: string[];
  resources: string[];
  solutions?: string[]; // Mehrere Lösungsansätze
  links?: { title: string; url: string }[]; // Strukturierte Links
}

export const wcagErrors: Record<string, WCAGError> = {
  // Wahrnehmbar (Perceivable)
  'WE001': {
    code: 'WE001',
    title: 'Fehlender Alt-Text für Bilder',
    description: 'Bilder ohne alternative Textbeschreibung sind für Screenreader nicht zugänglich und verstoßen gegen WCAG 1.1.1.',
    level: 'A',
    guideline: '1.1.1 Nicht-Text-Inhalte',
    impact: 'high',
    solution: 'Fügen Sie aussagekräftige alt-Attribute zu allen Bildern hinzu. Dekorative Bilder sollten alt="" haben.',
    solutions: [
      'Fügen Sie beschreibende alt-Attribute zu informationellen Bildern hinzu',
      'Verwenden Sie alt="" für rein dekorative Bilder',
      'Nutzen Sie aria-label bei komplexen Bildern',
      'Stellen Sie Langbeschreibungen für komplexe Grafiken bereit'
    ],
    examples: [
      '<img src="logo.png" alt="Firmenlogo von [Ihr Firmenname]">',
      '<img src="decoration.png" alt="" role="presentation">',
      '<img src="chart.png" alt="Verkaufszahlen Q4 2024" longdesc="chart-description.html">'
    ],
    resources: [
      'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
      'https://webaim.org/articles/alt/'
    ],
    links: [
      { title: 'WCAG 1.1.1 Verstehen', url: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html' },
      { title: 'Alt-Text Guide', url: 'https://webaim.org/articles/alt/' }
    ]
  },
  'WE002': {
    code: 'WE002',
    title: 'Unzureichender Farbkontrast',
    description: 'Der Kontrast zwischen Text und Hintergrund ist zu gering und erschwert das Lesen für Menschen mit Sehbehinderungen.',
    level: 'AA',
    guideline: '1.4.3 Kontrast (Minimum)',
    impact: 'high',
    solution: 'Verwenden Sie ein Kontrastverhältnis von mindestens 4.5:1 für normalen Text und 3:1 für großen Text.',
    solutions: [
      'Erhöhen Sie den Kontrast zwischen Text und Hintergrund',
      'Verwenden Sie dunklere Textfarben auf hellen Hintergründen',
      'Testen Sie Farbkombinationen mit Kontrast-Tools',
      'Implementieren Sie einen Hochkontrast-Modus'
    ],
    examples: [
      'Normaler Text: #000000 auf #FFFFFF (21:1)',
      'Großer Text: #666666 auf #FFFFFF (3.1:1)',
      'Fehlerhaft: #999999 auf #FFFFFF (2.8:1 - zu wenig)'
    ],
    resources: [
      'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html',
      'https://webaim.org/resources/contrastchecker/'
    ]
  },
  'WE003': {
    code: 'WE003',
    title: 'Fehlende Untertitel für Videos',
    description: 'Videos ohne Untertitel sind für gehörlose und schwerhörige Nutzer nicht zugänglich.',
    level: 'A',
    guideline: '1.2.2 Untertitel (aufgezeichnet)',
    impact: 'critical',
    solution: 'Stellen Sie Untertitel für alle aufgezeichneten Videos bereit.',
    solutions: [
      'Erstellen Sie WebVTT-Untertiteldateien',
      'Verwenden Sie automatische Untertitel als Ausgangspunkt',
      'Bieten Sie mehrsprachige Untertitel an',
      'Kennzeichnen Sie Geräusche und Musik in Untertiteln'
    ],
    examples: [
      '<video><track kind="captions" src="captions.vtt" srclang="de" label="Deutsch"></video>',
      '<video><track kind="subtitles" src="subtitles-en.vtt" srclang="en" label="English"></video>'
    ],
    resources: [
      'https://www.w3.org/WAI/WCAG21/Understanding/captions-prerecorded.html'
    ]
  },

  // Bedienbar (Operable)
  'WE004': {
    code: 'WE004',
    title: 'Nicht über Tastatur erreichbar',
    description: 'Interaktive Elemente sind nicht über die Tastatur bedienbar, was Nutzer ohne Maus ausschließt.',
    level: 'A',
    guideline: '2.1.1 Tastatur',
    impact: 'critical',
    solution: 'Stellen Sie sicher, dass alle interaktiven Elemente über Tab, Enter und Pfeiltasten bedienbar sind.',
    solutions: [
      'Implementieren Sie korrekte tabindex-Werte',
      'Erstellen Sie Keyboard-Event-Handler',
      'Verwenden Sie semantische HTML-Elemente',
      'Testen Sie die Navigation mit Tab-Taste'
    ],
    examples: [
      '<button tabindex="0">Klickbarer Button</button>',
      '<div role="button" tabindex="0" onKeyDown={handleKeyDown}>Custom Button</div>',
      '<a href="#content" class="skip-link">Zum Inhalt springen</a>'
    ],
    resources: [
      'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html'
    ]
  },
  'WE005': {
    code: 'WE005',
    title: 'Fehlende Fokus-Indikatoren',
    description: 'Fokussierte Elemente sind visuell nicht erkennbar, was die Tastaturnavigation erschwert.',
    level: 'AA',
    guideline: '2.4.7 Fokus sichtbar',
    impact: 'medium',
    solution: 'Implementieren Sie deutliche visuelle Fokus-Indikatoren für alle interaktiven Elemente.',
    solutions: [
      'Verwenden Sie deutliche Outline-Styles',
      'Implementieren Sie farbige Fokus-Rahmen',
      'Nutzen Sie Box-Shadow für bessere Sichtbarkeit',
      'Testen Sie Fokus-Indikatoren in verschiedenen Themes'
    ],
    examples: [
      'button:focus { outline: 2px solid #0066cc; outline-offset: 2px; }',
      'a:focus { box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.5); }',
      '.focus-visible { border: 2px solid #005fcc; }'
    ],
    resources: [
      'https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html'
    ]
  },
  'WE006': {
    code: 'WE006',
    title: 'Automatisch abspielende Inhalte',
    description: 'Medien spielen automatisch ab ohne Kontrolle für den Nutzer, was störend und problematisch ist.',
    level: 'A',
    guideline: '2.2.2 Pausieren, Stoppen, Ausblenden',
    impact: 'medium',
    solution: 'Bieten Sie Kontrollen zum Pausieren, Stoppen oder Ausblenden von automatisch abspielenden Inhalten.',
    solutions: [
      'Deaktivieren Sie Autoplay für Videos',
      'Implementieren Sie Play/Pause-Buttons',
      'Bieten Sie Stummschaltung an',
      'Verwenden Sie preload="none" für bessere Kontrolle'
    ],
    examples: [
      '<video controls muted>',
      '<audio controls preload="none">',
      '<video autoplay muted loop playsinline><!-- Nur für stumme Hintergrundvideos --></video>'
    ],
    resources: [
      'https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide.html'
    ]
  },

  // Weitere wichtige Fehler
  'WE012': {
    code: 'WE012',
    title: 'Fehlende Überschriftenstruktur',
    description: 'Überschriften folgen nicht der logischen Hierarchie (h1, h2, h3), was die Navigation erschwert.',
    level: 'AA',
    guideline: '2.4.6 Überschriften und Beschriftungen',
    impact: 'medium',
    solution: 'Verwenden Sie Überschriften in der korrekten hierarchischen Reihenfolge ohne Ebenen zu überspringen.',
    solutions: [
      'Beginnen Sie mit h1 für den Haupttitel',
      'Verwenden Sie h2 für Hauptabschnitte',
      'Nutzen Sie h3, h4, etc. für Unterabschnitte',
      'Überspringen Sie keine Überschriftenebenen'
    ],
    examples: [
      '<h1>Haupttitel der Seite</h1>',
      '<h2>Wichtiger Abschnitt</h2>',
      '<h3>Unterabschnitt</h3>',
      '<!-- Falsch: h1 gefolgt von h3 ohne h2 -->'
    ],
    resources: [
      'https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels.html'
    ]
  },
  'WE013': {
    code: 'WE013',
    title: 'Unklare Link-Texte',
    description: 'Links mit Texten wie "hier klicken" oder "mehr" sind nicht aussagekräftig.',
    level: 'A',
    guideline: '2.4.4 Linkzweck (im Kontext)',
    impact: 'medium',
    solution: 'Verwenden Sie beschreibende Link-Texte, die den Zweck des Links klar kommunizieren.',
    solutions: [
      'Beschreiben Sie das Linkziel im Link-Text',
      'Vermeiden Sie generische Texte wie "hier" oder "mehr"',
      'Nutzen Sie aria-label für zusätzliche Beschreibungen',
      'Stellen Sie Kontext durch umgebenden Text bereit'
    ],
    examples: [
      '<a href="/produkte">Unsere Produktübersicht</a>',
      '<a href="/kontakt" aria-label="Kontaktformular öffnen">Kontakt</a>',
      '<!-- Schlecht: <a href="/info">Hier klicken</a> -->'
    ],
    resources: [
      'https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html'
    ]
  },
  'WE014': {
    code: 'WE014',
    title: 'Fehlende Skip-Links',
    description: 'Keine Möglichkeit, wiederkehrende Navigationselemente zu überspringen.',
    level: 'A',
    guideline: '2.4.1 Blöcke umgehen',
    impact: 'medium',
    solution: 'Implementieren Sie Skip-Links, um direkt zum Hauptinhalt zu springen.',
    solutions: [
      'Fügen Sie einen "Zum Inhalt springen" Link hinzu',
      'Positionieren Sie Skip-Links am Seitenanfang',
      'Machen Sie Skip-Links bei Fokus sichtbar',
      'Verlinken Sie zu logischen Seitenabschnitten'
    ],
    examples: [
      '<a href="#main-content" class="skip-link">Zum Hauptinhalt springen</a>',
      '<a href="#navigation" class="skip-link">Zur Navigation springen</a>',
      '<main id="main-content">...</main>'
    ],
    resources: [
      'https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html'
    ]
  },
  'WE015': {
    code: 'WE015',
    title: 'Fehlende Landmarks',
    description: 'Keine semantischen Landmark-Rollen zur Strukturierung der Seite.',
    level: 'AA',
    guideline: '2.4.1 Blöcke umgehen',
    impact: 'medium',
    solution: 'Verwenden Sie HTML5-Semantik und ARIA-Landmarks für bessere Navigation.',
    solutions: [
      'Nutzen Sie main, nav, header, footer Elemente',
      'Verwenden Sie role="banner", role="navigation", etc.',
      'Kennzeichnen Sie Inhaltsbereiche mit section',
      'Implementieren Sie role="search" für Suchbereiche'
    ],
    examples: [
      '<header role="banner">...</header>',
      '<nav role="navigation" aria-label="Hauptnavigation">...</nav>',
      '<main role="main">...</main>',
      '<footer role="contentinfo">...</footer>'
    ],
    resources: [
      'https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/'
    ]
  },

  // Verständlich (Understandable)
  'WE007': {
    code: 'WE007',
    title: 'Fehlende Sprachkennzeichnung',
    description: 'Die Sprache der Seite oder von Textabschnitten ist nicht definiert.',
    level: 'A',
    guideline: '3.1.1 Sprache der Seite',
    impact: 'medium',
    solution: 'Definieren Sie die Hauptsprache der Seite und kennzeichnen Sie fremdsprachige Textabschnitte.',
    solutions: [
      'Setzen Sie das lang-Attribut im html-Element',
      'Kennzeichnen Sie fremdsprachige Textpassagen',
      'Verwenden Sie korrekte Sprachcodes (ISO 639-1)',
      'Aktualisieren Sie das lang-Attribut bei Sprachwechseln'
    ],
    examples: [
      '<html lang="de">',
      '<span lang="en">Hello World</span>',
      '<blockquote lang="fr">Bonjour le monde</blockquote>',
      '<p>Der englische Ausdruck <span lang="en">"accessibility"</span> bedeutet Barrierefreiheit.</p>'
    ],
    resources: [
      'https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html'
    ]
  },
  'WE008': {
    code: 'WE008',
    title: 'Unklare Fehlermeldungen',
    description: 'Fehlermeldungen in Formularen sind nicht aussagekräftig oder nicht mit den Feldern verknüpft.',
    level: 'A',
    guideline: '3.3.1 Fehleridentifikation',
    impact: 'high',
    solution: 'Verwenden Sie klare, spezifische Fehlermeldungen und verknüpfen Sie diese mit den entsprechenden Formularfeldern.',
    solutions: [
      'Verwenden Sie aria-describedby für Fehlermeldungen',
      'Positionieren Sie Fehler in der Nähe der Felder',
      'Nutzen Sie spezifische, hilfreiche Texte',
      'Implementieren Sie Live-Validierung mit aria-live'
    ],
    examples: [
      '<input aria-describedby="email-error" aria-invalid="true" required>',
      '<div id="email-error" role="alert">Bitte geben Sie eine gültige E-Mail-Adresse ein (z.B. name@domain.de).</div>',
      '<div aria-live="polite" aria-atomic="true">Formular wurde erfolgreich gesendet.</div>'
    ],
    resources: [
      'https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html'
    ]
  },
  'WE009': {
    code: 'WE009',
    title: 'Fehlende Labels für Formularfelder',
    description: 'Formularfelder haben keine oder unzureichende Beschriftungen.',
    level: 'A',
    guideline: '3.3.2 Beschriftungen oder Anweisungen',
    impact: 'high',
    solution: 'Stellen Sie für alle Formularfelder aussagekräftige Labels bereit.',
    solutions: [
      'Verwenden Sie label-Elemente mit for-Attribut',
      'Nutzen Sie aria-label für Felder ohne sichtbare Labels',
      'Implementieren Sie aria-labelledby für komplexe Labels',
      'Kennzeichnen Sie Pflichtfelder deutlich'
    ],
    examples: [
      '<label for="email">E-Mail-Adresse *</label><input id="email" type="email" required>',
      '<input aria-label="Suchbegriff eingeben" type="search">',
      '<fieldset><legend>Persönliche Angaben</legend>...</fieldset>'
    ],
    resources: [
      'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html'
    ]
  },

  // Robust (Robust)
  'WE010': {
    code: 'WE010',
    title: 'Ungültiger HTML-Code',
    description: 'Der HTML-Code enthält Syntaxfehler oder ungültige Strukturen.',
    level: 'A',
    guideline: '4.1.1 Parsing',
    impact: 'medium',
    solution: 'Validieren Sie Ihren HTML-Code und beheben Sie alle Syntaxfehler.',
    solutions: [
      'Verwenden Sie einen HTML-Validator',
      'Schließen Sie alle HTML-Tags korrekt',
      'Vermeiden Sie doppelte IDs',
      'Nutzen Sie korrekte HTML5-Syntax'
    ],
    examples: [
      'Korrekt: <div><p>Text</p></div>',
      'Falsch: <div><p>Text</div></p>',
      '<!-- Eindeutige IDs: -->',
      '<div id="unique-id-1">...</div>'
    ],
    resources: [
      'https://www.w3.org/WAI/WCAG21/Understanding/parsing.html',
      'https://validator.w3.org/'
    ]
  },
  'WE011': {
    code: 'WE011',
    title: 'Fehlende ARIA-Labels',
    description: 'Interaktive Elemente haben keine zugänglichen Namen oder Beschreibungen.',
    level: 'A',
    guideline: '4.1.2 Name, Rolle, Wert',
    impact: 'high',
    solution: 'Verwenden Sie ARIA-Labels, um interaktiven Elementen zugängliche Namen zu geben.',
    solutions: [
      'Implementieren Sie aria-label für Icon-Buttons',
      'Verwenden Sie aria-describedby für zusätzliche Informationen',
      'Nutzen Sie aria-labelledby für komplexe Labels',
      'Setzen Sie role-Attribute für Custom Elements'
    ],
    examples: [
      '<button aria-label="Menü öffnen"><span>☰</span></button>',
      '<input aria-describedby="help-text" placeholder="Suchen...">',
      '<div id="help-text">Geben Sie mindestens 3 Zeichen ein</div>',
      '<div role="button" tabindex="0" aria-label="Schließen">×</div>'
    ],
    resources: [
      'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html'
    ]
  },
  'WE016': {
    code: 'WE016',
    title: 'Fehlende Bildbeschreibungen',
    description: 'Bilder haben keine aussagekräftigen Bildbeschreibungen.',
    level: 'A',
    guideline: '1.1.1 Nicht-Text-Inhalte',
    impact: 'medium',
    solution: 'Fügen Sie aussagekräftige Bildbeschreibungen zu allen Bildern hinzu.',
    examples: [
      '<img src="logo.png" alt="Firmenlogo von [Ihr Firmenname]">',
      '<img src="decoration.png" alt="" role="presentation">'
    ],
    resources: [
      'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html'
    ]
  }
};

// Hilfsfunktionen
export function getErrorByCode(code: string): WCAGError | undefined {
  return wcagErrors[code];
}

export function searchErrors(query: string): WCAGError[] {
  const searchTerm = query.toLowerCase();
  return Object.values(wcagErrors).filter(error => 
    error.title.toLowerCase().includes(searchTerm) ||
    error.description.toLowerCase().includes(searchTerm) ||
    error.code.toLowerCase().includes(searchTerm) ||
    error.guideline.toLowerCase().includes(searchTerm)
  );
}

export function getErrorsByLevel(level: 'A' | 'AA' | 'AAA'): WCAGError[] {
  return Object.values(wcagErrors).filter(error => error.level === level);
}

export function getErrorsByImpact(impact: 'low' | 'medium' | 'high' | 'critical'): WCAGError[] {
  return Object.values(wcagErrors).filter(error => error.impact === impact);
}
