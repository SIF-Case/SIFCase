import { useMemo, useState } from "react";
import { Bell, BellRing, FileText, CalendarClock } from "lucide-react";
import { UPCOMING, type UpcomingScheme } from "@/lib/upcoming";
import { useLocalStorage } from "@/hooks/use-local-storage";

const TODAY = new Date("2026-05-25T00:00:00Z");

function daysUntil(iso: string) {
  const d = new Date(iso + "T00:00:00Z").getTime();
  return Math.round((d - TODAY.getTime()) / 86400000);
}

function fmt(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

const WINDOWS = [
  { key: 30, label: "Next 30 days" },
  { key: 60, label: "Next 60 days" },
  { key: 90, label: "Next 90 days" },
] as const;

export function UpcomingSchemes() {
  const [win, setWin] = useState<30 | 60 | 90>(60);
  const [notified, setNotified] = useLocalStorage<string[]>("sifhub:notify", []);

  const items = useMemo(
    () =>
      UPCOMING.filter((s) => {
        const d = daysUntil(s.launchDate);
        return d >= -3 && d <= win;
      }).sort((a, b) => +new Date(a.launchDate) - +new Date(b.launchDate)),
    [win],
  );

  const toggleNotify = (id: string) =>
    setNotified(notified.includes(id) ? notified.filter((x) => x !== id) : [...notified, id]);

  return (
    <section className="border-t border-border bg-surface/40">
      <div className="max-w-[1440px] mx-auto px-6 py-16">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-primary inline-flex items-center gap-2">
              <CalendarClock className="size-3.5" /> Upcoming
            </div>
            <h2 className="mt-2 text-2xl lg:text-3xl font-semibold tracking-tight">Upcoming SIF launches</h2>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              NFO windows opening soon — get notified before subscription closes.
            </p>
          </div>
          <div className="inline-flex p-1 rounded-full border border-border-strong bg-surface text-[12px]">
            {WINDOWS.map((w) => (
              <button
                key={w.key}
                onClick={() => setWin(w.key)}
                className={`h-8 px-4 rounded-full font-medium transition ${
                  win === w.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        {/* Horizontal timeline */}
        <div className="relative overflow-x-auto pb-4 -mx-2 px-2">
          <div className="flex gap-4 min-w-fit">
            {items.map((s) => (
              <UpcomingCard
                key={s.id}
                s={s}
                notified={notified.includes(s.id)}
                onNotify={() => toggleNotify(s.id)}
              />
            ))}
            {items.length === 0 && (
              <div className="text-[13px] text-muted-foreground border border-dashed border-border rounded-xl p-8 w-full text-center">
                No SIF launches scheduled in this window.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function UpcomingCard({
  s,
  notified,
  onNotify,
}: {
  s: UpcomingScheme;
  notified: boolean;
  onNotify: () => void;
}) {
  const d = daysUntil(s.launchDate);
  const tone =
    d <= 7 ? "text-negative" : d <= 21 ? "text-gold" : "text-positive";
  return (
    <div className="w-[320px] shrink-0 bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-border-strong transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{s.amc}</div>
          <div className="mt-1 text-[15px] font-semibold leading-snug">{s.name}</div>
        </div>
        <span className="shrink-0 text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border border-border bg-surface-2 text-primary">
          {s.strategy}
        </span>
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <div className={`font-mono uppercase tracking-widest ${tone}`}>
          {d < 0 ? "Live now" : d === 0 ? "Launches today" : `Opens in ${d}d`}
        </div>
        <div className="text-muted-foreground">
          {fmt(s.nfoOpen)} → {fmt(s.nfoClose)}
        </div>
      </div>

      {/* timeline bar */}
      <div className="relative h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-primary/40"
          style={{ width: `${Math.min(100, Math.max(0, ((90 - Math.max(0, d)) / 90) * 100))}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 size-2.5 rounded-full bg-primary border-2 border-background"
          style={{ left: `${Math.min(100, Math.max(0, ((90 - Math.max(0, d)) / 90) * 100))}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 text-[11px]">
        <Mini label="Benchmark" value={s.benchmark} />
        <Mini label="Expense" value={`${s.expectedExpense}%`} />
        <Mini label="Min" value={`₹${(s.minInvestment / 100000).toFixed(0)}L`} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {s.highlights.map((h) => (
          <span key={h} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 border border-border text-muted-foreground">
            {h}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-auto pt-1">
        <button
          onClick={onNotify}
          aria-pressed={notified}
          className={`flex-1 h-9 inline-flex items-center justify-center gap-1.5 rounded-full text-[12px] font-medium border transition ${
            notified
              ? "border-primary bg-primary/15 text-primary"
              : "border-border-strong hover:bg-surface-2"
          }`}
        >
          {notified ? <BellRing className="size-3.5" /> : <Bell className="size-3.5" />}
          {notified ? "Notifying" : "Notify me"}
        </button>
        <button className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-border-strong hover:bg-surface-2 text-muted-foreground" title="Prospectus">
          <FileText className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate font-medium">{value}</div>
    </div>
  );
}
