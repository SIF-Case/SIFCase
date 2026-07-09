import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { getEffectiveAccess } from "@/lib/adminAuth";

// Runs only for "/" so the homepage route itself never has to call
// cookies()/auth() — that's what was forcing it out of static/ISR caching.
// Proxy always runs on Node.js runtime, so no runtime config needed here.
export const config = {
  matcher: ["/"],
};

export async function proxy(req: NextRequest) {
  const session = await auth();
  if (session?.user?.id) {
    const access = await getEffectiveAccess(session.user.id);
    if (access && (access.isSuperAdmin || access.permissions.size > 0)) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }
  return NextResponse.next();
}
