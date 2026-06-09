import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { logClientActivity, logClientPageVisit } from "@/lib/activityLogger";
import { connectDB } from "@/lib/mongodb";
import Client from "@/models/Client";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { type } = body;

  try {
    if (type === "page_visit") {
      const { path } = body;
      if (!path) return NextResponse.json({ error: "path required" }, { status: 400 });
      await logClientPageVisit(userId, path);
    } else if (type === "activity") {
      const { action, description } = body;
      if (!action || !description) return NextResponse.json({ error: "action and description required" }, { status: 400 });
      await logClientActivity(userId, action, description);
    } else if (type === "sync") {
      const { visits, activities } = body;
      await connectDB();
      let client = await Client.findOne({ linkedUserId: userId });

      if (!client) {
        const user = await User.findById(userId).lean();
        if (!user) return NextResponse.json({ ok: true });
        client = new Client({
          name: user.name || user.email || user.phone || "Unknown User",
          email: user.email || undefined,
          phone: user.phone || undefined,
          linkedUserId: user._id,
          stage: "lead",
          source: "",
          activities: [],
          pageVisits: [],
          notes: [{ text: "Client profile dynamically initialized via tracking sync", authorName: "System", createdAt: new Date() }],
        });
      }

      if (Array.isArray(visits)) {
        for (const v of visits) {
          if (v.path) {
            client.pageVisits.push({ path: v.path, visitedAt: new Date(v.visitedAt || Date.now()) });
          }
        }
      }

      if (Array.isArray(activities)) {
        const PRIMARY_SOURCES = ["Create User", "Wishlist", "Invest", "Booklet"];
        for (const act of activities) {
          if (act.action && act.description) {
            client.activities.push({
              action: act.action,
              description: act.description,
              createdAt: new Date(act.createdAt || Date.now()),
            });
            if (PRIMARY_SOURCES.includes(act.action)) {
              client.source = act.action;
            }
          }
        }
      }

      if (client.pageVisits.length > 50) {
        client.pageVisits = client.pageVisits.slice(-50);
      }

      await client.save();
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
