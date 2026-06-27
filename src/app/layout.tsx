import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MarketTicker from "@/components/MarketTicker";

export const metadata: Metadata = {
  title: "S&M Services — Portfolio Analytics & AI Investment Research",
  description:
    "Professional portfolio analytics and AI-powered investment research. Analyze your portfolio, research any stock, and receive institutional-grade intelligence powered by real-time market data.",
  keywords: "portfolio analysis, stock research, investment report, AI research, risk management, portfolio optimization, institutional analytics",
  openGraph: {
    title: "S&M Services — Portfolio Analytics & AI Investment Research",
    description: "Professional portfolio analytics and AI-powered investment research powered by real-time market data.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <MarketTicker />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
