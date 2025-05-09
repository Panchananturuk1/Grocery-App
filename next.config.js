/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  output: 'standalone',
  images: {
    domains: ['images.unsplash.com', 'img.icons8.com', 'itetzcqolezorrcegtkf.supabase.co'],
    unoptimized: process.env.NODE_ENV !== 'production',
  },
  experimental: {
    externalDir: true,
  },
  reactStrictMode: false,
  // Make sure server listens on the port Render expects
  serverRuntimeConfig: {
    port: process.env.PORT || 10000
  },
  publicRuntimeConfig: {
    port: process.env.PORT || 10000
  },
  // Remove deprecated swcMinify option - this is enabled by default in Next.js 13+
  compiler: {
    // Enables the styled-components SWC transform if you're using styled-components
    styledComponents: false
  }
}

module.exports = nextConfig 