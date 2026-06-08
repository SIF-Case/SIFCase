import { requireAdmin } from "@/lib/adminAuth";
import AISettingsClient from "./AISettingsClient";

export default async function AISettingsPage() {
  await requireAdmin();
  return <AISettingsClient />;
}
