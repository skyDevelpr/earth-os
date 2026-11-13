import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.prismic.io",
      },
      {
        protocol: "https",
        hostname: "image.mux.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/earth-os",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
