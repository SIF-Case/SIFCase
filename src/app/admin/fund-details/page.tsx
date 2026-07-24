"use client";

import { useState, useEffect, useRef } from "react";
import {
  FileText, Plus, Trash2, ExternalLink, Loader2,
  Wand2, Check, ChevronDown, Upload, AlertCircle, RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Manager = { name: string; designation: string; experienceYears: string; managingSince: string };
type Allocation = { assetClass: string; percentage: string };
type IndustryAlloc = { industry: string; percentage: string; marketValue: string; change1M: string };
type Holding = { name: string; percentage: string; sector: string; rating: string; marketValue: string; change1M: string };
type Factsheet = { url: string; filename: string; documentType: string; uploadedAt: string };
type TerSlab = { aumSlab: string; ter: string };
type TerPlanCosts = { ber: string; brokerageCost: string; transactionCost: string; statutoryLevies: string; ter: string };
type TerBreakdownForm = { terYear: string; terDate: string; regular: TerPlanCosts; direct: TerPlanCosts };

// ── finapi.upvaly.com sync fields ──────────────────────────────────────────
type FundamentalsForm = {
  pe: string; categoryAveragePe: string;
  pb: string; categoryAveragePb: string;
  priceToSale: string; categoryAveragePriceToSale: string;
  priceToCashFlow: string; categoryAveragePriceToCashFlow: string;
  dividendYield: string; categoryAverageDividendYield: string;
  roe: string; categoryAverageRoe: string;
};
type ConcentrationForm = {
  numberOfHoldings: string; averageMarketCap: string;
  top3SectorWeight: string; top5StocksWeight: string; top10StocksWeight: string;
};
type MarketCapForm = { largeCap: string; midCap: string; smallCap: string; others: string };
type RollingReturnRow = {
  timeframe: string; averageReturn: string; medianReturn: string;
  minReturn: string; minPeriod: string; maxReturn: string; maxPeriod: string;
  standardDeviation: string; downsideDeviation: string;
  positiveRatio: string; negativeRatio: string; consistencyScore: string;
};
type CategoryRankRow = { timeframe: string; annualizedReturn: string; categoryAverage: string; rankInCategory: string };
type PeerRow = { schemeCode: string; isin: string; schemeName: string; schemeNameShort: string; aum: string; pe: string; pb: string; dividendYield: string; expenseRatio: string };
type AmcSchemeRow = { schemeCode: string; isin: string; schemeName: string; schemeShortName: string; morningstarRating: string; aum: string; return1y: string; return3y: string; return7y: string; return10y: string };

const DOCUMENT_TYPES = [
  "Factsheet",
  "KIM",
  "Excel",
  "XLS - Summary Document",
  "PPT",
];

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
  topHoldings: Holding[];
  factsheets: Factsheet[];
  // Fund Structure
  schemeCategory: string;
  inceptionDate: string;
  // Redemption & Liquidity
  redemptionFrequency: string;
  // Investment Limits
  // Expenses & Taxation
  terMax: string;
  terSlabs: TerSlab[];
  /** Per-plan TER split from the AMFI TER feed. Regular vs Direct cost components. */
  terBreakdown: TerBreakdownForm;
  taxationSummary: string;
  /** Free-text mandate range from the AMFI SSD, e.g. "Equity 80–100%". SSD-owned. */
  statedAssetAllocation: string;
  // Derivatives & Risk Controls
  // Strategy Detail
  // Fund Administration
  sponsorName: string;
  amcName: string;
  trusteeName: string;
  registrarName: string;
  // Investor Suitability
  suitableFor: string;
  notSuitableFor: string;
  // Market Scenarios
  bullMarket: string;
  bearMarket: string;
  sidewaysMarket: string;
  // Fund Fit
  mfEquivalent: string;
  portfolioFit: string;
  // ── API (finapi.upvaly.com sync) ──────────────────────────────────────
  isin: string;
  // Read-only AMFI provenance, surfaced in the header — never edited here.
  schemeId: string;
  ssdAvailability: string;
  ssdMissReason: string;
  fundamentals: FundamentalsForm;
  concentration: ConcentrationForm;
  marketCapWeightage: MarketCapForm;
  rollingReturns: RollingReturnRow[];
  categoryRanks: CategoryRankRow[];
  peers: PeerRow[];
  amcOtherFundsCompanyName: string;
  amcOtherFundsSchemeList: AmcSchemeRow[];
};

type AiResult = Partial<{
  riskBand: number | null;
  schemeType: string | null;
  exitLoad: string | null;
  aumCurrent: number | null;
  aumAggregate: number | null;
  minInvestment: number | null;
  additionalInvestment: number | null;
  fundManagers: { name: string; designation?: string; experienceYears?: string | null; managingSince?: string | null }[];
  benchmarkName: string | null;
  benchmarkRiskBand: number | null;
  benchmarkDetails: string | null;
  assetAllocation: { assetClass: string; percentage: number }[];
  portfolioByIndustry: { industry: string; percentage: number }[];
  topHoldings: { name: string; percentage: number; sector?: string; rating?: string }[];
  // Fund Structure
  schemeCategory: string | null;
  inceptionDate: string | null;
  // Redemption & Liquidity
  redemptionFrequency: string | null;
  // Investment Limits
  // Expenses & Taxation
  terMax: string | null;
  terSlabs: { aumSlab: string; ter: string }[];
  taxationSummary: string | null;
  // Derivatives & Risk Controls
  // Strategy Detail
  // Fund Administration
  sponsorName: string | null;
  amcName: string | null;
  trusteeName: string | null;
  registrarName: string | null;
  // Investor Suitability
  suitableFor: string | null;
  notSuitableFor: string | null;
  // Market Scenarios
  bullMarket: string | null;
  bearMarket: string | null;
  sidewaysMarket: string | null;
  // Fund Fit
  mfEquivalent: string | null;
  portfolioFit: string | null;
}>;

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_FORM: FormState = {
  riskBand: "", schemeType: "", exitLoad: "",
  aumCurrent: "", aumAggregate: "",
  minInvestment: "1000000", additionalInvestment: "10000",
  fundManagers: [{ name: "", designation: "", experienceYears: "", managingSince: "" }],
  benchmarkName: "", benchmarkRiskBand: "", benchmarkDetails: "",
  assetAllocation: [{ assetClass: "", percentage: "" }],
  portfolioByIndustry: [{ industry: "", percentage: "", marketValue: "", change1M: "" }],
  topHoldings: [{ name: "", percentage: "", sector: "", rating: "", marketValue: "", change1M: "" }],
  factsheets: [],
  schemeCategory: "", inceptionDate: "",
  redemptionFrequency: "",
  terMax: "",
  terSlabs: [{ aumSlab: "", ter: "" }],
  terBreakdown: {
    terYear: "", terDate: "",
    regular: { ber: "", brokerageCost: "", transactionCost: "", statutoryLevies: "", ter: "" },
    direct: { ber: "", brokerageCost: "", transactionCost: "", statutoryLevies: "", ter: "" },
  },
  taxationSummary: "",
  statedAssetAllocation: "",
  sponsorName: "", amcName: "", trusteeName: "", registrarName: "",
  suitableFor: "", notSuitableFor: "",
  bullMarket: "", bearMarket: "", sidewaysMarket: "",
  mfEquivalent: "", portfolioFit: "",
  isin: "",
  schemeId: "", ssdAvailability: "unchecked", ssdMissReason: "",
  fundamentals: {
    pe: "", categoryAveragePe: "", pb: "", categoryAveragePb: "",
    priceToSale: "", categoryAveragePriceToSale: "", priceToCashFlow: "", categoryAveragePriceToCashFlow: "",
    dividendYield: "", categoryAverageDividendYield: "", roe: "", categoryAverageRoe: "",
  },
  concentration: { numberOfHoldings: "", averageMarketCap: "", top3SectorWeight: "", top5StocksWeight: "", top10StocksWeight: "" },
  marketCapWeightage: { largeCap: "", midCap: "", smallCap: "", others: "" },
  rollingReturns: [{ timeframe: "", averageReturn: "", medianReturn: "", minReturn: "", minPeriod: "", maxReturn: "", maxPeriod: "", standardDeviation: "", downsideDeviation: "", positiveRatio: "", negativeRatio: "", consistencyScore: "" }],
  categoryRanks: [{ timeframe: "", annualizedReturn: "", categoryAverage: "", rankInCategory: "" }],
  peers: [{ schemeCode: "", isin: "", schemeName: "", schemeNameShort: "", aum: "", pe: "", pb: "", dividendYield: "", expenseRatio: "" }],
  amcOtherFundsCompanyName: "",
  amcOtherFundsSchemeList: [{ schemeCode: "", isin: "", schemeName: "", schemeShortName: "", morningstarRating: "", aum: "", return1y: "", return3y: "", return7y: "", return10y: "" }],
};

type Provider = "deepseek" | "gemini" | "openrouter";

const PROVIDERS: Record<Provider, { label: string; models: string[] }> = {
  deepseek: { label: "DeepSeek", models: ["deepseek-chat", "deepseek-reasoner"] },
  gemini: { label: "Gemini", models: ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash", "gemini-1.5-flash"] },
  openrouter: { label: "OpenRouter", models: [] },
};

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

export default function FundDetailsPage() {
  const [brandNames, setBrandNames] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [fundNames, setFundNames] = useState<string[]>([]);
  const [selectedFund, setSelectedFund] = useState("");
  const [loadingFund, setLoadingFund] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [provider, setProvider] = useState<Provider>("deepseek");
  const [model, setModel] = useState(PROVIDERS.deepseek.models[0]);
  const [customModel, setCustomModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [savedConfig, setSavedConfig] = useState<{ label: string; provider: Provider; modelName: string } | null | undefined>(undefined);
  const [overrideConfig, setOverrideConfig] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [generatingNarrative, setGeneratingNarrative] = useState(false);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [aiError, setAiError] = useState("");

  const [uploadingPdf, setUploadingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isinInput, setIsinInput] = useState("");
  const [syncingIsin, setSyncingIsin] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [updatingAll, setUpdatingAll] = useState(false);
  const [sourceOutcomes, setSourceOutcomes] = useState<
    { source: "finapi" | "ssd" | "ter"; ok: boolean; fieldsWritten: string[]; message: string }[] | null
  >(null);

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
    setIsinInput("");
    setSyncMsg(null);
    if (!name) { setForm(EMPTY_FORM); return; }

    setLoadingFund(true);
    try {
      const r = await fetch(`/api/admin/fund-details?fundName=${encodeURIComponent(name)}`);
      const d = await r.json();
      setIsinInput(d.isinGrowth || "");
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
            ? det.fundManagers.map((m: Manager) => ({ name: m.name || "", designation: m.designation || "", experienceYears: m.experienceYears || "", managingSince: m.managingSince || "" }))
            : [{ name: "", designation: "", experienceYears: "", managingSince: "" }],
          benchmarkName: det.benchmarkName || "",
          benchmarkRiskBand: det.benchmarkRiskBand != null ? String(det.benchmarkRiskBand) : "",
          benchmarkDetails: det.benchmarkDetails || "",
          assetAllocation: det.assetAllocation?.length
            ? det.assetAllocation.map((a: { assetClass: string; percentage: number }) => ({ assetClass: a.assetClass || "", percentage: String(a.percentage) }))
            : [{ assetClass: "", percentage: "" }],
          portfolioByIndustry: det.portfolioByIndustry?.length
            ? det.portfolioByIndustry.map((p: { industry: string; percentage: number; marketValue?: number | null; change1M?: number | null }) => ({ industry: p.industry || "", percentage: String(p.percentage), marketValue: p.marketValue != null ? String(p.marketValue) : "", change1M: p.change1M != null ? String(p.change1M) : "" }))
            : [{ industry: "", percentage: "", marketValue: "", change1M: "" }],
          topHoldings: det.topHoldings?.length
            ? det.topHoldings.map((h: { name: string; percentage: number; sector?: string; rating?: string; marketValue?: number | null; change1M?: number | null }) => ({ name: h.name || "", percentage: String(h.percentage), sector: h.sector || "", rating: h.rating || "", marketValue: h.marketValue != null ? String(h.marketValue) : "", change1M: h.change1M != null ? String(h.change1M) : "" }))
            : [{ name: "", percentage: "", sector: "", rating: "", marketValue: "", change1M: "" }],
          factsheets: (det.factsheets || []).map((f: any) => ({
            url: f.url, filename: f.filename, documentType: f.documentType || "", uploadedAt: f.uploadedAt,
          })),
          schemeCategory: det.schemeCategory || "",
          inceptionDate: det.inceptionDate || "",
          redemptionFrequency: det.redemptionFrequency || "",
          terMax: det.terMax || "",
          terSlabs: det.terSlabs?.length
            ? det.terSlabs.map((t: TerSlab) => ({ aumSlab: t.aumSlab || "", ter: t.ter || "" }))
            : [{ aumSlab: "", ter: "" }],
          terBreakdown: (() => {
            const tb = det.terBreakdown;
            const costs = (c: Partial<TerPlanCosts> | undefined): TerPlanCosts => ({
              ber: c?.ber || "", brokerageCost: c?.brokerageCost || "", transactionCost: c?.transactionCost || "",
              statutoryLevies: c?.statutoryLevies || "", ter: c?.ter || "",
            });
            return {
              terYear: tb?.terYear || "", terDate: tb?.terDate || "",
              regular: costs(tb?.regular), direct: costs(tb?.direct),
            };
          })(),
          taxationSummary: det.taxationSummary || "",
          statedAssetAllocation: det.statedAssetAllocation || "",
          sponsorName: det.sponsorName || "",
          amcName: det.amcName || "",
          trusteeName: det.trusteeName || "",
          registrarName: det.registrarName || "",
          suitableFor: det.suitableFor || "",
          notSuitableFor: det.notSuitableFor || "",
          bullMarket: det.bullMarket || "",
          bearMarket: det.bearMarket || "",
          sidewaysMarket: det.sidewaysMarket || "",
          mfEquivalent: det.mfEquivalent || "",
          portfolioFit: det.portfolioFit || "",
          isin: det.isin || "",
          schemeId: det.schemeId || "",
          ssdAvailability: det.ssdAvailability || "unchecked",
          ssdMissReason: det.ssdMissReason || "",
          fundamentals: det.fundamentals
            ? Object.fromEntries(Object.entries(det.fundamentals).map(([k, v]) => [k, v != null ? String(v) : ""])) as unknown as FundamentalsForm
            : EMPTY_FORM.fundamentals,
          concentration: det.concentration
            ? {
                numberOfHoldings: det.concentration.numberOfHoldings != null ? String(det.concentration.numberOfHoldings) : "",
                averageMarketCap: det.concentration.averageMarketCap || "",
                top3SectorWeight: det.concentration.top3SectorWeight != null ? String(det.concentration.top3SectorWeight) : "",
                top5StocksWeight: det.concentration.top5StocksWeight != null ? String(det.concentration.top5StocksWeight) : "",
                top10StocksWeight: det.concentration.top10StocksWeight != null ? String(det.concentration.top10StocksWeight) : "",
              }
            : EMPTY_FORM.concentration,
          marketCapWeightage: det.marketCapWeightage
            ? {
                largeCap: det.marketCapWeightage.largeCap != null ? String(det.marketCapWeightage.largeCap) : "",
                midCap: det.marketCapWeightage.midCap != null ? String(det.marketCapWeightage.midCap) : "",
                smallCap: det.marketCapWeightage.smallCap != null ? String(det.marketCapWeightage.smallCap) : "",
                others: det.marketCapWeightage.others != null ? String(det.marketCapWeightage.others) : "",
              }
            : EMPTY_FORM.marketCapWeightage,
          rollingReturns: det.rollingReturns?.length
            ? det.rollingReturns.map((r: Record<string, unknown>) => ({
                timeframe: String(r.timeframe ?? ""), averageReturn: r.averageReturn != null ? String(r.averageReturn) : "",
                medianReturn: r.medianReturn != null ? String(r.medianReturn) : "", minReturn: r.minReturn != null ? String(r.minReturn) : "",
                minPeriod: String(r.minPeriod ?? ""), maxReturn: r.maxReturn != null ? String(r.maxReturn) : "", maxPeriod: String(r.maxPeriod ?? ""),
                standardDeviation: r.standardDeviation != null ? String(r.standardDeviation) : "", downsideDeviation: r.downsideDeviation != null ? String(r.downsideDeviation) : "",
                positiveRatio: r.positiveRatio != null ? String(r.positiveRatio) : "", negativeRatio: r.negativeRatio != null ? String(r.negativeRatio) : "",
                consistencyScore: r.consistencyScore != null ? String(r.consistencyScore) : "",
              }))
            : EMPTY_FORM.rollingReturns,
          categoryRanks: det.categoryRanks?.length
            ? det.categoryRanks.map((r: Record<string, unknown>) => ({
                timeframe: String(r.timeframe ?? ""), annualizedReturn: r.annualizedReturn != null ? String(r.annualizedReturn) : "",
                categoryAverage: r.categoryAverage != null ? String(r.categoryAverage) : "", rankInCategory: String(r.rankInCategory ?? ""),
              }))
            : EMPTY_FORM.categoryRanks,
          peers: det.peers?.length
            ? det.peers.map((p: Record<string, unknown>) => ({
                schemeCode: String(p.schemeCode ?? ""), isin: String(p.isin ?? ""), schemeName: String(p.schemeName ?? ""),
                schemeNameShort: String(p.schemeNameShort ?? ""), aum: String(p.aum ?? ""), pe: String(p.pe ?? ""),
                pb: String(p.pb ?? ""), dividendYield: String(p.dividendYield ?? ""), expenseRatio: String(p.expenseRatio ?? ""),
              }))
            : EMPTY_FORM.peers,
          amcOtherFundsCompanyName: det.amcOtherFunds?.companyName || "",
          amcOtherFundsSchemeList: det.amcOtherFunds?.schemeList?.length
            ? det.amcOtherFunds.schemeList.map((s: Record<string, unknown>) => {
                const returns = (s.returns ?? {}) as Record<string, string>;
                return {
                  schemeCode: String(s.schemeCode ?? ""), isin: String(s.isin ?? ""), schemeName: String(s.schemeName ?? ""),
                  schemeShortName: String(s.schemeShortName ?? ""), morningstarRating: s.morningstarRating != null ? String(s.morningstarRating) : "",
                  aum: String(s.aum ?? ""),
                  return1y: returns["1y"] ?? "", return3y: returns["3y"] ?? "", return7y: returns["7y"] ?? "", return10y: returns["10y"] ?? "",
                };
              })
            : EMPTY_FORM.amcOtherFundsSchemeList,
        });
      } else {
        setForm(EMPTY_FORM);
      }
    } finally {
      setLoadingFund(false);
    }
  };

  const [uploadProgress, setUploadProgress] = useState(0);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ALLOWED_TYPES = new Set([
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ]);
    if (!ALLOWED_TYPES.has(file.type) && !file.name.match(/\.(pdf|xlsx|xls)$/i)) {
      alert("PDF or Excel files only (.pdf, .xlsx, .xls)");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      alert("Max 20MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploadingPdf(true);
    setUploadProgress(0);

    try {
      const sigRes = await fetch("/api/admin/fund-details/cloudinary-signature", { method: "POST" });
      if (!sigRes.ok) {
        const errBody = await sigRes.json().catch(() => ({}));
        throw new Error(errBody.error || "Failed to get upload signature");
      }
      const { signature, timestamp, apiKey, cloudName, folder, useFilename, uniqueFilename } = await sigRes.json();

      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", apiKey);
      fd.append("timestamp", String(timestamp));
      fd.append("signature", signature);
      fd.append("folder", folder);
      fd.append("use_filename", String(useFilename));
      fd.append("unique_filename", String(uniqueFilename));

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`;

      const result = await new Promise<{ secure_url: string; original_filename: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", uploadUrl);

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            const errBody = JSON.parse(xhr.responseText || "{}");
            reject(new Error(errBody?.error?.message || `Cloudinary upload failed: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));

        xhr.send(fd);
      });

      setForm(prev => ({
        ...prev,
        factsheets: [
          ...prev.factsheets,
          {
            url: result.secure_url,
            filename: file.name || result.original_filename, // matches your old route's fallback order
            documentType: "",
            uploadedAt: new Date().toISOString(),
          },
        ],
      }));
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingPdf(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDocumentTypeChange = (idx: number, type: string) => {
    setForm(prev => ({
      ...prev,
      factsheets: prev.factsheets.map((f, i) => i === idx ? { ...f, documentType: type } : f),
    }));
  };

  const removeFactsheet = (idx: number) => {
    setForm(prev => ({ ...prev, factsheets: prev.factsheets.filter((_, i) => i !== idx) }));
  };

  // Shared by the sidebar "Sync from ISIN" box (arbitrary ISIN) and the
  // "Update from finapi" button at the top of the record (this fund's own ISIN).
  const runIsinSync = async (rawIsin: string) => {
    const isin = rawIsin.trim().toUpperCase();
    if (!isin) return;
    setSyncingIsin(true);
    setSyncMsg(null);
    try {
      const r = await fetch("/api/admin/fund-details/sync-isin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isin }),
      });
      const d = await r.json();
      if (!r.ok) {
        setSyncMsg({ ok: false, text: d.error || "Sync failed" });
        return;
      }
      setSyncMsg({ ok: true, text: `Synced ${d.fundName} — ${d.updatedFields.length} fields updated` });
      if (d.fundName === selectedFund) {
        await handleSelectFund(selectedFund);
      }
    } catch (e: unknown) {
      setSyncMsg({ ok: false, text: (e as Error).message || "Sync failed" });
    } finally {
      setSyncingIsin(false);
    }
  };

  const handleSyncIsin = () => runIsinSync(isinInput);

  // "Update all sources" — finapi + AMFI SSD + AMFI TER for the selected fund,
  // through the same lib the nightly cron uses. Each source reports separately so
  // a fund with no published SSD still shows the other two as applied.
  const handleUpdateAllSources = async () => {
    if (!selectedFund) return;
    setUpdatingAll(true);
    setSourceOutcomes(null);
    setSyncMsg(null);
    try {
      const r = await fetch("/api/admin/fund-details/update-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fundName: selectedFund }),
      });
      const d = await r.json();
      if (!r.ok) {
        setSyncMsg({ ok: false, text: d.error || "Update failed" });
        return;
      }
      setSourceOutcomes(d.outcomes ?? []);
      await handleSelectFund(selectedFund);
      // All three sources fetched — run AI narrative generation as the final step
      // so the derived/editorial fields reflect the freshly synced data.
      await handleGenerateNarrative();
    } catch (e: unknown) {
      setSyncMsg({ ok: false, text: (e as Error).message || "Update failed" });
    } finally {
      setUpdatingAll(false);
    }
  };

  const handleGenerateNarrative = async () => {
    if (!selectedFund) return;
    setGeneratingNarrative(true);
    setAiError("");
    try {
      const activeModel = provider === "openrouter" ? customModel : model;
      const useManualEntry = !savedConfig || overrideConfig;
      const r = await fetch("/api/admin/fund-details/generate-narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fundName: selectedFund,
          ...(useManualEntry ? { provider, model: activeModel, apiKey } : {}),
        }),
      });
      const d = await r.json();
      if (!r.ok) { setAiError(d.error || "Generation failed"); return; }
      setAiResult(prev => ({ ...prev, ...d.extracted }));
    } catch (e: unknown) {
      setAiError((e as Error).message || "Generation failed");
    } finally {
      setGeneratingNarrative(false);
    }
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
          files: form.factsheets.map(f => ({ url: f.url, documentType: f.documentType })),
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
      const arr = (val as { name: string; designation?: string; experienceYears?: string | null; managingSince?: string | null }[]) || [];
      setForm(prev => ({ ...prev, fundManagers: arr.map(m => ({ name: m.name, designation: m.designation || "", experienceYears: m.experienceYears || "", managingSince: m.managingSince || "" })) }));
    } else if (field === "terSlabs") {
      const arr = (val as { aumSlab: string; ter: string }[]) || [];
      setForm(prev => ({ ...prev, terSlabs: arr.map(t => ({ aumSlab: t.aumSlab, ter: t.ter })) }));
    } else if (field === "assetAllocation") {
      const arr = (val as { assetClass: string; percentage: number }[]) || [];
      setForm(prev => ({ ...prev, assetAllocation: arr.map(a => ({ assetClass: a.assetClass, percentage: String(a.percentage) })) }));
    } else if (field === "portfolioByIndustry") {
      const arr = (val as { industry: string; percentage: number }[]) || [];
      setForm(prev => ({ ...prev, portfolioByIndustry: arr.map(p => ({ industry: p.industry, percentage: String(p.percentage), marketValue: "", change1M: "" })) }));
    } else if (field === "topHoldings") {
      const arr = (val as { name: string; percentage: number; sector?: string; rating?: string }[]) || [];
      setForm(prev => ({ ...prev, topHoldings: arr.map(h => ({ name: h.name, percentage: String(h.percentage), sector: h.sector || "", rating: h.rating || "", marketValue: "", change1M: "" })) }));
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
          fundManagers: form.fundManagers.filter(m => m.name.trim()).map(m => ({
            name: m.name, designation: m.designation, experienceYears: m.experienceYears || undefined, managingSince: m.managingSince || undefined,
          })),
          benchmarkName: form.benchmarkName,
          benchmarkRiskBand: form.benchmarkRiskBand !== "" ? Number(form.benchmarkRiskBand) : null,
          benchmarkDetails: form.benchmarkDetails,
          assetAllocation: form.assetAllocation
            .filter(a => a.assetClass.trim())
            .map(a => ({ assetClass: a.assetClass, percentage: Number(a.percentage) || 0 })),
          portfolioByIndustry: form.portfolioByIndustry
            .filter(p => p.industry.trim())
            .map(p => ({
              industry: p.industry, percentage: Number(p.percentage) || 0,
              marketValue: p.marketValue !== "" ? Number(p.marketValue) : null,
              change1M: p.change1M !== "" ? Number(p.change1M) : null,
            })),
          topHoldings: form.topHoldings
            .filter(h => h.name.trim())
            .map(h => ({
              name: h.name, percentage: Number(h.percentage) || 0, sector: h.sector, rating: h.rating || undefined,
              marketValue: h.marketValue !== "" ? Number(h.marketValue) : null,
              change1M: h.change1M !== "" ? Number(h.change1M) : null,
            })),
          factsheets: form.factsheets,
          schemeCategory: form.schemeCategory,
          inceptionDate: form.inceptionDate,
          redemptionFrequency: form.redemptionFrequency,
          terMax: form.terMax,
          terSlabs: form.terSlabs.filter(t => t.aumSlab.trim()).map(t => ({ aumSlab: t.aumSlab, ter: t.ter })),
          // Send null when every field is blank so an untouched save can't wipe the
          // TER-feed values (save route skips null for nullable objects).
          terBreakdown: (() => {
            const tb = form.terBreakdown;
            const anyVal = [tb.terYear, tb.terDate,
              ...Object.values(tb.regular), ...Object.values(tb.direct)].some(v => String(v).trim());
            return anyVal ? tb : null;
          })(),
          taxationSummary: form.taxationSummary,
          statedAssetAllocation: form.statedAssetAllocation,
          sponsorName: form.sponsorName,
          amcName: form.amcName,
          trusteeName: form.trusteeName,
          registrarName: form.registrarName,
          suitableFor: form.suitableFor,
          notSuitableFor: form.notSuitableFor,
          bullMarket: form.bullMarket,
          bearMarket: form.bearMarket,
          sidewaysMarket: form.sidewaysMarket,
          mfEquivalent: form.mfEquivalent,
          portfolioFit: form.portfolioFit,
          isin: form.isin,
          fundamentals: Object.values(form.fundamentals).some(v => v !== "")
            ? Object.fromEntries(Object.entries(form.fundamentals).map(([k, v]) => [k, v !== "" ? Number(v) : null]))
            : null,
          concentration: Object.values(form.concentration).some(v => v !== "")
            ? {
                numberOfHoldings: form.concentration.numberOfHoldings !== "" ? Number(form.concentration.numberOfHoldings) : null,
                averageMarketCap: form.concentration.averageMarketCap,
                top3SectorWeight: form.concentration.top3SectorWeight !== "" ? Number(form.concentration.top3SectorWeight) : null,
                top5StocksWeight: form.concentration.top5StocksWeight !== "" ? Number(form.concentration.top5StocksWeight) : null,
                top10StocksWeight: form.concentration.top10StocksWeight !== "" ? Number(form.concentration.top10StocksWeight) : null,
              }
            : null,
          marketCapWeightage: Object.values(form.marketCapWeightage).some(v => v !== "")
            ? {
                largeCap: form.marketCapWeightage.largeCap !== "" ? Number(form.marketCapWeightage.largeCap) : null,
                midCap: form.marketCapWeightage.midCap !== "" ? Number(form.marketCapWeightage.midCap) : null,
                smallCap: form.marketCapWeightage.smallCap !== "" ? Number(form.marketCapWeightage.smallCap) : null,
                others: form.marketCapWeightage.others !== "" ? Number(form.marketCapWeightage.others) : null,
              }
            : null,
          rollingReturns: form.rollingReturns.filter(r => r.timeframe.trim()).map(r => ({
            timeframe: r.timeframe,
            averageReturn: r.averageReturn !== "" ? Number(r.averageReturn) : null,
            medianReturn: r.medianReturn !== "" ? Number(r.medianReturn) : null,
            minReturn: r.minReturn !== "" ? Number(r.minReturn) : null,
            minPeriod: r.minPeriod,
            maxReturn: r.maxReturn !== "" ? Number(r.maxReturn) : null,
            maxPeriod: r.maxPeriod,
            standardDeviation: r.standardDeviation !== "" ? Number(r.standardDeviation) : null,
            downsideDeviation: r.downsideDeviation !== "" ? Number(r.downsideDeviation) : null,
            positiveRatio: r.positiveRatio !== "" ? Number(r.positiveRatio) : null,
            negativeRatio: r.negativeRatio !== "" ? Number(r.negativeRatio) : null,
            consistencyScore: r.consistencyScore !== "" ? Number(r.consistencyScore) : null,
          })),
          categoryRanks: form.categoryRanks.filter(r => r.timeframe.trim()).map(r => ({
            timeframe: r.timeframe,
            annualizedReturn: r.annualizedReturn !== "" ? Number(r.annualizedReturn) : null,
            categoryAverage: r.categoryAverage !== "" ? Number(r.categoryAverage) : null,
            rankInCategory: r.rankInCategory,
          })),
          peers: form.peers.filter(p => p.schemeName.trim()).map(p => ({
            schemeCode: p.schemeCode, isin: p.isin, schemeName: p.schemeName, schemeNameShort: p.schemeNameShort,
            aum: p.aum, pe: p.pe, pb: p.pb, dividendYield: p.dividendYield, expenseRatio: p.expenseRatio,
          })),
          amcOtherFunds: form.amcOtherFundsCompanyName.trim() || form.amcOtherFundsSchemeList.some(s => s.schemeName.trim())
            ? {
                companyName: form.amcOtherFundsCompanyName,
                schemeList: form.amcOtherFundsSchemeList.filter(s => s.schemeName.trim()).map(s => {
                  const returns: Record<string, string> = {};
                  if (s.return1y !== "") returns["1y"] = s.return1y;
                  if (s.return3y !== "") returns["3y"] = s.return3y;
                  if (s.return7y !== "") returns["7y"] = s.return7y;
                  if (s.return10y !== "") returns["10y"] = s.return10y;
                  return {
                    schemeCode: s.schemeCode, isin: s.isin, schemeName: s.schemeName, schemeShortName: s.schemeShortName,
                    morningstarRating: s.morningstarRating !== "" ? Number(s.morningstarRating) : undefined,
                    aum: s.aum, returns,
                  };
                }),
              }
            : null,
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
  const addManager = () => setForm(prev => ({ ...prev, fundManagers: [...prev.fundManagers, { name: "", designation: "", experienceYears: "", managingSince: "" }] }));
  const removeManager = (i: number) => setForm(prev => ({ ...prev, fundManagers: prev.fundManagers.filter((_, idx) => idx !== i) }));



  const updateTerSlab = (i: number, k: keyof TerSlab, v: string) =>
    setForm(prev => ({ ...prev, terSlabs: prev.terSlabs.map((t, idx) => idx === i ? { ...t, [k]: v } : t) }));
  const addTerSlab = () => setForm(prev => ({ ...prev, terSlabs: [...prev.terSlabs, { aumSlab: "", ter: "" }] }));
  const removeTerSlab = (i: number) => setForm(prev => ({ ...prev, terSlabs: prev.terSlabs.filter((_, idx) => idx !== i) }));
  const updateTerMeta = (k: "terYear" | "terDate", v: string) =>
    setForm(prev => ({ ...prev, terBreakdown: { ...prev.terBreakdown, [k]: v } }));
  const updateTerPlan = (plan: "regular" | "direct", k: keyof TerPlanCosts, v: string) =>
    setForm(prev => ({ ...prev, terBreakdown: { ...prev.terBreakdown, [plan]: { ...prev.terBreakdown[plan], [k]: v } } }));



  const updateAllocation = (i: number, k: keyof Allocation, v: string) =>
    setForm(prev => ({ ...prev, assetAllocation: prev.assetAllocation.map((a, idx) => idx === i ? { ...a, [k]: v } : a) }));
  const addAllocation = () => setForm(prev => ({ ...prev, assetAllocation: [...prev.assetAllocation, { assetClass: "", percentage: "" }] }));
  const removeAllocation = (i: number) => setForm(prev => ({ ...prev, assetAllocation: prev.assetAllocation.filter((_, idx) => idx !== i) }));

  const updateIndustryAlloc = (i: number, k: keyof IndustryAlloc, v: string) =>
    setForm(prev => ({ ...prev, portfolioByIndustry: prev.portfolioByIndustry.map((p, idx) => idx === i ? { ...p, [k]: v } : p) }));
  const addIndustryAlloc = () => setForm(prev => ({ ...prev, portfolioByIndustry: [...prev.portfolioByIndustry, { industry: "", percentage: "", marketValue: "", change1M: "" }] }));
  const removeIndustryAlloc = (i: number) => setForm(prev => ({ ...prev, portfolioByIndustry: prev.portfolioByIndustry.filter((_, idx) => idx !== i) }));


  const updateHolding = (i: number, k: keyof Holding, v: string) =>
    setForm(prev => ({ ...prev, topHoldings: prev.topHoldings.map((h, idx) => idx === i ? { ...h, [k]: v } : h) }));
  const addHolding = () => setForm(prev => ({ ...prev, topHoldings: [...prev.topHoldings, { name: "", percentage: "", sector: "", rating: "", marketValue: "", change1M: "" }] }));
  const removeHolding = (i: number) => setForm(prev => ({ ...prev, topHoldings: prev.topHoldings.filter((_, idx) => idx !== i) }));

  const setFundamentalsField = (k: keyof FundamentalsForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, fundamentals: { ...prev.fundamentals, [k]: e.target.value } }));
  const setConcentrationField = (k: keyof ConcentrationForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, concentration: { ...prev.concentration, [k]: e.target.value } }));
  const setMarketCapField = (k: keyof MarketCapForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, marketCapWeightage: { ...prev.marketCapWeightage, [k]: e.target.value } }));

  // Generic row-array editor for the API section (rollingReturns, categoryRanks, peers, amcOtherFundsSchemeList, risk-conclusion rows)
  type ArrayField = "rollingReturns" | "categoryRanks" | "peers" | "amcOtherFundsSchemeList";
  const arrayFieldOps = <F extends ArrayField>(field: F, blankRow: FormState[F][number]) => ({
    update: (i: number, k: keyof FormState[F][number], v: string) =>
      setForm(prev => ({
        ...prev,
        [field]: (prev[field] as Array<Record<string, string>>).map((row, idx) => idx === i ? { ...row, [k]: v } : row),
      })),
    add: () => setForm(prev => ({ ...prev, [field]: [...(prev[field] as unknown[]), blankRow] })),
    remove: (i: number) => setForm(prev => ({ ...prev, [field]: (prev[field] as unknown[]).filter((_, idx) => idx !== i) })),
  });
  const rollingReturnsOps = arrayFieldOps("rollingReturns", EMPTY_FORM.rollingReturns[0]);
  const categoryRanksOps = arrayFieldOps("categoryRanks", EMPTY_FORM.categoryRanks[0]);
  const peersOps = arrayFieldOps("peers", EMPTY_FORM.peers[0]);
  const amcSchemesOps = arrayFieldOps("amcOtherFundsSchemeList", EMPTY_FORM.amcOtherFundsSchemeList[0]);


  const usingSavedConfig = !!savedConfig && !overrideConfig;
  const canAnalyse = !!selectedFund && form.factsheets.length > 0 &&
    (usingSavedConfig || (!!apiKey && (provider !== "openrouter" ? !!model : !!customModel)));
  const canGenerateNarrative = !!selectedFund &&
    (usingSavedConfig || (!!apiKey && (provider !== "openrouter" ? !!model : !!customModel)));

  const aiDisplayValue = (field: keyof AiResult): string | null => {
    const val = aiResult?.[field];
    if (val == null) return null;
    if (Array.isArray(val)) return JSON.stringify(val, null, 2);
    return String(val);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
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

      <div className="flex-1 flex overflow-hidden">

        <div className="w-[55%] overflow-y-auto border-r border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="px-7 py-6">
            {!selectedFund ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <FileText className="size-10 text-[#CBD5E1] mb-3" />
                <p className="text-[14px] font-medium text-[#94A3B8]">Select a fund to view or edit its details</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 mb-6">
                  <h2 className="text-[15px] font-bold text-[#0B1F3A] shrink-0">Current Record</h2>
                  <div className="flex items-center gap-2.5 flex-wrap justify-end">
                    {saveMsg && (
                      <span className={`text-[12px] font-medium px-2.5 py-1 rounded-full ${saveMsg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                        {saveMsg.text}
                      </span>
                    )}
                    {syncMsg && (
                      <span className={`text-[12px] font-medium px-2.5 py-1 rounded-full ${syncMsg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                        {syncMsg.text}
                      </span>
                    )}
                    {/* Runs finapi + AMFI SSD + AMFI TER through the same lib the
                        nightly cron uses, so this check reflects production. */}
                    <button
                      onClick={handleUpdateAllSources}
                      disabled={updatingAll}
                      title={`Re-pull ${selectedFund} from finapi, AMFI SSD and AMFI TER`}
                      className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-[8px] bg-[#0B1F3A] text-white text-[12.5px] font-semibold hover:bg-[#1E3A8A] transition-colors disabled:opacity-50"
                    >
                      {updatingAll ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                      {updatingAll ? "Updating…" : "Update all sources"}
                    </button>
                  </div>
                </div>

                {/* Per-source result. Deliberately one row per source rather than a
                    single total: a lumped count cannot tell you WHICH source went
                    stale, which is the whole reason for checking by hand. */}
                {sourceOutcomes && (
                  <div className="-mt-2 mb-6 rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] divide-y divide-[#E2E8F0]">
                    {sourceOutcomes.map((o) => (
                      <div key={o.source} className="flex items-start gap-3 px-3.5 py-2.5">
                        <span className={`mt-[3px] shrink-0 size-1.5 rounded-full ${o.ok ? "bg-[#16A34A]" : "bg-[#F59E0B]"}`} />
                        <span className="shrink-0 w-[52px] text-[11px] font-mono uppercase tracking-wide text-[#64748B]">
                          {o.source}
                        </span>
                        <div className="min-w-0">
                          <p className={`text-[12px] ${o.ok ? "text-[#0F172A]" : "text-[#B45309]"}`}>{o.message}</p>
                          {o.fieldsWritten.length > 0 && (
                            <p className="text-[11px] text-[#94A3B8] mt-0.5 break-words">
                              {o.fieldsWritten.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Standing SSD state, independent of whether an update just ran. */}
                {form.ssdAvailability === "not_published" && (
                  <div className="-mt-2 mb-6 rounded-[10px] border border-[#FDE68A] bg-[#FFFBEB] px-3.5 py-2.5">
                    <p className="text-[12px] font-medium text-[#92400E]">
                      No Scheme Summary Document published by AMFI for this fund
                      {form.schemeId ? ` (${form.schemeId})` : ""}.
                    </p>
                    <p className="text-[11.5px] text-[#B45309] mt-0.5">
                      {form.ssdMissReason || "SSD fetch did not return a document."} Everything else is filled from finapi and the AMFI TER feed; SSD-owned fields keep their last known values.
                    </p>
                  </div>
                )}
                {!form.isin.trim() && (
                  <p className="text-[11.5px] text-[#94A3B8] -mt-4 mb-6">
                    No ISIN saved on this record yet — finapi will be skipped until you run “Sync from ISIN” in the sidebar once.
                  </p>
                )}

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

                {/* Fund Structure */}
                <SectionHeader title="Fund Structure" />
                <div className="grid grid-cols-2 gap-x-4">
                  <FieldRow label="Scheme Category">
                    <input className={inputCls} value={form.schemeCategory} onChange={setField("schemeCategory")} placeholder="e.g. SIF - Category III AIF, Hybrid Long-Short" />
                    {aiResult?.schemeCategory != null && <AiValueBadge value={String(aiResult.schemeCategory)} onApply={() => applyField("schemeCategory")} />}
                  </FieldRow>
                </div>
                <FieldRow label="Inception Date">
                  <input className={inputCls} value={form.inceptionDate} onChange={setField("inceptionDate")} placeholder="e.g. 15 Mar 2025" />
                  {aiResult?.inceptionDate != null && <AiValueBadge value={String(aiResult.inceptionDate)} onApply={() => applyField("inceptionDate")} />}
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
                    <div key={i} className="flex flex-col gap-1.5 pb-2 border-b border-[#F1F5F9] last:border-0">
                      <div className="flex gap-2 items-center">
                        <input className={`${inputFlexCls} flex-1`} value={m.name} onChange={e => updateManager(i, "name", e.target.value)} placeholder="Manager name" />
                        <input className={`${inputFlexCls} flex-1`} value={m.designation} onChange={e => updateManager(i, "designation", e.target.value)} placeholder="Designation" />
                        {form.fundManagers.length > 1 && (
                          <button onClick={() => removeManager(i)} className="shrink-0 p-1.5 rounded-[6px] text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 transition-colors">
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2 items-center">
                        <input className={`${inputFlexCls} flex-1`} value={m.experienceYears} onChange={e => updateManager(i, "experienceYears", e.target.value)} placeholder="Experience (e.g. 15+ years)" />
                        <input className={`${inputFlexCls} flex-1`} value={m.managingSince} onChange={e => updateManager(i, "managingSince", e.target.value)} placeholder="Managing since (e.g. Mar 2025)" />
                      </div>
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
                      <input className={`${inputCls} flex-1`} value={p.industry} onChange={e => updateIndustryAlloc(i, "industry", e.target.value)} placeholder="Industry / sector" />
                      <div className="relative w-24 shrink-0">
                        <input type="number" className={inputCls} value={p.percentage} onChange={e => updateIndustryAlloc(i, "percentage", e.target.value)} placeholder="%" />
                      </div>
                      <div className="relative w-28 shrink-0">
                        <input type="number" className={inputCls} value={p.marketValue} onChange={e => updateIndustryAlloc(i, "marketValue", e.target.value)} placeholder="Market value ₹Cr" />
                      </div>
                      <div className="relative w-24 shrink-0">
                        <input type="number" className={inputCls} value={p.change1M} onChange={e => updateIndustryAlloc(i, "change1M", e.target.value)} placeholder="1M change %" />
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
                      <div className="flex gap-2 items-center">
                        <input className={`${inputFlexCls} flex-1`} type="number" value={h.marketValue} onChange={e => updateHolding(i, "marketValue", e.target.value)} placeholder="Market value ₹Cr" />
                        <input className={`${inputFlexCls} flex-1`} type="number" value={h.change1M} onChange={e => updateHolding(i, "change1M", e.target.value)} placeholder="1M change %" />
                      </div>
                    </div>
                  ))}
                  <button onClick={addHolding} className="flex items-center gap-1.5 text-[12px] text-primary hover:text-[#1E3A8A] transition-colors mt-1">
                    <Plus className="size-3.5" /> Add holding
                  </button>
                </div>

                {/* Redemption & Liquidity */}
                <SectionHeader title="Redemption & Liquidity" />
                <div className="grid grid-cols-2 gap-x-4">
                  <FieldRow label="Redemption Frequency">
                    <input className={inputCls} value={form.redemptionFrequency} onChange={setField("redemptionFrequency")} placeholder="e.g. Every Monday and Wednesday" />
                    {aiResult?.redemptionFrequency != null && <AiValueBadge value={String(aiResult.redemptionFrequency)} onApply={() => applyField("redemptionFrequency")} />}
                  </FieldRow>
                </div>

                {/* Expenses & Taxation */}
                <SectionHeader title="Expenses & Taxation" />
                <FieldRow label="Maximum TER">
                  <input className={inputCls} value={form.terMax} onChange={setField("terMax")} placeholder="e.g. 2.25%" />
                  {aiResult?.terMax != null && <AiValueBadge value={String(aiResult.terMax)} onApply={() => applyField("terMax")} />}
                </FieldRow>
                <p className="text-[12px] font-medium text-[#64748B] mb-1 mt-3">TER Slabs</p>
                {aiResult?.terSlabs != null && (
                  <AiValueBadge
                    value={(aiResult.terSlabs as { aumSlab: string; ter: string }[]).map(t => `${t.aumSlab}: ${t.ter}`).join(", ")}
                    onApply={() => applyField("terSlabs")}
                  />
                )}
                <div className="space-y-2 mt-2">
                  {form.terSlabs.map((t, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input className={`${inputFlexCls} flex-1`} value={t.aumSlab} onChange={e => updateTerSlab(i, "aumSlab", e.target.value)} placeholder="AUM slab (e.g. First ₹500 Cr)" />
                      <input className={`${inputFlexCls} w-28 shrink-0`} value={t.ter} onChange={e => updateTerSlab(i, "ter", e.target.value)} placeholder="TER (e.g. 2.00%)" />
                      {form.terSlabs.length > 1 && (
                        <button onClick={() => removeTerSlab(i)} className="shrink-0 p-1.5 rounded-[6px] text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 transition-colors">
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={addTerSlab} className="flex items-center gap-1.5 text-[12px] text-primary hover:text-[#1E3A8A] transition-colors mt-1">
                    <Plus className="size-3.5" /> Add TER slab
                  </button>
                </div>

                {/* TER Breakdown — per-plan cost split from the AMFI TER feed. */}
                <p className="text-[12px] font-medium text-[#64748B] mb-1 mt-4">TER Breakdown (from AMFI TER feed)</p>
                <div className="grid grid-cols-2 gap-x-4 mt-1">
                  <FieldRow label="TER Year">
                    <input className={inputCls} value={form.terBreakdown.terYear} onChange={e => updateTerMeta("terYear", e.target.value)} placeholder="e.g. 2026-2027" />
                  </FieldRow>
                  <FieldRow label="TER Date">
                    <input className={inputCls} value={form.terBreakdown.terDate} onChange={e => updateTerMeta("terDate", e.target.value)} placeholder="e.g. 2026-07-01" />
                  </FieldRow>
                </div>
                <div className="grid grid-cols-2 gap-x-4 mt-1">
                  {(["regular", "direct"] as const).map(plan => (
                    <div key={plan} className="rounded-[8px] border border-[#E2E8F0] p-3">
                      <p className="text-[11px] font-mono font-semibold uppercase tracking-wide text-[#64748B] mb-2">{plan} Plan</p>
                      <div className="space-y-2">
                        {([
                          ["ter", "Total TER %"],
                          ["ber", "Base ER %"],
                          ["brokerageCost", "Brokerage %"],
                          ["transactionCost", "Transaction %"],
                          ["statutoryLevies", "Statutory Levies %"],
                        ] as [keyof TerPlanCosts, string][]).map(([key, label]) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-[11px] text-[#64748B] w-32 shrink-0">{label}</span>
                            <input className={`${inputFlexCls} flex-1`} value={form.terBreakdown[plan][key]} onChange={e => updateTerPlan(plan, key, e.target.value)} placeholder="—" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <FieldRow label="Taxation Summary">
                  <textarea className={`${textareaCls} h-24`} value={form.taxationSummary} onChange={setField("taxationSummary")} placeholder="Capital gains treatment, holding periods, applicable rates..." />
                  {aiResult?.taxationSummary != null && <AiValueBadge value={String(aiResult.taxationSummary)} onApply={() => applyField("taxationSummary")} />}
                </FieldRow>

                {/* Stated Asset Allocation — free-text mandate from the AMFI SSD. */}
                <SectionHeader title="Stated Asset Allocation" />
                <div className="mt-2">
                  <textarea
                    className={`${inputCls} min-h-[80px] resize-y`}
                    value={form.statedAssetAllocation}
                    onChange={setField("statedAssetAllocation")}
                    placeholder="e.g. Equity 80–100%, Short exposure through unhedged derivatives 0–25% (auto-filled from AMFI SSD)"
                  />
                </div>

                {/* Derivatives & Risk Controls */}
                {/* Fund Administration */}
                <SectionHeader title="Fund Administration" />
                <div className="grid grid-cols-2 gap-x-4">
                  <FieldRow label="Sponsor">
                    <input className={inputCls} value={form.sponsorName} onChange={setField("sponsorName")} placeholder="Sponsor name" />
                    {aiResult?.sponsorName != null && <AiValueBadge value={String(aiResult.sponsorName)} onApply={() => applyField("sponsorName")} />}
                  </FieldRow>
                  <FieldRow label="AMC / Investment Manager">
                    <input className={inputCls} value={form.amcName} onChange={setField("amcName")} placeholder="AMC name" />
                    {aiResult?.amcName != null && <AiValueBadge value={String(aiResult.amcName)} onApply={() => applyField("amcName")} />}
                  </FieldRow>
                  <FieldRow label="Trustee">
                    <input className={inputCls} value={form.trusteeName} onChange={setField("trusteeName")} placeholder="Trustee company name" />
                    {aiResult?.trusteeName != null && <AiValueBadge value={String(aiResult.trusteeName)} onApply={() => applyField("trusteeName")} />}
                  </FieldRow>
                  <FieldRow label="Registrar (RTA)">
                    <input className={inputCls} value={form.registrarName} onChange={setField("registrarName")} placeholder="Registrar / transfer agent name" />
                    {aiResult?.registrarName != null && <AiValueBadge value={String(aiResult.registrarName)} onApply={() => applyField("registrarName")} />}
                  </FieldRow>
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
                <FieldRow label="MF Equivalent">
                  <textarea className={`${textareaCls} h-16`} value={form.mfEquivalent} onChange={setField("mfEquivalent")} placeholder="Closest mutual fund category or equivalent..." />
                  {aiResult?.mfEquivalent != null && <AiValueBadge value={String(aiResult.mfEquivalent)} onApply={() => applyField("mfEquivalent")} />}
                </FieldRow>
                <FieldRow label="Portfolio Fit">
                  <textarea className={`${textareaCls} h-20`} value={form.portfolioFit} onChange={setField("portfolioFit")} placeholder="Where this fund fits in an investor's portfolio (e.g. satellite, core, hedge)..." />
                  {aiResult?.portfolioFit != null && <AiValueBadge value={String(aiResult.portfolioFit)} onApply={() => applyField("portfolioFit")} />}
                </FieldRow>

                {/* ═══ API (finapi.upvaly.com sync) ═══════════════════════════ */}
                <SectionHeader title="API" />
                <p className="text-[11.5px] text-[#94A3B8] -mt-2 mb-3">
                  Fields populated by &quot;Sync from ISIN&quot; above. Editable here too — saving preserves any field left blank.
                </p>

                <div className="grid grid-cols-2 gap-x-4">
                  <FieldRow label="ISIN">
                    <input className={inputCls} value={form.isin} onChange={setField("isin")} placeholder="e.g. INF966L30027" />
                  </FieldRow>
                </div>

                <SectionHeader title="Fundamentals" />
                <div className="grid grid-cols-2 gap-x-4">
                  {([
                    ["pe", "P/E"], ["categoryAveragePe", "P/E (Cat Avg)"],
                    ["pb", "P/B"], ["categoryAveragePb", "P/B (Cat Avg)"],
                    ["priceToSale", "Price/Sales"], ["categoryAveragePriceToSale", "Price/Sales (Cat Avg)"],
                    ["priceToCashFlow", "Price/Cash Flow"], ["categoryAveragePriceToCashFlow", "Price/Cash Flow (Cat Avg)"],
                    ["dividendYield", "Dividend Yield %"], ["categoryAverageDividendYield", "Dividend Yield % (Cat Avg)"],
                    ["roe", "ROE %"], ["categoryAverageRoe", "ROE % (Cat Avg)"],
                  ] as [keyof FundamentalsForm, string][]).map(([k, label]) => (
                    <FieldRow key={k} label={label}>
                      <input type="number" className={inputCls} value={form.fundamentals[k]} onChange={setFundamentalsField(k)} />
                    </FieldRow>
                  ))}
                </div>

                <SectionHeader title="Concentration" />
                <div className="grid grid-cols-2 gap-x-4">
                  <FieldRow label="Number of Holdings">
                    <input type="number" className={inputCls} value={form.concentration.numberOfHoldings} onChange={setConcentrationField("numberOfHoldings")} />
                  </FieldRow>
                  <FieldRow label="Average Market Cap">
                    <input className={inputCls} value={form.concentration.averageMarketCap} onChange={setConcentrationField("averageMarketCap")} placeholder="e.g. ₹1,29,548.11 Cr" />
                  </FieldRow>
                  <FieldRow label="Top 3 Sector Weight %">
                    <input type="number" className={inputCls} value={form.concentration.top3SectorWeight} onChange={setConcentrationField("top3SectorWeight")} />
                  </FieldRow>
                  <FieldRow label="Top 5 Stocks Weight %">
                    <input type="number" className={inputCls} value={form.concentration.top5StocksWeight} onChange={setConcentrationField("top5StocksWeight")} />
                  </FieldRow>
                  <FieldRow label="Top 10 Stocks Weight %">
                    <input type="number" className={inputCls} value={form.concentration.top10StocksWeight} onChange={setConcentrationField("top10StocksWeight")} />
                  </FieldRow>
                </div>

                <SectionHeader title="Market Cap Weightage" />
                <div className="grid grid-cols-2 gap-x-4">
                  <FieldRow label="Large Cap %">
                    <input type="number" className={inputCls} value={form.marketCapWeightage.largeCap} onChange={setMarketCapField("largeCap")} />
                  </FieldRow>
                  <FieldRow label="Mid Cap %">
                    <input type="number" className={inputCls} value={form.marketCapWeightage.midCap} onChange={setMarketCapField("midCap")} />
                  </FieldRow>
                  <FieldRow label="Small Cap %">
                    <input type="number" className={inputCls} value={form.marketCapWeightage.smallCap} onChange={setMarketCapField("smallCap")} />
                  </FieldRow>
                  <FieldRow label="Others %">
                    <input type="number" className={inputCls} value={form.marketCapWeightage.others} onChange={setMarketCapField("others")} />
                  </FieldRow>
                </div>

                <SectionHeader title="Rolling Returns" />
                <div className="space-y-3 mt-2">
                  {form.rollingReturns.map((r, i) => (
                    <div key={i} className="border border-[#E2E8F0] rounded-[8px] p-3 space-y-2">
                      <div className="flex gap-2 items-center">
                        <input className={inputFlexCls} style={{ flex: 1 }} value={r.timeframe} onChange={e => rollingReturnsOps.update(i, "timeframe", e.target.value)} placeholder="Timeframe (e.g. 3M)" />
                        {form.rollingReturns.length > 1 && (
                          <button onClick={() => rollingReturnsOps.remove(i)} className="shrink-0 p-1.5 rounded-[6px] text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 transition-colors">
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input type="number" className={inputFlexCls} value={r.averageReturn} onChange={e => rollingReturnsOps.update(i, "averageReturn", e.target.value)} placeholder="Avg return %" />
                        <input type="number" className={inputFlexCls} value={r.medianReturn} onChange={e => rollingReturnsOps.update(i, "medianReturn", e.target.value)} placeholder="Median return %" />
                        <input type="number" className={inputFlexCls} value={r.standardDeviation} onChange={e => rollingReturnsOps.update(i, "standardDeviation", e.target.value)} placeholder="Std deviation" />
                        <input type="number" className={inputFlexCls} value={r.downsideDeviation} onChange={e => rollingReturnsOps.update(i, "downsideDeviation", e.target.value)} placeholder="Downside deviation" />
                        <input type="number" className={inputFlexCls} value={r.positiveRatio} onChange={e => rollingReturnsOps.update(i, "positiveRatio", e.target.value)} placeholder="Positive ratio %" />
                        <input type="number" className={inputFlexCls} value={r.negativeRatio} onChange={e => rollingReturnsOps.update(i, "negativeRatio", e.target.value)} placeholder="Negative ratio %" />
                        <input type="number" className={inputFlexCls} value={r.consistencyScore} onChange={e => rollingReturnsOps.update(i, "consistencyScore", e.target.value)} placeholder="Consistency score" />
                        <input type="number" className={inputFlexCls} value={r.minReturn} onChange={e => rollingReturnsOps.update(i, "minReturn", e.target.value)} placeholder="Min return %" />
                        <input type="number" className={inputFlexCls} value={r.maxReturn} onChange={e => rollingReturnsOps.update(i, "maxReturn", e.target.value)} placeholder="Max return %" />
                        <input className={inputFlexCls} value={r.minPeriod} onChange={e => rollingReturnsOps.update(i, "minPeriod", e.target.value)} placeholder="Min period" />
                        <input className={inputFlexCls} value={r.maxPeriod} onChange={e => rollingReturnsOps.update(i, "maxPeriod", e.target.value)} placeholder="Max period" />
                      </div>
                    </div>
                  ))}
                  <button onClick={rollingReturnsOps.add} className="flex items-center gap-1.5 text-[12px] text-primary hover:text-[#1E3A8A] transition-colors mt-1">
                    <Plus className="size-3.5" /> Add rolling return row
                  </button>
                </div>

                <SectionHeader title="Category Ranks" />
                <div className="space-y-2 mt-2">
                  {form.categoryRanks.map((r, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input className={inputFlexCls} style={{ flex: 1 }} value={r.timeframe} onChange={e => categoryRanksOps.update(i, "timeframe", e.target.value)} placeholder="Timeframe" />
                      <input type="number" className={inputFlexCls} style={{ flex: 1 }} value={r.annualizedReturn} onChange={e => categoryRanksOps.update(i, "annualizedReturn", e.target.value)} placeholder="Annualised return %" />
                      <input type="number" className={inputFlexCls} style={{ flex: 1 }} value={r.categoryAverage} onChange={e => categoryRanksOps.update(i, "categoryAverage", e.target.value)} placeholder="Category avg %" />
                      <input className={inputFlexCls} style={{ flex: 1 }} value={r.rankInCategory} onChange={e => categoryRanksOps.update(i, "rankInCategory", e.target.value)} placeholder="Rank" />
                      {form.categoryRanks.length > 1 && (
                        <button onClick={() => categoryRanksOps.remove(i)} className="shrink-0 p-1.5 rounded-[6px] text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 transition-colors">
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={categoryRanksOps.add} className="flex items-center gap-1.5 text-[12px] text-primary hover:text-[#1E3A8A] transition-colors mt-1">
                    <Plus className="size-3.5" /> Add rank row
                  </button>
                </div>

                <SectionHeader title="Peers" />
                <div className="space-y-2 mt-2">
                  {form.peers.map((p, i) => (
                    <div key={i} className="border border-[#E2E8F0] rounded-[8px] p-3 space-y-2">
                      <div className="flex gap-2 items-center">
                        <input className={inputFlexCls} style={{ flex: 1 }} value={p.schemeName} onChange={e => peersOps.update(i, "schemeName", e.target.value)} placeholder="Scheme name" />
                        {form.peers.length > 1 && (
                          <button onClick={() => peersOps.remove(i)} className="shrink-0 p-1.5 rounded-[6px] text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 transition-colors">
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input className={inputFlexCls} value={p.schemeNameShort} onChange={e => peersOps.update(i, "schemeNameShort", e.target.value)} placeholder="Short name" />
                        <input className={inputFlexCls} value={p.schemeCode} onChange={e => peersOps.update(i, "schemeCode", e.target.value)} placeholder="Scheme code" />
                        <input className={inputFlexCls} value={p.isin} onChange={e => peersOps.update(i, "isin", e.target.value)} placeholder="ISIN" />
                        <input className={inputFlexCls} value={p.aum} onChange={e => peersOps.update(i, "aum", e.target.value)} placeholder="AUM" />
                        <input className={inputFlexCls} value={p.pe} onChange={e => peersOps.update(i, "pe", e.target.value)} placeholder="P/E" />
                        <input className={inputFlexCls} value={p.pb} onChange={e => peersOps.update(i, "pb", e.target.value)} placeholder="P/B" />
                        <input className={inputFlexCls} value={p.dividendYield} onChange={e => peersOps.update(i, "dividendYield", e.target.value)} placeholder="Dividend yield" />
                        <input className={inputFlexCls} value={p.expenseRatio} onChange={e => peersOps.update(i, "expenseRatio", e.target.value)} placeholder="Expense ratio" />
                      </div>
                    </div>
                  ))}
                  <button onClick={peersOps.add} className="flex items-center gap-1.5 text-[12px] text-primary hover:text-[#1E3A8A] transition-colors mt-1">
                    <Plus className="size-3.5" /> Add peer
                  </button>
                </div>

                <SectionHeader title="More Funds from this AMC" />
                <FieldRow label="AMC Company Name">
                  <input className={inputCls} value={form.amcOtherFundsCompanyName} onChange={setField("amcOtherFundsCompanyName")} placeholder="e.g. Quant Money Managers Limited" />
                </FieldRow>
                <div className="space-y-2 mt-2">
                  {form.amcOtherFundsSchemeList.map((s, i) => (
                    <div key={i} className="flex gap-2 items-center flex-wrap">
                      <input className={inputFlexCls} style={{ flex: 2 }} value={s.schemeName} onChange={e => amcSchemesOps.update(i, "schemeName", e.target.value)} placeholder="Scheme name" />
                      <input className={inputFlexCls} style={{ flex: 1 }} value={s.schemeShortName} onChange={e => amcSchemesOps.update(i, "schemeShortName", e.target.value)} placeholder="Short name" />
                      <input className={inputFlexCls} style={{ flex: 1 }} value={s.schemeCode} onChange={e => amcSchemesOps.update(i, "schemeCode", e.target.value)} placeholder="Scheme code" />
                      <input className={inputFlexCls} style={{ flex: 1 }} value={s.isin} onChange={e => amcSchemesOps.update(i, "isin", e.target.value)} placeholder="ISIN" />
                      <input type="number" className={inputFlexCls} style={{ flex: 1 }} value={s.morningstarRating} onChange={e => amcSchemesOps.update(i, "morningstarRating", e.target.value)} placeholder="★ rating" />
                      <input className={inputFlexCls} style={{ flex: 1 }} value={s.aum} onChange={e => amcSchemesOps.update(i, "aum", e.target.value)} placeholder="AUM" />
                      <input className={inputFlexCls} style={{ flex: 1 }} value={s.return1y} onChange={e => amcSchemesOps.update(i, "return1y", e.target.value)} placeholder="1Y return %" />
                      <input className={inputFlexCls} style={{ flex: 1 }} value={s.return3y} onChange={e => amcSchemesOps.update(i, "return3y", e.target.value)} placeholder="3Y return %" />
                      <input className={inputFlexCls} style={{ flex: 1 }} value={s.return7y} onChange={e => amcSchemesOps.update(i, "return7y", e.target.value)} placeholder="7Y return %" />
                      <input className={inputFlexCls} style={{ flex: 1 }} value={s.return10y} onChange={e => amcSchemesOps.update(i, "return10y", e.target.value)} placeholder="10Y return %" />
                      {form.amcOtherFundsSchemeList.length > 1 && (
                        <button onClick={() => amcSchemesOps.remove(i)} className="shrink-0 p-1.5 rounded-[6px] text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 transition-colors">
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={amcSchemesOps.add} className="flex items-center gap-1.5 text-[12px] text-primary hover:text-[#1E3A8A] transition-colors mt-1">
                    <Plus className="size-3.5" /> Add AMC scheme
                  </button>
                </div>

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
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3 py-2.5 rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC]">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText className="size-4 text-primary shrink-0" />
                      <span className="text-[12px] text-[#0B1F3A] truncate font-medium" title={f.filename}>{f.filename}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={f.documentType}
                        onChange={(e) => handleDocumentTypeChange(i, e.target.value)}
                        className="text-[11.5px] font-medium text-[#0B1F3A] bg-white border border-[#E2E8F0] rounded-[6px] px-2 py-1 outline-none focus:border-primary cursor-pointer min-w-[150px] transition-colors"
                      >
                        <option value="">— Select Type —</option>
                        {DOCUMENT_TYPES.map(type => {
                          const isSelectedElsewhere = form.factsheets.some((otherF, otherIdx) => otherIdx !== i && otherF.documentType === type);
                          if (isSelectedElsewhere) return null;
                          return <option key={type} value={type}>{type}</option>;
                        })}
                      </select>
                      <a href={f.url} target="_blank" rel="noreferrer" className="p-1 text-[#94A3B8] hover:text-primary hover:bg-white rounded-[6px] border border-transparent hover:border-[#E2E8F0] transition-all" title="View Document">
                        <ExternalLink className="size-3.5" />
                      </a>
                      <button onClick={() => removeFactsheet(i)} className="p-1 text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 rounded-[6px] border border-transparent hover:border-red-100 transition-all ml-0.5" title="Remove Document">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
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
              {uploadingPdf ? `Uploading… ${uploadProgress}%` : "Upload PDF / Excel"}
            </button>
            {!selectedFund && <p className="text-[11.5px] text-[#94A3B8] mt-1.5">Select a fund first</p>}

            {/* Sync from ISIN (finapi.upvaly.com) */}
            <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
              <h2 className="text-[15px] font-bold text-[#0B1F3A] mb-1">Sync from ISIN</h2>
              <p className="text-[11.5px] text-[#94A3B8] mb-3">
                Pulls holdings, sectors, fundamentals, rolling returns, ranks, risk metrics and peers from finapi and overwrites this fund&apos;s record (NAV untouched).
              </p>
              <div className="flex gap-2">
                <input
                  className={inputCls}
                  value={isinInput}
                  onChange={e => setIsinInput(e.target.value.toUpperCase())}
                  placeholder="e.g. INF966L30027"
                  maxLength={12}
                />
                <button
                  onClick={handleSyncIsin}
                  disabled={syncingIsin || !isinInput.trim()}
                  className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#0B1F3A] text-white text-[13px] font-semibold hover:bg-[#1E3A8A] transition-colors disabled:opacity-50"
                >
                  {syncingIsin ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                  {syncingIsin ? "Syncing…" : "Sync"}
                </button>
              </div>
              {syncMsg && (
                <p className={`text-[11.5px] mt-2 ${syncMsg.ok ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
                  {syncMsg.text}
                </p>
              )}
            </div>

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

              <div className="mb-4">
                <label className="block text-[12px] font-medium text-[#64748B] mb-1">
                  API Key <span className="text-[#94A3B8] font-normal">API</span>
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


              <button
                onClick={handleAnalyse}
                disabled={!canAnalyse || analysing}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[8px] bg-[#0B1F3A] text-white text-[13px] font-semibold hover:bg-[#1E3A8A] transition-colors disabled:opacity-50"
              >
                {analysing ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
                {analysing ? "Analysing factsheet…" : "Analyse Factsheet"}
              </button>

              <button
                onClick={handleGenerateNarrative}
                disabled={!canGenerateNarrative || generatingNarrative}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-[8px] border border-primary text-primary text-[13px] font-semibold hover:bg-primary/5 transition-colors disabled:opacity-50"
                title="Generates benchmark details, taxation summary, derivative strategies, alpha approach, suitability, market scenario and portfolio-fit copy from the synced API data (fundamentals, holdings, sectors, rolling returns, risk metrics)."
              >
                {generatingNarrative ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
                {generatingNarrative ? "Generating…" : "Generate Narrative Fields with AI"}
              </button>

              {!canAnalyse && !analysing && (
                <p className="text-[11.5px] text-[#94A3B8] mt-2 text-center">
                  {!selectedFund ? "Select a fund" : !form.factsheets.length ? "Upload at least one PDF" : "Enter API key"}
                </p>
              )}


              {aiError && (
                <div className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-[8px]">
                  <AlertCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-red-700">{aiError}</p>
                </div>
              )}

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
                          topHoldings: "Top Holdings",
                          schemeCategory: "Scheme Category",
                          inceptionDate: "Inception Date",
                          redemptionFrequency: "Redemption Frequency",
                          terMax: "Maximum TER",
                          terSlabs: "TER Slabs",
                          taxationSummary: "Taxation Summary",
                          sponsorName: "Sponsor",
                          amcName: "AMC / Investment Manager",
                          trusteeName: "Trustee",
                          registrarName: "Registrar (RTA)",
                          suitableFor: "Suitable For",
                          notSuitableFor: "Not Suitable For",
                          bullMarket: "Bull Market Performance",
                          bearMarket: "Bear Market Performance",
                          sidewaysMarket: "Sideways Market Performance",
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

            {/* Debug: full current form state as JSON */}
            {selectedFund && (
              <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[15px] font-bold text-[#0B1F3A]">Form JSON</h2>
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(form, null, 2))}
                    className="text-[11.5px] font-semibold text-primary hover:text-[#1E3A8A] transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <pre className="text-[11px] leading-relaxed bg-[#0B1F3A] text-[#E2E8F0] rounded-[8px] p-3 overflow-auto max-h-[600px] whitespace-pre-wrap break-words">
                  {JSON.stringify(form, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
