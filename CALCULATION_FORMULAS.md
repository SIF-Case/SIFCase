# SIFcase Financial Calculation Formulas

This document contains all the financial formulas used in the SIFcase application for computing returns, risk metrics, and performance indicators.

---

## 1. PERCENTAGE RETURN (Simple Return)

**Formula:**
```
Return (%) = ((Current Value - Base Value) / Base Value) × 100
```

**Code:**
```typescript
function pct(current: number, base: number): number {
  return +(((current - base) / base) * 100).toFixed(2);
}
```

**Use Cases:**
- Short-term returns (< 1 year)
- Daily price changes
- Monthly returns
- Intra-period returns

**Example:**
- If NAV goes from 100 to 110
- Return = ((110 - 100) / 100) × 100 = 10%

---

## 2. ANNUALIZED RETURN (CAGR - Compound Annual Growth Rate)

**Formula:**
```
CAGR (%) = ((Current Value / Base Value) ^ (1 / Years) - 1) × 100
```

**Conditions:**
- If period ≤ 1 year: Use simple percentage return
- If period > 1 year: Use CAGR

**Code:**
```typescript
function annualizedReturn(
  current: number, 
  base: number, 
  startDate: Date, 
  endDate: Date
): number {
  const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  
  if (years <= 1) return pct(current, base);
  
  return +((Math.pow(current / base, 1 / years) - 1) * 100).toFixed(2);
}
```

**Use Cases:**
- Since Inception (SI) returns
- Multi-year performance comparison
- Long-term investment analysis

**Example:**
- Initial NAV: 100
- Final NAV: 150
- Time period: 3 years
- CAGR = ((150/100)^(1/3) - 1) × 100 = 14.47%

---

## 3. SHARPE RATIO (Risk-Adjusted Return)

**Formula:**
```
Sharpe Ratio = (Mean Daily Return - Risk-Free Rate) / Standard Deviation × √252
```

**Where:**
- Mean Daily Return = Average of daily returns
- Risk-Free Rate = 6.5% annual (0.065 / 252 per day)
- Standard Deviation = Sample standard deviation of daily returns
- √252 = Annualization factor (252 trading days per year)

**Code:**
```typescript
function computeSharpe(
  records: { nav: number; navDate: Date }[], 
  riskFreeAnnual = 0.065
): number | null {
  if (records.length < 15) return null;

  // Calculate daily returns
  const returns: number[] = [];
  for (let i = 1; i < records.length; i++) {
    const r = (records[i].nav - records[i - 1].nav) / records[i - 1].nav;
    returns.push(r);
  }

  if (returns.length < 10) return null;

  // Mean return
  const n = returns.length;
  const mean = returns.reduce((a, b) => a + b, 0) / n;
  
  // Sample standard deviation
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1);
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return null;

  // Sharpe ratio
  return +((mean - riskFreeAnnual / 252) / stdDev * Math.sqrt(252)).toFixed(2);
}
```

**Interpretation:**
- < 1.0: Poor risk-adjusted return
- 1.0 - 2.0: Good risk-adjusted return
- 2.0 - 3.0: Very good risk-adjusted return
- > 3.0: Excellent risk-adjusted return

**Key Points:**
- Treats each NAV record as 1 trading day (ignoring weekend/holiday gaps)
- Uses sample standard deviation (n-1 denominator)
- Risk-free rate defaults to 6.5% annual

---

## 4. MAXIMUM DRAWDOWN (Worst Peak-to-Trough Decline)

**Formula:**
```
Max Drawdown (%) = ((Trough Value - Peak Value) / Peak Value) × 100
```

**Where:**
- Peak = Highest NAV reached up to that point
- Trough = Lowest NAV after the peak

**Code:**
```typescript
function computeMaxDrawdown(records: { nav: number }[]): number | null {
  if (records.length < 2) return null;
  
  let peak = records[0].nav;
  let maxDD = 0;
  
  for (const r of records) {
    // Update peak if current value is higher
    if (r.nav > peak) peak = r.nav;
    
    // Calculate drawdown from peak
    const dd = (r.nav - peak) / peak * 100;
    
    // Track maximum drawdown (most negative)
    if (dd < maxDD) maxDD = dd;
  }
  
  return +maxDD.toFixed(2);
}
```

**Use Cases:**
- Risk assessment
- Understanding worst-case scenarios
- Comparing fund volatility

**Example:**
- Peak NAV: 120
- Trough NAV: 90
- Max Drawdown = ((90 - 120) / 120) × 100 = -25%

**Interpretation:**
- Value is always negative or zero
- Larger negative value = higher risk
- Shows maximum loss an investor would have experienced

---

## 5. VOLATILITY (Annualized Standard Deviation)

**Formula:**
```
Volatility (%) = Standard Deviation of Daily Returns × √252 × 100
```

**Where:**
- Standard Deviation = Sample std dev of daily returns
- √252 = Annualization factor (252 trading days)
- × 100 = Convert to percentage

**Code:**
```typescript
function computeVolatility(records: { nav: number }[]): number | null {
  if (records.length < 15) return null;
  
  // Calculate daily returns
  const rets: number[] = [];
  for (let i = 1; i < records.length; i++) {
    rets.push((records[i].nav - records[i - 1].nav) / records[i - 1].nav);
  }
  
  if (rets.length < 10) return null;
  
  // Mean and variance
  const n = rets.length;
  const mean = rets.reduce((a, b) => a + b, 0) / n;
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1);
  
  // Annualized volatility
  return +(Math.sqrt(variance) * Math.sqrt(252) * 100).toFixed(2);
}
```

**Interpretation:**
- Low (< 10%): Low volatility, stable returns
- Medium (10-20%): Moderate volatility
- High (20-30%): High volatility
- Very High (> 30%): Very volatile, risky

**Use Cases:**
- Risk measurement
- Portfolio diversification
- Comparing fund stability

---

## 6. MONTHLY RETURN CALCULATION

**Formula:**
```
Monthly Return (%) = ((End of Month NAV - Start of Month NAV) / Start of Month NAV) × 100
```

**Code:**
```typescript
// Monthly returns for heatmap
const monthReturns: (number | null)[] = periods.map(({ start, end }) => {
  const inMonth = records.filter((r) => r.navDate >= start && r.navDate <= end);
  if (inMonth.length < 2) return null;
  return pct(inMonth[inMonth.length - 1].nav, inMonth[0].nav);
});
```

**Requirements:**
- Minimum 2 NAV records in the month
- Uses first and last NAV of the month
- Returns null if insufficient data

---

## 7. YEAR-TO-DATE (YTD) RETURN

**Formula:**
```
YTD Return (%) = ((Current NAV - NAV on Jan 1) / NAV on Jan 1) × 100
```

**Code:**
```typescript
const ytdCutoff = new Date(Date.UTC(latestDate.getUTCFullYear(), 0, 1));
const ytdIdx = lastIdxOnOrBefore(allHistory, ytdCutoff);
const ytdSlice = ytdIdx >= 0 ? allHistory.slice(ytdIdx) : allHistory;
const ytdReturn = computeReturn(ytdSlice);
```

**Use Cases:**
- Current year performance tracking
- Comparing against calendar year benchmarks

---

## 8. PERIOD-BASED RETURNS (1M, 3M, 6M, 1Y)

**Formula:**
```
Period Return (%) = ((Current NAV - NAV X months ago) / NAV X months ago) × 100
```

**Code:**
```typescript
// Calculate cutoff dates
const cutoffs = {
  "1M": subMonths(latestDate, 1),
  "3M": subMonths(latestDate, 3),
  "6M": subMonths(latestDate, 6),
  "1Y": subYears(latestDate, 1),
};

// Get NAV records from cutoff to present
const sliceFor = (cutoff: Date) => {
  const idx = lastIdxOnOrBefore(allHistory, cutoff);
  return idx >= 0 ? allHistory.slice(idx) : allHistory.filter((r) => r.navDate >= cutoff);
};

// Calculate return
const computeReturn = (slice: typeof allHistory): number | null =>
  slice.length >= 2 ? pct(slice[slice.length - 1].nav, slice[0].nav) : null;
```

**Key Points:**
- Uses last trading day on or before the cutoff date
- Handles weekends/holidays automatically
- Requires minimum data points for accuracy:
  - 1M: 20 records
  - 3M: 60 records
  - 6M: 120 records
  - 1Y: 240 records

---

## 9. DAILY CHANGE (Ticker)

**Formula:**
```
Daily Change (%) = ((Latest NAV - Previous NAV) / Previous NAV) × 100
```

**Code:**
```typescript
const latest = recent[0].nav as number;
const prev = recent.length > 1 ? (recent[1].nav as number) : latest;
const change = pct(latest, prev);
```

**Use Cases:**
- Real-time price movements
- Market ticker displays
- Daily performance tracking

---

## 10. DATE HANDLING UTILITIES

### Month Subtraction (handles month-end overflow)
```typescript
function subMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const targetMonth = d.getMonth() - months;
  d.setMonth(targetMonth);
  
  // Handle overflow (e.g., Jan 31 - 1 month → Feb 31 → Mar 3)
  const expected = ((targetMonth % 12) + 12) % 12;
  if (d.getMonth() !== expected) d.setDate(0); // Roll back to last day of intended month
  
  return d;
}
```

### Year Subtraction
```typescript
function subYears(date: Date, years: number): Date {
  return subMonths(date, years * 12);
}
```

### Find Last Trading Day On or Before Date
```typescript
function lastIdxOnOrBefore(records: { navDate: Date }[], cutoff: Date): number {
  let idx = -1;
  for (let i = 0; i < records.length; i++) {
    if (records[i].navDate <= cutoff) idx = i;
    else break;
  }
  return idx;
}
```

---

## 11. ASSUMPTIONS & CONSTANTS

| Constant | Value | Purpose |
|----------|-------|---------|
| Risk-Free Rate | 6.5% annual (0.065) | Used in Sharpe ratio calculation |
| Trading Days Per Year | 252 | Standard market convention |
| Minimum Records for Sharpe | 15 | Ensures statistical significance |
| Minimum Returns for Sharpe | 10 | After calculating daily returns |
| Minimum Records for Volatility | 15 | Statistical significance |

---

## 12. DATA REQUIREMENTS

### Return Calculations
- **1M Return**: Minimum 20 NAV records
- **3M Return**: Minimum 60 NAV records
- **6M Return**: Minimum 120 NAV records
- **1Y Return**: Minimum 240 NAV records
- **SI Return**: Minimum 2 NAV records (inception + latest)

### Risk Metrics
- **Sharpe Ratio**: Minimum 15 NAV records, 10 daily returns after calculation
- **Max Drawdown**: Minimum 2 NAV records
- **Volatility**: Minimum 15 NAV records, 10 daily returns

---

## 13. PRECISION & ROUNDING

All calculations are rounded to **2 decimal places** using `.toFixed(2)` and converted back to numbers with the `+` operator:

```typescript
return +(calculatedValue).toFixed(2);
```

This ensures:
- Consistent display format
- Prevents floating-point precision errors
- Standardized across all metrics

---

## 14. NULL HANDLING

Functions return `null` when:
- Insufficient data points for calculation
- Division by zero would occur
- Standard deviation is zero (for Sharpe ratio)
- No records available for the period

This allows the UI to handle missing data gracefully.

---

## SUMMARY TABLE

| Metric | Formula | Min Data | Interpretation |
|--------|---------|----------|----------------|
| Simple Return | ((New - Old) / Old) × 100 | 2 records | Percentage gain/loss |
| CAGR | ((New/Old)^(1/Years) - 1) × 100 | 2 records | Annualized return |
| Sharpe Ratio | (Mean - RF) / StdDev × √252 | 15 records | Risk-adjusted return |
| Max Drawdown | ((Trough - Peak) / Peak) × 100 | 2 records | Worst loss from peak |
| Volatility | StdDev × √252 × 100 | 15 records | Annualized risk |

---

**Generated from:** `src/lib/sifData.ts`
**Last Updated:** 2026-07-07
