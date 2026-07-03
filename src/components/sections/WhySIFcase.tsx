import { Landmark, Search, ShieldCheck, TrendingDown } from "lucide-react";

const TRUST_PILLS = [
  "Track Every SIF In India",
  "Independent Research",
  "Monthly Rankings",
  "SEBI-Compliant Framework",
  "Expert Team",
];

const FEATURE_CARDS = [
  {
    Icon: Landmark,
    title: "SEBI-Regulated",
    description:
      "Every SIF operates under SEBI's framework, with defined rules on strategy, disclosure and risk.",
  },
  {
    Icon: Search,
    title: "Transparent",
    description:
      "Each fund shows its SEBI Risk Band, mandate and NAV history up front, so you know what you own.",
  },
  {
    Icon: TrendingDown,
    title: "Lower Entry",
    description:
      "PMS- and AIF-style strategies from Rs. 10 lakh minimum, under regulated AMC oversight.",
  },
  {
    Icon: ShieldCheck,
    title: "Safeguarded",
    description:
      "Assets sit with regulated AMCs and independent custodians, with audited, NAV-based reporting.",
  },
];

export function WhySIFcase() {
  return (
    <>
      {/* Green trust pill bar */}
      <section style={{ background: "#ecf4f1", padding: "8px 0" }}>
        <div
          className="flex flex-wrap items-center justify-center gap-3 mx-auto px-6 sm:gap-5 lg:px-10"
          style={{ maxWidth: 1280 }}
        >
          {TRUST_PILLS.map((label, i) => (
            <span
              key={label}
              className="trust-pill inline-flex items-center whitespace-nowrap text-[13px] font-[500] leading-5 sm:text-[14px]"
              style={{
                padding: "12px 16px",
                borderRadius: 16,
                border: "1px solid #c8e6c9",
                background: "#eef5ee",
                color: "#0f2918",
                opacity: 0.8,
                animationDelay: `${i * 60}ms`,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* Why Investors section */}
      <section
        className="flex flex-col items-center gap-6"
        style={{ background: "#fdfefe", padding: "56px 0" }}
      >
        <div className="mx-auto w-full max-w-[1280px] px-6 lg:px-10">
          <h2
            className="text-center uppercase"
            style={{
              color: "#14b7a3",
              fontSize: 15,
              fontWeight: 700,
              lineHeight: "30px",
              marginBottom: 24,
            }}
          >
            Why Investors Are Looking At SIFs
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {FEATURE_CARDS.map(({ Icon, title, description }) => (
              <article
                key={title}
                className="flex flex-col gap-2"
                style={{
                  padding: 12,
                  borderRadius: 24,
                  border: "1px solid rgba(232,232,233,0.6)",
                  background: "#fff",
                  minHeight: 157,
                  boxShadow: "0 1px 4px 0 rgba(0,0,0,0.04)",
                }}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="size-6 text-black" strokeWidth={1.5} />
                  <h3
                    style={{
                      color: "#000",
                      fontSize: 15,
                      fontWeight: 700,
                      lineHeight: "30px",
                    }}
                  >
                    {title}
                  </h3>
                </div>
                <p
                  className="text-center"
                  style={{
                    color: "rgba(15,41,24,0.7)",
                    fontSize: 14,
                    fontWeight: 500,
                    lineHeight: "normal",
                  }}
                >
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
