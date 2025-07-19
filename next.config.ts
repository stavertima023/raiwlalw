import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/',
        permanent: true,
      },
    ]
  },
  // Увеличиваем лимиты для API routes
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  // Настройки для обработки больших данных
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Увеличиваем лимит для серверных компонентов
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        maxSize: 244000,
      };
    }
    return config;
  },
};

export default nextConfig;
