/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost', 'avatars.githubusercontent.com', 'github.com', 'storage.googleapis.com'],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Add support for importing .md files
    config.module.rules.push({
      test: /\.md$/,
      use: 'raw-loader',
    });

    // Monaco Editor webpack configuration
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
