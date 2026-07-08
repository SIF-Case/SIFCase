import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { QuizClient } from "./QuizClient";

export const metadata = {
  title: "Test Your Readiness — SIF 101 Quiz | SIFcase",
  description:
    "Test your understanding of SIF basics with our interactive quiz. Get instant feedback and learn as you go.",
};

export default function QuizPage() {
  return (
    <main className="flex flex-col min-h-screen" style={{ background: "#FDFEFE" }}>
      <Navbar />
      <QuizClient />
      <Footer />
    </main>
  );
}
