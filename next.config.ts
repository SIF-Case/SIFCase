import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      // Cloudinary (used by the upload API for logos and article images)
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Allow any https host so admins can paste CDN URLs from any AMC website
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
