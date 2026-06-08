"use client";

import { useState, useEffect, useRef } from "react";
import {
  FileText, Plus, Trash2, ExternalLink, Loader2,
  Wand2, Check, ChevronDown, Upload, AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Manager = { name: string; designation: string };
type Allocation = { assetClass: string; percentage: string };
type IndustryAlloc = { industry: string; percentage: string };
type RatingAlloc = { ratingClass: string; percentage: string };
type Holding = { name: string; percentage: string; sector: string; rating: string };
type Factsheet = { url: string; filename: string; uploadedAt: string };

type FormState = {
  riskBand: string;
  schemeType: string;
  exitLoad: string;
  aumCurrent: string;
  aumAggregate: string;
  minInvestment: string;
  additionalInvestment: string;
  fundManagers: Manager[];
  benchmarkName: string;
  benchmarkRiskBand: string;
  benchmarkDetails: string;
  assetAllocation: Allocation[];
  portfolioByIndustry: IndustryAlloc[];
  portfolioByRatingClass: RatingAlloc[];
  topHoldings: Holding[];
  factsheets: Factsheet[];
  // Investor Suitability
  suitableFor: string;
  notSuitableFor: string;
  // Market Scenarios
  bullMarket: string;
  bearMarket: string;
  sidewaysMarket: string;
  // Fund Fit
  howItWorks: string;
  mfEquivalent: string;
  portfolioFit: string;
};

type AiResult = Partial<{
  riskBand: number | null;
  schemeType: string | null;
  exitLoad: string | null;
  aumCurrent: number | null;
  aumAggregate: number | null;
  minInvestment: number | null;
  additionalInvestment: number | null;
  fundManagers: { name: string; designation?: string }[];
  benchmarkName: string | null;
  benchmarkRiskBand: number | null;
  benchmarkDetails: string | null;
  assetAllocation: { assetClass: string; percentage: number }[];
  portfolioByIndustry: { industry: string; percentage: number }[];
  portfolioByRatingClass: { ratingClass: string; percentage: number }[];
  topHoldings: { name: string; percentage: number; sector?: string; rating?: string }[];
  // Investor Suitability
  suitableFor: string | null;
  notSuitableFor: string | null;
  // Market Scenarios
  bullMarket: string | null;
  bearMarket: string | null;
  sidewaysMarket: string | null;
  // Fund Fit
  howItWorks: string | null;
  mfEquivalent: string | null;
  portfolioFit: string | null;
}>;

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_FORM: FormState = {
  riskBand: "", schemeType: "", exitLoad: "",
  aumCurrent: "", aumAggregate: "",
  minInvestment: "1000000", additionalInvestment: "10000",
  fundManagers: [{ name: "", designation: "" }],
  benchmarkName: "", benchmarkRiskBand: "", benchmarkDetails: "",
  assetAllocation: [{ assetClass: "", percentage: "" }],
  portfolioByIndustry: [{ industry: "", percentage: "" }],
  portfolioByRatingClass: [{ ratingClass: "", percentage: "" }],
  topHoldings: [{ name: "", percentage: "", sector: "", rating: "" }],
  factsheets: [],
  suitableFor: "", notSuitableFor: "",
  bullMarket: "", bearMarket: "", sidewaysMarket: "",
  howItWorks: "", mfEquivalent: "", portfolioFit: "",
};

type Provider = "deepseek" | "gemini" | "openrouter";

const PROVIDERS: Record<Provider, { label: string; models: string[] }> = {
  deepseek: { label: "DeepSeek", models: ["deepseek-chat", "deepseek-reasoner"] },
  gemini: { label: "Gemini", models: ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash", "gemini-1.5-flash"] },
  openrouter: { label: "OpenRouter", models: [] },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.13em] text-primary mb-3 mt-6 first:mt-0">
      {title}
    </p>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-[12px] font-medium text-[#64748B] mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-[8px] border border-[#E2E8F0] bg-white px-3 py-2 text-[13px] text-[#0B1F3A] placeholder-[#CBD5E1] focus:outline-none focus:border-primary transition-colors";
const inputFlexCls = "min-w-0 rounded-[8px] border border-[#E2E8F0] bg-white px-3 py-2 text-[13px] text-[#0B1F3A] placeholder-[#CBD5E1] focus:outline-none focus:border-primary transition-colors";
const textareaCls = `${inputCls} resize-none`;

function AiValueBadge({ value, onApply }: { value: string; onApply: () => void }) {
  return (
    <div className="flex items-start gap-2 mt-1.5 bg-[#F0F7FF] border border-[#BFDBFE] rounded-[8px] px-3 py-2">
      <Wand2 className="size-3.5 text-primary mt-0.5 shrink-0" />
      <span className="text-[12px] text-[#1E3A8A] flex-1 leading-relaxed break-words">{value}</span>
      <button
        onClick={onApply}
        className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-[#1E3A8A] transition-colors ml-1"
      >
        <Check className="size-3" /> Apply
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FundDetailsPage() {
  const [brandNames, setBrandNames] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [fundNames, setFundNames] = useState<string[]>([]);
  const [selectedFund, setSelectedFund] = useState("");
  const [loadingFund, setLoadingFund] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // AI state
  const [provider, setProvider] = useState<Provider>("deepseek");
  const [model, setModel] = useState(PROVIDERS.deepseek.models[0]);
  const [customModel, setCustomModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [savedConfig, setSavedConfig] = useState<{ label: string; provider: Provider; modelName: string } | null | undefined>(undefined);
  const [overrideConfig, setOverrideConfig] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [aiError, setAiError] = useState("");

  // PDF upload
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch("/api/admin/fund-details?list=1")
      .then(r => r.json())
      .then(d => {
        setFundNames(d.fundNames || []);
        setBrandNames(d.brandNames || []);
      });

    fetch("/api/admin/fund-details/analyse")
      .then(r => r.json())
      .then(d => setSavedConfig(d.config ?? null))
      .catch(() => setSavedConfig(null));
  }, []);

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    setSelectedFund("");
    setForm(EMPTY_FORM);
    setAiResult(null);
    const url = brand ? `/api/admin/fund-details?list=1&brand=${encodeURIComponent(brand)}` : "/api/admin/fund-details?list=1";
    fetch(url).then(r => r.json()).then(d => setFundNames(d.fundNames || []));
  };

  useEffect(() => {
    const saved = localStorage.getItem(`sifcase_ai_key_${provider}`) || "";
    setApiKey(saved);
    if (provider !== "openrouter") setModel(PROVIDERS[provider].models[0]);
  }, [provider]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleApiKeyChange = (v: string) => {
    setApiKey(v);
    localStorage.setItem(`sifcase_ai_key_${provider}`, v);
  };

  const handleSelectFund = async (name: string) => {
    setSelectedFund(name);
    setAiResult(null);
    setAiError("");
    setSaveMsg(null);
    if (!name) { setForm(EMPTY_FORM); return; }

    setLoadingFund(true);
    try {
      const r = await fetch(`/api/admin/fund-details?fundName=${encodeURIComponent(name)}`);
      const d = await r.json();
      if (d.detail) {
        const det = d.detail;
        setForm({
          riskBand: det.riskBand != null ? String(det.riskBand) : "",
          schemeType: det.schemeType || "",
          exitLoad: det.exitLoad || "",
          aumCurrent: det.aumCurrent != null ? String(det.aumCurrent) : "",
          aumAggregate: det.aumAggregate != null ? String(det.aumAggregate) : "",
          minInvestment: det.minInvestment != null ? String(det.minInvestment) : "10000000",
          additionalInvestment: det.additionalInvestment != null ? String(det.additionalInvestment) : "10000",
          fundManagers: det.fundManagers?.length
            ? det.fundManagers.map((m: Manager) => ({ name: m.name || "", designation: m.designation || "" }))
            : [{ name: "", designation: "" }],
          benchmarkName: det.benchmarkName || "",
          benchmarkRiskBand: det.benchmarkRiskBand != null ? String(det.benchmarkRiskBand) : "",
          benchmarkDetails: det.benchmarkDetails || "",
          assetAllocation: det.assetAllocation?.length
            ? det.assetAllocation.map((a: { assetClass: string; percentage: number }) => ({ assetClass: a.assetClass || "", percentage: String(a.percentage) }))
            : [{ assetClass: "", percentage: "" }],
          portfolioByIndustry: det.portfolioByIndustry?.length
            ? det.portfolioByIndustry.map((p: { industry: string; percentage: number }) => ({ industry: p.industry || "", percentage: String(p.percentage) }))
            : [{ industry: "", percentage: "" }],
          portfolioByRatingClass: det.portfolioByRatingClass?.length
            ? det.portfolioByRatingClass.map((p: { ratingClass: string; percentage: number }) => ({ ratingClass: p.ratingClass || "", percentage: String(p.percentage) }))
            : [{ ratingClass: "", percentage: "" }],
          topHoldings: det.topHoldings?.length
            ? det.topHoldings.map((h: { name: string; percentage: number; sector?: string; rating?: string }) => ({ name: h.name || "", percentage: String(h.percentage), sector: h.sector || "", rating: h.rating || "" }))
            : [{ name: "", percentage: "", sector: "", rating: "" }],
          factsheets: (det.factsheets || []).map((f: Factsheet) => ({
            url: f.url, filename: f.filename, uploadedAt: f.uploadedAt,
          })),
          suitableFor: det.suitableFor || "",
          notSuitableFor: det.notSuitableFor || "",
          bullMarket: det.bullMarket || "",
          bearMarket: det.bearMarket || "",
          sidewaysMarket: det.sidewaysMarket || "",
          howItWorks: det.howItWorks || "",
          mfEquivalent: det.mfEquivalent || "",
          portfolioFit: det.portfolioFit || "",
        });
      } else {
        setForm(EMPTY_FORM);
      }
    } finally {
      setLoadingFund(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPdf(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/admin/fund-details/upload-pdf", { method: "POST", body: fd });
      const d = await r.json();
      if (d.url) {
        setForm(prev => ({
          ...prev,
          factsheets: [...prev.factsheets, { url: d.url, filename: d.filename, uploadedAt: new Date().toISOString() }],
        }));
      }
    } finally {
      setUploadingPdf(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeFactsheet = (idx: number) => {
    setForm(prev => ({ ...prev, factsheets: prev.factsheets.filter((_, i) => i !== idx) }));
  };

  const handleAnalyse = async () => {
    setAnalysing(true);
    setAiError("");
    setAiResult(null);
    try {
      const activeModel = provider === "openrouter" ? customModel : model;
      const useManualEntry = !savedConfig || overrideConfig;
      const r = await fetch("/api/admin/fund-details/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fundName: selectedFund,
          pdfUrls: form.factsheets.map(f => f.url),
          ...(useManualEntry ? { provider, model: activeModel, apiKey } : {}),
        }),
      });
      const d = await r.json();
      if (d.extracted) setAiResult(d.extracted);
      else {
        const details = d.details?.length ? `\n${(d.details as string[]).join("\n")}` : "";
        setAiError((d.error || "Analysis failed") + details);
      }
    } catch {
      setAiError("Network error — check console");
    } finally {
      setAnalysing(false);
    }
  };

  const applyField = (field: keyof AiResult) => {
    if (!aiResult || aiResult[field] == null) return;
    const val = aiResult[field];
    if (field === "fundManagers") {
      const arr = (val as { name: string; designation?: string }[]) || [];
      setForm(prev => ({ ...prev, fundManagers: arr.map(m => ({ name: m.name, designation: m.designation || "" })) }));
    } else if (field === "assetAllocation") {
      const arr = (val as { assetClass: string; percentage: number }[]) || [];
      setForm(prev => ({ ...prev, assetAllocation: arr.map(a => ({ assetClass: a.assetClass, percentage: String(a.percentage) })) }));
    } else if (field === "portfolioByIndustry") {
      const arr = (val as { industry: string; percentage: number }[]) || [];
      setForm(prev => ({ ...prev, portfolioByIndustry: arr.map(p => ({ industry: p.industry, percentage: String(p.percentage) })) }));
    } else if (field === "portfolioByRatingClass") {
      const arr = (val as { ratingClass: string; percentage: number }[]) || [];
      setForm(prev => ({ ...prev, portfolioByRatingClass: arr.map(p => ({ ratingClass: p.ratingClass, percentage: String(p.percentage) })) }));
    } else if (field === "topHoldings") {
      const arr = (val as { name: string; percentage: number; sector?: string; rating?: string }[]) || [];
      setForm(prev => ({ ...prev, topHoldings: arr.map(h => ({ name: h.name, percentage: String(h.percentage), sector: h.sector || "", rating: h.rating || "" })) }));
    } else {
      setForm(prev => ({ ...prev, [field]: val != null ? String(val) : "" }));
    }
  };

  const applyAll = () => {
    if (!aiResult) return;
    (Object.keys(aiResult) as (keyof AiResult)[]).forEach(k => {
      if (aiResult[k] != null) applyField(k);
    });
  };

  const handleSave = async () => {
    if (!selectedFund) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const r = await fetch("/api/admin/fund-details/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fundName: selectedFund,
          riskBand: form.riskBand !== "" ? Number(form.riskBand) : null,
          schemeType: form.schemeType,
          exitLoad: form.exitLoad,
          aumCurrent: form.aumCurrent !== "" ? Number(form.aumCurrent) : null,
          aumAggregate: form.aumAggregate !== "" ? Number(form.aumAggregate) : null,
          minInvestment: form.minInvestment !== "" ? Number(form.minInvestment) : 10_000_000,
          additionalInvestment: form.additionalInvestment !== "" ? Number(form.additionalInvestment) : 10_000,
          fundManagers: form.fundManagers.filter(m => m.name.trim()),
          benchmarkName: form.benchmarkName,
          benchmarkRiskBand: form.benchmarkRiskBand !== "" ? Number(form.benchmarkRiskBand) : null,
          benchmarkDetails: form.benchmarkDetails,
          assetAllocation: form.assetAllocation
            .filter(a => a.assetClass.trim())
            .map(a => ({ assetClass: a.assetClass, percentage: Number(a.percentage) || 0 })),
          portfolioByIndustry: form.portfolioByIndustry
            .filter(p => p.industry.trim())
            .map(p => ({ industry: p.industry, percentage: Number(p.percentage) || 0 })),
          portfolioByRatingClass: form.portfolioByRatingClass
            .filter(p => p.ratingClass.trim())
            .map(p => ({ ratingClass: p.ratingClass, percentage: Number(p.percentage) || 0 })),
          topHoldings: form.topHoldings
            .filter(h => h.name.trim())
            .map(h => ({ name: h.name, percentage: Number(h.percentage) || 0, sector: h.sector, rating: h.rating || undefined })),
          factsheets: form.factsheets,
          suitableFor: form.suitableFor,
          notSuitableFor: form.notSuitableFor,
          bullMarket: form.bullMarket,
          bearMarket: form.bearMarket,
          sidewaysMarket: form.sidewaysMarket,
          howItWorks: form.howItWorks,
          mfEquivalent: form.mfEquivalent,
          portfolioFit: form.portfolioFit,
        }),
      });
      const d = await r.json();
      setSaveMsg({ ok: d.ok, text: d.ok ? "Saved successfully" : d.error || "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  // ── Form helpers ──────────────────────────────────────────────────────────

  const setField = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const updateManager = (i: number, k: keyof Manager, v: string) =>
    setForm(prev => ({ ...prev, fundManagers: prev.fundManagers.map((m, idx) => idx === i ? { ...m, [k]: v } : m) }));
  const addManager = () => setForm(prev => ({ ...prev, fundManagers: [...prev.fundManagers, { name: "", designation: "" }] }));
  const removeManager = (i: number) => setForm(prev => ({ ...prev, fundManagers: prev.fundManagers.filter((_, idx) => idx !== i) }));

  const updateAllocation = (i: number, k: keyof Allocation, v: string) =>
    setForm(prev => ({ ...prev, assetAllocation: prev.assetAllocation.map((a, idx) => idx === i ? { ...a, [k]: v } : a) }));
  const addAllocation = () => setForm(prev => ({ ...prev, assetAllocation: [...prev.assetAllocation, { assetClass: "", percentage: "" }] }));
  const removeAllocation = (i: number) => setForm(prev => ({ ...prev, assetAllocation: prev.assetAllocation.filter((_, idx) => idx !== i) }));

  const updateIndustryAlloc = (i: number, k: keyof IndustryAlloc, v: string) =>
    setForm(prev => ({ ...prev, portfolioByIndustry: prev.portfolioByIndustry.map((p, idx) => idx === i ? { ...p, [k]: v } : p) }));
  const addIndustryAlloc = () => setForm(prev => ({ ...prev, portfolioByIndustry: [...prev.portfolioByIndustry, { industry: "", percentage: "" }] }));
  const removeIndustryAlloc = (i: number) => setForm(prev => ({ ...prev, portfolioByIndustry: prev.portfolioByIndustry.filter((_, idx) => idx !== i) }));

  const updateRatingAlloc = (i: number, k: keyof RatingAlloc, v: string) =>
    setForm(prev => ({ ...prev, portfolioByRatingClass: prev.portfolioByRatingClass.map((p, idx) => idx === i ? { ...p, [k]: v } : p) }));
  const addRatingAlloc = () => setForm(prev => ({ ...prev, portfolioByRatingClass: [...prev.portfolioByRatingClass, { ratingClass: "", percentage: "" }] }));
  const removeRatingAlloc = (i: number) => setForm(prev => ({ ...prev, portfolioByRatingClass: prev.portfolioByRatingClass.filter((_, idx) => idx !== i) }));

  const updateHolding = (i: number, k: keyof Holding, v: string) =>
    setForm(prev => ({ ...prev, topHoldings: prev.topHoldings.map((h, idx) => idx === i ? { ...h, [k]: v } : h) }));
  const addHolding = () => setForm(prev => ({ ...prev, topHoldings: [...prev.topHoldings, { name: "", percentage: "", sector: "", rating: "" }] }));
  const removeHolding = (i: number) => setForm(prev => ({ ...prev, topHoldings: prev.topHoldings.filter((_, idx) => idx !== i) }));

  // ── Render ────────────────────────────────────────────────────────────────

  const usingSavedConfig = !!savedConfig && !overrideConfig;
  const canAnalyse = !!selectedFund && form.factsheets.length > 0 &&
    (usingSavedConfig || (!!apiKey && (provider !== "openrouter" ? !!model : !!customModel)));

  const aiDisplayValue = (field: keyof AiResult): string | null => {
    const val = aiResult?.[field];
    if (val == null) return null;
    if (Array.isArray(val)) return JSON.stringify(val, null, 2);
    return String(val);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 px-8 pt-7 pb-5 border-b border-[#E2E8F0] bg-white flex items-center gap-6">
        <div>
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.13em] text-primary mb-0.5">Admin</p>
          <h1 className="text-[22px] font-bold text-[#0B1F3A] tracking-[-0.4px]">Fund Details</h1>
        </div>

        <div className="flex items-center gap-3 ml-auto flex-wrap justify-end">
          {/* Brand filter */}
          <div className="flex items-center gap-2">
            <label className="text-[12px] font-medium text-[#64748B]">Brand</label>
            <div className="relative">
              <select
                value={selectedBrand}
                onChange={e => handleBrandChange(e.target.value)}
                className={`appearance-none pl-3 pr-8 py-2 rounded-[8px] border bg-white text-[13px] focus:outline-none focus:border-primary min-w-[160px] cursor-pointer transition-colors ${selectedBrand ? "border-primary text-primary font-medium" : "border-[#E2E8F0] text-[#0B1F3A]"}`}
              >
                <option value="">All brands</option>
                {brandNames.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#94A3B8] pointer-events-none" />
            </div>
          </div>

          {/* Fund selector */}
          <div className="flex items-center gap-2">
            <label className="text-[12px] font-medium text-[#64748B]">Fund</label>
            <div className="relative">
              <select
                value={selectedFund}
                onChange={e => handleSelectFund(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-[8px] border border-[#E2E8F0] bg-white text-[13px] text-[#0B1F3A] focus:outline-none focus:border-primary min-w-[260px] cursor-pointer"
              >
                <option value="">— Select a fund —</option>
                {fundNames.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#94A3B8] pointer-events-none" />
            </div>
            {loadingFund && <Loader2 className="size-4 animate-spin text-primary" />}
          </div>
        </div>
      </div>

      {/* Two-panel body */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT: Current Record ─────────────────────────────────────────── */}
        <div className="w-[55%] overflow-y-auto border-r border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="px-7 py-6">
            {!selectedFund ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <FileText className="size-10 text-[#CBD5E1] mb-3" />
                <p className="text-[14px] font-medium text-[#94A3B8]">Select a fund to view or edit its details</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[15px] font-bold text-[#0B1F3A]">Current Record</h2>
                  {saveMsg && (
                    <span className={`text-[12px] font-medium px-2.5 py-1 rounded-full ${saveMsg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                      {saveMsg.text}
                    </span>
                  )}
                </div>

                {/* Overview */}
                <SectionHeader title="Overview" />
                <div className="grid grid-cols-2 gap-x-4">
                  <FieldRow label="Risk Band">
                    <select className={inputCls} value={form.riskBand} onChange={setField("riskBand")}>
                      <option value="">— select —</option>
                      <option value="1">1 · Low</option>
                      <option value="2">2 · Low to Moderate</option>
                      <option value="3">3 · Moderate</option>
                      <option value="4">4 · Moderately High</option>
                      <option value="5">5 · High</option>
                    </select>
                    {aiResult?.riskBand != null && <AiValueBadge value={`Band ${aiResult.riskBand}`} onApply={() => applyField("riskBand")} />}
                  </FieldRow>
                  <FieldRow label="Scheme Type">
                    <input className={inputCls} value={form.schemeType} onChange={setField("schemeType")} placeholder="e.g. Category III AIF" />
                    {aiResult?.schemeType != null && <AiValueBadge value={String(aiResult.schemeType)} onApply={() => applyField("schemeType")} />}
                  </FieldRow>
                </div>
                <FieldRow label="Exit Load">
                  <input className={inputCls} value={form.exitLoad} onChange={setField("exitLoad")} placeholder="e.g. 2% if redeemed within 1 year" />
                  {aiResult?.exitLoad != null && <AiValueBadge value={String(aiResult.exitLoad)} onApply={() => applyField("exitLoad")} />}
                </FieldRow>

                {/* AUM */}
                <SectionHeader title="AUM (₹ Crore)" />
                <div className="grid grid-cols-3 gap-x-4">
                  <FieldRow label="Current AUM">
                    <input type="number" className={inputCls} value={form.aumCurrent} onChange={setField("aumCurrent")} placeholder="0.00" />
                    {aiResult?.aumCurrent != null && <AiValueBadge value={String(aiResult.aumCurrent)} onApply={() => applyField("aumCurrent")} />}
                  </FieldRow>
                  <FieldRow label="Monthly AAUM (₹ Cr)">
                    <input type="number" className={inputCls} value={form.aumAggregate} onChange={setField("aumAggregate")} placeholder="0.00" />
                    {aiResult?.aumAggregate != null && <AiValueBadge value={String(aiResult.aumAggregate)} onApply={() => applyField("aumAggregate")} />}
                  </FieldRow>
                </div>

                {/* Investment */}
                <SectionHeader title="Minimum Investment (₹)" />
                <div className="grid grid-cols-2 gap-x-4">
                  <FieldRow label="Minimum Investment">
                    <input type="number" className={inputCls} value={form.minInvestment} onChange={setField("minInvestment")} placeholder="10000000" />
                    {aiResult?.minInvestment != null && <AiValueBadge value={String(aiResult.minInvestment)} onApply={() => applyField("minInvestment")} />}
                  </FieldRow>
                  <FieldRow label="Additional Investment">
                    <input type="number" className={inputCls} value={form.additionalInvestment} onChange={setField("additionalInvestment")} placeholder="10000" />
                    {aiResult?.additionalInvestment != null && <AiValueBadge value={String(aiResult.additionalInvestment)} onApply={() => applyField("additionalInvestment")} />}
                  </FieldRow>
                </div>

                {/* Fund Managers */}
                <SectionHeader title="Fund Managers" />
                {aiResult?.fundManagers != null && (
                  <AiValueBadge
                    value={(aiResult.fundManagers as { name: string; designation?: string }[]).map(m => `${m.name}${m.designation ? ` (${m.designation})` : ""}`).join(", ")}
                    onApply={() => applyField("fundManagers")}
                  />
                )}
                <div className="space-y-2 mt-2">
                  {form.fundManagers.map((m, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input className={inputCls} value={m.name} onChange={e => updateManager(i, "name", e.target.value)} placeholder="Manager name" />
                      <input className={inputCls} value={m.designation} onChange={e => updateManager(i, "designation", e.target.value)} placeholder="Designation" />
                      {form.fundManagers.length > 1 && (
                        <button onClick={() => removeManager(i)} className="shrink-0 p-1.5 rounded-[6px] text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 transition-colors">
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={addManager} className="flex items-center gap-1.5 text-[12px] text-primary hover:text-[#1E3A8A] transition-colors mt-1">
                    <Plus className="size-3.5" /> Add manager
                  </button>
                </div>

                {/* Benchmark */}
                <SectionHeader title="Benchmark" />
                <div className="grid grid-cols-2 gap-x-4">
                  <FieldRow label="Benchmark Name">
                    <input className={inputCls} value={form.benchmarkName} onChange={setField("benchmarkName")} placeholder="e.g. Nifty 50 TRI" />
                    {aiResult?.benchmarkName != null && <AiValueBadge value={String(aiResult.benchmarkName)} onApply={() => applyField("benchmarkName")} />}
                  </FieldRow>
                  <FieldRow label="Benchmark Risk Band">
                    <select className={inputCls} value={form.benchmarkRiskBand} onChange={setField("benchmarkRiskBand")}>
                      <option value="">— select —</option>
                      <option value="1">1 · Low</option>
                      <option value="2">2 · Low to Moderate</option>
                      <option value="3">3 · Moderate</option>
                      <option value="4">4 · Moderately High</option>
                      <option value="5">5 · High</option>
                    </select>
                    {aiResult?.benchmarkRiskBand != null && <AiValueBadge value={`Band ${aiResult.benchmarkRiskBand}`} onApply={() => applyField("benchmarkRiskBand")} />}
                  </FieldRow>
                </div>
                <FieldRow label="Benchmark Details">
                  <textarea className={`${textareaCls} h-16`} value={form.benchmarkDetails} onChange={setField("benchmarkDetails")} placeholder="Description of benchmark composition..." />
                  {aiResult?.benchmarkDetails != null && <AiValueBadge value={String(aiResult.benchmarkDetails)} onApply={() => applyField("benchmarkDetails")} />}
                </FieldRow>

                {/* Asset Allocation */}
                <SectionHeader title="Asset Allocation" />
                {aiResult?.assetAllocation != null && (
                  <AiValueBadge
                    value={(aiResult.assetAllocation as { assetClass: string; percentage: number }[]).map(a => `${a.assetClass}: ${a.percentage}%`).join(", ")}
                    onApply={() => applyField("assetAllocation")}
                  />
                )}
                <div className="space-y-2 mt-2">
                  {form.assetAllocation.map((a, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input className={inputCls} value={a.assetClass} onChange={e => updateAllocation(i, "assetClass", e.target.value)} placeholder="Asset class (e.g. Equity)" />
                      <div className="relative w-28 shrink-0">
                        <input type="number" className={inputCls} value={a.percentage} onChange={e => updateAllocation(i, "percentage", e.target.value)} placeholder="%" />
                      </div>
                      {form.assetAllocation.length > 1 && (
                        <button onClick={() => removeAllocation(i)} className="shrink-0 p-1.5 rounded-[6px] text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 transition-colors">
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={addAllocation} className="flex items-center gap-1.5 text-[12px] text-primary hover:text-[#1E3A8A] transition-colors mt-1">
                    <Plus className="size-3.5" /> Add asset class
                  </button>
                </div>

                {/* Portfolio by Industry */}
                <SectionHeader title="Portfolio by Industry" />
                {aiResult?.portfolioByIndustry != null && (
                  <AiValueBadge
                    value={(aiResult.portfolioByIndustry as { industry: string; percentage: number }[]).map(p => `${p.industry}: ${p.percentage}%`).join(", ")}
                    onApply={() => applyField("portfolioByIndustry")}
                  />
                )}
                <div className="space-y-2 mt-2">
                  {form.portfolioByIndustry.map((p, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input className={inputCls} value={p.industry} onChange={e => updateIndustryAlloc(i, "industry", e.target.value)} placeholder="Industry / sector" />
                      <div className="relative w-28 shrink-0">
                        <input type="number" className={inputCls} value={p.percentage} onChange={e => updateIndustryAlloc(i, "percentage", e.target.value)} placeholder="%" />
                      </div>
                      {form.portfolioByIndustry.length > 1 && (
                        <button onClick={() => removeIndustryAlloc(i)} className="shrink-0 p-1.5 rounded-[6px] text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 transition-colors">
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={addIndustryAlloc} className="flex items-center gap-1.5 text-[12px] text-primary hover:text-[#1E3A8A] transition-colors mt-1">
                    <Plus className="size-3.5" /> Add industry
                  </button>
                </div>

                {/* Portfolio by Rating Class */}
                <SectionHeader title="Portfolio by Rating Class" />
                {aiResult?.portfolioByRatingClass != null && (
                  <AiValueBadge
                    value={(aiResult.portfolioByRatingClass as { ratingClass: string; percentage: number }[]).map(p => `${p.ratingClass}: ${p.percentage}%`).join(", ")}
                    onApply={() => applyField("portfolioByRatingClass")}
                  />
                )}
                <div className="space-y-2 mt-2">
                  {form.portfolioByRatingClass.map((p, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input className={inputCls} value={p.ratingClass} onChange={e => updateRatingAlloc(i, "ratingClass", e.target.value)} placeholder="Rating class (e.g. AAA Equivalent)" />
                      <div className="relative w-28 shrink-0">
                        <input type="number" className={inputCls} value={p.percentage} onChange={e => updateRatingAlloc(i, "percentage", e.target.value)} placeholder="%" />
                      </div>
                      {form.portfolioByRatingClass.length > 1 && (
                        <button onClick={() => removeRatingAlloc(i)} className="shrink-0 p-1.5 rounded-[6px] text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 transition-colors">
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={addRatingAlloc} className="flex items-center gap-1.5 text-[12px] text-primary hover:text-[#1E3A8A] transition-colors mt-1">
                    <Plus className="size-3.5" /> Add rating class
                  </button>
                </div>

                {/* Top Holdings */}
                <SectionHeader title="Top Holdings" />
                {aiResult?.topHoldings != null && (
                  <AiValueBadge
                    value={(aiResult.topHoldings as { name: string; percentage: number; sector?: string }[]).map(h => `${h.name} ${h.percentage}%`).join(", ")}
                    onApply={() => applyField("topHoldings")}
                  />
                )}
                <div className="space-y-2 mt-2">
                  {form.topHoldings.map((h, i) => (
                    <div key={i} className="flex flex-col gap-1.5 pb-2 border-b border-[#F1F5F9] last:border-0">
                      <div className="flex gap-2 items-center">
                        <input className={`${inputFlexCls} flex-1`} value={h.name} onChange={e => updateHolding(i, "name", e.target.value)} placeholder="Company / instrument name" />
                        {form.topHoldings.length > 1 && (
                          <button onClick={() => removeHolding(i)} className="shrink-0 p-1.5 rounded-[6px] text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 transition-colors">
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2 items-center">
                        <input className={`${inputFlexCls} w-[90px] shrink-0`} value={h.percentage} onChange={e => updateHolding(i, "percentage", e.target.value)} placeholder="% of NAV" type="number" />
                        <input className={`${inputFlexCls} flex-1`} value={h.sector} onChange={e => updateHolding(i, "sector", e.target.value)} placeholder="Industry / sector" />
                        <input className={`${inputFlexCls} w-28 shrink-0`} value={h.rating} onChange={e => updateHolding(i, "rating", e.target.value)} placeholder="Rating" />
                      </div>
                    </div>
                  ))}
                  <button onClick={addHolding} className="flex items-center gap-1.5 text-[12px] text-primary hover:text-[#1E3A8A] transition-colors mt-1">
                    <Plus className="size-3.5" /> Add holding
                  </button>
                </div>

                {/* Investor Suitability */}
                <SectionHeader title="Investor Suitability" />
                <FieldRow label="Suitable For">
                  <textarea className={`${textareaCls} h-24`} value={form.suitableFor} onChange={setField("suitableFor")} placeholder="Describe the investor profile, risk appetite, and goals this SIF is suitable for..." />
                  {aiResult?.suitableFor != null && <AiValueBadge value={String(aiResult.suitableFor)} onApply={() => applyField("suitableFor")} />}
                </FieldRow>
                <FieldRow label="Not Suitable For">
                  <textarea className={`${textareaCls} h-24`} value={form.notSuitableFor} onChange={setField("notSuitableFor")} placeholder="Describe investor types who should avoid this SIF..." />
                  {aiResult?.notSuitableFor != null && <AiValueBadge value={String(aiResult.notSuitableFor)} onApply={() => applyField("notSuitableFor")} />}
                </FieldRow>

                {/* Market Scenarios */}
                <SectionHeader title="Market Scenario Performance" />
                <FieldRow label="In Bull Markets">
                  <textarea className={`${textareaCls} h-20`} value={form.bullMarket} onChange={setField("bullMarket")} placeholder="How does this fund perform in bull markets and why..." />
                  {aiResult?.bullMarket != null && <AiValueBadge value={String(aiResult.bullMarket)} onApply={() => applyField("bullMarket")} />}
                </FieldRow>
                <FieldRow label="In Bear Markets">
                  <textarea className={`${textareaCls} h-20`} value={form.bearMarket} onChange={setField("bearMarket")} placeholder="How does this fund perform in bear markets and why..." />
                  {aiResult?.bearMarket != null && <AiValueBadge value={String(aiResult.bearMarket)} onApply={() => applyField("bearMarket")} />}
                </FieldRow>
                <FieldRow label="In Sideways Markets">
                  <textarea className={`${textareaCls} h-20`} value={form.sidewaysMarket} onChange={setField("sidewaysMarket")} placeholder="How does this fund perform in sideways / range-bound markets and why..." />
                  {aiResult?.sidewaysMarket != null && <AiValueBadge value={String(aiResult.sidewaysMarket)} onApply={() => applyField("sidewaysMarket")} />}
                </FieldRow>

                {/* Fund Fit */}
                <SectionHeader title="Where Does This Fund Fit For You?" />
                <FieldRow label="How This Fund Works">
                  <textarea className={`${textareaCls} h-24`} value={form.howItWorks} onChange={setField("howItWorks")} placeholder="Concise explanation of the fund strategy mechanics..." />
                  {aiResult?.howItWorks != null && <AiValueBadge value={String(aiResult.howItWorks)} onApply={() => applyField("howItWorks")} />}
                </FieldRow>
                <FieldRow label="MF Equivalent">
                  <textarea className={`${textareaCls} h-16`} value={form.mfEquivalent} onChange={setField("mfEquivalent")} placeholder="Closest mutual fund category or equivalent..." />
                  {aiResult?.mfEquivalent != null && <AiValueBadge value={String(aiResult.mfEquivalent)} onApply={() => applyField("mfEquivalent")} />}
                </FieldRow>
                <FieldRow label="Portfolio Fit">
                  <textarea className={`${textareaCls} h-20`} value={form.portfolioFit} onChange={setField("portfolioFit")} placeholder="Where this fund fits in an investor's portfolio (e.g. satellite, core, hedge)..." />
                  {aiResult?.portfolioFit != null && <AiValueBadge value={String(aiResult.portfolioFit)} onApply={() => applyField("portfolioFit")} />}
                </FieldRow>

                {/* Save */}
                <div className="mt-8 pt-6 border-t border-[#E2E8F0] flex items-center gap-3 flex-wrap">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-primary text-white text-[13px] font-semibold hover:bg-[#1E3A8A] transition-colors disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                    Save Record
                  </button>
                  {saveMsg && (
                    <span className={`text-[12px] font-medium px-3 py-1.5 rounded-full ${saveMsg.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                      {saveMsg.text}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT: AI Analysis ───────────────────────────────────────────── */}
        <div className="w-[45%] overflow-y-auto bg-white">
          <div className="px-7 py-6">

            {/* Factsheets */}
            <h2 className="text-[15px] font-bold text-[#0B1F3A] mb-4">Factsheets</h2>

            {form.factsheets.length > 0 && (
              <div className="space-y-2 mb-4">
                {form.factsheets.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC]">
                    <FileText className="size-4 text-primary shrink-0" />
                    <span className="text-[12px] text-[#0B1F3A] flex-1 truncate">{f.filename}</span>
                    <a href={f.url} target="_blank" rel="noreferrer" className="text-[#94A3B8] hover:text-primary transition-colors">
                      <ExternalLink className="size-3.5" />
                    </a>
                    <button onClick={() => removeFactsheet(i)} className="text-[#94A3B8] hover:text-[#EF4444] transition-colors ml-1">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.xlsx,.xls"
              className="hidden"
              onChange={handlePdfUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPdf || !selectedFund}
              className="flex items-center gap-2 px-4 py-2 rounded-[8px] border border-[#E2E8F0] text-[13px] font-medium text-[#475569] hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
            >
              {uploadingPdf ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
              Upload PDF / Excel
            </button>
            {!selectedFund && <p className="text-[11.5px] text-[#94A3B8] mt-1.5">Select a fund first</p>}

            {/* AI Config */}
            {selectedFund && <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
              <h2 className="text-[15px] font-bold text-[#0B1F3A] mb-4">AI Analysis</h2>

              {savedConfig && (
                <div className="flex items-center justify-between gap-3 mb-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[8px] px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-[#15803D]">
                      Using saved config — {savedConfig.label}
                    </p>
                    <p className="text-[11px] text-[#16A34A] font-mono mt-0.5 truncate">
                      {PROVIDERS[savedConfig.provider]?.label ?? savedConfig.provider} · {savedConfig.modelName}
                    </p>
                  </div>
                  <button
                    onClick={() => setOverrideConfig(v => !v)}
                    className="shrink-0 text-[11px] font-semibold text-[#15803D] hover:text-[#166534] transition-colors"
                  >
                    {overrideConfig ? "Use saved config" : "Override manually ▾"}
                  </button>
                </div>
              )}

              {!usingSavedConfig && <>
              {/* Provider tabs */}
              <div className="flex gap-1 mb-4 bg-[#F1F5F9] rounded-[8px] p-1">
                {(Object.keys(PROVIDERS) as Provider[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setProvider(p)}
                    className={`flex-1 py-1.5 rounded-[6px] text-[12px] font-semibold transition-colors ${provider === p ? "bg-white text-[#0B1F3A] shadow-sm" : "text-[#94A3B8] hover:text-[#475569]"}`}
                  >
                    {PROVIDERS[p].label}
                  </button>
                ))}
              </div>

              {/* Model */}
              <div className="mb-3">
                <label className="block text-[12px] font-medium text-[#64748B] mb-1">Model</label>
                {provider === "openrouter" ? (
                  <input
                    className={inputCls}
                    value={customModel}
                    onChange={e => setCustomModel(e.target.value)}
                    placeholder="e.g. anthropic/claude-3.5-sonnet"
                  />
                ) : (
                  <div className="relative">
                    <select
                      value={model}
                      onChange={e => setModel(e.target.value)}
                      className="appearance-none w-full pl-3 pr-8 py-2 rounded-[8px] border border-[#E2E8F0] bg-white text-[13px] text-[#0B1F3A] focus:outline-none focus:border-primary"
                    >
                      {PROVIDERS[provider].models.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#94A3B8] pointer-events-none" />
                  </div>
                )}
              </div>

              {/* API Key */}
              <div className="mb-4">
                <label className="block text-[12px] font-medium text-[#64748B] mb-1">
                  API Key <span className="text-[#94A3B8] font-normal">(saved locally in browser)</span>
                </label>
                <input
                  type="password"
                  className={inputCls}
                  value={apiKey}
                  onChange={e => handleApiKeyChange(e.target.value)}
                  placeholder={`Your ${PROVIDERS[provider].label} API key`}
                  autoComplete="off"
                />
              </div>
              </>}

              {/* Analyse button */}
              <button
                onClick={handleAnalyse}
                disabled={!canAnalyse || analysing}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[8px] bg-[#0B1F3A] text-white text-[13px] font-semibold hover:bg-[#1E3A8A] transition-colors disabled:opacity-50"
              >
                {analysing ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
                {analysing ? "Analysing factsheet…" : "Analyse Factsheet"}
              </button>

              {!canAnalyse && !analysing && (
                <p className="text-[11.5px] text-[#94A3B8] mt-2 text-center">
                  {!selectedFund ? "Select a fund" : !form.factsheets.length ? "Upload at least one PDF" : "Enter API key"}
                </p>
              )}

              {/* AI Error */}
              {aiError && (
                <div className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-[8px]">
                  <AlertCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-red-700">{aiError}</p>
                </div>
              )}

              {/* AI Results */}
              {aiResult && (
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[13px] font-bold text-[#0B1F3A]">Extracted Data</p>
                    <button
                      onClick={applyAll}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-primary text-white text-[11.5px] font-semibold hover:bg-[#1E3A8A] transition-colors"
                    >
                      <Check className="size-3" /> Apply All
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(Object.keys(aiResult) as (keyof AiResult)[])
                      .filter(k => aiResult[k] != null)
                      .map(field => {
                        const display = aiDisplayValue(field);
                        if (!display) return null;
                        const label = {
                          riskBand: "Risk Band",
                          schemeType: "Scheme Type",
                          exitLoad: "Exit Load",
                          aumCurrent: "Current AUM (₹ Cr)",
                          aumAggregate: "Monthly AAUM (₹ Cr)",
                          minInvestment: "Min Investment (₹)",
                          additionalInvestment: "Additional Investment (₹)",
                          fundManagers: "Fund Managers",
                          benchmarkName: "Benchmark Name",
                          benchmarkRiskBand: "Benchmark Risk Band",
                          benchmarkDetails: "Benchmark Details",
                          assetAllocation: "Asset Allocation",
                          portfolioByIndustry: "Portfolio by Industry",
                          portfolioByRatingClass: "Portfolio by Rating Class",
                          topHoldings: "Top Holdings",
                          suitableFor: "Suitable For",
                          notSuitableFor: "Not Suitable For",
                          bullMarket: "Bull Market Performance",
                          bearMarket: "Bear Market Performance",
                          sidewaysMarket: "Sideways Market Performance",
                          howItWorks: "How This Fund Works",
                          mfEquivalent: "MF Equivalent",
                          portfolioFit: "Portfolio Fit",
                        }[field] || field;

                        return (
                          <div key={field} className="rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-mono font-semibold uppercase tracking-wide text-[#64748B]">{label}</span>
                              <button
                                onClick={() => applyField(field)}
                                className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-[#1E3A8A] transition-colors"
                              >
                                <Check className="size-3" /> Apply
                              </button>
                            </div>
                            <p className="text-[12px] text-[#0B1F3A] leading-relaxed whitespace-pre-wrap break-words">
                              {Array.isArray(aiResult[field]) ? display : display}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>}
          </div>
        </div>
      </div>
    </div>
  );
}
