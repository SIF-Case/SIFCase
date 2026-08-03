import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Load pdfjs-dist from node_modules at runtime instead of bundling it. The
  // report route parses the AMFI PDF with the legacy build, which works in Node
  // without a worker; when bundled, its fake-worker fallback tries to import a
  // pdf.worker chunk that doesn't exist → "Setting up fake worker failed".
  serverExternalPackages: ["pdfjs-dist"],
  // pdfjs resolves its worker at runtime through a specifier the tracer can't
  // follow, so the report function shipped without pdf.worker.mjs and failed in
  // production only ("Setting up fake worker failed"). pdfjsLoader.ts imports
  // the worker explicitly; this guarantees the file lands in the bundle
  // regardless of how the tracer treats an external package.
  outputFileTracingIncludes: {
    "/api/admin/nav-records/report": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
  },
  // Rewrite barrel imports to deep imports so a single icon or chart doesn't
  // pull its whole package into the client bundle.
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "d3-hierarchy"],
  },
  turbopack: {
    root: __dirname,
  },
  images: {
    // Serve modern formats and keep optimised variants on the CDN for a month
    // instead of the 60s default — AMC logos and article images never change.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
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
