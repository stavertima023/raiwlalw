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
      {
        protocol: 'https',
        hostname: 'kong-production-efec.up.railway.app',
        port: '',
        pathname: '/**',
      },
      // Optional S3/MinIO public endpoint (set at runtime via env)
      ...(process.env.S3_PUBLIC_HOSTNAME
        ? [{ protocol: process.env.S3_PUBLIC_PROTOCOL || 'https', hostname: process.env.S3_PUBLIC_HOSTNAME, port: '', pathname: '/**' }]
        : []),
      // Allow images from dedicated photo Supabase domain
      ...(process.env.PHOTO_SUPABASE_URL
        ? (() => {
            try {
              const u = new URL(process.env.PHOTO_SUPABASE_URL);
              return [{ protocol: u.protocol.replace(':',''), hostname: u.hostname, port: '', pathname: '/**' }];
            } catch (_) {
              return [] as any[];
            }
          })()
        : []),
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
  serverExternalPackages: ['@supabase/supabase-js'],
  // Конфигурация для увеличения лимитов
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Увеличиваем лимиты для серверных компонентов
      config.externals = config.externals || [];
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      });
    }
    return config;
  },
  // Увеличиваем лимиты для API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
