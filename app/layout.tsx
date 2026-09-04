import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meridian DSS — Executive Decision-Style Assessment",
  description:
    "MBTI-based Decision Support System for HR Executive review of upper-management decision styles — Siam Bank Corp.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body bg-ink text-slate-50 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
