// next.config.js
/** @type {import('next').NextConfig} */

const nextConfig = {
  // Enable environment variables
  env: {
    // Add any environment variables that need to be exposed to the client here
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  
  // Handle CORS issues
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
  
  // Other Next.js config
  webpack: (config) => {
    // Any webpack configuration
    return config
  },
  
  // Image optimization settings
  images: {
    domains: ['njbreobyezzylpafgbyg.supabase.co'], // Add your Supabase domain
  }
}

module.exports = nextConfig
