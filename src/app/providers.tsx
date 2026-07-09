'use client';

import { CompareTrayProvider, type CompareFund } from "@/components/ui/CompareTray";
import type { ReactNode } from "react";

export function Providers({ children, funds }: { children: ReactNode; funds: CompareFund[] }) {
  return <CompareTrayProvider funds={funds}>{children}</CompareTrayProvider>;
}
