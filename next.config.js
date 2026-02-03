/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['localhost'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.cloudinary.com',
            },
            {
                protocol: 'https',
                hostname: '**.gov.in',
            },
        ],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },
};

module.exports = nextConfig;
