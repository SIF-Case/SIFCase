'use client';

import { useSession } from "next-auth/react";
import { AuthModal } from "./AuthModal";

// Site-wide gate: any signed-in, non-admin user whose account has no phone number
// is forced through the mandatory phone-collection step before they can continue.
// Covers both the email and Google sign-in paths (incl. Google's redirect return)
// and any legacy phone-less account.
export function PhoneGate() {
  const { data: session, status } = useSession();

  const needsPhone =
    status === "authenticated" &&
    !!session?.user &&
    !session.user.isAdmin &&
    !session.user.phone;

  if (!needsPhone) return null;

  // onClose is a no-op — the modal itself blocks dismissal in phone mode and
  // closes only after the phone is attached (session updates, gate unmounts).
  return <AuthModal open mode="phone" onClose={() => {}} />;
}
