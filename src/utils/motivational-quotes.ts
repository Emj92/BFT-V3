/**
 * Utility für Motivationssprüche nach erfolgreichen Scans
 */

const motivationalQuotes = [
  "🌟 Jeder Klick zählt - du machst das Web für alle zugänglich!",
  "🚀 Barrieren überwinden, eine Website nach der anderen!",
  "💪 Du baust Brücken im digitalen Raum - weiter so!",
  "✨ Deine Arbeit öffnet Türen für Menschen mit Behinderungen!",
  "🎯 Perfektion ist das Ziel, Fortschritt der Weg - großartig gemacht!",
  "🔥 Du verwandelst Hindernisse in Möglichkeiten!",
  "🌈 Inklusion beginnt mit einem Scan - du machst den Unterschied!",
  "⚡ Jede behobene Barriere ist ein Sieg für die Zugänglichkeit!",
  "🏆 Du bist ein Held der digitalen Barrierefreiheit!",
  "💡 Deine Vision einer barrierefreien Welt wird Realität!",
  
  "🎖️ Erfolg ist die Summe kleiner Anstrengungen - wie dieser Scan!",
  "🔥 Du brennst für Qualität - das sieht man!",
  "⭐ Exzellenz ist kein Zufall, sondern das Ergebnis deiner Arbeit!",
  "💎 Jeder Scan macht deine Website wertvoller!",
  "🚀 Der beste Weg, die Zukunft vorherzusagen, ist sie zu gestalten!",
  "⚡ Du setzt Maßstäbe in der digitalen Welt!",
  "🎯 Ziele erreicht man Schritt für Schritt - wie du es gerade tust!",
  "🏅 Qualität ist dein Markenzeichen!",
  "💪 Hartnäckigkeit führt zum Erfolg - du beweist es!",
  "✨ Du machst das Unmögliche möglich!",
  
  "🔧 Jeder Bug weniger macht das Web ein bisschen besser!",
  "💻 Code mit Herz - für eine bessere User Experience!",
  "🛠️ Du optimierst nicht nur Code, sondern Leben!",
  "⚙️ Deine technische Expertise macht den Unterschied!",
  "🔍 Details sind wichtig - du hast den Blick dafür!",
  "📱 Responsive Design trifft auf verantwortlichen Entwickler!",
  "🌐 Du baust das Internet von morgen - heute!",
  "💯 Performance und Accessibility - du meisterst beides!",
  "🎨 Schönes Design trifft auf smarte Funktionalität!",
  "⚡ Schnell, schön, barrierefrei - die perfekte Kombination!",
  
  "🎉 Du investierst in deine Website - und in dich selbst!",
  "🌟 Jeder Scan bringt dich näher zur perfekten Website!",
  "🏆 Du gehörst zu den Besten - dieser Scan beweist es!",
  "💼 Professionalität zeigt sich in solchen Details!",
  "🎯 Deine Hingabe zur Qualität ist beeindruckend!",
  "🔥 Du setzt neue Standards in deiner Branche!",
  "💡 Innovation beginnt mit Menschen wie dir!",
  "⭐ Du machst deine Konkurrenz nervös - zu Recht!",
  "🚀 Dein Engagement für Exzellenz zahlt sich aus!",
  "💎 Du verwandelst Visionen in digitale Realität!",
  
  "☕ Koffein + Code + Barrierefreiheit = Dein Erfolgsrezept!",
  "🎪 Du jonglierst mit HTML, CSS und WCAG wie ein Profi!",
  "🦸 Mit großer Website kommt große Verantwortung - du meisterst sie!",
  "🎲 Du würfelst nicht - du planst für Barrierefreiheit!",
  "🍕 Pizza schmeckt besser nach einem erfolgreichen Scan!",
  "🎵 Dein Code singt das Lied der Accessibility!",
  "🏃 Du läufst der Konkurrenz mit deiner Barrierefreiheit davon!",
  "🎭 Performance und Accessibility - du spielst beide Rollen perfekt!",
  "🔮 Du siehst Probleme, bevor sie entstehen - magisch!",
  "🎨 Picasso malte, du codest - beide erschaffen Kunst!"
];

/**
 * Gibt einen zufälligen Motivationsspruch zurück
 */
export function getRandomMotivationalQuote(): string {
  const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
  return motivationalQuotes[randomIndex];
}

/**
 * Gibt einen Motivationsspruch basierend auf dem Scan-Score zurück
 */
export function getScoreBasedMotivationalQuote(score: number): string {
  // Für sehr gute Scores (90%+) - Erfolgs- und Qualitätssprüche
  if (score >= 90) {
    const highScoreQuotes = motivationalQuotes.filter(quote => 
      quote.includes('🏆') || quote.includes('⭐') || quote.includes('💎') || 
      quote.includes('🎖️') || quote.includes('🏅') || quote.includes('🎯')
    );
    return highScoreQuotes[Math.floor(Math.random() * highScoreQuotes.length)];
  }
  
  // Für gute Scores (70-89%) - Motivations- und Fortschrittssprüche
  if (score >= 70) {
    const goodScoreQuotes = motivationalQuotes.filter(quote => 
      quote.includes('🚀') || quote.includes('💪') || quote.includes('🔥') || 
      quote.includes('⚡') || quote.includes('💡') || quote.includes('🌟')
    );
    return goodScoreQuotes[Math.floor(Math.random() * goodScoreQuotes.length)];
  }
  
  // Für niedrigere Scores - Ermutigung und Verbesserungssprüche
  const improvementQuotes = motivationalQuotes.filter(quote => 
    quote.includes('🛠️') || quote.includes('🔧') || quote.includes('🔍') || 
    quote.includes('💻') || quote.includes('🌈') || quote.includes('✨')
  );
  return improvementQuotes[Math.floor(Math.random() * improvementQuotes.length)];
}