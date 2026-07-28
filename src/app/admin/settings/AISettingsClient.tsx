"use client";

import { useEffect, useState, useCallback } from "react";
import { KeyRound, Plus, Pencil, Trash2, RefreshCw, X, ChevronDown } from "lucide-react";
import { AI_USAGES } from "@/lib/aiUsages";
import MonthlyReportsPanel from "./MonthlyReportsPanel";
import LeadNotificationsPanel from "./LeadNotificationsPanel";

type Provider = "deepseek" | "gemini" | "openrouter";

const PROVIDERS: Record<Provider, { label: string; models: string[] }> = {
  deepseek: { label: "DeepSeek", models: ["deepseek-chat", "deepseek-reasoner"] },
  gemini: { label: "Gemini", models: ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash", "gemini-1.5-flash"] },
  openrouter: { label: "OpenRouter", models: [] },
};

type AISetting = {
  _id: string;
  label: string;
  provider: Provider;
  modelName: string;
  apiKeyMasked: string;
  usages: string[];
  updatedAt: string;
};

const CUSTOM_MODEL = "__custom__";

type FormState = { label: string; provider: Provider; model: string; customModel: string; apiKey: string; usages: string[] };

function emptyForm(): FormState {
  return { label: "", provider: "deepseek", model: PROVIDERS.deepseek.models[0], customModel: "", apiKey: "", usages: [] };
}

function toFormState(s: AISetting): FormState {
  const isCustomModel = s.provider !== "openrouter" && !PROVIDERS[s.provider].models.includes(s.modelName);
  return {
    label: s.label,
    provider: s.provider,
    model: s.provider === "openrouter" || isCustomModel ? CUSTOM_MODEL : s.modelName,
    customModel: s.provider === "openrouter" || isCustomModel ? s.modelName : "",
    apiKey: "",
    usages: [...s.usages],
  };
}

const inputCls = "w-full h-9 px-3 rounded-[8px] border border-rule bg-white text-[13px] text-body outline-none focus:border-primary";
const labelCls = "block text-[11px] font-semibold text-muted mb-1";

export default function AISettingsClient() {
  const [settings, setSettings] = useState<AISetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AISetting | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/ai-settings");
    const d = await r.json();
    setSettings(d.settings || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  function openCreate() {
    setForm(emptyForm());
    setError("");
    setEditing("new");
  }

  function openEdit(s: AISetting) {
    setForm(toFormState(s));
    setError("");
    setEditing(s);
  }

  function closeForm() {
    setEditing(null);
    setError("");
  }

  function toggleUsage(key: string) {
    setForm(f => ({
      ...f,
      usages: f.usages.includes(key) ? f.usages.filter(u => u !== key) : [...f.usages, key],
    }));
  }

  function setProvider(provider: Provider) {
    setForm(f => ({
      ...f,
      provider,
      model: provider === "openrouter" ? "" : PROVIDERS[provider].models[0],
      customModel: "",
    }));
  }

  async function save() {
    if (!form.label.trim()) return setError("Label is required");
    const activeModel = (form.provider === "openrouter" || form.model === CUSTOM_MODEL ? form.customModel : form.model).trim();
    if (!activeModel) return setError("Model is required");
    const isNew = editing === "new";
    if (isNew && !form.apiKey.trim()) return setError("API key is required");

    setSaving(true);
    setError("");
    try {
      const url = isNew ? "/api/admin/ai-settings" : `/api/admin/ai-settings/${(editing as AISetting)._id}`;
      const body: Record<string, unknown> = {
        label: form.label.trim(),
        provider: form.provider,
        modelName: activeModel,
        usages: form.usages,
      };
      if (form.apiKey.trim()) body.apiKey = form.apiKey.trim();

      const r = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) { setError(d?.error || `Save failed (${r.status})`); return; }
      closeForm();
      await fetchSettings();
    } finally {
      setSaving(false);
    }
  }

  async function remove(s: AISetting) {
    if (!confirm(`Delete "${s.label}"? This cannot be undone.`)) return;
    setActionLoading(s._id);
    await fetch(`/api/admin/ai-settings/${s._id}`, { method: "DELETE" });
    await fetchSettings();
    setActionLoading(null);
  }

  const usageOwners = new Map<string, string>();
  for (const s of settings) for (const u of s.usages) usageOwners.set(u, s.label);

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-heading tracking-[-0.3px]">Settings</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-primary text-white text-[13px] font-semibold hover:opacity-90">
            <Plus className="size-3.5" /> New config
          </button>
          <button onClick={fetchSettings} className="flex items-center gap-2 px-4 py-2 rounded-[10px] border border-rule text-[13px] text-muted hover:text-body">
            <RefreshCw className="size-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Usage map */}
      <div className="bg-white rounded-[14px] border border-rule shadow-card p-5 mb-6">
        <p className="text-[11px] font-mono uppercase tracking-widest text-muted mb-3">Where each usage gets its config from</p>
        <div className="space-y-2">
          {AI_USAGES.map(u => (
            <div key={u.key} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-heading">{u.label}</p>
                <p className="text-[11.5px] text-muted truncate">{u.description}</p>
              </div>
              {usageOwners.has(u.key) ? (
                <span className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-semibold text-gain bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  <KeyRound className="size-3" /> {usageOwners.get(u.key)}
                </span>
              ) : (
                <span className="shrink-0 text-[11px] text-faint italic">No config assigned — manual entry required</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-[14px] border border-rule shadow-card overflow-hidden">
        <div className="grid grid-cols-[1.3fr_0.9fr_1.2fr_1fr_1.4fr_90px] gap-3 px-5 py-2.5 bg-mist text-[10px] font-mono uppercase tracking-widest text-muted border-b border-rule">
          <div>Label</div><div>Provider</div><div>Model</div><div>API key</div><div>Used for</div><div>Actions</div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted text-[13px]">Loading…</div>
        ) : settings.length === 0 ? (
          <div className="py-16 text-center text-muted text-[13px]">No AI configs yet — add one to get started.</div>
        ) : settings.map(s => (
          <div key={s._id} className="grid grid-cols-[1.3fr_0.9fr_1.2fr_1fr_1.4fr_90px] gap-3 px-5 py-3.5 border-b border-rule last:border-0 items-center">
            <div className="min-w-0 text-[13px] font-semibold text-heading truncate">{s.label}</div>
            <div className="text-[12px] text-body">{PROVIDERS[s.provider]?.label ?? s.provider}</div>
            <div className="min-w-0 text-[12px] font-mono text-body truncate">{s.modelName}</div>
            <div className="text-[12px] font-mono text-muted">{s.apiKeyMasked}</div>
            <div className="flex flex-wrap gap-1">
              {s.usages.length === 0
                ? <span className="text-[11px] text-faint">—</span>
                : s.usages.map(u => (
                  <span key={u} className="text-[10.5px] font-semibold text-primary bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                    {AI_USAGES.find(a => a.key === u)?.label ?? u}
                  </span>
                ))}
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => openEdit(s)} title="Edit"
                className="size-7 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-primary hover:border-primary/30">
                <Pencil className="size-3.5" />
              </button>
              <button onClick={() => remove(s)} title="Delete" disabled={actionLoading === s._id}
                className="size-7 inline-flex items-center justify-center rounded-[6px] border border-rule text-muted hover:text-loss hover:border-red-300 disabled:opacity-40">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <LeadNotificationsPanel />

      <MonthlyReportsPanel />

      {/* Form modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6" onClick={closeForm}>
          <div className="bg-white rounded-[14px] border border-rule shadow-card w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-rule sticky top-0 bg-white">
              <h2 className="text-[16px] font-bold text-heading">{editing === "new" ? "New AI config" : `Edit "${(editing as AISetting).label}"`}</h2>
              <button onClick={closeForm} className="size-7 inline-flex items-center justify-center rounded-[6px] text-muted hover:text-body">
                <X className="size-4" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className={labelCls}>Label</label>
                <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. Gemini — production"
                  className={inputCls} />
              </div>

              <div className="mb-4">
                <label className={labelCls}>Provider</label>
                <div className="flex gap-1 bg-mist rounded-[8px] p-1">
                  {(Object.keys(PROVIDERS) as Provider[]).map(p => (
                    <button key={p} type="button" onClick={() => setProvider(p)}
                      className={`flex-1 py-1.5 rounded-[6px] text-[12px] font-semibold transition-colors ${form.provider === p ? "bg-white text-heading shadow-sm" : "text-muted hover:text-body"}`}>
                      {PROVIDERS[p].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className={labelCls}>Model</label>
                {form.provider === "openrouter" ? (
                  <input value={form.customModel} onChange={e => setForm(f => ({ ...f, customModel: e.target.value }))}
                    placeholder="e.g. anthropic/claude-3.5-sonnet" className={inputCls} />
                ) : (
                  <>
                    <div className="relative">
                      <select value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                        className="appearance-none w-full h-9 pl-3 pr-8 rounded-[8px] border border-rule bg-white text-[13px] text-body outline-none focus:border-primary">
                        {PROVIDERS[form.provider].models.map(m => <option key={m} value={m}>{m}</option>)}
                        <option value={CUSTOM_MODEL}>Custom…</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted pointer-events-none" />
                    </div>
                    {form.model === CUSTOM_MODEL && (
                      <input value={form.customModel} onChange={e => setForm(f => ({ ...f, customModel: e.target.value }))}
                        placeholder="e.g. deepseek-v3.2" className={`${inputCls} mt-2`} />
                    )}
                  </>
                )}
              </div>

              <div className="mb-5">
                <label className={labelCls}>
                  API key {editing !== "new" && <span className="text-faint font-normal">(leave blank to keep the current key — currently {(editing as AISetting).apiKeyMasked})</span>}
                </label>
                <input type="password" autoComplete="off" value={form.apiKey} onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
                  placeholder={`Your ${PROVIDERS[form.provider].label} API key`} className={inputCls} />
              </div>

              <label className="block text-[11px] font-semibold text-muted mb-1.5">Use this config for</label>
              <div className="border border-rule rounded-[10px] overflow-hidden mb-5">
                {AI_USAGES.map(u => {
                  const checked = form.usages.includes(u.key);
                  const heldBy = settings.find(s => editing !== "new" && s._id !== (editing as AISetting)._id && s.usages.includes(u.key));
                  return (
                    <label key={u.key} className="flex items-start gap-3 px-4 py-2.5 border-b border-rule last:border-0 cursor-pointer hover:bg-surface">
                      <input type="checkbox" checked={checked} onChange={() => toggleUsage(u.key)}
                        className="size-4 mt-0.5 accent-primary cursor-pointer" />
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium text-body">{u.label}</p>
                        {heldBy && !checked && (
                          <p className="text-[11px] text-faint mt-0.5">Currently used by &ldquo;{heldBy.label}&rdquo; — checking this will reassign it here.</p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              {error && <p className="text-[12px] text-loss mb-3">{error}</p>}

              <div className="flex items-center gap-2">
                <button onClick={save} disabled={saving}
                  className="px-4 py-2 rounded-[8px] bg-primary text-white text-[13px] font-semibold hover:opacity-90 disabled:opacity-50">
                  {saving ? "Saving…" : "Save config"}
                </button>
                <button onClick={closeForm} className="px-4 py-2 rounded-[8px] border border-rule text-[13px] text-muted hover:text-body">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
