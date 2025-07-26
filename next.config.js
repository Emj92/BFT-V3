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
