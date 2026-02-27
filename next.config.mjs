/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Remove ignoreBuildErrors to prevent constant rebuilds
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  // Optimize development performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Configure Turbopack instead of webpack
  turbopack: {
    // Turbopack configuration
  },
  // Content Security Policy for ngrok development
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "font-src 'self' data: https://fonts.gstatic.com https://ngrok.com",
              "img-src 'self' data: https://ngrok.com https://*.ngrok.io https://*.ngrok-free.dev",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "connect-src 'self' https://ngrok.com https://*.ngrok.io https://*.ngrok-free.dev https://va.vercel-scripts.com https://www.google-analytics.com"
            ].join('; ')
          }
        ]
      }
    ]
  }
}

export default nextConfig
