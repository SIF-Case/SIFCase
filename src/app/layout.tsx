import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { UserTracker } from "@/components/UserTracker";
import { CallbackPopup } from "@/components/ui/CallbackPopup";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        {/* Nohemi font - geometric display font used in hero heading */}
        <link rel="preconnect" href="https://fonts.cdnfonts.com" />
        <link rel="stylesheet" href="https://fonts.cdnfonts.com/css/nohemi" />
      </head>
      {/* Satoshi Variable font loaded via CSS @import in globals.css */}
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
