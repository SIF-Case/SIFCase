/**
 * Seed SIF Education articles into MongoDB.
 * Run: node scripts/seedSifEducation.js
 *
 * These 4 articles will be shown on /sif-101 under the "SIF Education" section.
 * The detail pages are at /read/[slug].
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Basic dotenv parser
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('Error: .env file not found at', envPath);
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
    if (match) {
      let value = (match[2] || '').trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[match[1]] = value;
    }
  });
}

const articles = [
  {
    title: "Specialized Investment Fund (SIF): Meaning, Features, Benefits and Restrictions",
    slug: "sif-meaning-features-benefits-restrictions",
    excerpt: "A comprehensive guide to understanding what a Specialized Investment Fund is — its structure under SEBI regulations, key features, the benefits it offers to eligible investors, and the restrictions that apply.",
    content: `<p>A Specialized Investment Fund (SIF) is a SEBI-regulated investment vehicle that bridges the gap between Mutual Funds and Portfolio Management Services (PMS). Introduced to serve sophisticated investors, SIFs allow more flexible portfolio strategies while maintaining investor protection standards.</p>

<h2>What is a Specialized Investment Fund?</h2>
<p>Under SEBI's circular, a SIF is an investment product that allows Asset Management Companies (AMCs) to offer strategies that go beyond traditional mutual fund constraints — including long-short equity, arbitrage, and multi-asset approaches.</p>

<h2>Key Features</h2>
<ul>
<li><strong>Minimum investment of ₹10 lakh</strong> — setting it apart from standard mutual funds</li>
<li><strong>Daily NAV disclosure</strong> — unlike PMS which has portfolio-level reporting</li>
<li><strong>SEBI-regulated structure</strong> — offering transparency and investor protection</li>
<li><strong>Flexible strategies</strong> — including derivatives, short-selling, and complex multi-asset positions</li>
</ul>

<h2>Benefits</h2>
<p>SIFs offer institutional-grade investment strategies to high-net-worth individuals at a fraction of the ticket size required for PMS. They combine the liquidity of mutual funds with the strategy sophistication of hedge fund-like structures.</p>

<h2>Restrictions</h2>
<p>Only investors with a minimum investment of ₹10 lakh per SIF are eligible. AMCs must meet SEBI eligibility criteria. SIF schemes operate separately from existing mutual fund schemes and have their own risk-band disclosures.</p>`,
    category: "SIF Education",
    subcategory: "Basics",
    order: 1,
    status: "published",
    authorName: "SIFcase Team",
    readTime: 7,
    publishedAt: new Date(),
    tags: ["SIF", "basics", "SEBI", "features"],
  },
  {
    title: "Reading a SIF's Investment Strategy Information Document (ISID)",
    slug: "reading-sif-isid-investment-strategy-document",
    excerpt: "Learn how to decode the Investment Strategy Information Document (ISID) — the key document every SIF must publish that describes its investment approach, risk parameters, and portfolio methodology.",
    content: `<p>Every Specialized Investment Fund (SIF) is required by SEBI to publish an Investment Strategy Information Document (ISID). This document is your primary reference for understanding exactly how a fund will invest your money.</p>

<h2>What is an ISID?</h2>
<p>The ISID is analogous to a Scheme Information Document (SID) in mutual funds, but tailored for the more complex strategies SIFs employ. It outlines the fund's investment universe, strategy, risk limits, and performance benchmarks.</p>

<h2>Key Sections to Read</h2>

<h3>1. Investment Objective and Strategy</h3>
<p>This section explains the fund's goal and how it intends to achieve it — whether through long-short equity, multi-asset allocation, or another approach.</p>

<h3>2. Risk Band</h3>
<p>SEBI mandates SIFs to declare a 1–6 risk band. Higher bands indicate greater potential volatility.</p>

<h3>3. Portfolio Construction</h3>
<p>Look for constraints on position sizing, sector limits, and derivatives usage.</p>

<h3>4. Liquidity and Redemption Terms</h3>
<p>Unlike standard mutual funds, some SIFs may have lock-in periods or redemption windows. Understand these before investing.</p>

<h2>Red Flags to Watch For</h2>
<ul>
<li>Vague strategy descriptions with no specific constraints</li>
<li>Extremely high benchmark or return targets without clear methodology</li>
<li>Limited liquidity windows with high exit loads</li>
</ul>`,
    category: "SIF Education",
    subcategory: "Due Diligence",
    order: 2,
    status: "published",
    authorName: "SIFcase Team",
    readTime: 6,
    publishedAt: new Date(),
    tags: ["ISID", "due diligence", "document", "SIF strategy"],
  },
  {
    title: "5 Things to Check Before Investing in Any SIF",
    slug: "5-things-to-check-before-investing-sif",
    excerpt: "Before committing ₹10 lakh or more to any Specialized Investment Fund, make sure you've checked these five critical factors — from the AMC's track record to the fund's risk band and redemption terms.",
    content: `<p>Investing in a Specialized Investment Fund (SIF) requires more due diligence than a standard mutual fund, given the higher minimum ticket and more complex strategies involved. Here are five essential things to check before you invest.</p>

<h2>1. The AMC's Track Record in Complex Strategies</h2>
<p>Not every AMC has experience running long-short or derivatives-heavy portfolios. Look for AMCs with a history of managing PMS or AIF strategies — their expertise directly impacts how well the SIF will be managed.</p>

<h2>2. The Risk Band</h2>
<p>SEBI assigns each SIF a risk band from 1 (lowest) to 6 (highest). This tells you the fund's expected volatility range. Make sure the risk band aligns with your personal risk tolerance and investment horizon.</p>

<h2>3. Expense Ratio and Total Costs</h2>
<p>SIFs can have higher expense ratios than mutual funds, plus performance fees in some cases. Factor these into your expected return calculations. Compare the Direct Plan vs Regular Plan costs.</p>

<h2>4. Liquidity Terms</h2>
<p>Check the redemption frequency — some SIFs offer daily liquidity like mutual funds, while others have weekly or monthly redemption windows. Also check exit loads for early redemption.</p>

<h2>5. Strategy Transparency and ISID</h2>
<p>Read the Investment Strategy Information Document carefully. If the strategy is vaguely described or the risk disclosures are unclear, treat it as a warning sign. A well-managed SIF will have a clearly articulated investment process with defined constraints.</p>`,
    category: "SIF Education",
    subcategory: "Due Diligence",
    order: 3,
    status: "published",
    authorName: "SIFcase Team",
    readTime: 5,
    publishedAt: new Date(),
    tags: ["checklist", "due diligence", "before investing", "tips"],
  },
  {
    title: "Understanding Risk Bands in SIFs",
    slug: "understanding-risk-bands-sifs",
    excerpt: "SEBI's 1–6 risk band system for Specialized Investment Funds explained — how each band is computed, what it means for your investment, and how to use risk bands when comparing SIFs side-by-side.",
    content: `<p>SEBI requires every Specialized Investment Fund (SIF) to disclose a Risk Band — a number from 1 to 6 that summarizes the fund's expected risk level. Understanding this system is essential for comparing and selecting SIFs that match your risk profile.</p>

<h2>The 1–6 Risk Band Scale</h2>

<ul>
<li><strong>Band 1 — Low Risk</strong>: Primarily debt-oriented with capital preservation focus. Suitable for conservative investors.</li>
<li><strong>Band 2 — Low-to-Moderate Risk</strong>: Mix of debt and limited equity exposure. Lower volatility expected.</li>
<li><strong>Band 3 — Moderate Risk</strong>: Balanced equity-debt allocation. Suitable for medium-term investors.</li>
<li><strong>Band 4 — Moderately High Risk</strong>: Higher equity allocation or some derivatives usage. Expect meaningful drawdowns.</li>
<li><strong>Band 5 — High Risk</strong>: Concentrated equity, long-short strategies, or significant derivatives. Higher return potential with higher volatility.</li>
<li><strong>Band 6 — Very High Risk</strong>: Maximum risk profile. Complex strategies like leveraged long-short, momentum, or arbitrage with derivatives overlay.</li>
</ul>

<h2>How Risk Bands Are Computed</h2>
<p>SEBI's methodology evaluates several factors including the fund's asset class exposure, use of derivatives and leverage, portfolio concentration, liquidity of underlying assets, and historical or modeled volatility.</p>

<h2>Using Risk Bands to Compare SIFs</h2>
<p>Risk bands provide a standardized way to compare SIFs across different AMCs. When two funds have the same risk band but different return profiles, you can more confidently assess which offers better risk-adjusted performance.</p>

<h2>Risk Band ≠ Return Expectation</h2>
<p>A higher risk band does not guarantee higher returns — it only means higher potential volatility. Always evaluate risk-adjusted metrics like Sharpe Ratio and maximum drawdown alongside the risk band.</p>`,
    category: "SIF Education",
    subcategory: "Risk",
    order: 4,
    status: "published",
    authorName: "SIFcase Team",
    readTime: 6,
    publishedAt: new Date(),
    tags: ["risk band", "SEBI", "risk", "comparison"],
  },
];

async function main() {
  loadEnv();

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI not found in .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    const col = db.collection('articles');

    let inserted = 0;
    let skipped = 0;

    for (const article of articles) {
      const existing = await col.findOne({ slug: article.slug });
      if (existing) {
        console.log(`  ⏭  Already exists: "${article.title}"`);
        skipped++;
        continue;
      }

      const now = new Date();
      await col.insertOne({
        ...article,
        createdAt: now,
        updatedAt: now,
      });

      console.log(`  ✅  Inserted: "${article.title}"`);
      inserted++;
    }

    console.log(`\nDone! Inserted ${inserted}, skipped ${skipped} (already existed).`);

    // Ensure ArticleOptions collection has "SIF Education" as a recognised category
    const optCol = db.collection('articleoptions');
    const opts = await optCol.findOne({});
    if (opts) {
      const cats = opts.categories || [];
      if (!cats.includes('SIF Education')) {
        await optCol.updateOne({}, { $addToSet: { categories: 'SIF Education' } });
        console.log('  ✅  Added "SIF Education" to ArticleOptions categories.');
      }
    } else {
      await optCol.insertOne({ categories: ['SIF Education'], createdAt: new Date(), updatedAt: new Date() });
      console.log('  ✅  Created ArticleOptions with "SIF Education".');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

main();
