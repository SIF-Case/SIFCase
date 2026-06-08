import { ShieldCheck, TrendingUp, FileText, Ban } from "lucide-react";

const ITEMS = [];

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
