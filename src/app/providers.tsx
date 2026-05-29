'use client';

import { SessionProvider } from "next-auth/react";
import { CompareTrayProvider } from "@/components/ui/CompareTray";
import type { FundRow } from "@/lib/sifData";
import type { ReactNode } from "react";

export function Providers({ children, funds }: { children: ReactNode; funds: FundRow[] }) {
  return (
    <SessionProvider>
      <CompareTrayProvider funds={funds}>{children}</CompareTrayProvider>
    </SessionProvider>
  );
}
