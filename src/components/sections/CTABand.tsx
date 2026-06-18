import { ArrowRight } from "lucide-react";

export function CTABand() {
  return (
    <section className="bg-brand-navy py-section">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-[36px] sm:text-[42px] font-bold text-white leading-[1.1] tracking-[-0.5px] mb-4">
            Understand SIFs before you invest.
          </h2>
          <p className="text-[16px] text-[#D8E8F7] leading-relaxed mb-8 max-w-xl mx-auto">
            Compare official data, read simplified strategy notes, and check if
            SIFs are suitable for your investment profile.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="/compare"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[10px] bg-primary text-white text-[14.5px] font-semibold hover:bg-primary-hover shadow-btn"
            >
              Become SIF Ready
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/read"
              className="inline-flex items-center px-7 py-3.5 rounded-[10px] bg-white/[0.08] border border-white/15 text-white text-[14.5px] font-semibold hover:bg-white/[0.14]"
            >
              Start with the basics
            </a>
          </div>

          <p className="mt-8 text-[12px] text-white/30 max-w-lg mx-auto">
            SIFs require a minimum investment of ₹10 lakh and are designed for
            sophisticated investors. This platform is for research and education
            only, not investment advice.
          </p>
        </div>
      </div>
    </section>
  );
}
