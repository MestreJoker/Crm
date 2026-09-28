import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gruporeciclo.com',
      },
    ],
  },
  
  allowedDevOrigins: ['192.168.15.103', '172.31.48.1', 'localhost:3000'],
};

export default nextConfig;