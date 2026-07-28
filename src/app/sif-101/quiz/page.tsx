import type { Metadata } from "next";
import { resolvePageMetadata } from "@/lib/pageSeo";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { QuizClient } from "./QuizClient";

// Title/description/canonical come from the Page SEO admin screen when an
// override exists, otherwise from the defaults in src/lib/seoRegistry.ts.
export async function generateMetadata(): Promise<Metadata> {
  return resolvePageMetadata({ path: "/sif-101/quiz" });
}

export default function QuizPage() {
  return (
    <main className="flex flex-col min-h-screen" style={{ background: "#FDFEFE" }}>
      <Navbar />
      <QuizClient />
      <Footer />
    </main>
  );
}
