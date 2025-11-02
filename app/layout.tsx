import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Commerce Metrics Dashboard",
  description: "KPIs, cohorts, and ETL rollups",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full bg-gray-50">
      <body className="min-h-full text-gray-900 antialiased">{children}</body>
    </html>
  );
}

