import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { UserTracker } from "@/components/UserTracker";
import { CallbackPopup } from "@/components/ui/CallbackPopup";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Self-hosted replacement for the old cdnfonts.com (Nohemi, 500-erroring)
// and fonts.googleapis.com (Satoshi Variable, wrong host) render-blocking
// external font requests — next/font inlines and preloads this at build time.
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
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
    <html lang="en" className={`${inter.variable} ${dmSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <UserTracker />
          <CallbackPopup />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
