/** @type {import('next').NextConfig} */

let withBundleAnalyzer = (config) => config
try {
  withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  })
} catch (e) {
  console.log('Bundle analyzer not installed, skipping. Run npm install to enable ANALYZE=true')
}

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['i.pravatar.cc', 'unpkg.com'],
  },
  env: {
    NEXT_PUBLIC_MAP_PROVIDER: process.env.NEXT_PUBLIC_MAP_PROVIDER || 'leaflet',
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          'vendor-leaflet': {
            test: /[\\/]node_modules[\\/](leaflet|react-leaflet)[\\/]/,
            name: 'vendor-leaflet',
            chunks: 'all',
            priority: 30,
          },
          'vendor-supabase': {
            test: /[\\/]node_modules[\\/](@supabase)[\\/]/,
            name: 'vendor-supabase',
            chunks: 'all',
            priority: 20,
          },
          'vendor-maps': {
            test: /[\\/]node_modules[\\/](recharts|react-big-calendar|date-fns)[\\/]/,
            name: 'vendor-maps',
            chunks: 'all',
            priority: 25,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      }
    }
    return config
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
}

module.exports = withBundleAnalyzer(nextConfig)
