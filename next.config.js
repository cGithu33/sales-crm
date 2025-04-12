/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  },
  // Handle missing environment variables gracefully
  serverRuntimeConfig: {
    // Will only be available on the server side
    DATABASE_URL: process.env.DATABASE_URL || 'mongodb://localhost:27017/sales-crm',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'development-secret',
    GOOGLE_CLOUD_VISION_API_KEY: process.env.GOOGLE_CLOUD_VISION_API_KEY || '',
    SMTP_HOST: process.env.SMTP_HOST || '',
    SMTP_PORT: process.env.SMTP_PORT || '587',
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    SMTP_FROM: process.env.SMTP_FROM || 'noreply@example.com',
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || ''
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
  }
}
