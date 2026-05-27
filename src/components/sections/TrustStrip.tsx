import { ShieldCheck, TrendingUp, FileText, Ban } from "lucide-react";

const ITEMS = [
  {
    Icon: ShieldCheck,
    text: "NAV from AMFI",
    sub: "Direct import, no manual entry",
  },
  {
    Icon: TrendingUp,
    text: "Returns calculated from NAV history",
    sub: "Not from marketing materials",
  },
  {
    Icon: FileText,
    text: "Documents from AMC / ISID",
    sub: "Official scheme documents only",
  },
  {
    Icon: Ban,
    text: "No guessed data",
    sub: "Missing values shown as unavailable",
  },
];

export function TrustStrip() {
  return (
    <section className="bg-mist border-b border-rule">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-8 py-5">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {ITEMS.map(({ Icon, text, sub }, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Icon
                className="w-4 h-4 text-verified flex-shrink-0"
                strokeWidth={2}
              />
              <div>
                <span className="text-[13px] font-semibold text-heading">
                  {text}
                </span>
                <span className="hidden lg:inline text-[13px] text-muted">
                  {" "}
                  — {sub}
                </span>
              </div>
              {i < ITEMS.length - 1 && (
                <span className="hidden md:block w-px h-4 bg-rule ml-4 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
