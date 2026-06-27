"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart2, TrendingUp, TrendingDown, Search, Activity,
  Shield, Target, Layers, Gauge, Sparkles, ExternalLink, Clock,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface StockQuote { ticker: string; name: string; price: number | null; change: number | null; changePct: number | null; }
interface SectorData { name: string; ticker: string; changePct: number | null; }
interface NewsItem { headline: string; source: string; datetime: number; url: string; }
interface MarketData {
  trending: StockQuote[];
  gainers: StockQuote[];
  losers: StockQuote[];
  sectors: SectorData[];
  news: NewsItem[];
}

// ── Format helpers ─────────────────────────────────────────────────────────────
function fmtPrice(v: number | null) { return v == null ? "—" : `$${v.toFixed(2)}`; }
function fmtPct(v: number | null) {
  if (v == null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-[#1E2D3D] rounded animate-pulse ${className ?? ""}`} />;
}


function LiveMarketWidget({ trending, loaded }: { trending: StockQuote[]; loaded: boolean }) {
  return (
    <div className="bg-[#060D16] rounded-xl border border-[#1A2840] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 border-b border-[#1A2840] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
          <span className="text-[9px] font-mono font-bold text-[#22C55E] tracking-widest uppercase">Live Market</span>
        </div>
        <Link href="/research" className="text-[9px] font-mono text-[#3A5A7A] hover:text-[#22C55E] transition-colors">
          Open Research Terminal →
        </Link>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-3 px-4 py-1.5 border-b border-[#0F1C2E]">
        <span className="text-[9px] font-bold text-[#3A5A7A] uppercase tracking-wider font-mono">Symbol</span>
        <span className="text-[9px] font-bold text-[#3A5A7A] uppercase tracking-wider font-mono text-right">Price</span>
        <span className="text-[9px] font-bold text-[#3A5A7A] uppercase tracking-wider font-mono text-right">Chg %</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#0F1C2E]">
        {!loaded
          ? Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="grid grid-cols-3 px-4 py-2.5 gap-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-16 ml-auto" />
                <Skeleton className="h-3 w-12 ml-auto" />
              </div>
            ))
          : trending.map((stock) => {
              const pos = (stock.changePct ?? 0) >= 0;
              return (
                <Link
                  key={stock.ticker}
                  href={`/research/${stock.ticker}`}
                  className="grid grid-cols-3 px-4 py-2.5 hover:bg-[#0D1A2A] transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-mono font-bold text-[#E2E8F0] group-hover:text-[#22C55E] transition-colors">
                      {stock.ticker}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[12px] font-mono text-[#94A3B8]">{fmtPrice(stock.price)}</span>
                  </div>
                  <div className="text-right flex items-center justify-end gap-1">
                    {pos
                      ? <TrendingUp size={9} className="text-[#22C55E]" />
                      : <TrendingDown size={9} className="text-[#EF4444]" />}
                    <span className={`text-[11px] font-mono font-bold ${pos ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                      {fmtPct(stock.changePct)}
                    </span>
                  </div>
                </Link>
              );
            })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[#0F1C2E]">
        <p className="text-[9px] font-mono text-[#2A4A6A]">Data: Finnhub API · Refreshes every 60s</p>
      </div>
    </div>
  );
}

function MarketMovers({ gainers, losers, loaded }: { gainers: StockQuote[]; losers: StockQuote[]; loaded: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Gainers */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#E5E7EB] flex items-center gap-2 bg-[#F0FDF4]">
          <TrendingUp size={11} className="text-[#16A34A]" />
          <span className="text-[10px] font-bold text-[#16A34A] uppercase tracking-widest">Top Gainers</span>
        </div>
        <div className="divide-y divide-[#F3F4F6]">
          {!loaded
            ? Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <div className="h-3 w-24 bg-[#F3F4F6] rounded animate-pulse" />
                  <div className="h-3 w-16 bg-[#F3F4F6] rounded animate-pulse" />
                </div>
              ))
            : gainers.map((s) => (
                <Link
                  key={s.ticker}
                  href={`/research/${s.ticker}`}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-[#F8FAF8] transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#111827] group-hover:text-[#0B5D3B] w-12">{s.ticker}</span>
                    <span className="text-xs text-[#9CA3AF] hidden sm:block">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs text-[#374151]">{fmtPrice(s.price)}</span>
                    <span className="font-mono font-bold text-xs text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded min-w-[56px] text-right">
                      {fmtPct(s.changePct)}
                    </span>
                  </div>
                </Link>
              ))}
        </div>
      </div>

      {/* Losers */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-[#E5E7EB] flex items-center gap-2 bg-[#FFF5F5]">
          <TrendingDown size={11} className="text-[#DC2626]" />
          <span className="text-[10px] font-bold text-[#DC2626] uppercase tracking-widest">Top Losers</span>
        </div>
        <div className="divide-y divide-[#F3F4F6]">
          {!loaded
            ? Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <div className="h-3 w-24 bg-[#F3F4F6] rounded animate-pulse" />
                  <div className="h-3 w-16 bg-[#F3F4F6] rounded animate-pulse" />
                </div>
              ))
            : losers.map((s) => (
                <Link
                  key={s.ticker}
                  href={`/research/${s.ticker}`}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-[#FFF8F8] transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#111827] group-hover:text-red-600 w-12">{s.ticker}</span>
                    <span className="text-xs text-[#9CA3AF] hidden sm:block">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs text-[#374151]">{fmtPrice(s.price)}</span>
                    <span className="font-mono font-bold text-xs text-[#DC2626] bg-[#FEF2F2] px-2 py-0.5 rounded min-w-[56px] text-right">
                      {fmtPct(s.changePct)}
                    </span>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </div>
  );
}

function SectorHeatmap({ sectors, loaded }: { sectors: SectorData[]; loaded: boolean }) {
  if (!loaded) {
    return (
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-1.5">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="bg-[#F3F4F6] rounded-lg h-12 animate-pulse" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-1.5">
      {sectors.map((s) => {
        if (s.changePct == null) {
          return (
            <div key={s.name} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-2.5 text-center">
              <p className="text-[9px] font-semibold text-[#9CA3AF]">{s.name}</p>
              <p className="text-xs font-mono text-[#D1D5DB] mt-0.5">—</p>
            </div>
          );
        }
        const pos = s.changePct >= 0;
        const intensity = Math.min(Math.abs(s.changePct) / 2.5, 1);
        const bg = pos
          ? `rgba(22, 163, 74, ${0.10 + intensity * 0.28})`
          : `rgba(220, 38, 38, ${0.10 + intensity * 0.28})`;
        const borderColor = pos ? "rgba(22,163,74,0.22)" : "rgba(220,38,38,0.22)";
        const textColor = pos ? "#15803D" : "#B91C1C";
        return (
          <div
            key={s.name}
            className="rounded-lg p-2.5 text-center"
            style={{ backgroundColor: bg, border: `1px solid ${borderColor}` }}
          >
            <p className="text-[9px] font-semibold text-[#374151]">{s.name}</p>
            <p className="text-xs font-mono font-bold mt-0.5" style={{ color: textColor }}>
              {pos ? "+" : ""}{s.changePct.toFixed(2)}%
            </p>
          </div>
        );
      })}
    </div>
  );
}

function NewsGrid({ news, loaded }: { news: NewsItem[]; loaded: boolean }) {
  if (!loaded) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-white border border-[#E5E7EB] rounded-xl p-4 animate-pulse">
            <div className="h-2 w-16 bg-[#F3F4F6] rounded mb-3" />
            <div className="space-y-1.5">
              <div className="h-2 bg-[#F3F4F6] rounded" />
              <div className="h-2 bg-[#F3F4F6] rounded w-4/5" />
              <div className="h-2 bg-[#F3F4F6] rounded w-3/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (news.length === 0) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 text-center">
        <p className="text-xs text-[#9CA3AF]">Market news unavailable from provider at this time.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {news.slice(0, 8).map((n, i) => (
        <a
          key={i}
          href={n.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white border border-[#E5E7EB] rounded-xl p-4 hover:border-[#0B5D3B]/25 hover:shadow-card-md transition-all block group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[9px] font-bold text-[#0B5D3B] uppercase tracking-wider">{n.source}</span>
            <span className="text-[9px] text-[#9CA3AF] flex items-center gap-0.5">
              <Clock size={8} />
              {n.datetime
                ? new Date(n.datetime * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : ""}
            </span>
          </div>
          <p className="text-xs font-semibold text-[#111827] leading-snug line-clamp-3 group-hover:text-[#0B5D3B] transition-colors">
            {n.headline}
          </p>
          {n.url && (
            <div className="mt-2.5 text-[9px] text-[#0B5D3B] flex items-center gap-1 font-medium">
              Read article <ExternalLink size={8} />
            </div>
          )}
        </a>
      ))}
    </div>
  );
}

const CAPABILITIES = [
  { icon: Gauge, title: "Portfolio Health Score", desc: "6-dimension composite grade: diversification, risk, valuation, growth, sector balance, income." },
  { icon: Activity, title: "Risk Center", desc: "Concentration risk, beta, volatility, correlation, and scenario stress testing across major market events." },
  { icon: Search, title: "AI Research Reports", desc: "10-section investment reports built exclusively from real Finnhub data — FACT vs ANALYSIS labeled." },
  { icon: Layers, title: "Exposure Analytics", desc: "Sector, market cap, and geographic exposure with benchmark deviation analysis." },
  { icon: Shield, title: "Portfolio Intelligence Engine", desc: "AI-generated insights from actual portfolio calculations — concentration, correlation, macro exposure." },
  { icon: Target, title: "Analyst Sentiment", desc: "Live Buy/Hold/Sell consensus, price targets, and quarterly EPS actuals vs estimates." },
  { icon: Sparkles, title: "Scenario Testing", desc: "Stress test against 2008 crisis, COVID crash, 2022 rate shock, and recession scenarios." },
  { icon: BarChart2, title: "Performance Attribution", desc: "Benchmark returns vs S&P 500 and Nasdaq across 1M, 3M, 6M, and 1Y periods." },
];

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/market-overview")
      .then((r) => r.json())
      .then((d) => { setMarketData(d as MarketData); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const trending = marketData?.trending ?? [];
  const gainers  = marketData?.gainers  ?? [];
  const losers   = marketData?.losers   ?? [];
  const sectors  = marketData?.sectors  ?? [];
  const news     = marketData?.news     ?? [];

  // Build faint ticker-wall background text from real data
  const tickerText = trending.length > 0
    ? Array.from({ length: 40 }, () =>
        trending.map(s =>
          `${s.ticker} ${s.price?.toFixed(2) ?? "—"} ${s.changePct != null ? (s.changePct >= 0 ? "+" : "") + s.changePct.toFixed(2) + "%" : "—"}  `
        ).join("")
      ).join(" ")
    : "";

  return (
    <div className="min-h-screen bg-[#FAFBFC]">

      {/* ── Hero ───────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[#E5E7EB]">
        {/* Faint ticker background */}
        {tickerText && (
          <div
            className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0"
            aria-hidden="true"
          >
            <div
              className="font-mono text-[10px] leading-7 text-[#0B5D3B] break-all whitespace-pre-wrap"
              style={{ opacity: 0.035 }}
            >
              {tickerText}
            </div>
          </div>
        )}

        <div className="relative z-10 max-w-screen-xl mx-auto px-6 pt-10 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

            {/* Left — brand + CTA */}
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-px h-4 bg-[#0B5D3B]" />
                <span className="text-[10px] font-bold text-[#0B5D3B] tracking-widest uppercase">S&amp;M Services</span>
                <span className="text-[10px] text-[#9CA3AF]">·</span>
                <span className="text-[10px] text-[#9CA3AF] tracking-wide">Portfolio Intelligence Suite</span>
              </div>
              <h1 className="text-4xl lg:text-[42px] font-bold text-[#0B1220] leading-[1.1] mb-4">
                Professional Portfolio Analytics<br />
                <span className="text-[#0B5D3B]">&amp; AI Investment Research</span>
              </h1>
              <p className="text-sm text-[#4B5563] leading-relaxed mb-6 max-w-md">
                Analyze portfolios like an institution. Research any public company using real market
                data and AI-generated investment reports built exclusively from verified financial information.
              </p>
              <div className="flex flex-wrap gap-3 mb-7">
                <Link
                  href="/portfolio"
                  className="flex items-center gap-2 bg-[#0B5D3B] hover:bg-[#1E7A52] text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
                >
                  <BarChart2 size={13} /> Analyze Portfolio
                </Link>
                <Link
                  href="/research"
                  className="flex items-center gap-2 text-[#0B5D3B] border border-[#C5DDD3] hover:border-[#0B5D3B] hover:bg-[#F0F7F4] font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
                >
                  <Search size={13} /> Research Companies
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                {["Live data via Finnhub API", "10 AI report sections per company", "Zero mock data"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                    <div className="w-1 h-1 rounded-full bg-[#0B5D3B] flex-shrink-0" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — live market widget */}
            <div>
              <LiveMarketWidget trending={trending} loaded={loaded} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Market Movers ──────────────────────────────────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 py-5">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={12} className="text-[#0B5D3B]" />
          <h2 className="text-[10px] font-bold text-[#374151] uppercase tracking-widest">Market Movers</h2>
          <span className="text-[10px] text-[#9CA3AF]">Today&apos;s top performers from a 16-stock watchlist</span>
        </div>
        <MarketMovers gainers={gainers} losers={losers} loaded={loaded} />
      </section>

      <div className="border-t border-[#E5E7EB]" />

      {/* ── Sector Heatmap ──────────────────────────────────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 py-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers size={12} className="text-[#0B5D3B]" />
            <h2 className="text-[10px] font-bold text-[#374151] uppercase tracking-widest">Sector Performance</h2>
            <span className="text-[10px] text-[#9CA3AF]">Daily change via sector ETFs</span>
          </div>
          <span className="text-[9px] text-[#9CA3AF] hidden md:block">XLK · XLF · XLV · XLI · XLY · XLE · XLU · XLB · XLC</span>
        </div>
        <SectorHeatmap sectors={sectors} loaded={loaded} />
      </section>

      <div className="border-t border-[#E5E7EB]" />

      {/* ── Market News ──────────────────────────────────────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 py-5">
        <div className="flex items-center gap-2 mb-3">
          <ExternalLink size={12} className="text-[#0B5D3B]" />
          <h2 className="text-[10px] font-bold text-[#374151] uppercase tracking-widest">Market News</h2>
          <span className="text-[10px] text-[#9CA3AF]">Latest headlines via Finnhub</span>
        </div>
        <NewsGrid news={news} loaded={loaded} />
      </section>

      <div className="border-t border-[#E5E7EB]" />

      {/* ── Platform Capabilities ────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-screen-xl mx-auto px-6 py-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={12} className="text-[#0B5D3B]" />
            <h2 className="text-[10px] font-bold text-[#374151] uppercase tracking-widest">Platform Capabilities</h2>
            <span className="text-[10px] text-[#9CA3AF]">Two products in one — portfolio analytics and company research</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {CAPABILITIES.map((c) => (
              <div
                key={c.title}
                className="bg-[#FAFBFC] border border-[#E5E7EB] rounded-xl p-3.5 hover:border-[#0B5D3B]/30 hover:bg-white hover:shadow-card transition-all"
              >
                <div className="w-6 h-6 bg-[#F0F7F4] rounded-md flex items-center justify-center mb-2.5">
                  <c.icon size={11} className="text-[#0B5D3B]" />
                </div>
                <h3 className="font-semibold text-[#111827] text-[10px] mb-1 leading-tight">{c.title}</h3>
                <p className="text-[9px] text-[#6B7280] leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Strip ────────────────────────────────────────────────────────────── */}
      <section className="bg-[#060D16]">
        <div className="max-w-screen-xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div>
              <p className="text-[10px] font-bold text-[#22C55E] tracking-widest uppercase mb-1">S&amp;M Services — Portfolio Intelligence Suite</p>
              <h2 className="text-lg font-bold text-white mb-1">Professional financial intelligence — free and live</h2>
              <p className="text-xs text-[#4A6A8A]">No account required. All data live from Finnhub. Zero mock data.</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link
                href="/portfolio"
                className="flex items-center gap-2 bg-[#0B5D3B] hover:bg-[#1E7A52] text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                <BarChart2 size={13} /> Analyze Portfolio
              </Link>
              <Link
                href="/research"
                className="flex items-center gap-2 border border-[#1A2840] hover:border-[#4A9B7F] text-[#94A3B8] hover:text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                <Search size={13} /> Research Companies
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
