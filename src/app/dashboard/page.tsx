import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getEffectiveAccess } from "@/lib/adminAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DashboardClient } from "./DashboardClient";
import { getTopFunds } from "@/lib/sifData";
import { Providers } from "@/app/providers";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard — SIFcase" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const access = await getEffectiveAccess(session.user.id);
  if (access && (access.isSuperAdmin || access.permissions.size > 0)) {
    redirect("/admin");
  }

  const funds = await getTopFunds();

  return (
    <Providers funds={funds}>
      <main className="flex flex-col min-h-screen bg-surface">
        <Navbar />
        <DashboardClient user={session.user} funds={funds} />
        <Footer />
      </main>
    </Providers>
  );
}
