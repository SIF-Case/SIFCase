"use client";

import dynamic from "next/dynamic";
import type { FundRow } from "@/lib/sifData";

/**
 * `ssr: false` is only legal inside a client component, so this thin wrapper
 * exists purely to let the homepage (a server component) skip server-rendering
 * the compare tool. It pulls ~340 KB of recharts out of the homepage's initial
 * JS; the tool is interactive-only, so nothing indexable is lost.
 */
const BuildYourCompareImpl = dynamic(
  () => import("./BuildYourCompare").then((m) => m.BuildYourCompare),
  { ssr: false, loading: () => <div className="h-[600px]" /> },
);

export function BuildYourCompareLazy({ funds }: { funds: FundRow[] }) {
  return <BuildYourCompareImpl funds={funds} />;
}
