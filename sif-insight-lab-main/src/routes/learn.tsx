import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { GLOSSARY } from "@/lib/data";
import { BookOpen, Clock, GraduationCap, Search, Sparkles, ChevronDown, PlayCircle, FileText, Award } from "lucide-react";

export const Route = createFileRoute("/learn")({
  head: () => ({ meta: [
    { title: "Learn SIFs — Investor Education · SIFHub" },
    { name: "description", content: "Education-first SIF learning center: beginner guides, derivatives, long-short mechanics, taxation, glossary, case studies and certified paths." },
  ] }),
  component: Learn,
});

const PERSONAS = [
  { id: "beginner", t: "First-time Investor", d: "Start with what an SIF is and why it exists.", time: "~2 hrs", tracks: 3, icon: Sparkles },
  { id: "hni", t: "HNI / Family Office", d: "Portfolio construction, hedging, and tax mechanics.", time: "~6 hrs", tracks: 5, icon: Award },
  { id: "advisor", t: "Advisor / Analyst", d: "Strategy theses, AMC due-diligence, regulatory framework.", time: "~9 hrs", tracks: 8, icon: GraduationCap },
];

const TRACKS = [
  { t: "SIFs 101", d: "What is a Specialized Investment Fund and why SEBI introduced it.", lessons: 6, mins: 42, level: "Beginner", progress: 100 },
  { t: "Long-Short Mechanics", d: "Going both sides of the market without losing your shirt.", lessons: 8, mins: 71, level: "Intermediate", progress: 62 },
  { t: "Derivatives Basics", d: "Futures, options, hedging payoffs and margin mechanics.", lessons: 10, mins: 95, level: "Intermediate", progress: 30 },
  { t: "Taxation Deep-Dive", d: "Equity vs. debt vs. other — what you actually pay.", lessons: 5, mins: 38, level: "Beginner", progress: 0 },
  { t: "Alternative Strategies", d: "Arbitrage, event-driven, special situations, credit.", lessons: 12, mins: 128, level: "Advanced", progress: 0 },
  { t: "Portfolio Construction", d: "Sizing SIFs alongside MFs, PMS and direct equity.", lessons: 7, mins: 64, level: "Advanced", progress: 0 },
  { t: "AMC Due-Diligence", d: "Reading factsheets, pedigree checks, and red flags.", lessons: 6, mins: 52, level: "Intermediate", progress: 0 },
  { t: "Regulatory Framework", d: "SEBI rules, disclosures, and what changed in 2025.", lessons: 4, mins: 31, level: "Beginner", progress: 0 },
];

const CASES = [
  { tag: "Long-Short", t: "How a 0.64-beta book outran the NIFTY 500 by 8% in 2025", read: 9 },
  { tag: "Arbitrage", t: "When event-driven spreads collapsed: a Q3 2025 post-mortem", read: 7 },
  { tag: "Credit", t: "Reading between the YTM lines on a hybrid credit SIF", read: 11 },
];

const FAQ = [
  { q: "Who can invest in an SIF?", a: "Any resident or NRI investor meeting the ₹10 lakh minimum across an AMC's SIF strategies. Accredited investors get fewer restrictions." },
  { q: "How are SIFs different from PMS or AIFs?", a: "SIFs are pooled like a mutual fund (lower minimum than AIF), but can run long-short, derivatives, and alternative strategies that MFs cannot. Operationally simpler than PMS." },
  { q: "What are the tax implications?", a: "Equity-oriented SIFs follow MF equity taxation (12.5% LTCG > 12 months). Debt-oriented and 'other' categories follow slab/debt rules — see the Taxation track for the full matrix." },
  { q: "Are returns guaranteed?", a: "No SIF carries a guarantee. Most aim for benchmark-plus with controlled drawdowns, but past performance does not assure future results." },
];

const FEATURED_CHAPTERS = [
  { n: "01", t: "Why long-short exists", mins: 4 },
  { n: "02", t: "Building the short book", mins: 9 },
  { n: "03", t: "Beta neutrality vs. dollar neutrality", mins: 7 },
  { n: "04", t: "Margin, leverage and the SEBI cap", mins: 6 },
  { n: "05", t: "Reading a long-short factsheet", mins: 8 },
];

function Learn() {
  const totals = useMemo(() => ({
    tracks: TRACKS.length,
    lessons: TRACKS.reduce((a, t) => a + t.lessons, 0),
    minutes: TRACKS.reduce((a, t) => a + t.mins, 0),
    completed: TRACKS.filter((t) => t.progress === 100).length,
  }), []);

  const [q, setQ] = useState("");
  const [level, setLevel] = useState<"All" | "Beginner" | "Intermediate" | "Advanced">("All");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const filteredTracks = TRACKS.filter((t) => level === "All" || t.level === level);
  const glossary = Object.entries(GLOSSARY).filter(([k, v]) =>
    !q || k.toLowerCase().includes(q.toLowerCase()) || v.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-10 space-y-14">
      {/* HERO */}
      <header className="grid lg:grid-cols-[1.4fr_1fr] gap-8 items-end">
        <div className="space-y-4 max-w-2xl">
          <div className="text-[11px] font-mono uppercase tracking-widest text-primary">Learning Center</div>
          <h1 className="text-3xl lg:text-5xl font-semibold tracking-tight leading-[1.05]">
            Master SIFs — from first principles to institutional fluency.
          </h1>
          <p className="text-[14px] text-muted-foreground max-w-xl leading-relaxed">
            A structured curriculum for HNIs, advisors and finance students. Bite-sized lessons, live case studies, and a searchable glossary — all in one place.
          </p>
        </div>
        <div className="grid grid-cols-4 gap-px bg-border border border-border rounded-xl overflow-hidden">
          {[
            { k: "Tracks", v: totals.tracks },
            { k: "Lessons", v: totals.lessons },
            { k: "Minutes", v: totals.minutes },
            { k: "Done", v: `${totals.completed}/${totals.tracks}` },
          ].map((s) => (
            <div key={s.k} className="bg-surface px-3 py-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{s.k}</div>
              <div className="mt-1 text-xl font-semibold tabular">{s.v}</div>
            </div>
          ))}
        </div>
      </header>

      {/* PERSONAS */}
      <section>
        <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">Pick your path</div>
        <div className="grid md:grid-cols-3 gap-4">
          {PERSONAS.map((p) => (
            <button key={p.id} className="text-left bg-surface border border-border rounded-xl p-5 hover:border-primary/40 hover:bg-surface-2 transition group">
              <div className="flex items-center justify-between">
                <p.icon className="size-5 text-primary" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{p.tracks} tracks · {p.time}</span>
              </div>
              <div className="mt-4 text-[15px] font-semibold">{p.t}</div>
              <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">{p.d}</p>
              <div className="mt-4 text-[11px] font-mono uppercase tracking-widest text-primary group-hover:translate-x-0.5 transition">Begin →</div>
            </button>
          ))}
        </div>
      </section>

      {/* TRACKS */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary">Curriculum</div>
            <h2 className="mt-1 text-xl lg:text-2xl font-semibold tracking-tight">All tracks</h2>
          </div>
          <div className="flex gap-1 bg-surface border border-border rounded-md p-0.5">
            {(["All", "Beginner", "Intermediate", "Advanced"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`px-3 h-7 text-[11px] font-mono uppercase tracking-widest rounded ${level === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >{l}</button>
            ))}
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border rounded-xl overflow-hidden">
          {filteredTracks.map((t, i) => (
            <div key={t.t} className="bg-surface p-5 hover:bg-surface-2 transition flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Track {String(TRACKS.indexOf(t) + 1).padStart(2, "0")}</span>
                <LevelChip level={t.level} />
              </div>
              <div className="mt-3 text-[15px] font-semibold leading-snug">{t.t}</div>
              <p className="mt-1.5 text-[12px] text-muted-foreground leading-relaxed flex-1">{t.d}</p>
              <div className="mt-4 flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
                <span className="inline-flex items-center gap-1"><BookOpen className="size-3" /> {t.lessons}</span>
                <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {t.mins}m</span>
              </div>
              <div className="mt-3 h-1 bg-surface-2 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${t.progress}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px]">
                <span className="font-mono text-muted-foreground">{t.progress === 0 ? "Not started" : t.progress === 100 ? "Completed" : `${t.progress}% complete`}</span>
                <span className="text-primary font-medium">{t.progress === 0 ? "Start →" : t.progress === 100 ? "Review →" : "Resume →"}</span>
              </div>
              <span className="sr-only">{i}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED LESSON */}
      <section className="grid lg:grid-cols-[1.3fr_1fr] gap-6">
        <div className="bg-gradient-to-br from-primary/15 via-surface to-surface border border-border rounded-xl p-7">
          <div className="text-[10px] font-mono uppercase tracking-widest text-primary">Featured Lesson</div>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight">Long-Short Mechanics: the full walkthrough</h3>
          <p className="mt-2 text-[13px] text-muted-foreground max-w-lg leading-relaxed">
            Five short chapters covering the entire long-short playbook — written for investors who'd rather understand the math than memorise the marketing.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground h-9 px-4 rounded-md text-[12px] font-medium hover:opacity-90">
              <PlayCircle className="size-4" /> Start lesson
            </button>
            <button className="inline-flex items-center gap-2 border border-border h-9 px-4 rounded-md text-[12px] font-medium hover:bg-surface-2">
              <FileText className="size-4" /> Download PDF
            </button>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl divide-y divide-border">
          {FEATURED_CHAPTERS.map((c) => (
            <div key={c.n} className="px-5 py-3.5 flex items-center justify-between hover:bg-surface-2 transition">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[10px] font-mono text-primary">{c.n}</span>
                <span className="text-[13px] truncate">{c.t}</span>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground tabular">{c.mins} min</span>
            </div>
          ))}
        </div>
      </section>

      {/* CASE STUDIES */}
      <section>
        <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">Case Studies</div>
        <h2 className="text-xl lg:text-2xl font-semibold tracking-tight mb-5">Real strategies, dissected</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {CASES.map((c) => (
            <article key={c.t} className="bg-surface border border-border rounded-xl p-5 hover:bg-surface-2 transition">
              <span className="text-[10px] font-mono uppercase tracking-widest text-primary border border-primary/30 bg-primary/10 px-2 py-0.5 rounded">{c.tag}</span>
              <h3 className="mt-3 text-[15px] font-semibold leading-snug">{c.t}</h3>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span>{c.read} min read</span>
                <span className="text-primary">Open →</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* GLOSSARY */}
      <section>
        <div className="flex items-end justify-between mb-4 gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary">Glossary</div>
            <h2 className="mt-1 text-xl lg:text-2xl font-semibold tracking-tight">Every term, plainly defined</h2>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search terms…"
              className="w-full h-9 pl-9 pr-3 text-[12px] bg-surface border border-border rounded-md focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl divide-y divide-border">
          {glossary.length === 0 && <div className="px-6 py-8 text-[13px] text-muted-foreground">No terms match "{q}".</div>}
          {glossary.map(([term, def]) => (
            <div key={term} className="grid md:grid-cols-[180px_1fr] gap-6 px-6 py-4">
              <dt className="text-[13px] font-semibold">{term}</dt>
              <dd className="text-[13px] text-muted-foreground leading-relaxed">{def}</dd>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">FAQ</div>
        <h2 className="text-xl lg:text-2xl font-semibold tracking-tight mb-5">Frequent investor questions</h2>
        <div className="bg-surface border border-border rounded-xl divide-y divide-border">
          {FAQ.map((f, i) => (
            <div key={f.q}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-surface-2 transition"
              >
                <span className="text-[14px] font-medium">{f.q}</span>
                <ChevronDown className={`size-4 text-muted-foreground transition ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && <div className="px-6 pb-5 text-[13px] text-muted-foreground leading-relaxed">{f.a}</div>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function LevelChip({ level }: { level: string }) {
  const tone = level === "Beginner" ? "text-positive border-positive/30 bg-positive/10"
    : level === "Intermediate" ? "text-gold border-gold/30 bg-gold/10"
    : "text-negative border-negative/30 bg-negative/10";
  return <span className={`text-[9px] font-mono uppercase tracking-widest border px-1.5 py-0.5 rounded ${tone}`}>{level}</span>;
}
