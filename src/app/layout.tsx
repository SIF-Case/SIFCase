import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
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
      <body className="min-h-full flex flex-col">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
