import { Link } from "@tanstack/react-router";
import { TICKERS } from "@/lib/data";

export function Ticker() {
  const items = [...TICKERS, ...TICKERS];
  return (
    <div className="h-9 border-b border-border bg-background/95 backdrop-blur overflow-hidden marquee-pause">
      <div className="flex h-full items-center animate-marquee whitespace-nowrap font-mono text-[11px] tabular">
        {items.map((t, i) => {
          const content = (
            <span className="px-5 flex items-center gap-2 group">
              <span className="text-muted-foreground tracking-wider uppercase group-hover:text-foreground transition-colors">
                {t.sym}
              </span>
              <span className="text-foreground">{t.val}</span>
              {t.chg !== 0 && (
                <span className={t.chg > 0 ? "text-positive" : "text-negative"}>
                  {t.chg > 0 ? "+" : ""}
                  {t.chg.toFixed(2)}%
                </span>
              )}
              <span className="text-border-strong">·</span>
            </span>
          );
          return t.fundId ? (
            <Link key={i} to="/fund/$id" params={{ id: t.fundId }} className="hover:bg-surface/60 transition-colors">
              {content}
            </Link>
          ) : (
            <Link key={i} to="/market" className="hover:bg-surface/60 transition-colors">
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
