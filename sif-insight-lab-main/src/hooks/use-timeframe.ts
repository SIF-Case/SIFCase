import { useNavigate, useSearch } from "@tanstack/react-router";
import { TIMEFRAMES, type Timeframe } from "@/lib/market-derive";

export function useTimeframe(): [Timeframe, (tf: Timeframe) => void] {
  const search = useSearch({ strict: false }) as { tf?: string };
  const navigate = useNavigate();
  const tf = (TIMEFRAMES.includes(search.tf as Timeframe) ? search.tf : "1Y") as Timeframe;
  const set = (next: Timeframe) =>
    navigate({ to: ".", search: (prev: Record<string, unknown>) => ({ ...prev, tf: next }), replace: true });
  return [tf, set];
}
