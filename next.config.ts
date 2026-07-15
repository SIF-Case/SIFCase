import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Load pdfjs-dist from node_modules at runtime instead of bundling it. The
  // report route parses the AMFI PDF with the legacy build, which works in Node
  // without a worker; when bundled, its fake-worker fallback tries to import a
  // pdf.worker chunk that doesn't exist → "Setting up fake worker failed".
  serverExternalPackages: ["pdfjs-dist"],
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
  async redirects() {
    return [
      {
        source: "/read/what-is-a-specialized-investment-fund-sif-meaning-features-benefits-and-restrictions",
        destination: "/sif-101/specialised-investment-fund-sif-meaning-features-benefits-and-restrictions",
        permanent: true,
      },
      {
        source: "/suitability",
        destination: "/sif-101/quiz",
        permanent: false,
      }
    ];
  },
};

export default nextConfig;
