export interface MonthMeta {
  mon: string; year: number; monthLabel: string; monthShort: string;
  asOfLong: string; asOfShort: string; amfiUrl: string; fileMon: string;
}

const MONTHS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
const FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function ordinal(d: number): string {
  const s = ["th","st","nd","rd"], v = d % 100;
  return d + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Last calendar day of the month before `toDate`, as YYYY-MM-DD. Used when AMFI
// has not published the requested month's SIF report yet and the admin opts to
// fall back to the previous month's industry figures.
export function previousMonthToDate(toDate: string): string {
  const dt = new Date(toDate + "T00:00:00Z");
  const prevLast = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), 0));
  return prevLast.toISOString().slice(0, 10);
}

export function monthMetaFromDate(toDate: string): MonthMeta {
  const dt = new Date(toDate + "T00:00:00Z");
  const y = dt.getUTCFullYear();
  const mi = dt.getUTCMonth();
  const mon = MONTHS[mi];
  const monTitle = mon.charAt(0).toUpperCase() + mon.slice(1); // "Jun"
  const lastDay = new Date(Date.UTC(y, mi + 1, 0)).getUTCDate();
  return {
    mon, year: y, fileMon: monTitle,
    monthLabel: `${FULL[mi]} ${y}`,
    monthShort: `${monTitle} ${y}`,
    asOfLong: `${ordinal(lastDay)} ${monTitle} ${y}`,
    asOfShort: `${monTitle} ${lastDay}, ${y}`,
    amfiUrl: `https://portal.amfiindia.com/spages/sif_am${mon}${y}repo.pdf`,
  };
}
