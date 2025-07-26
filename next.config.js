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
  // Exclude problematic pages from static generation if needed
  exportPathMap: async function (defaultPathMap) {
    const pathMap = { ...defaultPathMap }
    // Remove verify-email from static generation
    delete pathMap['/verify-email']
    return pathMap
  }
};

module.exports = nextConfig;
