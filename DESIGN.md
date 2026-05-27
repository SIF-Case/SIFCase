# SIFcase Design System — Wealth Trust

## What This Is

This file is the authoritative design reference for building SIFcase. Read it before implementing any page, component, or UI element. Every decision about color, type, layout, copy, and component behavior is described here.

SIFcase is a **serious SIF intelligence platform** for investors, wealth managers, and research-driven decision makers. It must feel more credible, cleaner, and more source-verified than SIF360. It is not a fintech landing page. It is a research interface with an editorial layer.

---

## Core Principle

Every screen should answer:
> Can I trust this number, understand this strategy, and compare it responsibly?

---

## Colors

### Token Reference (JS)

```js
export const theme = {
  colors: {
    // Brand
    brandNavy:      "#0B1F3A",  // trust, nav, hero, footer, authority surfaces
    ink:            "#071426",  // strongest text, headings, fund names
    primary:        "#1E4ED8",  // actions, active filters, links, focus rings
    primaryActive:  "#1B43B8",  // hover/pressed on primary
    primarySoft:    "#E8EEFF",  // selected filter bg, comparison chip bg

    // Verification
    verified:       "#0FAF75",  // AMFI Verified, positive returns, import success — not decorative
    verifiedSoft:   "#E8FBF3",  // verified badge background

    // Surfaces (light research mode — this is the default)
    canvas:         "#FFFFFF",  // main page floor
    surfaceSoft:    "#F7FAFC",  // alternating bands, secondary cards, empty states
    mist:           "#EAF1F7",  // filter panels, trust strips, table headers
    card:           "#FFFFFF",  // cards on soft surfaces
    cardHover:      "#FBFDFF",  // hovered row/card

    // Surfaces (dark trust mode — hero, footer, CTA bands only)
    canvasNavy:     "#0B1F3A",
    surfaceNavy:    "#102D52",  // elevated cards on navy
    surfaceNavySoft:"#153A66",  // nested/selected dark cards

    // Borders
    hairline:       "#D8E2EC",  // default 1px on cards, tables, inputs
    hairlineSoft:   "#E5EDF5",  // softer row dividers
    hairlineOnNavy: "rgba(255,255,255,0.16)",
    borderStrong:   "#B8C7D6",  // selected states, sticky panels

    // Text (light surfaces)
    textStrong:     "#0B1F3A",
    textBody:       "#334155",
    textMuted:      "#64748B",
    textFaint:      "#94A3B8",  // placeholders, disabled, unavailable

    // Text (dark navy surfaces)
    textOnNavy:     "#FFFFFF",
    textSoftOnNavy: "#D8E8F7",
    textOnPrimary:  "#FFFFFF",
    textOnVerified: "#063B28",

    // Financial semantics
    positive:       "#0FAF75",  // positive returns
    negative:       "#DC2626",  // negative returns, errors, failed imports
    neutral:        "#64748B",  // no movement, unavailable
    review:         "#F59E0B",  // pending verification, manual review
    info:           "#1E4ED8",  // tooltips, source notes, education
  },
  radius: {
    sm:   "6px",     // small badges, compact tags
    md:   "10px",    // buttons, small inputs
    lg:   "14px",    // inputs, dropdowns, filter chips
    xl:   "18px",    // cards, table containers
    "2xl":"24px",    // hero containers, major CTA bands
    pill: "9999px",  // badges, chips
  },
  spacing: {
    xxs:     "4px",
    xs:      "8px",
    sm:      "12px",
    md:      "16px",
    lg:      "24px",
    xl:      "32px",
    "2xl":   "48px",
    "3xl":   "64px",
    section: "88px",
    hero:    "112px",
  },
  shadows: {
    card:    "0 14px 40px rgba(11, 31, 58, 0.06)",
    premium: "0 24px 70px rgba(11, 31, 58, 0.10)",
    button:  "0 12px 28px rgba(30, 78, 216, 0.22)",
  },
}
```

### Color Usage Rules

- **Navy** = trust and authority. Nav, hero, footer, trust bands, research callouts.
- **Royal Blue** = actions only. CTAs, active filters, selected states, focus rings. Do not overuse.
- **Emerald** = verification and positive financial data only. Not decorative green.
- **Red** = negative returns, failed imports, high-risk warnings only.
- **Amber** = manual review / pending verification only.
- Never add purple, neon gradients, crypto orange, or AI-glow colors.
- Do not introduce a second accent. The system is Navy + Blue + Emerald.

---

## Typography

### Font Stack

```css
font-family: Inter, Manrope, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
font-variant-numeric: tabular-nums; /* always on for financial numbers */
```

Inter / Manrope for all UI, editorial, nav, buttons, labels.
Tabular numerals everywhere: NAV, returns, TER, AUM, percentages, dates.

### Scale

| Token | Size | Weight | Line-H | Tracking | Use |
|---|---:|---:|---:|---:|---|
| hero-display | 64px | 700 | 1.05 | -1.2px | Homepage hero headline |
| display-lg | 48px | 700 | 1.1 | -0.8px | Major page headlines |
| display-md | 40px | 650 | 1.15 | -0.5px | Section headings |
| display-sm | 32px | 650 | 1.2 | -0.3px | CTA band headings |
| title-xl | 28px | 650 | 1.25 | -0.2px | Fund detail title |
| title-lg | 24px | 650 | 1.3 | 0 | Card group titles |
| title-md | 20px | 650 | 1.35 | 0 | Card titles, table section headings |
| title-sm | 16px | 650 | 1.4 | 0 | Filter labels, source cards |
| body-lg | 18px | 400 | 1.65 | 0 | Hero supporting copy, education intros |
| body-md | 15px | 400 | 1.6 | 0 | Default body and table descriptions |
| body-sm | 14px | 400 | 1.5 | 0 | Dense card copy, metadata |
| caption | 12px | 550 | 1.4 | 0.02em | Badges, dates, source labels |
| button | 14px | 650 | 1 | 0 | Button labels |
| nav-link | 14px | 550 | 1.4 | 0 | Top nav items |
| number-hero | 48px | 700 | 1.05 | -0.6px | Large NAV / market stats |
| number-lg | 32px | 700 | 1.1 | -0.3px | Return cards |
| number-md | 16px | 600 | 1.4 | 0 | Table values |
| number-sm | 13px | 600 | 1.4 | 0 | Small deltas, badges |

### Headline Voice

Good: `Compare SIFs with verified data.`
Bad: `Unlock the Future of AI-Powered Wealth Creation.`

Good section title: `What this strategy is trying to do`
Bad section title: `Discover limitless opportunities with next-gen investment intelligence.`

---

## Layout

### Containers

| Context | Max Width |
|---|---:|
| Marketing | 1200px |
| Dashboard | 1320px |
| Research / tables | 1440px |

### Grid Patterns

- **Homepage hero**: 6/6 desktop split — editorial copy left, dashboard preview right.
- **Fund detail**: 8/4 split — main content left, NAV/CTA rail right.
- **All SIFs**: filter sidebar + main results grid/table.
- **Compare**: horizontal matrix with sticky first column.

### Spacing Rules

- Homepage bands: `section` (88px) to `hero` (112px).
- Dense data pages: 32–48px between sections.
- Card padding: 20–24px normal, 28–32px premium.
- Table row padding: 14–18px vertical.
- Filter sidebar padding: 20–24px.

---

## Elevation

| Level | Treatment | Use |
|---|---|---|
| Flat | No shadow, no border | Page canvas, education content |
| Hairline | 1px `hairline` | Tables, inputs, filter panels |
| Soft Card | White + hairline + subtle shadow | Fund cards, NFO cards, metric cards |
| Premium Card | Larger radius + soft shadow + source row | Fund detail panels, comparison cards |
| Navy Card | `surfaceNavy` on navy background | Hero dashboard, CTA cards |
| Sticky Panel | Hairline + shadow on scroll | Compare summary, fund detail rail |

No glassmorphism. No blur. No glows. No mesh gradients.

---

## Components

### Navigation (`top-nav`)

**Light variant**: white bg, `hairlineSoft` bottom border, navy wordmark, right cluster: search + "Become SIF Ready" CTA.
**Dark hero variant**: transparent or `brandNavy` bg, white wordmark, `textSoftOnNavy` links.

Nav items: All SIFs · Performance · Compare · NFOs · Learn · Calculators

### Buttons

**Primary** — `primary` bg, white text, `rounded.md`, 42–46px height, 12×20px padding. Hover: `primaryActive`.
Use for: Compare SIFs, Become SIF Ready, View Full Comparison. Do not place on every action.

**Secondary** — white bg, `hairline` border, `textStrong` text. Hover: `surfaceSoft`.
Use for: Learn SIF Basics, View Documents, Reset Filters.

**Ghost** — transparent, `primary` text, no border.
Use for: View, Details, Source, Read more (inside tables and compact cards).

### Source Badge

The most important small component. Communicates data confidence visually.

| Variant | Background | Text Color | Icon |
|---|---|---|---|
| AMFI Verified | `verifiedSoft` | `textOnVerified` | shield-check |
| Calculated from NAV | `primarySoft` | `primary` | chart-line |
| ISID Verified | `#EEF3F8` | `brandNavy` | document-check |
| AMC Verified | `#EEF3FF` | `primary` | building |
| Manual Review | `#FFF7E6` | `#92400E` | alert-circle |
| Unavailable | `#F1F5F9` | `textMuted` | minus-circle |

Shape: `rounded.pill`, padding 5×9px, `caption` font.

### Trust Strip

Horizontal row below hero and on fund detail pages.
> NAV from AMFI · Returns calculated from NAV history · Documents from AMC / ISID · No guessed data

Background: `surfaceSoft` or navy-transparent in hero. Small icons + source labels. Human tone, not promotional.

### Market Snapshot Card

White card, `hairline` border, large tabular number, tiny source label, optional icon in soft blue circle.
Example: `37 · Regular Plan NAVs · AMFI Verified · 25 May 2026`

### SIF Card

1. AMC / brand row
2. Fund name
3. Strategy category
4. NAV + date
5. Returns grid
6. Risk / TER row
7. Source badge row
8. Actions (View Details · Add to Compare)

Feels like a research object, not a marketing tile.

### Performance Table

Columns: AMC · SIF Name · Strategy · Plan · Option · NAV · NAV Date · 1D · 1M · 3M · Since Inception · TER · Source · Action

Rules:
- Sticky header, sortable columns, horizontal scroll on smaller screens.
- Positive returns: `positive` text color only.
- Negative returns: `negative` text color only.
- Missing data shows text ("Insufficient history"), never blank cells.
- Source badge in every row.

### Compare Matrix

2–4 SIFs. Sticky left label column. Sections: Basic · NAV & Returns · Risk · Cost · Liquidity · Strategy · Documents · Data Confidence.
Highlight differences softly. Never use "Best," "Recommended," "Winner," "Safe," or "Guaranteed."

### Fund Detail Header

Left: AMC, brand, fund name, plan/option, status badge, riskometer.
Right: latest NAV, last updated, source confidence, CTA card (Add to Compare · Request Callback · View Documents).

### NAV Chart Card

White card, Royal Blue line, minimal grid, date range tabs.
Footer: `Source: AMFI NAV data. Returns calculated by SIFcase.`
No fake forecasts.

### Strategy Explainer Card

Title: `What this strategy is trying to do`
2–4 short plain-English paragraphs. Include risk note. Link to official document.
This is a key differentiator from generic data sites.

### NFO Card

Fields: AMC · SIF name · Strategy · Open date · Close date · Days left · Min investment · Riskometer · Document link · CTA

Status: Live (`primarySoft`/`primary`) · Upcoming (soft navy) · Closed (neutral) · Launched (verified)

Good urgency: `Closes in 5 days` — not `Last chance to grab this hot fund`

### Lead Form Card ("Become SIF Ready")

Fields: Name · Phone · Email · Investment range · Interested in · Consent
CTA: `Request a SIF discussion`
Microcopy: `We will use this information only to help you with your SIF inquiry.`
Note: `SIFs are higher-ticket investment products and may not be suitable for every investor.`

### Footer

Deep Navy bg, white text, muted links. Sections: Platform · Data Sources · Learn · Company · Legal · Contact.

Required legal copy:
> SIFcase is a research and comparison platform. Information shown is for educational purposes only and should not be considered investment advice. Investments in securities markets are subject to market risks. Please read all official scheme documents carefully before investing.

---

## Pages

### Homepage

1. Hero with dashboard preview
2. Trust strip
3. Market snapshot (stat cards)
4. Featured SIF comparison table
5. Live NFOs
6. Why SIFcase is different
7. Learn SIF section
8. Become SIF Ready CTA
9. Footer

Must communicate: what SIF is, why data verification matters, what users can compare, where values come from, how to take next step.

### All SIFs

Filter sidebar + results. Toggle: Card view / Table view. Sort controls. Results count. Data updated timestamp.
Subtitle: `Explore all available Specialized Investment Funds with source-backed NAV, strategy, and document data.`

### Performance Page

Table-first. Fast sorting. NAV date visible. Returns marked as calculated. Missing values explained. Direct and Regular plans separated. Filters: AMC, strategy, plan, option, status. Do not hide data quality.

### Compare Page

Up to 4 SIFs. Sticky field labels. Grouped sections. Source badges. Highlight differences. Explain terms with tooltips. No winner labels, no recommendation language.

### Fund Detail Page

1. Fund identity
2. Latest NAV
3. Performance
4. NAV chart
5. What this strategy is trying to do
6. Risk and liquidity
7. Costs and TER
8. Benchmark
9. Fund manager
10. Documents
11. Data confidence
12. Similar SIFs
13. Lead CTA

Must feel like an analyst-prepared research sheet.

### Live NFO Page

Live NFOs · Upcoming NFOs · Recently closed · NFO document links · "How to evaluate a SIF NFO" education block

### Knowledge Hub

Not a blog. Research explainers, SIF 101, document-reading guides, strategy explainers.
Categories: Basics · Strategy · Risk · Documents · Comparison · Regulation · Taxation

---

## Data Confidence UX

### Field → Source Badge Mapping

| Field | Badge |
|---|---|
| Latest NAV | AMFI Verified |
| NAV Date | AMFI Verified |
| SIF Code | AMFI Verified |
| ISIN | AMFI / ISID Verified |
| 1M / 3M Return | Calculated from NAV |
| Since Inception | Calculated from NAV |
| TER | AMFI / AMC Verified |
| Benchmark | ISID Verified |
| Exit Load | ISID Verified |
| Fund Manager | AMC Verified |
| Riskometer | ISID / AMC Verified |
| NFO Dates | AMFI / AMC Verified |
| Minimum Investment | SEBI Rule / ISID Verified |

### Data Quality States (all must be designed, not edge-cased)

- Verified
- Calculated
- Partially verified
- Manual review
- Unavailable
- Insufficient history
- Import failed

---

## Copywriting

### Standard Microcopy

| Situation | Text |
|---|---|
| Missing return | `Insufficient history` |
| Missing NAV | `NAV unavailable` |
| Pending doc | `Pending source verification` |
| Calculated tooltip | `Calculated from stored AMFI NAV history.` |
| AMFI tooltip | `Imported from AMFI SIF NAV data.` |
| ISID tooltip | `Verified from the official Investment Strategy Information Document.` |

### Voice

Calm · Clear · Specific · Responsible · Human · Source-aware. No hype, no buzzwords, no vague promises, no "AI-powered" claims unless implemented.

---

## Motion

```css
transition: all 180ms ease;
```

Allowed: card hover lift, filter drawer slide, table row hover, tooltip fade, chart reveal, button hover.
Forbidden: floating elements, parallax, animated blobs, flashing numbers, crypto-style motion.

---

## Responsive Breakpoints

| Name | Width | Notes |
|---|---:|---|
| Mobile | < 768px | Nav collapses, filters become drawer, tables scroll horizontally, 1-up cards |
| Tablet | 768–1024px | 2-up cards, compare matrix scrolls, nav hides secondary links |
| Desktop | 1024–1440px | Full nav, sidebar filters, sticky panels |
| Wide | > 1440px | Max-width containers, more breathing room |

Mobile rules: keep primary CTA visible; tables scroll with sticky first column; fund detail shows NAV first, then returns, chart, then explanation.

---

## Iconography

Stroke width 1.75–2px, line style only.
Use: shield-check · database · document-text · chart-line · calendar · scale · filter · info-circle · external-link · alert-triangle

Never: 3D icons, cartoon money, crypto coins, AI brain icons.

---

## Do / Don't

**Do**
- Use `brandNavy` for trust-heavy surfaces
- Use `primary` only for actions and active states
- Use `verified` only for verified/positive data
- Show source badges wherever data credibility matters
- Use tabular numerals for all financial data
- Explain missing data honestly ("Insufficient history", not blank)
- Make tables beautiful and primary — investors compare rows

**Don't**
- Create a generic SaaS homepage
- Use fake AI/crypto visuals, 3D coins, or gradient blobs
- Call anything "best," "safe," or "guaranteed"
- Show blank cells or `0` for missing data
- Use green decoratively (it means verification here)
- Overuse blue buttons
- Write vague marketing copy
- Invent data
