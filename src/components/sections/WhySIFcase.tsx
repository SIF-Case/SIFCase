import { Landmark, Search, ShieldCheck, TrendingDown } from "lucide-react";

const ACCENT = "#14b7a3";
const TINT = "#e6f6f3";
const TINT_TEXT = "#0a5f57";

const TRUST_PILLS = [
  "Track every SIF in India",
  "Independent research",
  "Monthly rankings",
  "SEBI-compliant framework",
  "Expert team",
];

const FEATURE_CARDS = [
  {
    Icon: Landmark,
    title: "SEBI-regulated",
    description:
      "Every SIF operates under SEBI's framework, with defined rules on strategy, disclosure and risk.",
  },
  {
    Icon: Search,
    title: "Transparent",
    description:
      "Each fund shows its SEBI risk band, mandate and NAV history up front.",
  },
  {
    Icon: TrendingDown,
    title: "Lower entry",
    description:
      "PMS and AIF-style strategies from ₹10 lakh, under regulated AMC oversight.",
  },
  {
    Icon: ShieldCheck,
    title: "Safeguarded",
    description:
      "Assets sit with regulated AMCs and independent custodians, with audited reporting.",
  },
];

export function WhySIFcase() {
  return (
    <section className="bg-white py-12 lg:py-14">
      <div className="mx-auto w-full max-w-[1200px] px-5 lg:px-8">
        {/* Trust pills — one scrolling row on narrow screens rather than wrapping. */}
        <div className="mb-7 flex gap-3 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden justify-start md:justify-center">
          {TRUST_PILLS.map((label) => (
            <span
              key={label}
              className="shrink-0 whitespace-nowrap rounded-full px-5 py-[8px] text-[15px]"
              style={{ background: TINT, color: TINT_TEXT }}
            >
              {label}
            </span>
          ))}
        </div>

        <p className="mb-7 text-center text-[26px] font-medium" style={{ color: ACCENT }}>
          Why investors are looking at SIFs
        </p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURE_CARDS.map(({ Icon, title, description }) => (
            <article
              key={title}
              className="rounded-[14px] p-6"
              style={{ border: "1px solid #dee7e5" }}
            >
              <Icon className="mb-3.5 size-6" style={{ color: ACCENT }} strokeWidth={1.8} />
              <h3 className="mb-1.5 text-[17px] font-semibold" style={{ color: "#04342c" }}>
                {title}
              </h3>
              <p className="text-[15px] leading-[1.6]" style={{ color: "#6b7975" }}>
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
