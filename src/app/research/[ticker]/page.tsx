"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import {
  Activity, AlertTriangle, ArrowLeft, ArrowUpRight,
  ChevronDown, ChevronRight, ChevronUp, Clock, Database, ExternalLink,
  Info, Newspaper, Search, Sparkles, TrendingDown, TrendingUp,
} from "lucide-react";
import StockChart from "@/components/StockChart";

// ── Types ─────────────────────────────────────────────────────────────────────
type Para = { type: "fact" | "analysis"; text: string };

interface KeyMetrics {
  pe: number | null; eps: number | null; epsGrowth: number | null;
  revenueGrowth: number | null; revenueGrowth3Y: number | null;
  grossMargin: number | null; operatingMargin: number | null; netMargin: number | null;
  roe: number | null; roa: number | null; debtToEquity: number | null;
  currentRatio: number | null; dividendYield: number | null; beta: number | null;
  fiftyTwoWeekHigh: number; fiftyTwoWeekLow: number; yearReturn: number | null;
  psTTM: number | null; pbAnnual: number | null;
}

interface StockData {
  name: string; ticker: string; price: number; change: number; changePercent: number;
  marketCap: string; marketCapM: number; sector: string; industry: string;
  founded: string; employees: string; headquarters: string; exchange: string;
  currency: string; weburl: string; logo: string;
  keyMetrics: KeyMetrics;
  openPrice: number; dayHigh: number; dayLow: number; prevClose: number;
  priceHistory: { date: string; price: number; volume: number }[];
  analystRating: { buy: number; hold: number; sell: number; total: number } | null;
  priceTarget: { mean: number; high: number; low: number; median: number; upside: number | null } | null;
  quarterlyEPS: { quarter: string; actual: number | null; estimate: number }[];
  peers: string[];
  newsItems: { headline: string; source: string; datetime: number; url: string; summary: string }[];
  aiReport: Record<string, Para[] | string>;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: "overview",   label: "Overview" },
  { id: "financials", label: "Financials" },
  { id: "analysts",   label: "Analysts" },
  { id: "news",       label: "News" },
  { id: "peers",      label: "Peers" },
  { id: "report",     label: "AI Report" },
];

const REPORT_SECTIONS = [
  { key: "executiveSummary",       label: "Executive Summary" },
  { key: "businessModel",          label: "Business Model" },
  { key: "competitiveAdvantages",  label: "Competitive Advantages" },
  { key: "growthDrivers",          label: "Growth Drivers" },
  { key: "risks",                  label: "Risks" },
  { key: "bullCaseDetailed",       label: "Bull Case" },
  { key: "bearCaseDetailed",       label: "Bear Case" },
  { key: "financialHealth",        label: "Financial Health" },
  { key: "valuationObservations",  label: "Valuation" },
  { key: "finalThesis",            label: "Final Thesis" },
];

const GREEN = "#0B5D3B";
const CHART_PALETTE = [GREEN, "#1E7A52", "#9CA3AF"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(v: number | null, d = 2): string { return v == null ? "—" : v.toFixed(d); }
function fmtPct(v: number | null, scale = 1): string {
  if (v == null) return "—";
  const val = v * scale;
  return `${val >= 0 ? "+" : ""}${val.toFixed(1)}%`;
}
function fmtX(v: number | null): string { return v == null ? "—" : `${v.toFixed(1)}x`; }
function fmtDirect(v: number | null, d = 1): string { return v == null ? "—" : `${v.toFixed(d)}%`; }

function SectionLabel({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div id={id} className="flex items-center gap-2.5 mb-5 pt-2">
      <div className="w-0.5 h-5 bg-[#0B5D3B] rounded-full" />
      <h2 className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest">{children}</h2>
    </div>
  );
}

function MetricCard({
  label, value, sub, positive,
}: { label: string; value: string; sub?: string; positive?: boolean | null }) {
  const color = positive === true ? "text-[#0B5D3B]" : positive === false ? "text-red-500" : "text-[#111827]";
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-sm">
      <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-[#9CA3AF] mt-0.5">{sub}</p>}
    </div>
  );
}

function ReportPara({ para }: { para: Para }) {
  const isFact = para.type === "fact";
  return (
    <div className="flex gap-3 py-3 border-b border-[#F3F4F6] last:border-0">
      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex-shrink-0 h-fit mt-0.5 ${
        isFact ? "bg-[#EFF6FF] text-[#2563EB]" : "bg-[#F0F7F4] text-[#0B5D3B]"
      }`}>
        {isFact ? "FACT" : "ANALYSIS"}
      </span>
      <p className="text-sm text-[#374151] leading-relaxed">{para.text}</p>
    </div>
  );
}

// ── Loading / Error States ────────────────────────────────────────────────────
function LoadingState({ ticker }: { ticker: string }) {
  return (
    <div className="min-h-screen bg-[#F8FAF8]">
      <div className="bg-white border-b border-[#E5E7EB] px-5 h-14 flex items-center gap-3">
        <Link href="/research" className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#0B5D3B] transition-colors">
          <ArrowLeft size={13} /> Research
        </Link>
        <ChevronRight size={12} className="text-[#D1D5DB]" />
        <span className="text-xs font-mono font-bold text-[#111827]">{ticker}</span>
      </div>
      <div className="max-w-screen-xl mx-auto px-5 py-16 text-center">
        <div className="w-10 h-10 border-4 border-[#E5E7EB] border-t-[#0B5D3B] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-[#111827] mb-1">Loading research data</p>
        <p className="text-xs text-[#9CA3AF]">Fetching live market data from Finnhub…</p>
      </div>
    </div>
  );
}

function ErrorState({ ticker, error }: { ticker: string; error: string }) {
  return (
    <div className="min-h-screen bg-[#F8FAF8]">
      <div className="bg-white border-b border-[#E5E7EB] px-5 h-14 flex items-center gap-3">
        <Link href="/research" className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#0B5D3B] transition-colors">
          <ArrowLeft size={13} /> Research
        </Link>
      </div>
      <div className="max-w-screen-xl mx-auto px-5 py-16 text-center">
        <AlertTriangle size={32} className="text-amber-500 mx-auto mb-4" />
        <p className="text-lg font-semibold text-[#111827] mb-2">Could not load research for {ticker}</p>
        <p className="text-sm text-[#6B7280] mb-6">{error === "Ticker not found" ? "This ticker was not found. Please check the symbol and try again." : "Failed to retrieve market data. Please try again shortly."}</p>
        <Link href="/research" className="inline-flex items-center gap-2 bg-[#0B5D3B] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#1E7A52] transition-colors">
          <Search size={13} /> Search Another Company
        </Link>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ResearchDashboard() {
  const params = useParams();
  const ticker = ((params.ticker as string) ?? "").toUpperCase();
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openReportSections, setOpenReportSections] = useState<Set<string>>(new Set(["executiveSummary"]));

  useEffect(() => {
    if (!ticker) return;
    setLoading(true); setError(null);
    fetch(`/api/stock/${ticker}`)
      .then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(new Error((e as { error?: string }).error ?? "Failed")));
        return r.json() as Promise<StockData>;
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError((e as Error).message); setLoading(false); });
  }, [ticker]);

  function toggleReportSection(key: string) {
    setOpenReportSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (loading) return <LoadingState ticker={ticker} />;
  if (error || !data) return <ErrorState ticker={ticker} error={error ?? "Unknown error"} />;

  const { keyMetrics: m, priceHistory, analystRating, priceTarget, quarterlyEPS, peers, newsItems, aiReport } = data;
  const isPositive = data.changePercent >= 0;

  // Analyst donut data
  const donutData = analystRating ? [
    { name: "Buy", value: analystRating.buy,  color: "#0B5D3B" },
    { name: "Hold", value: analystRating.hold, color: "#F59E0B" },
    { name: "Sell", value: analystRating.sell, color: "#EF4444" },
  ].filter((d) => d.value > 0) : [];


  return (
    <div className="min-h-screen bg-[#F8FAF8]">

      {/* ── Top Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/research" className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#0B5D3B] transition-colors flex-shrink-0">
              <ArrowLeft size={13} /> Research
            </Link>
            <ChevronRight size={12} className="text-[#D1D5DB] flex-shrink-0" />
            <span className="font-bold font-mono text-[#0B5D3B] text-sm flex-shrink-0">{data.ticker}</span>
            <span className="text-sm text-[#6B7280] truncate hidden sm:block">{data.name}</span>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-right">
              <p className="text-base font-bold font-mono text-[#111827] leading-none">${data.price.toFixed(2)}</p>
              <p className={`text-xs font-semibold ${isPositive ? "text-[#0B5D3B]" : "text-red-500"}`}>
                {isPositive ? "+" : ""}{data.change.toFixed(2)} ({isPositive ? "+" : ""}{data.changePercent.toFixed(2)}%)
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#F0F7F4] border border-[#C5DDD3] text-[#0B5D3B] font-semibold">
                {data.exchange}
              </span>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] text-[#6B7280] font-medium truncate max-w-[120px]">
                {data.sector}
              </span>
            </div>
            {data.weburl && (
              <a href={data.weburl} target="_blank" rel="noopener noreferrer"
                className="text-[#9CA3AF] hover:text-[#0B5D3B] transition-colors hidden md:block">
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Section Nav ────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-14 z-40">
        <div className="max-w-screen-xl mx-auto px-5">
          <div className="flex gap-0 overflow-x-auto scrollbar-none">
            {SECTIONS.map((s) => (
              <button key={s.id} onClick={() => scrollTo(s.id)}
                className="text-xs font-medium text-[#6B7280] hover:text-[#0B5D3B] px-4 py-3 border-b-2 border-transparent hover:border-[#0B5D3B] transition-colors whitespace-nowrap flex-shrink-0">
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-5 py-6 space-y-8">

        {/* ── 1. OVERVIEW ──────────────────────────────────────────────────── */}
        <section>
          <SectionLabel id="overview">Company Overview</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Left: description + quick facts */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm">
                <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">About</p>
                <p className="text-sm text-[#374151] leading-relaxed">
                  {data.name} ({data.ticker}) trades on {data.exchange} and operates in the {data.industry} industry,
                  headquartered in {data.headquarters}.
                  {data.founded !== "—" ? ` Listed since ${data.founded}.` : ""}
                  {data.employees !== "—" ? ` Approx. ${data.employees} employees.` : ""}
                </p>
                {data.weburl && (
                  <a href={data.weburl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#0B5D3B] hover:text-[#1E7A52] mt-3 font-medium transition-colors">
                    Investor Relations <ExternalLink size={10} />
                  </a>
                )}
              </div>

              {/* Quick facts grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard label="Market Cap" value={data.marketCap} />
                <MetricCard label="Exchange" value={data.exchange} />
                <MetricCard label="Country" value={data.headquarters} />
                <MetricCard
                  label="52W Range"
                  value={`$${m.fiftyTwoWeekLow.toFixed(0)}–$${m.fiftyTwoWeekHigh.toFixed(0)}`}
                />
              </div>

              {/* Price chart */}
              <StockChart ticker={data.ticker} />
            </div>

            {/* Right: key price stats */}
            <div className="space-y-3">
              {/* Day stats */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm">
                <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Today</p>
                <div className="space-y-2">
                  {[
                    ["Open",       `$${data.openPrice.toFixed(2)}`],
                    ["Day High",   `$${data.dayHigh.toFixed(2)}`],
                    ["Day Low",    `$${data.dayLow.toFixed(2)}`],
                    ["Prev Close", `$${data.prevClose.toFixed(2)}`],
                    ["Change",     `${isPositive ? "+" : ""}${data.change.toFixed(2)} (${isPositive ? "+" : ""}${data.changePercent.toFixed(2)}%)`],
                  ].map(([l, v]) => (
                    <div key={l} className="flex items-center justify-between">
                      <span className="text-xs text-[#9CA3AF]">{l}</span>
                      <span className={`text-xs font-mono font-bold ${l === "Change" ? (isPositive ? "text-[#0B5D3B]" : "text-red-500") : "text-[#111827]"}`}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick metrics */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm">
                <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3">Key Metrics</p>
                <div className="space-y-2">
                  {[
                    ["P/E Ratio",    m.pe != null ? `${m.pe.toFixed(1)}x` : "—"],
                    ["Beta",         m.beta != null ? m.beta.toFixed(2) : "—"],
                    ["Div Yield",    m.dividendYield != null ? `${m.dividendYield.toFixed(2)}%` : "—"],
                    ["1Y Return",    m.yearReturn != null ? `${m.yearReturn >= 0 ? "+" : ""}${m.yearReturn.toFixed(1)}%` : "—"],
                    ["Gross Margin", m.grossMargin != null ? `${m.grossMargin.toFixed(1)}%` : "—"],
                  ].map(([l, v]) => (
                    <div key={l} className="flex items-center justify-between">
                      <span className="text-xs text-[#9CA3AF]">{l}</span>
                      <span className="text-xs font-mono font-bold text-[#111827]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Analyst mini */}
              {analystRating && (
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm">
                  <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">Analyst Consensus</p>
                  <div className="flex h-2 rounded-full overflow-hidden bg-[#F3F4F6] mb-2">
                    <div className="bg-[#0B5D3B]" style={{ width: `${(analystRating.buy / analystRating.total) * 100}%` }} />
                    <div className="bg-[#F59E0B]" style={{ width: `${(analystRating.hold / analystRating.total) * 100}%` }} />
                    <div className="bg-[#EF4444]" style={{ width: `${(analystRating.sell / analystRating.total) * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[#0B5D3B] font-bold">{Math.round((analystRating.buy / analystRating.total) * 100)}% Buy</span>
                    <span className="text-[#6B7280]">{Math.round((analystRating.hold / analystRating.total) * 100)}% Hold</span>
                    <span className="text-red-500 font-bold">{Math.round((analystRating.sell / analystRating.total) * 100)}% Sell</span>
                  </div>
                  <p className="text-[10px] text-[#9CA3AF] mt-1">{analystRating.total} analysts</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── 2. FINANCIALS ────────────────────────────────────────────────── */}
        <section>
          <SectionLabel id="financials">Financial Snapshot</SectionLabel>

          {/* Primary KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            <MetricCard label="P/E Ratio (TTM)"    value={fmtX(m.pe)} sub="Price / Earnings" />
            <MetricCard label="Revenue Growth YoY" value={m.revenueGrowth != null ? fmtPct(m.revenueGrowth, 100) : "—"} positive={m.revenueGrowth != null ? m.revenueGrowth > 0 : null} sub="TTM YoY" />
            <MetricCard label="Gross Margin"       value={fmtDirect(m.grossMargin)} sub="TTM" />
            <MetricCard label="Operating Margin"   value={fmtDirect(m.operatingMargin)} sub="TTM" positive={m.operatingMargin != null ? m.operatingMargin > 0 : null} />
            <MetricCard label="Net Margin"         value={fmtDirect(m.netMargin)} sub="TTM" positive={m.netMargin != null ? m.netMargin > 0 : null} />
            <MetricCard label="EPS (Annual)"       value={m.eps != null ? `$${m.eps.toFixed(2)}` : "—"} sub="Basic excl. extra" />
          </div>

          {/* Secondary metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
            <MetricCard label="ROE (TTM)"         value={fmtDirect(m.roe)} sub="Return on Equity" positive={m.roe != null ? m.roe > 10 : null} />
            <MetricCard label="ROA (TTM)"         value={fmtDirect(m.roa)} sub="Return on Assets" positive={m.roa != null ? m.roa > 0 : null} />
            <MetricCard label="Debt / Equity"     value={m.debtToEquity != null ? `${m.debtToEquity.toFixed(2)}x` : "—"} sub="Annual" positive={m.debtToEquity != null ? m.debtToEquity < 1 : null} />
            <MetricCard label="Current Ratio"     value={m.currentRatio != null ? `${m.currentRatio.toFixed(2)}x` : "—"} sub="Annual" positive={m.currentRatio != null ? m.currentRatio > 1.5 : null} />
            <MetricCard label="Price / Sales"     value={fmtX(m.psTTM)} sub="TTM" />
            <MetricCard label="Price / Book"      value={fmtX(m.pbAnnual)} sub="Annual" />
          </div>

          {/* Quarterly EPS chart */}
          {quarterlyEPS.length > 0 && (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm">
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-4">
                Quarterly EPS — Actual vs Estimate
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={quarterlyEPS} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} width={40} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 11 }}
                    formatter={(v, name) => [`$${Number(v).toFixed(2)}`, name === "actual" ? "Actual EPS" : "Estimate"]}
                  />
                  <ReferenceLine y={0} stroke="#E5E7EB" />
                  <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#6B7280", paddingTop: 8 }}
                    formatter={(v) => v === "actual" ? "Actual EPS" : "Estimate"} />
                  <Bar dataKey="estimate" fill="#E5E7EB" radius={[2, 2, 0, 0]} name="estimate" />
                  <Bar dataKey="actual"   fill={GREEN}   radius={[2, 2, 0, 0]} name="actual" />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-[#9CA3AF] mt-2 flex items-center gap-1">
                <Database size={9} /> Source: Finnhub — actual reported EPS vs consensus estimate at time of report.
              </p>
            </div>
          )}
        </section>

        {/* ── 3. ANALYSTS ──────────────────────────────────────────────────── */}
        <section>
          <SectionLabel id="analysts">Analyst Sentiment</SectionLabel>
          {analystRating ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Donut */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm flex flex-col items-center">
                <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-3 self-start">
                  Recommendation Distribution
                </p>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={3} dataKey="value">
                      {donutData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4 text-xs mt-1">
                  {donutData.map((d) => (
                    <span key={d.name} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name} ({d.value})
                    </span>
                  ))}
                </div>
              </div>

              {/* Breakdown table */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm">
                <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-4">Consensus Breakdown</p>
                <div className="space-y-3">
                  {[
                    { label: "Buy / Strong Buy", count: analystRating.buy,  color: "#0B5D3B", bg: "bg-[#0B5D3B]" },
                    { label: "Hold",             count: analystRating.hold, color: "#F59E0B", bg: "bg-amber-400" },
                    { label: "Sell / Strong Sell", count: analystRating.sell, color: "#EF4444", bg: "bg-red-400" },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#6B7280]">{row.label}</span>
                        <span className="text-xs font-bold font-mono" style={{ color: row.color }}>
                          {row.count} ({Math.round((row.count / analystRating.total) * 100)}%)
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${row.bg}`} style={{ width: `${(row.count / analystRating.total) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                  <p className="text-[10px] text-[#9CA3AF] pt-2 border-t border-[#F3F4F6]">
                    {analystRating.total} covering analysts · Source: Finnhub
                  </p>
                </div>
              </div>

              {/* Price target */}
              {priceTarget ? (
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm">
                  <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-4">Analyst Price Target</p>
                  <div className="text-center mb-4">
                    <p className="text-3xl font-bold font-mono text-[#111827]">${priceTarget.mean}</p>
                    <p className="text-xs text-[#9CA3AF]">Consensus Mean</p>
                    {priceTarget.upside != null && (
                      <span className={`inline-block mt-1 text-sm font-bold ${priceTarget.upside >= 0 ? "text-[#0B5D3B]" : "text-red-500"}`}>
                        {priceTarget.upside >= 0 ? "+" : ""}{priceTarget.upside}% upside
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {[
                      ["High Target",   `$${priceTarget.high}`],
                      ["Median Target", `$${priceTarget.median}`],
                      ["Low Target",    `$${priceTarget.low}`],
                      ["Current Price", `$${data.price.toFixed(2)}`],
                    ].map(([l, v]) => (
                      <div key={l} className="flex justify-between">
                        <span className="text-xs text-[#9CA3AF]">{l}</span>
                        <span className="text-xs font-mono font-bold text-[#111827]">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm flex items-center justify-center">
                  <p className="text-sm text-[#9CA3AF] text-center">Price target data unavailable from provider.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 text-center text-[#9CA3AF] shadow-sm">
              <Info size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Analyst rating data unavailable from provider for this security.</p>
            </div>
          )}
        </section>

        {/* ── 4. NEWS ──────────────────────────────────────────────────────── */}
        <section>
          <SectionLabel id="news">Recent News</SectionLabel>
          {newsItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {newsItems.slice(0, 9).map((n, i) => (
                <a
                  key={i}
                  href={n.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-sm hover:border-[#0B5D3B]/30 hover:shadow-md transition-all block"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-[#0B5D3B] uppercase tracking-wide">{n.source}</span>
                    <span className="text-[10px] text-[#9CA3AF]">
                      {n.datetime ? new Date(n.datetime * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#111827] leading-snug mb-2 line-clamp-3">{n.headline}</p>
                  {n.summary && (
                    <p className="text-xs text-[#9CA3AF] leading-relaxed line-clamp-2">{n.summary}</p>
                  )}
                  {n.url && (
                    <div className="flex items-center gap-1 mt-3 text-[10px] text-[#0B5D3B] font-medium">
                      Read article <ArrowUpRight size={10} />
                    </div>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 text-center text-[#9CA3AF] shadow-sm">
              <Newspaper size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No recent news found for {data.ticker} in the past 30 days.</p>
            </div>
          )}
        </section>

        {/* ── 5. PEERS ─────────────────────────────────────────────────────── */}
        <section>
          <SectionLabel id="peers">Peer Companies</SectionLabel>
          {peers.length > 0 ? (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm">
              <p className="text-xs text-[#9CA3AF] mb-4">
                Identified by Finnhub as peers in the same industry. Click to open their research dashboard.
              </p>
              <div className="flex flex-wrap gap-2">
                {peers.map((p) => (
                  <Link
                    key={p}
                    href={`/research/${p}`}
                    className="flex items-center gap-1.5 bg-[#F8FAF8] border border-[#E5E7EB] hover:border-[#0B5D3B]/40 hover:bg-[#F0F7F4] rounded-lg px-4 py-2 text-sm font-bold font-mono text-[#0B5D3B] transition-all"
                  >
                    {p} <ChevronRight size={11} className="text-[#9CA3AF]" />
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 text-center text-[#9CA3AF] shadow-sm">
              <p className="text-sm">Peer data unavailable from provider for this security.</p>
            </div>
          )}
        </section>

        {/* ── 6. AI INVESTMENT REPORT ──────────────────────────────────────── */}
        <section>
          <SectionLabel id="report">AI Investment Report</SectionLabel>
          <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm overflow-hidden">
            {/* Report header */}
            <div className="bg-[#0B5D3B] px-6 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={14} className="text-white/70" />
                    <p className="text-xs font-semibold text-white/80 uppercase tracking-widest">S&M Services · AI Research</p>
                  </div>
                  <h3 className="text-lg font-bold text-white">{data.name} ({data.ticker}) — Investment Research Report</h3>
                  <p className="text-xs text-white/50 mt-1">
                    Data source: Finnhub API ·{" "}
                    {typeof aiReport.generatedAt === "string"
                      ? new Date(aiReport.generatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                      : ""}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-4 text-[10px] text-white/60">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#EFF6FF]" /> FACT = Data from Finnhub</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#F0F7F4]" /> ANALYSIS = AI interpretation</span>
              </div>
            </div>

            {/* Report sections — accordion */}
            <div className="divide-y divide-[#F3F4F6]">
              {REPORT_SECTIONS.map(({ key, label }) => {
                const paras = aiReport[key];
                if (!Array.isArray(paras) || paras.length === 0) return null;
                const isOpen = openReportSections.has(key);
                return (
                  <div key={key}>
                    <button
                      onClick={() => toggleReportSection(key)}
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#F8FAF8] transition-colors text-left"
                    >
                      <span className="text-sm font-semibold text-[#111827]">{label}</span>
                      {isOpen
                        ? <ChevronUp size={14} className="text-[#9CA3AF] flex-shrink-0" />
                        : <ChevronDown size={14} className="text-[#9CA3AF] flex-shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5">
                        {(paras as Para[]).map((p, i) => <ReportPara key={i} para={p} />)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Disclaimer */}
            <div className="px-6 py-4 bg-[#F8FAF8] border-t border-[#E5E7EB]">
              <p className="text-[10px] text-[#9CA3AF] leading-relaxed">
                <strong className="text-[#6B7280]">Disclaimer:</strong>{" "}
                {typeof aiReport.disclaimer === "string" ? aiReport.disclaimer : ""}
                {" "}All financial data sourced from Finnhub API. This report is for informational purposes only and does not constitute investment advice.
                Past performance is not indicative of future results. Consult a qualified financial advisor before making investment decisions.
              </p>
            </div>
          </div>
        </section>

        {/* Data footer */}
        <div className="border-t border-[#E5E7EB] pt-6 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#9CA3AF]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><Database size={10} /> Market data: Finnhub API</span>
            <span className="flex items-center gap-1.5"><Activity size={10} /> Price history: Yahoo Finance</span>
            <span className="flex items-center gap-1.5"><Clock size={10} /> Cached 5 min</span>
          </div>
          <span className="flex items-center gap-1.5"><Info size={10} /> For informational purposes only — not investment advice</span>
        </div>

      </div>
    </div>
  );
}
