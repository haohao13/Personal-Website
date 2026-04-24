import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "bkimg.cdn.bcebos.com",
      },
      {
        protocol: "https",
        hostname: "cassette.sphdigital.com.sg",
      },
      {
        protocol: "http",
        hostname: "img2.chinadaily.com.cn",
      },
    ],
  },
};

export default nextConfig;
