import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MarketTicker from "@/components/MarketTicker";

export const metadata: Metadata = {
  title: "S&M Services — Stocks & Money Services | Portfolio Analytics",
  description:
    "S&M Services: your stocks and money services platform. Analyze your portfolio, research any stock, and get AI-powered investment insights with real-time market data.",
  keywords: "stocks and money services, S&M services, stock portfolio analyzer, money services, stock research, investment analysis, AI investment research, portfolio analytics, stock market tools",
  openGraph: {
    title: "S&M Services — Stocks & Money Services | Portfolio Analytics",
    description: "S&M Services: your stocks and money services platform for portfolio analysis and AI-powered stock research.",
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
