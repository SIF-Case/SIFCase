import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SIFScheme from "@/models/SIFScheme";
import Article from "@/models/Article";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";

    if (!q) {
      return NextResponse.json({ schemes: [], articles: [], fundHouses: [] });
    }

    await connectDB();

    const [schemes, articles, fundHousesRows] = await Promise.all([
      // 1. Search SIF Schemes
      SIFScheme.find({
        isActive: { $ne: false },
        plan: { $ne: "Direct" },
        $or: [
          { schemeName: { $regex: q, $options: "i" } },
          { fundName: { $regex: q, $options: "i" } },
          { amc: { $regex: q, $options: "i" } },
          { brandName: { $regex: q, $options: "i" } },
          { isinGrowth: { $regex: q, $options: "i" } },
        ],
      })
        .select("schemeCode schemeName fundName amc brandName plan option")
        .limit(6)
        .lean(),

      // 2. Search Published Articles
      Article.find({
        status: "published",
        $or: [
          { title: { $regex: q, $options: "i" } },
          { excerpt: { $regex: q, $options: "i" } },
          { category: { $regex: q, $options: "i" } },
          { subcategory: { $regex: q, $options: "i" } },
          { tags: { $regex: q, $options: "i" } },
        ],
      })
        .select("title slug excerpt category subcategory readTime")
        .limit(6)
        .lean(),

      // 3. Search Unique Fund Houses (AMCs)
      SIFScheme.aggregate([
        {
          $match: {
            brandName: { $regex: q, $options: "i" },
          },
        },
        {
          $group: {
            _id: "$brandName",
            companyName_short: { $first: "$companyName_short" },
          },
        },
        { $limit: 5 },
      ]),
    ]);

    const fundHouses = fundHousesRows.map((row) => ({
      brandName: row._id,
      companyName_short: row.companyName_short ?? "",
      slug: row._id.toLowerCase().replace(/\s+/g, "-"),
    }));

    return NextResponse.json({
      schemes,
      articles,
      fundHouses,
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: "Failed to perform search" }, { status: 500 });
  }
}
