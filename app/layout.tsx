import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meridian DSS — Executive Decision-Style Assessment",
  description:
    "MBTI-based Decision Support System for HR Executive review of upper-management decision styles — Siam Bank Corp.",
};

const THEME_INIT_SCRIPT = `
try {
  if (localStorage.getItem("meridian-theme") === "light") {
    document.documentElement.classList.add("light");
  }
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-body bg-ink text-slate-50 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
