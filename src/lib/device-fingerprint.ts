// Device Fingerprinting für kostenlose Scan-Limits
// Verhindert Umgehung durch private Fenster/Inkognito-Modus

export interface DeviceFingerprint {
  canvas: string;
  webgl: string;
  audio: string;
  screen: string;
  timezone: string;
  language: string;
  platform: string;
  hardwareConcurrency: number;
  deviceMemory?: number;
  userAgent: string;
}

export function generateDeviceFingerprint(): Promise<string> {
  return new Promise((resolve) => {
    const fingerprint: Partial<DeviceFingerprint> = {};

    // Canvas Fingerprint
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('BF24 Device Check 🔒', 2, 2);
      fingerprint.canvas = canvas.toDataURL();
    }

    // WebGL Fingerprint
    const webglCanvas = document.createElement('canvas');
    const gl = webglCanvas.getContext('webgl') || webglCanvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      fingerprint.webgl = debugInfo ? 
        gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) + '|' + 
        gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 
        'no-webgl-debug';
    }

    // Audio Fingerprint
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(analyser);
      analyser.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 1000;
      gainNode.gain.value = 0;
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      
      fingerprint.audio = Array.from(dataArray.slice(0, 10)).join(',');
      audioContext.close();
    } catch (e) {
      fingerprint.audio = 'audio-unavailable';
    }

    // System Information
    fingerprint.screen = `${screen.width}x${screen.height}x${screen.colorDepth}`;
    fingerprint.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    fingerprint.language = navigator.language;
    fingerprint.platform = navigator.platform;
    fingerprint.hardwareConcurrency = navigator.hardwareConcurrency || 0;
    fingerprint.deviceMemory = (navigator as any).deviceMemory || 0;
    fingerprint.userAgent = navigator.userAgent;

    // Kombiniere alle Werte zu einem Hash
    const combinedString = Object.values(fingerprint).join('|');
    
    // Einfacher Hash (für Produktion sollte crypto.subtle.digest verwendet werden)
    let hash = 0;
    for (let i = 0; i < combinedString.length; i++) {
      const char = combinedString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32-bit integer
    }

    resolve('fp_' + Math.abs(hash).toString(36));
  });
}

export function storeScanCount(fingerprint: string, count: number): void {
  const today = new Date().toDateString();
  const data = {
    fingerprint,
    date: today,
    count,
    timestamp: Date.now()
  };
  
  localStorage.setItem('bf24_scan_limit', JSON.stringify(data));
}

export function getScanCount(fingerprint: string): number {
  try {
    const stored = localStorage.getItem('bf24_scan_limit');
    if (!stored) return 0;
    
    const data = JSON.parse(stored);
    const today = new Date().toDateString();
    
    // Prüfe ob gleicher Tag und gleicher Fingerprint
    if (data.date === today && data.fingerprint === fingerprint) {
      return data.count || 0;
    }
    
    return 0;
  } catch (e) {
    return 0;
  }
}

export function incrementScanCount(fingerprint: string): number {
  const currentCount = getScanCount(fingerprint);
  const newCount = currentCount + 1;
  storeScanCount(fingerprint, newCount);
  return newCount;
}

export function canScan(fingerprint: string, limit: number = 3): boolean {
  return getScanCount(fingerprint) < limit;
}
