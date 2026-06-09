import { connectDB } from "@/lib/mongodb";
import Client from "@/models/Client";
import User from "@/models/User";

const PRIMARY_SOURCES = ["Create User", "Wishlist", "Invest", "Booklet"];

export async function logClientActivity(userId: string, action: string, description: string) {
  if (!userId) return;
  await connectDB();

  let client = await Client.findOne({ linkedUserId: userId });

  if (!client) {
    const user = await User.findById(userId).lean();
    if (!user) return;

    client = new Client({
      name: user.name || user.email || user.phone || "Unknown User",
      email: user.email || undefined,
      phone: user.phone || undefined,
      linkedUserId: user._id,
      stage: "lead",
      source: PRIMARY_SOURCES.includes(action) ? action : "",
      activities: [{ action, description, createdAt: new Date() }],
      pageVisits: [],
      notes: [{ text: "User account created", authorName: "System", createdAt: user.createdAt || new Date() }],
    });
  } else {
    client.activities.push({ action, description, createdAt: new Date() });
    if (PRIMARY_SOURCES.includes(action)) {
      client.source = action;
    }
  }

  await client.save();
}

export async function logClientPageVisit(userId: string, path: string) {
  if (!userId || !path) return;
  await connectDB();

  let client = await Client.findOne({ linkedUserId: userId });

  if (!client) {
    const user = await User.findById(userId).lean();
    if (!user) return;

    client = new Client({
      name: user.name || user.email || user.phone || "Unknown User",
      email: user.email || undefined,
      phone: user.phone || undefined,
      linkedUserId: user._id,
      stage: "lead",
      source: "",
      activities: [],
      pageVisits: [{ path, visitedAt: new Date() }],
      notes: [{ text: "User account created", authorName: "System", createdAt: user.createdAt || new Date() }],
    });
  } else {
    client.pageVisits.push({ path, visitedAt: new Date() });
    // Limit to latest 50 visits to avoid document bloat
    if (client.pageVisits.length > 50) {
      client.pageVisits = client.pageVisits.slice(-50);
    }
  }

  await client.save();
}
