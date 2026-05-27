import {
  ShieldCheck,
  TrendingUp,
  FileCheck,
  Building2,
  AlertCircle,
  MinusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SourceVariant } from "@/lib/staticData";

interface BadgeConfig {
  label: string;
  bg: string;
  text: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const CONFIG: Record<SourceVariant, BadgeConfig> = {
  amfi: {
    label: "AMFI Verified",
    bg: "bg-verified-tint",
    text: "text-[#063B28]",
    Icon: ShieldCheck,
  },
  calculated: {
    label: "Calculated from NAV",
    bg: "bg-primary-tint",
    text: "text-primary",
    Icon: TrendingUp,
  },
  isid: {
    label: "ISID Verified",
    bg: "bg-[#EEF3F8]",
    text: "text-brand-navy",
    Icon: FileCheck,
  },
  amc: {
    label: "AMC Verified",
    bg: "bg-[#EEF3FF]",
    text: "text-primary",
    Icon: Building2,
  },
  review: {
    label: "Manual Review",
    bg: "bg-[#FFF7E6]",
    text: "text-[#92400E]",
    Icon: AlertCircle,
  },
  unavailable: {
    label: "Unavailable",
    bg: "bg-[#F1F5F9]",
    text: "text-muted",
    Icon: MinusCircle,
  },
};

interface SourceBadgeProps {
  variant: SourceVariant;
  className?: string;
}

export function SourceBadge({ variant, className }: SourceBadgeProps) {
  const { label, bg, text, Icon } = CONFIG[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-[5px] rounded-full",
        "text-[11px] font-semibold leading-none tracking-wide",
        bg,
        text,
        className
      )}
    >
      <Icon className="w-3 h-3 flex-shrink-0" strokeWidth={2} />
      {label}
    </span>
  );
}
