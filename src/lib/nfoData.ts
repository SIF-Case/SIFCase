export interface AllocationBand {
  name: string;
  range: string;
  percent: number;
  color: string;
}

export interface StrategyPoint {
  title: string;
  desc: string;
  icon: "pulse" | "clock" | "shield" | "chart" | "lock";
}

export interface Manager {
  name: string;
  role: string;
  cred: string;
  avatar: string;
}

export interface NFODocument {
  title: string;
  href: string;
}

export interface NFOData {
  slug: string;
  amc: string;
  amcShort: string;
  avatar: string;
  name: string;
  category: "Equity" | "Hybrid" | "Debt";
  structure: "Open-ended" | "Close-ended";
  objective: string;
  daysLeft: number;
  closeDate: string;
  openDate: string;
  allotmentDate: string;
  reopenDate: string;
  minInvestment: string;
  subscriptionPrice: string;
  exitLoad: string;
  benchmark: string;
  riskLevel: string;
  riskColor: string;
  isClosingSoon: boolean;
  allocationBands: AllocationBand[];
  strategyPoints: StrategyPoint[];
  managers: Manager[];
  docs: NFODocument[];
}

// NFO data now lives in MongoDB (see src/models/Nfo.ts, managed at /admin/nfos) —
// fetched via src/lib/nfoQueries.ts on the server and passed down as props.
