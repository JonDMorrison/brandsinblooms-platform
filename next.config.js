/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Multi-domain support configuration
  trailingSlash: false,
  poweredByHeader: false,
  generateEtags: true,
  compress: true,
  
  // Production optimizations for multi-domain
  modularizeImports: {
    '@radix-ui/react-icons': {
      transform: '@radix-ui/react-icons/dist/{{member}}',
    },
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '54321',
      },
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      // Support for custom domains and subdomains
      {
        protocol: 'https',
        hostname: '**.blooms.cc',
      },
      {
        protocol: 'http',
        hostname: '**.localhost',
        port: '3000',
      },
      // Support for any custom domain (production)
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Image optimization settings
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    // Allow SVG images - no script execution needed
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; style-src 'self' 'unsafe-inline'; sandbox;",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Railway port configuration
  // IMPORTANT: Railway provides PORT automatically - don't override
  serverRuntimeConfig: {
    port: process.env.PORT || 3000,
    // Log port configuration for debugging
    _portDebug: {
      envPort: process.env.PORT,
      defaultPort: 3000,
      isRailway: !!process.env.RAILWAY_PUBLIC_DOMAIN,
    },
  },
  // Performance optimizations (already defined above, removing duplicates)
  httpAgentOptions: {
    keepAlive: true,
  },
  // Experimental performance features
  experimental: {
    optimizeCss: true,
    optimizeFonts: false,
    scrollRestoration: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'date-fns'],
  },
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Exclude Node.js built-ins from client-side bundles
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        dns: false,
        crypto: false,
        stream: false,
        url: false,
        querystring: false,
        util: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      }
      
      // Exclude Redis from client-side bundles completely
      config.externals = config.externals || []
      config.externals.push('redis')
    }
    // Optimize production builds
    if (!dev && !isServer) {
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
      config.optimization.concatenateModules = true
      config.optimization.runtimeChunk = 'single'
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test(module) {
              return module.size() > 160000 && /node_modules[/\\]/.test(module.identifier())
            },
            name(module) {
              // Simple hash function for module names - browser compatible
              const str = module.identifier()
              let hash = 0
              for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i)
                hash = ((hash << 5) - hash) + char
                hash = hash & hash // Convert to 32-bit integer
              }
              return Math.abs(hash).toString(16).substring(0, 8)
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
            priority: 20,
          },
          shared: {
            name(module, chunks) {
              // Simple hash function for chunk names - browser compatible
              const str = chunks.reduce((acc, chunk) => acc + chunk.name, '')
              let hash = 0
              for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i)
                hash = ((hash << 5) - hash) + char
                hash = hash & hash // Convert to 32-bit integer
              }
              return Math.abs(hash).toString(16).substring(0, 8)
            },
            priority: 10,
            minChunks: 2,
            reuseExistingChunk: true,
          },
        },
      }
    }
    return config
  },
  // Security headers with multi-domain support
  async headers() {
    // Environment-aware CSP configuration
    const isDevelopment = process.env.NODE_ENV === 'development'

    // Build connect-src directive based on environment
    const connectSrc = isDevelopment
      ? "connect-src 'self' https://api.stripe.com https://m.stripe.network wss: https: http://localhost:* http://127.0.0.1:*"
      : "connect-src 'self' https://api.stripe.com https://m.stripe.network wss: https:"

    // Build img-src directive based on environment
    const imgSrc = isDevelopment
      ? "img-src 'self' data: https: http: blob:"
      : "img-src 'self' data: https: blob:"

    const frameSrc = "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.youtube.com https://www.youtube-nocookie.com"

    const cspValue = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://m.stripe.network",
      connectSrc,
      frameSrc,
      // child-src is used as fallback for frame-src in some browsers
      "child-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
      "style-src 'self' 'unsafe-inline'",
      imgSrc,
      "font-src 'self' data:"
    ].join('; ')

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: cspValue
          },
          // Production performance headers
          {
            key: 'X-Robots-Tag',
            value: 'index, follow'
          },
        ]
      },
      // API routes with CORS support
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With, x-csrf-token'
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400'
          },
        ]
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate'
          }
        ]
      }
    ]
  },
}

// Bundle analyzer configuration
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = process.env.ANALYZE === 'true' 
  ? withBundleAnalyzer(nextConfig) 
  : nextConfig