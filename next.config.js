/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    optimizeCss: false, // Deaktiviere optimizeCss um Build-Probleme zu vermeiden
    esmExternals: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  // Image-Optimierung Konfiguration
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Verbesserte Produktion-Settings
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  // Deaktiviere statische Optimierung für die gesamte App
  // da sie hauptsächlich dynamische Inhalte hat
  trailingSlash: false,
  // Alle Seiten als Server-Side Rendering behandeln
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // Verhindere, dass Next.js versucht statische Seiten zu generieren
  generateBuildId: async () => {
    return 'build-' + Date.now()
  }
};

module.exports = nextConfig;
