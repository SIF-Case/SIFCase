import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Analytics } from "@vercel/analytics/next";
import { UserTracker } from "@/components/UserTracker";
import { CallbackPopup } from "@/components/ui/CallbackPopup";
import { PhoneGate } from "@/components/auth/PhoneGate";
import "./globals.css";

// Inter used to be loaded here too, but every rule in globals.css names
// --font-dm-sans first and only falls back to Inter, so it was a second font
// download on every page that nothing ever rendered.

// Self-hosted replacement for the old cdnfonts.com (Nohemi, 500-erroring)
// and fonts.googleapis.com (Satoshi Variable, wrong host) render-blocking
// external font requests — next/font inlines and preloads this at build time.
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.sifcase.com"),
  title: "SIFcase — Compare SIFs with verified data",
  description:
    "Track NAV, NFOs, TER, strategy documents, and returns from official sources — simplified for serious investors.",
  keywords: [
    "Specialized Investment Fund",
    "SIF",
    "NAV",
    "NFO",
    "AMFI",
    "TER",
    "SIF comparison",
    "SIF returns",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        {/* No window-focus refetch: the session is a JWT that doesn't change
            while a tab sits open, and every refetch handed components a fresh
            session object that reset their derived state. */}
        <SessionProvider refetchOnWindowFocus={false}>
          <UserTracker />
          <CallbackPopup />
          {children}
          <PhoneGate />
          <Analytics />
        </SessionProvider>
      </body>
    </html>
  );
}
