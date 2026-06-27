"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search, TrendingUp, TrendingDown, ArrowRight, Clock,
  ExternalLink, BarChart2, Activity, ChevronRight,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface SearchResult { ticker: string; name: string; }
interface StockQuote { ticker: string; name: string; price: number | null; change: number | null; changePct: number | null; }
interface NewsItem { headline: string; source: string; datetime: number; url: string; }
interface MarketData {
  trending: StockQuote[];
  gainers: StockQuote[];
  losers: StockQuote[];
  news: NewsItem[];
}

const QUICK_ACCESS = [
  { ticker: "AAPL",  name: "Apple" },
  { ticker: "MSFT",  name: "Microsoft" },
  { ticker: "NVDA",  name: "NVIDIA" },
  { ticker: "AMZN",  name: "Amazon" },
  { ticker: "META",  name: "Meta" },
  { ticker: "GOOGL", name: "Alphabet" },
  { ticker: "BRK.B", name: "Berkshire" },
  { ticker: "JPM",   name: "JPMorgan" },
  { ticker: "TSLA",  name: "Tesla" },
  { ticker: "V",     name: "Visa" },
  { ticker: "XOM",   name: "Exxon" },
  { ticker: "JNJ",   name: "J&J" },
];

const RECENT_REPORTS = [
  { ticker: "NVDA", name: "NVIDIA Corporation", sector: "Semiconductors" },
  { ticker: "MSFT", name: "Microsoft Corporation", sector: "Software" },
  { ticker: "AMZN", name: "Amazon.com Inc.", sector: "E-Commerce / Cloud" },
  { ticker: "AAPL", name: "Apple Inc.", sector: "Consumer Electronics" },
  { ticker: "META", name: "Meta Platforms Inc.", sector: "Social Media" },
];

function fmtPrice(v: number | null) { return v == null ? "—" : `$${v.toFixed(2)}`; }
function fmtPct(v: number | null) {
  if (v == null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ResearchTerminal() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/market-overview")
      .then((r) => r.json())
      .then((d) => setMarketData(d as MarketData))
      .catch(() => {});
  }, []);

  function navigate(ticker: string) {
    router.push(`/research/${ticker.toUpperCase()}`);
  }

  function handleInput(val: string) {
    setQuery(val);
    setSearched(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(val.trim())}`);
        const data = await res.json() as { results: SearchResult[] };
        setResults(data.results ?? []);
      } catch { setResults([]); }
      finally { setSearching(false); setSearched(true); }
    }, 350);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim().toUpperCase();
    if (!trimmed) return;
    if (/^[A-Z.]{1,6}$/.test(trimmed)) { navigate(trimmed); return; }
    if (results.length > 0) { navigate(results[0].ticker); return; }
    navigate(trimmed);
  }

  const gainers = marketData?.gainers ?? [];
  const losers  = marketData?.losers  ?? [];
  const news    = marketData?.news    ?? [];

  return (
    <div className="min-h-screen bg-[#FAFBFC]">

      {/* ── Terminal Header ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-screen-xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Label */}
            <div className="flex items-center gap-2 flex-shrink-0 hidden md:flex">
              <div className="w-7 h-7 bg-[#0B5D3B] rounded-lg flex items-center justify-center">
                <BarChart2 size={13} className="text-white" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#111827] leading-none">Research Terminal</p>
                <p className="text-[9px] text-[#9CA3AF] font-mono leading-none mt-0.5">S&amp;M Services</p>
              </div>
            </div>

            <div className="w-px h-8 bg-[#E5E7EB] hidden md:block flex-shrink-0" />

            {/* Search */}
            <form onSubmit={handleSubmit} className="flex-1 relative max-w-2xl">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleInput(e.target.value)}
                  placeholder="Search ticker or company name — e.g. AAPL, Microsoft, NVDA"
                  className="w-full pl-10 pr-24 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-sm text-[#111827] placeholder-[#9CA3AF] focus:border-[#0B5D3B] focus:ring-2 focus:ring-[#0B5D3B]/10 focus:outline-none focus:bg-white transition-colors font-mono"
                  autoFocus
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#0B5D3B] hover:bg-[#1E7A52] text-white text-xs font-semibold px-3.5 py-1.5 rounded-md transition-colors flex items-center gap-1.5"
                >
                  Go <ArrowRight size={11} />
                </button>
              </div>

              {/* Dropdown */}
              {(results.length > 0 || (searched && results.length === 0)) && query.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-xl shadow-card-lg z-50 overflow-hidden">
                  {searching && (
                    <div className="px-4 py-3 text-xs text-[#9CA3AF] flex items-center gap-2 font-mono">
                      <span className="w-3 h-3 border-2 border-[#9CA3AF]/30 border-t-[#0B5D3B] rounded-full animate-spin" />
                      Searching…
                    </div>
                  )}
                  {!searching && results.length === 0 && (
                    <div className="px-4 py-3 text-xs text-[#9CA3AF] font-mono">No matching companies found.</div>
                  )}
                  {!searching && results.map((r) => (
                    <button
                      key={r.ticker}
                      type="button"
                      onClick={() => navigate(r.ticker)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F8FAF8] border-b border-[#F3F4F6] last:border-0 text-left transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold font-mono text-[#0B5D3B] text-sm w-16">{r.ticker}</span>
                        <span className="text-sm text-[#6B7280]">{r.name}</span>
                      </div>
                      <ChevronRight size={13} className="text-[#D1D5DB]" />
                    </button>
                  ))}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── LEFT COLUMN ──────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Quick Access */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Activity size={11} className="text-[#0B5D3B]" />
                <h2 className="text-[10px] font-bold text-[#374151] uppercase tracking-widest">Quick Access</h2>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {QUICK_ACCESS.map((s) => (
                  <button
                    key={s.ticker}
                    onClick={() => navigate(s.ticker)}
                    className="bg-white border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-left hover:border-[#0B5D3B]/50 hover:bg-[#F0F7F4] transition-all group"
                  >
                    <p className="font-bold font-mono text-[#0B5D3B] text-xs leading-none">{s.ticker}</p>
                    <p className="text-[9px] text-[#9CA3AF] mt-0.5 leading-none truncate">{s.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Market Movers */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Activity size={11} className="text-[#0B5D3B]" />
                <h2 className="text-[10px] font-bold text-[#374151] uppercase tracking-widest">Market Movers</h2>
                <span className="text-[10px] text-[#9CA3AF]">Today&apos;s top performers</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Gainers */}
                <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
                  <div className="px-3.5 py-2 border-b border-[#E5E7EB] bg-[#F0FDF4] flex items-center gap-1.5">
                    <TrendingUp size={10} className="text-[#16A34A]" />
                    <span className="text-[9px] font-bold text-[#16A34A] uppercase tracking-widest">Top Gainers</span>
                  </div>
                  <div className="divide-y divide-[#F3F4F6]">
                    {gainers.length > 0 ? gainers.map((s) => (
                      <button
                        key={s.ticker}
                        onClick={() => navigate(s.ticker)}
                        className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-[#F8FAF8] transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[#111827] w-11">{s.ticker}</span>
                          <span className="text-[10px] text-[#9CA3AF] hidden sm:block truncate max-w-[80px]">{s.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-mono text-xs text-[#374151]">{fmtPrice(s.price)}</span>
                          <span className="font-mono font-bold text-[10px] text-[#16A34A] min-w-[44px] text-right">{fmtPct(s.changePct)}</span>
                        </div>
                      </button>
                    )) : Array.from({ length: 4 }, (_, i) => (
                      <div key={i} className="flex justify-between px-3.5 py-2">
                        <div className="h-2.5 w-20 bg-[#F3F4F6] rounded animate-pulse" />
                        <div className="h-2.5 w-14 bg-[#F3F4F6] rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Losers */}
                <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
                  <div className="px-3.5 py-2 border-b border-[#E5E7EB] bg-[#FFF5F5] flex items-center gap-1.5">
                    <TrendingDown size={10} className="text-[#DC2626]" />
                    <span className="text-[9px] font-bold text-[#DC2626] uppercase tracking-widest">Top Losers</span>
                  </div>
                  <div className="divide-y divide-[#F3F4F6]">
                    {losers.length > 0 ? losers.map((s) => (
                      <button
                        key={s.ticker}
                        onClick={() => navigate(s.ticker)}
                        className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-[#FFF8F8] transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[#111827] w-11">{s.ticker}</span>
                          <span className="text-[10px] text-[#9CA3AF] hidden sm:block truncate max-w-[80px]">{s.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-mono text-xs text-[#374151]">{fmtPrice(s.price)}</span>
                          <span className="font-mono font-bold text-[10px] text-[#DC2626] min-w-[44px] text-right">{fmtPct(s.changePct)}</span>
                        </div>
                      </button>
                    )) : Array.from({ length: 4 }, (_, i) => (
                      <div key={i} className="flex justify-between px-3.5 py-2">
                        <div className="h-2.5 w-20 bg-[#F3F4F6] rounded animate-pulse" />
                        <div className="h-2.5 w-14 bg-[#F3F4F6] rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Reports */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <BarChart2 size={11} className="text-[#0B5D3B]" />
                <h2 className="text-[10px] font-bold text-[#374151] uppercase tracking-widest">Research Reports</h2>
                <span className="text-[10px] text-[#9CA3AF]">AI-generated from real Finnhub data</span>
              </div>
              <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden divide-y divide-[#F3F4F6]">
                {RECENT_REPORTS.map((r) => (
                  <button
                    key={r.ticker}
                    onClick={() => navigate(r.ticker)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F8FAF8] transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#F0F7F4] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#0B5D3B] transition-colors">
                        <span className="text-[9px] font-bold font-mono text-[#0B5D3B] group-hover:text-white transition-colors">{r.ticker}</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#111827] group-hover:text-[#0B5D3B] transition-colors">{r.name}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{r.sector}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[9px] font-semibold text-[#0B5D3B] bg-[#F0F7F4] px-2 py-0.5 rounded-full border border-[#C5DDD3]">AI Report</span>
                      <ChevronRight size={12} className="text-[#D1D5DB] group-hover:text-[#0B5D3B] transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN — News ───────────────────────────────────────────── */}
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <ExternalLink size={11} className="text-[#0B5D3B]" />
                <h2 className="text-[10px] font-bold text-[#374151] uppercase tracking-widest">Market News</h2>
              </div>
              <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden divide-y divide-[#F3F4F6]">
                {news.length > 0 ? news.slice(0, 8).map((n, i) => (
                  <a
                    key={i}
                    href={n.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col px-4 py-3 hover:bg-[#F8FAF8] transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-bold text-[#0B5D3B] uppercase tracking-wider">{n.source}</span>
                      <span className="text-[9px] text-[#9CA3AF] flex items-center gap-0.5 flex-shrink-0">
                        <Clock size={8} />
                        {n.datetime
                          ? new Date(n.datetime * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                          : ""}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-[#374151] leading-snug line-clamp-2 group-hover:text-[#0B5D3B] transition-colors">
                      {n.headline}
                    </p>
                  </a>
                )) : (
                  Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="px-4 py-3 space-y-1.5 animate-pulse">
                      <div className="h-2 w-12 bg-[#F3F4F6] rounded" />
                      <div className="h-2 bg-[#F3F4F6] rounded" />
                      <div className="h-2 bg-[#F3F4F6] rounded w-4/5" />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* What you get */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
              <p className="text-[10px] font-bold text-[#374151] uppercase tracking-widest mb-3">Each Report Includes</p>
              <div className="space-y-1.5">
                {[
                  "Executive Summary",
                  "Business Model Analysis",
                  "Competitive Advantages",
                  "Growth Drivers",
                  "Risk Assessment",
                  "Bull Case",
                  "Bear Case",
                  "Financial Health",
                  "Valuation Observations",
                  "Final Investment Thesis",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-[#0B5D3B] flex-shrink-0" />
                    <span className="text-[10px] text-[#6B7280]">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-[#F3F4F6]">
                <p className="text-[9px] text-[#9CA3AF]">All data sourced exclusively from Finnhub API. No hallucinated financial data.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
