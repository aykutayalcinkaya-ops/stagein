import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@stagein/shared', '@stagein/supabase'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }],
  },
}

export default nextConfig
