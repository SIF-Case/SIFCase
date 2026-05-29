'use client';

import { CompareTrayProvider } from "@/components/ui/CompareTray";
import type { FundRow } from "@/lib/sifData";
import type { ReactNode } from "react";

export function Providers({ children, funds }: { children: ReactNode; funds: FundRow[] }) {
  return <CompareTrayProvider funds={funds}>{children}</CompareTrayProvider>;
}
