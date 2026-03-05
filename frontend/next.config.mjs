/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow serving uploaded images from the backend
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
