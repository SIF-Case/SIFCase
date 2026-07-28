"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, Plus, Send, Trash2, Loader2 } from "lucide-react";

type Setting = {
  enabled: boolean;
  recipients: string[];
  updatedAt: string | null;
  envFallback: string[];
  configured: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LeadNotificationsPanel() {
  const [setting, setSetting] = useState<Setting | null>(null);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/notification-settings");
    const d = await r.json().catch(() => null);
    if (d?.setting) {
      setSetting(d.setting);
      setRecipients(d.setting.recipients);
      setEnabled(d.setting.enabled);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function addDraft() {
    const value = draft.trim().toLowerCase();
    if (!value) return;
    if (!EMAIL_RE.test(value)) { setError(`"${value}" isn't a valid email address`); return; }
    if (recipients.includes(value)) { setDraft(""); return; }
    setRecipients((prev) => [...prev, value]);
    setDraft("");
    setError("");
    setNotice("");
  }

  function removeRecipient(email: string) {
    setRecipients((prev) => prev.filter((e) => e !== email));
    setNotice("");
  }

  async function save() {
    if (enabled && !recipients.length) {
      setError("Add at least one address, or turn lead alerts off.");
      return;
    }
    setSaving(true); setError(""); setNotice("");
    try {
      const r = await fetch("/api/admin/notification-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients, enabled }),
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) { setError(d?.error || `Save failed (${r.status})`); return; }
      setSetting(d.setting);
      setRecipients(d.setting.recipients);
      setEnabled(d.setting.enabled);
      setNotice("Saved. New callback requests will go to this list.");
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    setTesting(true); setError(""); setNotice("");
    try {
      const r = await fetch("/api/admin/notification-settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Test the on-screen list, so an address can be checked before saving.
        body: JSON.stringify({ recipients }),
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) { setError(d?.error || `Test send failed (${r.status})`); return; }
      setNotice(`Test email sent to ${(d.recipients as string[]).join(", ")}.`);
    } finally {
      setTesting(false);
    }
  }

  const dirty =
    !!setting &&
    (enabled !== setting.enabled ||
      recipients.length !== setting.recipients.length ||
      recipients.some((e, i) => e !== setting.recipients[i]));

  return (
    <div className="bg-white rounded-[14px] border border-rule shadow-card p-5 mt-6">
      <div className="flex items-start justify-between gap-4 mb-1">
        <div>
          <h2 className="text-[15px] font-bold text-heading flex items-center gap-2">
            <BellRing className="size-4 text-primary" /> Lead alert emails
          </h2>
          <p className="text-[12px] text-muted mt-1 max-w-xl">
            Who gets notified when someone submits &ldquo;Get Started with This Fund&rdquo; or a callback
            request. Everyone listed receives the same email, with the investor&rsquo;s details and a direct
            link to the lead and the fund page.
          </p>
        </div>
        <label className="shrink-0 flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => { setEnabled(e.target.checked); setNotice(""); }}
            className="size-4 accent-primary cursor-pointer"
          />
          <span className="text-[12px] font-semibold text-body">Alerts on</span>
        </label>
      </div>

      {loading ? (
        <p className="py-8 text-center text-muted text-[13px]">Loading…</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mt-4 mb-3">
            {recipients.length === 0 ? (
              <p className="text-[12px] text-faint italic">
                No recipients saved — alerts currently fall back to {setting?.envFallback.join(", ") || "nobody"}.
              </p>
            ) : recipients.map((email) => (
              <span key={email} className="inline-flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full bg-mist border border-rule text-[12.5px] text-body">
                {email}
                <button
                  onClick={() => removeRecipient(email)}
                  title={`Remove ${email}`}
                  className="size-5 inline-flex items-center justify-center rounded-full text-muted hover:text-loss hover:bg-red-50"
                >
                  <Trash2 className="size-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 mb-4">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDraft(); } }}
              placeholder="name@aurevawealth.com"
              className="flex-1 h-9 px-3 rounded-[8px] border border-rule bg-white text-[13px] text-body outline-none focus:border-primary"
            />
            <button
              onClick={addDraft}
              className="flex items-center gap-1.5 px-3 h-9 rounded-[8px] border border-rule text-[12.5px] font-semibold text-body hover:border-primary hover:text-primary"
            >
              <Plus className="size-3.5" /> Add
            </button>
          </div>

          {error && <p className="text-[12px] text-loss mb-3">{error}</p>}
          {notice && <p className="text-[12px] text-gain mb-3">{notice}</p>}

          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving || !dirty}
              className="px-4 py-2 rounded-[8px] bg-primary text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-40"
            >
              {saving ? "Saving…" : dirty ? "Save recipients" : "Saved"}
            </button>
            <button
              onClick={sendTest}
              disabled={testing || !recipients.length}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] border border-rule text-[13px] text-muted hover:text-body disabled:opacity-40"
            >
              {testing ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Send test email
            </button>
            {setting?.updatedAt && (
              <span className="text-[11px] text-faint ml-1">
                Last updated {new Date(setting.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
