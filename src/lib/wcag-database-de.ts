// Deutsche WCAG-Fehler-Bibliothek mit vollständigen Übersetzungen und Lösungsvorschlägen
// BFSG-konforme Terminologie für deutsche Kunden

export interface WCAGError {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'critical' | 'serious' | 'moderate' | 'minor';
  level: 'A' | 'AA' | 'AAA';
  wcagCriterion: string;
  bfsgReference: string;
  impact: string;
  solutions: string[];
  technicalDetails: string;
  wcagCoachUrl: string;
}

export const wcagErrorsDE: Record<string, WCAGError> = {
  'color-contrast': {
    id: 'color-contrast',
    title: 'Unzureichender Farbkontrast',
    description: 'Der Kontrast zwischen Text und Hintergrund erfüllt nicht die BFSG-Mindestanforderungen für barrierefreie Darstellung.',
    category: 'Farben und Kontraste',
    priority: 'serious',
    level: 'AA',
    wcagCriterion: 'WCAG 2.1 Kriterium 1.4.3',
    bfsgReference: 'BFSG Anlage 1, Nr. 1.4.3',
    impact: 'Menschen mit Sehbehinderungen können Inhalte nicht oder nur schwer erkennen.',
    solutions: [
      'Erhöhen Sie den Kontrast zwischen Text und Hintergrund auf mindestens 4,5:1 für normalen Text',
      'Verwenden Sie einen Kontrast von mindestens 3:1 für große Texte (18pt+ oder 14pt+ fett)',
      'Nutzen Sie den WCAG Coach Colour Contrast Analyser zur präzisen Messung',
      'Testen Sie Ihre Farbkombinationen mit Online-Tools wie WebAIM Contrast Checker',
      'Vermeiden Sie reine Farbkodierung - nutzen Sie zusätzliche Kennzeichnungen wie Symbole oder Unterstreichungen'
    ],
    technicalDetails: 'CSS-Eigenschaften: color, background-color, border-color',
    wcagCoachUrl: 'https://www.wcag.com/designers/1-4-3-contrast-minimum/'
  },

  'image-alt': {
    id: 'image-alt',
    title: 'Fehlende Alternativtexte für Bilder',
    description: 'Bilder haben keine aussagekräftigen alt-Attribute, die den Inhalt für Screenreader beschreiben.',
    category: 'Bilder und Medien',
    priority: 'critical',
    level: 'A',
    wcagCriterion: 'WCAG 2.1 Kriterium 1.1.1',
    bfsgReference: 'BFSG Anlage 1, Nr. 1.1.1',
    impact: 'Blinde und sehbehinderte Nutzer erhalten keine Informationen über Bildinhalte.',
    solutions: [
      'Fügen Sie aussagekräftige alt-Attribute zu allen informativen Bildern hinzu',
      'Verwenden Sie alt="" für rein dekorative Bilder (leeres alt-Attribut)',
      'Beschreiben Sie den Zweck und Inhalt des Bildes, nicht nur das Aussehen',
      'Nutzen Sie den WCAG Coach Image Alt Text Decision Tree',
      'Bei komplexen Grafiken: Verwenden Sie zusätzlich longdesc oder aria-describedby',
      'Testen Sie mit Screenreadern wie NVDA oder JAWS'
    ],
    technicalDetails: 'HTML: <img src="bild.jpg" alt="Beschreibender Text">',
    wcagCoachUrl: 'https://www.wcag.com/designers/1-1-1-non-text-content/'
  },

  'form-label': {
    id: 'form-label',
    title: 'Fehlende oder unzureichende Formularbeschriftungen',
    description: 'Formularfelder haben keine eindeutigen Labels oder Beschriftungen für Screenreader.',
    category: 'Formulare und Eingaben',
    priority: 'critical',
    level: 'A',
    wcagCriterion: 'WCAG 2.1 Kriterium 1.3.1, 4.1.2',
    bfsgReference: 'BFSG Anlage 1, Nr. 1.3.1, 4.1.2',
    impact: 'Nutzer mit Screenreadern können Formularfelder nicht identifizieren oder ausfüllen.',
    solutions: [
      'Verwenden Sie <label for="id">-Elemente für jedes Eingabefeld',
      'Nutzen Sie aria-label oder aria-labelledby für komplexe Formulare',
      'Gruppieren Sie verwandte Felder mit <fieldset> und <legend>',
      'Befolgen Sie die WCAG Coach Formular-Richtlinien',
      'Stellen Sie Fehlermeldungen programmatisch zugänglich bereit',
      'Testen Sie die Formular-Navigation nur mit der Tastatur'
    ],
    technicalDetails: 'HTML: <label for="email">E-Mail-Adresse</label><input type="email" id="email">',
    wcagCoachUrl: 'https://www.wcag.com/designers/1-3-1-info-and-relationships/'
  },

  'heading-order': {
    id: 'heading-order',
    title: 'Fehlerhafte Überschriftenhierarchie',
    description: 'Überschriften folgen nicht der logischen Reihenfolge (h1, h2, h3, etc.) oder Ebenen werden übersprungen.',
    category: 'Struktur und Navigation',
    priority: 'moderate',
    level: 'AA',
    wcagCriterion: 'WCAG 2.1 Kriterium 1.3.1',
    bfsgReference: 'BFSG Anlage 1, Nr. 1.3.1',
    impact: 'Screenreader-Nutzer können die Seitenstruktur nicht verstehen und effizient navigieren.',
    solutions: [
      'Beginnen Sie jede Seite mit genau einer h1-Überschrift',
      'Folgen Sie der logischen Hierarchie: h1 → h2 → h3 (keine Ebenen überspringen)',
      'Verwenden Sie Überschriften für Struktur, nicht für Styling',
      'Nutzen Sie CSS für das visuelle Erscheinungsbild der Überschriften',
      'Folgen Sie den WCAG Coach Überschriften-Richtlinien',
      'Testen Sie die Navigation mit Screenreader-Überschriften-Modi'
    ],
    technicalDetails: 'HTML: <h1>Haupttitel</h1> <h2>Untertitel</h2> <h3>Abschnitt</h3>',
    wcagCoachUrl: 'https://www.wcag.com/designers/1-3-1-info-and-relationships/'
  },

  'link-name': {
    id: 'link-name',
    title: 'Unklare oder fehlende Link-Beschreibungen',
    description: 'Links haben keine aussagekräftigen Texte oder Beschreibungen für den Linkzweck.',
    category: 'Navigation und Links',
    priority: 'serious',
    level: 'A',
    wcagCriterion: 'WCAG 2.1 Kriterium 2.4.4',
    bfsgReference: 'BFSG Anlage 1, Nr. 2.4.4',
    impact: 'Nutzer können nicht verstehen, wohin Links führen oder was sie bewirken.',
    solutions: [
      'Verwenden Sie aussagekräftige Linktexte (nicht "hier klicken" oder "mehr")',
      'Beschreiben Sie das Linkziel oder die Aktion eindeutig',
      'Nutzen Sie aria-label für zusätzliche Kontext-Informationen',
      'Bei Bild-Links: Stellen Sie alt-Text oder aria-label bereit',
      'Befolgen Sie die WCAG Coach Link-Richtlinien',
      'Testen Sie Links in der Screenreader-Linkliste'
    ],
    technicalDetails: 'HTML: <a href="/kontakt">Kontaktformular öffnen</a> (statt "hier")',
    wcagCoachUrl: 'https://www.wcag.com/designers/2-4-4-link-purpose-in-context/'
  },

  'keyboard-trap': {
    id: 'keyboard-trap',
    title: 'Tastaturfalle (Keyboard Trap)',
    description: 'Nutzer können mit der Tastatur in bestimmte Bereiche gelangen, aber nicht wieder heraus.',
    category: 'Tastaturzugänglichkeit',
    priority: 'critical',
    level: 'A',
    wcagCriterion: 'WCAG 2.1 Kriterium 2.1.2',
    bfsgReference: 'BFSG Anlage 1, Nr. 2.1.2',
    impact: 'Tastaturnutzer können die Website nicht vollständig bedienen oder "gefangen" werden.',
    solutions: [
      'Stellen Sie sicher, dass alle fokussierbaren Elemente auch wieder verlassen werden können',
      'Implementieren Sie Escape-Funktionalität für Modals und Overlays',
      'Verwenden Sie Focus Management bei dynamischen Inhalten',
      'Folgen Sie den WCAG Coach Tastatur-Richtlinien',
      'Testen Sie die komplette Website nur mit der Tastatur (Tab, Shift+Tab, Enter, Escape)',
      'Implementieren Sie sichtbare Fokus-Indikatoren'
    ],
    technicalDetails: 'JavaScript: focus(), blur(), tabindex, aria-hidden',
    wcagCoachUrl: 'https://www.wcag.com/designers/2-1-2-no-keyboard-trap/'
  },

  'focus-visible': {
    id: 'focus-visible',
    title: 'Fehlende oder unzureichende Fokus-Indikatoren',
    description: 'Fokussierte Elemente sind nicht oder nicht ausreichend sichtbar hervorgehoben.',
    category: 'Tastaturzugänglichkeit',
    priority: 'serious',
    level: 'AA',
    wcagCriterion: 'WCAG 2.1 Kriterium 2.4.7',
    bfsgReference: 'BFSG Anlage 1, Nr. 2.4.7',
    impact: 'Tastaturnutzer können nicht erkennen, welches Element aktuell fokussiert ist.',
    solutions: [
      'Entfernen Sie niemals den Standard-Fokusindikator ohne Ersatz',
      'Verwenden Sie deutlich sichtbare Fokus-Stile (Kontrast mindestens 3:1)',
      'Implementieren Sie :focus und :focus-visible CSS-Regeln',
      'Nutzen Sie outline oder box-shadow für Fokus-Indikatoren',
      'Befolgen Sie die WCAG Coach Fokus-Richtlinien',
      'Testen Sie alle interaktiven Elemente mit Tab-Navigation'
    ],
    technicalDetails: 'CSS: :focus { outline: 2px solid #005fcc; } :focus-visible { ... }',
    wcagCoachUrl: 'https://www.wcag.com/designers/2-4-7-focus-visible/'
  },

  'aria-roles': {
    id: 'aria-roles',
    title: 'Fehlende oder falsche ARIA-Rollen',
    description: 'Interaktive Elemente haben keine oder falsche ARIA-Rollen und -Eigenschaften.',
    category: 'ARIA und Semantik',
    priority: 'moderate',
    level: 'AA',
    wcagCriterion: 'WCAG 2.1 Kriterium 4.1.2',
    bfsgReference: 'BFSG Anlage 1, Nr. 4.1.2',
    impact: 'Screenreader können die Funktion von Elementen nicht korrekt vermitteln.',
    solutions: [
      'Verwenden Sie semantische HTML-Elemente wann immer möglich',
      'Nutzen Sie ARIA-Rollen nur wenn nötig (button, tabpanel, etc.)',
      'Implementieren Sie aria-expanded, aria-selected, aria-checked korrekt',
      'Verwenden Sie aria-live für dynamische Inhaltsänderungen',
      'Befolgen Sie die WCAG Coach ARIA-Richtlinien',
      'Testen Sie mit verschiedenen Screenreadern (NVDA, JAWS, VoiceOver)'
    ],
    technicalDetails: 'HTML: <div role="button" tabindex="0" aria-pressed="false">',
    wcagCoachUrl: 'https://www.wcag.com/designers/4-1-2-name-role-value/'
  },

  'page-title': {
    id: 'page-title',
    title: 'Fehlender oder unzureichender Seitentitel',
    description: 'Die Seite hat keinen oder einen nicht beschreibenden <title>-Tag.',
    category: 'Seitenstruktur',
    priority: 'moderate',
    level: 'A',
    wcagCriterion: 'WCAG 2.1 Kriterium 2.4.2',
    bfsgReference: 'BFSG Anlage 1, Nr. 2.4.2',
    impact: 'Nutzer können Seiten nicht eindeutig identifizieren oder unterscheiden.',
    solutions: [
      'Geben Sie jeder Seite einen eindeutigen, beschreibenden Titel',
      'Verwenden Sie das Format: "Seitenname - Website-Name"',
      'Halten Sie Titel prägnant aber informativ (unter 60 Zeichen)',
      'Aktualisieren Sie Titel bei dynamischen Inhaltsänderungen',
      'Befolgen Sie die WCAG Coach Titel-Richtlinien',
      'Testen Sie Titel in Browser-Tabs und Screenreader-Ausgabe'
    ],
    technicalDetails: 'HTML: <title>Kontakt - Meine Firma GmbH</title>',
    wcagCoachUrl: 'https://www.wcag.com/designers/2-4-2-page-titled/'
  },

  'language': {
    id: 'language',
    title: 'Fehlende Sprachauszeichnung',
    description: 'Die Seite oder Textabschnitte haben keine oder falsche Sprachauszeichnung.',
    category: 'Seitenstruktur',
    priority: 'moderate',
    level: 'A',
    wcagCriterion: 'WCAG 2.1 Kriterium 3.1.1, 3.1.2',
    bfsgReference: 'BFSG Anlage 1, Nr. 3.1.1, 3.1.2',
    impact: 'Screenreader können Inhalte nicht in der korrekten Sprache vorlesen.',
    solutions: [
      'Setzen Sie das lang-Attribut im <html>-Element: <html lang="de">',
      'Markieren Sie fremdsprachige Textabschnitte mit lang-Attribut',
      'Verwenden Sie korrekte ISO-Sprachcodes (de, en, fr, etc.)',
      'Aktualisieren Sie Sprachattribute bei dynamischen Änderungen',
      'Befolgen Sie die WCAG Coach Sprach-Richtlinien',
      'Testen Sie mit Screenreadern in verschiedenen Spracheinstellungen'
    ],
    technicalDetails: 'HTML: <html lang="de"> <span lang="en">English text</span>',
    wcagCoachUrl: 'https://www.wcag.com/designers/3-1-1-language-of-page/'
  },

  'listitem': {
    id: 'listitem',
    title: 'Falsche Listen-Struktur',
    description: 'Listenelemente werden nicht korrekt als semantische Listen strukturiert.',
    category: 'Struktur und Navigation',
    priority: 'moderate',
    level: 'A',
    wcagCriterion: 'WCAG 2.1 Kriterium 1.3.1',
    bfsgReference: 'BFSG Anlage 1, Nr. 1.3.1',
    impact: 'Screenreader können Listen nicht als zusammengehörige Elemente erkennen.',
    solutions: [
      'Verwenden Sie <ul> für ungeordnete Listen und <ol> für geordnete Listen',
      'Alle <li>-Elemente müssen innerhalb von <ul> oder <ol> stehen',
      'Nutzen Sie <dl>, <dt>, <dd> für Definitionslisten',
      'Vermeiden Sie Listen nur für Styling-Zwecke',
      'Befolgen Sie die WCAG Coach Listen-Richtlinien',
      'Testen Sie Listen-Navigation mit Screenreadern'
    ],
    technicalDetails: 'HTML: <ul><li>Punkt 1</li><li>Punkt 2</li></ul>',
    wcagCoachUrl: 'https://www.wcag.com/designers/1-3-1-info-and-relationships/'
  },

  'region': {
    id: 'region',
    title: 'Fehlende Landmark-Bereiche',
    description: 'Die Seite hat keine oder unzureichende Landmark-Bereiche für die Navigation.',
    category: 'Struktur und Navigation',
    priority: 'moderate',
    level: 'AA',
    wcagCriterion: 'WCAG 2.1 Kriterium 1.3.1',
    bfsgReference: 'BFSG Anlage 1, Nr. 1.3.1',
    impact: 'Screenreader-Nutzer können nicht effizient zwischen Seitenbereichen navigieren.',
    solutions: [
      'Verwenden Sie <main> für den Hauptinhalt jeder Seite',
      'Nutzen Sie <nav> für Navigationsbereiche',
      'Implementieren Sie <aside> für Seitenleisten',
      'Verwenden Sie role="banner" für Header und role="contentinfo" für Footer',
      'Befolgen Sie die WCAG Coach Landmark-Richtlinien',
      'Testen Sie Landmark-Navigation mit Screenreadern'
    ],
    technicalDetails: 'HTML: <main>, <nav>, <aside>, <header>, <footer>',
    wcagCoachUrl: 'https://www.wcag.com/designers/1-3-1-info-and-relationships/'
  }
};

// Funktion zum Abrufen eines Fehlers nach ID
export function getWCAGError(id: string): WCAGError | null {
  return wcagErrorsDE[id] || null;
}

// Funktion zum Abrufen aller Fehler einer Kategorie
export function getWCAGErrorsByCategory(category: string): WCAGError[] {
  return Object.values(wcagErrorsDE).filter(error => error.category === category);
}

// Funktion zum Abrufen aller Fehler nach Priorität
export function getWCAGErrorsByPriority(priority: string): WCAGError[] {
  return Object.values(wcagErrorsDE).filter(error => error.priority === priority);
}

// Bewertungsfunktion für Barrierefreiheits-Score
export function getAccessibilityRating(score: number): {
  rating: string;
  description: string;
  color: string;
} {
  if (score >= 90) {
    return {
      rating: 'Sehr gut',
      description: 'Hervorragende BFSG-Konformität',
      color: 'text-green-600'
    };
  } else if (score >= 75) {
    return {
      rating: 'Gut',
      description: 'Gute BFSG-Konformität',
      color: 'text-green-500'
    };
  } else if (score >= 60) {
    return {
      rating: 'Mittel',
      description: 'Verbesserungsbedarf',
      color: 'text-yellow-600'
    };
  } else if (score >= 40) {
    return {
      rating: 'Schlecht',
      description: 'Erhebliche Mängel',
      color: 'text-orange-600'
    };
  } else {
    return {
      rating: 'Kritisch',
      description: 'Dringende Überarbeitung erforderlich',
      color: 'text-red-600'
    };
  }
}

// Deutsche Übersetzungen für positive Tests
export const positiveTestsDE: Record<string, string> = {
  'Images have alternative text': 'Bilder haben Alternativtexte',
  'Form elements have labels': 'Formularelemente haben Beschriftungen',
  'Headings are structured properly': 'Überschriften sind korrekt strukturiert',
  'Links have descriptive text': 'Links haben beschreibenden Text',
  'Page has a title': 'Seite hat einen Titel',
  'Page has a language attribute': 'Seite hat eine Sprachauszeichnung',
  'Color contrast is sufficient': 'Farbkontrast ist ausreichend',
  'Keyboard navigation works': 'Tastaturnavigation funktioniert',
  'Focus indicators are visible': 'Fokus-Indikatoren sind sichtbar',
  'ARIA roles are used correctly': 'ARIA-Rollen werden korrekt verwendet',
  'Lists are properly structured': 'Listen sind korrekt strukturiert',
  'Tables have headers': 'Tabellen haben Überschriften',
  'Content is organized with landmarks': 'Inhalte sind mit Landmarks organisiert'
};

// Funktion zum Übersetzen positiver Tests
export function translatePositiveTest(englishText: string): string {
  return positiveTestsDE[englishText] || englishText;
}