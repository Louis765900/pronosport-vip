/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignorer les erreurs TypeScript pendant le build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ignorer les erreurs ESLint pendant le build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configuration des en-têtes pour les API
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
