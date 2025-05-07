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
    // Skip type checking during build
    tsconfigPath: false, 
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
}

module.exports = nextConfig 