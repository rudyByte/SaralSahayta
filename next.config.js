/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
            },
            {
                protocol: 'https',
                hostname: '**.cloudinary.com',
            },
            {
                protocol: 'https',
                hostname: '**.gov.in',
            },
            {
                protocol: 'https',
                hostname: '**.supabase.co',
            },
        ],
        minimumCacheTTL: 60,
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
        optimizePackageImports: [
            'lucide-react',
            'recharts',
            'date-fns',
            'framer-motion',
        ],
    },
    // Performance: Optimize production builds
    poweredByHeader: false,
    compress: true,
    reactStrictMode: true,
    
    typescript: {
        ignoreBuildErrors: false,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
};

module.exports = nextConfig;
