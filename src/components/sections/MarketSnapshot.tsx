"use client";

import type { SnapshotStats } from "@/lib/sifData";
import { useEffect, useState } from "react";
import { Wallet, FileText, PieChart, Shield, Landmark, TrendingUp, CheckCircle2 } from "lucide-react";

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number | null, prefix?: string, suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value === null) return;
    
    let startTimestamp: number | null = null;
    const duration = 2000;
    
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayValue(Math.floor(easeProgress * value));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    
    window.requestAnimationFrame(step);
  }, [value]);

  if (value === null) return <span>—</span>;

  return <span>{prefix}{displayValue.toLocaleString("en-IN")}{suffix}</span>;
}

function StatCard({ 
  value, 
  valueNode,
  label, 
  prefix,
  suffix
}: { 
  value?: number | null; 
  valueNode?: React.ReactNode;
  label?: string; 
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-6 sm:p-7 flex flex-col justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgb(0,0,0,0.12)] w-full h-full border border-gray-100 text-left">
      <div className="flex flex-col w-full flex-1 justify-center">
        {valueNode ? valueNode : (
          <>
            <div className="text-[26px] sm:text-[30px] font-bold text-[#0f172a] mb-1 tracking-tight font-sans">
              <AnimatedNumber value={value ?? null} prefix={prefix} suffix={suffix} />
            </div>
            {label && (
              <div className="text-[14px] font-medium text-gray-500 tracking-wide">
                {label}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function lastMonthLabel(isoDate: string): string {
  if (isoDate === "—") return "last month";
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export function MarketSnapshot({ stats }: { stats: SnapshotStats }) {
  const { equity, hybrid, debt } = stats.categoryBreakdown;

  const cards = [
    {
      label: "Total AUM",
      value: stats.totalAUM ? Math.round(stats.totalAUM / 1e7) : null,
      prefix: "₹",
      suffix: " Cr",
    },
    { 
      label: "AMCs Registered", 
      value: stats.uniqueAMCs,
    },
    { 
      label: "Schemes", 
      value: stats.totalGrowthRegular, 
    },
    { 
      valueNode: (
        <div className="flex flex-col gap-3 w-full">
          <span className="text-[16px] font-semibold text-[#0f172a] flex gap-3 items-center">
            <CheckCircle2 className="w-5 h-5 text-green-500" /> 
            <span><AnimatedNumber value={equity} /> Equity</span>
          </span>
          <span className="text-[16px] font-semibold text-[#0f172a] flex gap-3 items-center">
            <CheckCircle2 className="w-5 h-5 text-green-500" /> 
            <span><AnimatedNumber value={hybrid} /> Hybrid</span>
          </span>
          <span className="text-[16px] font-semibold text-[#0f172a] flex gap-3 items-center">
            <CheckCircle2 className="w-5 h-5 text-green-500" /> 
            <span><AnimatedNumber value={debt} /> Debt</span>
          </span>
        </div>
      )
    },
    { 
      label: "NFOs In Pipeline", 
      value: stats.nfosInPipeline,
    },
  ];

  return (
    <section className="bg-[#004C61] px-6 py-20 sm:px-10 lg:px-[112px] w-full flex flex-col items-center relative overflow-hidden">
      {/* Premium subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#14b7a3] opacity-[0.1] blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-[1400px] relative z-10 flex flex-col items-center">
        
        {/* Header Section */}
        <div className="text-center mb-14">
          <div className="text-[#14b7a3] text-[13px] font-bold tracking-[2px] uppercase mb-4">
            SIF Universe At A Glance
          </div>
          <h2 className="text-white text-[26px] sm:text-[40px] font-extrabold tracking-tight mb-4 leading-tight">
            Key insights from the SIF ecosystem
          </h2>

        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 w-full items-stretch justify-center">
          {cards.map((stat, index) => (
            <div key={stat.label || `card-${index}`} className="h-full">
              <StatCard {...stat} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
