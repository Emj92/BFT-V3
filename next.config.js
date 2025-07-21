/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['puppeteer'],
    // Performance: Optimierte Bundle-Größe
    optimizeCss: true,
    // Performance: Bessere Code-Splitting
    esmExternals: 'loose',
  },
  // Performance: Komprimierung aktivieren
  compress: true,
  // Performance: Statische Optimierung
  swcMinify: true,
  // Performance: Image-Optimierung
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  webpack: (config, { dev, isServer }) => {
    // Performance: Produktions-Optimierungen
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            lucide: {
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
              name: 'lucide',
              chunks: 'all',
            },
          },
        },
      };
    }

    // This is needed for working with puppeteer
    if (!config.externals) {
      config.externals = [];
    }
    config.externals.push('puppeteer');
    
    return config;
  },
};

module.exports = nextConfig;
