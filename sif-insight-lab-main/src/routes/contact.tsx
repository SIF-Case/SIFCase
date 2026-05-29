import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Advisor Connect — SIFHub" }, { name: "description", content: "Speak with a SIF specialist. Callback request, WhatsApp connect, advisor connect." }] }),
  component: Contact,
});

function Contact() {
  return (
    <div className="max-w-[1100px] mx-auto px-6 py-16 grid lg:grid-cols-[1fr_400px] gap-12">
      <div>
        <div className="text-[11px] font-mono uppercase tracking-widest text-primary">Advisor Connect</div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Talk to a SIF specialist.</h1>
        <p className="mt-5 text-[15px] text-muted-foreground max-w-md leading-relaxed">
          Free 30-minute consultation. We'll walk through your profile, suitable strategies, and the specific SIFs worth
          your attention. No obligation.
        </p>

        <form className="mt-10 space-y-5 max-w-md">
          <Field label="Full name" type="text" />
          <Field label="Email" type="email" />
          <Field label="Phone (with country code)" type="tel" />
          <div>
            <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Investible corpus</label>
            <select className="mt-1.5 w-full bg-surface border border-border-strong rounded-md px-3 h-10 text-[13px]">
              <option>₹10–50 Lakhs</option><option>₹50 Lakhs – 2 Cr</option><option>₹2 Cr – 5 Cr</option><option>₹5 Cr+</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Message</label>
            <textarea rows={4} className="mt-1.5 w-full bg-surface border border-border-strong rounded-md px-3 py-2 text-[13px] resize-none" />
          </div>
          <button className="w-full h-11 rounded-md bg-primary text-primary-foreground text-[14px] font-semibold">Request consultation</button>
        </form>
      </div>

      <aside className="space-y-4 lg:pt-16">
        {[
          { I: Mail, t: "Email", v: "research@sifhub.in" },
          { I: Phone, t: "Callback", v: "+91 80000 00000" },
          { I: MessageCircle, t: "WhatsApp", v: "Click to chat" },
        ].map(({ I, t, v }) => (
          <div key={t} className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4">
            <div className="size-10 rounded-md bg-primary/15 text-primary flex items-center justify-center">
              <I className="size-4" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{t}</div>
              <div className="text-[14px] font-medium">{v}</div>
            </div>
          </div>
        ))}
      </aside>
    </div>
  );
}

function Field({ label, type }: { label: string; type: string }) {
  return (
    <div>
      <label className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{label}</label>
      <input type={type} className="mt-1.5 w-full bg-surface border border-border-strong rounded-md px-3 h-10 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary" />
    </div>
  );
}
