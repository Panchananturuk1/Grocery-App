import type { NextConfig } from "next";
const DB_CONFIG = require("./src/config/supabase-config");

const nextConfig: NextConfig = {
  images: {
    domains: ["images.unsplash.com"],
  },
  env: {
    // Force Supabase configuration through environment variables
    NEXT_PUBLIC_SUPABASE_URL: DB_CONFIG.url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: DB_CONFIG.anonKey,
    NEXT_PUBLIC_SUPABASE_PROJECT_ID: DB_CONFIG.projectId,
    // Add a timestamp to bust cache
    NEXT_PUBLIC_BUILD_TIMESTAMP: Date.now().toString(),
  },
  // Disable caching during development
  experimental: {
    optimizeCss: false,
    scrollRestoration: false
  }
};

export default nextConfig;
