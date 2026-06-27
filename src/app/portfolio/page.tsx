"use client";

import { useState, useRef, useMemo, Fragment } from "react";
import {
  LineChart, Line, PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Legend,
} from "recharts";
import Link from "next/link";
import {
  Activity, AlertTriangle, BarChart2, ChevronDown, ChevronUp,
  ChevronRight, DollarSign, Globe, Layers, Plus, Shield, Sparkles,
  TrendingUp, TrendingDown, Trash2, X, Target, Info,
  ArrowUpDown, Clock, Database, Award, Gauge, Sliders, ExternalLink,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface Holding {
  ticker: string; name: string; allocation: number; weight: number;
  price: number; change: number; changePercent: number;
  sector: string; country: string;
  marketCap: string; marketCapCategory: string; marketCapColor: string; marketCapM: number;
  beta: number | null; pe: number | null; revenueGrowth: number | null;
  dividendYield: number; fiftyTwoWeekHigh: number; fiftyTwoWeekLow: number;
  recommendation: string; recommendationScore: number; recommendationReasons: string[];
  analystRating: { buy: number; hold: number; sell: number; total: number } | null;
  priceTarget: { mean: number; high: number; low: number } | null;
  priceTargetUpside: number | null; oneYearReturn: number | null; valid: boolean;
  news: { headline: string; source: string; datetime: number; url: string }[];
}
interface HealthDim { score: number; grade: string; detail: string; }
interface HealthScore {
  overall: number; grade: string; label: string;
  diversification: HealthDim; risk: HealthDim; sectorConcentration: HealthDim;
  valuation: HealthDim; growth: HealthDim; income: HealthDim;
}
interface StressTest { name: string; period: string; description: string; estimatedImpact: number; severity: string; }
interface Portfolio {
  totalAllocation: number; numHoldings: number; dailyPnL: number; dailyPnLPct: number; ytdReturn: number | null;
  performanceChart: { date: string; portfolio: number; spy: number; qqq: number }[];
  riskMetrics: { weightedBeta: number | null; volatility: number | null; sharpe: number | null; maxDrawdown: number | null; annualReturn: number | null };
  healthScore: HealthScore;
  metrics: { weightedBeta: number | null; weightedPE: number | null; avgDividendYield: number; numSectors: number; topConcentration: number };
  sectorAllocation: { sector: string; percentage: number; color: string }[];
  marketCapAllocation: { category: string; percentage: number; color: string }[];
  geographicAllocation: { country: string; percentage: number }[];
  concentrationRisk: { top1: number; top3: number; top5: number; hhi: number };
  stressTests: StressTest[];
  analysis: { summary: string; strengths: string[]; weaknesses: string[]; majorRisks: string[]; hiddenRisks: string[]; missingExposure: string[]; longTermOutlook: string };
  optimization: { reduce: { ticker: string; reason: string; currentAlloc?: number; suggestedAlloc?: number }[]; remove: { ticker: string; reason: string }[]; add: { suggestion: string; reason: string; category: string }[] };
  investmentCommittee: { bullCase: string[]; bearCase: string[]; riskManagerView: string[]; finalVerdict: { rating: string; confidence: string; text: string } };
}
interface PortfolioResponse { holdings: Holding[]; portfolio: Portfolio; }
interface AdvisorCard {
  category: string; severity: "High" | "Medium" | "Low";
  issue: string; impact: string; action: string; benefit: string;
}

// ── Constants ────────────────────────────────────────────────────────────────
const GRADE_CONFIG: Record<string, { color: string; bg: string; text: string }> = {
  A: { color: "#0B5D3B", bg: "bg-[#F0F7F4]", text: "text-[#0B5D3B]" },
  B: { color: "#1E7A52", bg: "bg-[#F0F7F4]", text: "text-[#1E7A52]" },
  C: { color: "#D97706", bg: "bg-amber-50", text: "text-amber-700" },
  D: { color: "#EF4444", bg: "bg-red-50", text: "text-red-600" },
  F: { color: "#DC2626", bg: "bg-red-50", text: "text-red-700" },
};

const REC_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  strong_buy: { label: "STRONG BUY", color: "text-[#0B5D3B]", bg: "bg-[#F0F7F4] border border-[#C5DDD3]" },
  buy: { label: "BUY", color: "text-[#1E7A52]", bg: "bg-[#F0F7F4] border border-[#C5DDD3]" },
  hold: { label: "HOLD", color: "text-amber-700", bg: "bg-amber-50 border border-amber-200" },
  sell: { label: "SELL", color: "text-orange-700", bg: "bg-orange-50 border border-orange-200" },
  strong_sell: { label: "STRONG SELL", color: "text-red-700", bg: "bg-red-50 border border-red-200" },
};

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  High: { color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  Medium: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  Low: { color: "text-[#1E7A52]", bg: "bg-[#F0F7F4]", border: "border-[#C5DDD3]" },
};

const CHART_PALETTE = ["#0B5D3B","#1E7A52","#2D9B65","#3DB87A","#5CC98A","#8DDDB0","#9CA3AF","#D1D5DB","#E5E7EB","#F3F4F6","#6B7280","#374151"];

const SECTIONS = [
  { id: "overview",      label: "Overview" },
  { id: "intelligence",  label: "Intelligence" },
  { id: "performance",   label: "Performance" },
  { id: "exposure",      label: "Exposure Analytics" },
  { id: "holdings",      label: "Holdings" },
  { id: "risk",          label: "Risk Center" },
  { id: "advisor",       label: "AI Advisor" },
  { id: "optimizer",     label: "Optimizer" },
  { id: "scenarios",     label: "Scenarios" },
  { id: "committee",     label: "Committee" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number | null, d = 2) { return n == null || isNaN(n) ? "—" : n.toFixed(d); }
function fmtPct(n: number | null) { return n == null ? "—" : `${n > 0 ? "+" : ""}${n.toFixed(2)}%`; }
function fmtDollar(n: number) {
  const a = Math.abs(n);
  if (a >= 1e6) return `${n < 0 ? "-" : ""}$${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${n < 0 ? "-" : ""}$${(a / 1e3).toFixed(1)}K`;
  return `${n < 0 ? "-$" : "$"}${a.toFixed(0)}`;
}

function gradeOf(score: number) {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 75) return "A−";
  if (score >= 70) return "B+";
  if (score >= 65) return "B";
  if (score >= 60) return "B−";
  if (score >= 55) return "C+";
  if (score >= 50) return "C";
  if (score >= 45) return "C−";
  if (score >= 40) return "D";
  return "F";
}
function gradeBase(g: string) { return g[0] as string; }

function buildIntelligenceInsights(p: Portfolio, h: Holding[]): { text: string; severity: "warning" | "info" | "positive" }[] {
  const insights: { text: string; severity: "warning" | "info" | "positive" }[] = [];

  // Sector concentration
  if (p.sectorAllocation.length > 0) {
    const top = p.sectorAllocation[0];
    if (top.percentage > 40) {
      insights.push({ severity: "warning", text: `${top.sector} allocation of ${top.percentage}% exceeds typical institutional benchmark weights by ${Math.max(0, top.percentage - 28).toFixed(0)}+ percentage points, amplifying sector-specific volatility.` });
    } else if (top.percentage > 30) {
      insights.push({ severity: "info", text: `${top.sector} leads sector allocation at ${top.percentage}% — above typical benchmark weighting. Monitor for sector-specific headwinds.` });
    } else {
      insights.push({ severity: "positive", text: `Sector allocation is reasonably balanced. ${top.sector} leads at ${top.percentage}%, within typical institutional portfolio ranges.` });
    }
  }

  // Top holdings concentration
  const top3pct = p.concentrationRisk?.top3;
  if (top3pct != null) {
    const top3names = h.slice(0, 3).map((x) => x.ticker).join(", ");
    if (top3pct > 60) {
      insights.push({ severity: "warning", text: `Top 3 holdings (${top3names}) represent ${top3pct.toFixed(0)}% of total portfolio value — severe concentration risk. Institutional standards recommend below 40% for top-3 positions.` });
    } else if (top3pct > 45) {
      insights.push({ severity: "warning", text: `Top 3 positions (${top3names}) account for ${top3pct.toFixed(0)}% of portfolio value — elevated concentration approaching institutional risk thresholds.` });
    } else {
      insights.push({ severity: "positive", text: `Top 3 positions represent ${top3pct.toFixed(0)}% of portfolio value — within acceptable concentration range for a diversified equity portfolio.` });
    }
  }

  // Geographic concentration
  const usAlloc = p.geographicAllocation.find((g) => g.country === "US" || g.country === "United States");
  if (usAlloc) {
    if (usAlloc.percentage > 90) {
      insights.push({ severity: "warning", text: `Portfolio carries ${usAlloc.percentage}% US-only exposure — extreme home-country bias. Global markets represent approximately 40% of world market capitalization.` });
    } else if (usAlloc.percentage > 75) {
      insights.push({ severity: "info", text: `${usAlloc.percentage}% US equity concentration reflects domestic tilt. International diversification may reduce correlation risk.` });
    }
  }

  // Beta / market sensitivity
  const beta = p.riskMetrics.weightedBeta ?? p.metrics.weightedBeta;
  if (beta != null) {
    if (beta > 1.4) {
      insights.push({ severity: "warning", text: `Weighted portfolio beta of ${beta.toFixed(2)}x signals amplified market sensitivity — expected to decline approximately ${(beta * 10).toFixed(0)}% in a 10% broad market correction.` });
    } else if (beta > 1.1) {
      insights.push({ severity: "info", text: `Portfolio beta of ${beta.toFixed(2)}x reflects moderate growth tilt with above-market volatility exposure vs. S&P 500 = 1.00.` });
    } else if (beta < 0.8) {
      insights.push({ severity: "positive", text: `Portfolio beta of ${beta.toFixed(2)}x reflects defensive positioning with below-market drawdown sensitivity.` });
    }
  }

  // Sector diversity
  if (p.metrics.numSectors < 4) {
    insights.push({ severity: "warning", text: `Portfolio spans only ${p.metrics.numSectors} sector${p.metrics.numSectors === 1 ? "" : "s"} — insufficient for institutional-grade risk management. Typically 6+ GICS sectors are maintained.` });
  } else if (p.metrics.numSectors >= 7) {
    insights.push({ severity: "positive", text: `${p.metrics.numSectors}-sector coverage demonstrates strong diversification consistent with institutional portfolio construction standards.` });
  }

  // AI/Tech exposure narrative
  const techSector = p.sectorAllocation.find((s) => s.sector.toLowerCase().includes("tech"));
  if (techSector && techSector.percentage > 35) {
    const aiTickers = h.filter((hold) => ["NVDA", "AMD", "MSFT", "GOOGL", "META", "AMZN"].includes(hold.ticker));
    if (aiTickers.length >= 2) {
      const aiWeight = aiTickers.reduce((sum, hold) => sum + hold.weight, 0);
      insights.push({ severity: "info", text: `Portfolio allocates approximately ${aiWeight.toFixed(0)}% to AI infrastructure and platform companies (${aiTickers.map((x) => x.ticker).join(", ")}) — concentrated exposure to AI spending cycle dynamics and regulatory risk.` });
    }
  }

  // Income score
  if (p.healthScore.income.score < 35) {
    insights.push({ severity: "info", text: `Income generation score of ${p.healthScore.income.score}/100 — portfolio is predominantly growth-oriented. Expected dividend yield is materially below broad market average.` });
  }

  // HHI concentration index
  if (p.concentrationRisk?.hhi > 2500) {
    insights.push({ severity: "warning", text: `Herfindahl-Hirschman Index of ${p.concentrationRisk.hhi.toFixed(0)} indicates highly concentrated portfolio. An HHI above 2,500 signals concentration by institutional portfolio standards.` });
  }

  return insights.slice(0, 6);
}

function buildAdvisorCards(p: Portfolio): AdvisorCard[] {
  const cards: AdvisorCard[] = [];

  p.optimization.reduce.forEach((r) => {
    cards.push({
      category: "Position Sizing",
      severity: (r.currentAlloc ?? 0) > 25 ? "High" : "Medium",
      issue: `${r.ticker} is overweight at ${r.currentAlloc ?? "—"}% of portfolio`,
      impact: r.reason,
      action: `Reduce ${r.ticker} to approximately ${r.suggestedAlloc ?? 10}% target allocation`,
      benefit: "Reduces single-stock concentration risk and improves overall portfolio diversification score",
    });
  });

  p.optimization.remove.forEach((r) => {
    cards.push({
      category: "Risk Reduction",
      severity: "Medium",
      issue: `${r.ticker} is flagged as a candidate for exit`,
      impact: r.reason,
      action: `Consider exiting the ${r.ticker} position and reallocating capital to higher-quality holdings`,
      benefit: "Improves portfolio quality, reduces performance drag, and frees capital for stronger opportunities",
    });
  });

  const dims: [string, HealthDim][] = [
    ["Diversification", p.healthScore.diversification],
    ["Risk Management", p.healthScore.risk],
    ["Sector Concentration", p.healthScore.sectorConcentration],
    ["Valuation", p.healthScore.valuation],
  ];
  dims.forEach(([name, dim]) => {
    if (dim.grade === "C" || dim.grade === "D" || dim.grade === "F") {
      cards.push({
        category: "Portfolio Quality",
        severity: dim.grade === "F" || dim.grade === "D" ? "High" : "Medium",
        issue: `${name} score is below institutional threshold (${dim.grade} · ${dim.score}/100)`,
        impact: dim.detail,
        action: `Review and rebalance portfolio to improve ${name.toLowerCase()} metrics`,
        benefit: "Raises composite portfolio health score and reduces structural vulnerability",
      });
    }
  });

  p.optimization.add.slice(0, 2).forEach((a) => {
    cards.push({
      category: "Diversification Gap",
      severity: "Low",
      issue: `Portfolio lacks sufficient ${a.category} exposure`,
      impact: a.reason,
      action: `Introduce a position in ${a.suggestion}`,
      benefit: "Improves sector balance, reduces concentration risk, and enhances portfolio resilience",
    });
  });

  return cards.slice(0, 6);
}

function getSectorInsight(alloc: Portfolio["sectorAllocation"]): string {
  if (!alloc.length) return "Sector data unavailable.";
  const top = alloc[0];
  if (top.percentage > 40) return `${top.sector} represents ${top.percentage}% of portfolio exposure, significantly above typical market benchmark weights. This concentration amplifies sector-specific volatility and drawdown risk.`;
  if (top.percentage > 30) return `${top.sector} is the dominant sector allocation at ${top.percentage}%, moderately above benchmark weights. Monitor for sector-specific headwinds.`;
  return `Sector allocation is reasonably balanced. ${top.sector} leads at ${top.percentage}%, within typical institutional portfolio ranges.`;
}

function getMarketCapInsight(alloc: Portfolio["marketCapAllocation"]): string {
  if (!alloc.length) return "Market cap data unavailable.";
  const mega = alloc.find(m => m.category.toLowerCase().includes("mega"));
  const large = alloc.find(m => m.category.toLowerCase().includes("large"));
  const largePct = (mega?.percentage ?? 0) + (large?.percentage ?? 0);
  if (largePct > 80) return `${largePct}% of the portfolio is concentrated in Mega and Large-cap equities. The portfolio exhibits low small-cap exposure and may underperform in small-cap rally environments.`;
  if (largePct > 60) return `Portfolio tilts toward large-cap stability at ${largePct}% combined Mega/Large allocation, with moderate exposure to mid and small-cap growth opportunities.`;
  return `Portfolio shows a diversified market cap profile, balancing stability across large-cap and growth potential across smaller market cap tiers.`;
}

function getGeoInsight(alloc: Portfolio["geographicAllocation"]): string {
  if (!alloc.length) return "Geographic data unavailable.";
  const us = alloc.find(g => g.country === "US" || g.country === "United States");
  const usPct = us?.percentage ?? 0;
  if (usPct > 90) return `Portfolio is ${usPct}% US-concentrated, carrying material home-country bias. International diversification may reduce correlation risk and improve risk-adjusted returns.`;
  if (usPct > 70) return `${usPct}% US exposure reflects a domestic tilt. Moderate international allocation provides some geographic diversification.`;
  return `Portfolio demonstrates reasonable geographic diversification with ${usPct}% US exposure.`;
}

// ── Sub-components ───────────────────────────────────────────────────────────
function SectionLabel({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div id={id} className="flex items-center gap-2.5 mb-5 pt-2">
      <div className="w-0.5 h-5 bg-[#0B5D3B] rounded-full" />
      <h2 className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest">{children}</h2>
    </div>
  );
}

function KpiScoreCard({ label, score, grade, icon: Icon }: { label: string; score: number; grade: string; icon?: React.ElementType }) {
  const gBase = gradeBase(grade);
  const cfg = GRADE_CONFIG[gBase] ?? { color: "#6B7280", bg: "bg-slate-50", text: "text-slate-600" };
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-card">
      <div className="flex items-start justify-between mb-2">
        <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider leading-tight">{label}</p>
        {Icon && <Icon size={12} className="text-[#D1D5DB]" />}
      </div>
      <p className="text-3xl font-bold font-mono leading-none mb-1" style={{ color: cfg.color }}>{score}</p>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${cfg.bg} ${cfg.text}`}>{grade}</span>
        <div className="flex-1 h-1 bg-[#F3F4F6] rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: cfg.color }} />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, trend, icon: Icon }: { label: string; value: string; sub?: string; trend?: "up" | "down" | "neutral"; icon?: React.ElementType }) {
  const trendColor = trend === "up" ? "text-[#0B5D3B]" : trend === "down" ? "text-red-500" : "text-[#111827]";
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-card">
      <div className="flex items-start justify-between mb-1">
        <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">{label}</p>
        {Icon && <Icon size={12} className="text-[#D1D5DB]" />}
      </div>
      <p className={`text-2xl font-bold font-mono leading-tight ${trendColor}`}>{value}</p>
      {sub && <p className="text-xs text-[#6B7280] mt-0.5">{sub}</p>}
    </div>
  );
}

function RecBadge({ rec }: { rec: string }) {
  const cfg = REC_CONFIG[rec] ?? REC_CONFIG.hold;
  return <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>;
}

function GradeChip({ grade }: { grade: string }) {
  const cfg = GRADE_CONFIG[gradeBase(grade)] ?? { color: "#6B7280", bg: "bg-slate-100", text: "text-slate-600" };
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-bold ${cfg.bg} ${cfg.text}`}>{grade}</span>;
}

function DonutChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
          {data.map((e, i) => <Cell key={`${e.name}-${i}`} fill={e.color || CHART_PALETTE[i % CHART_PALETTE.length]} />)}
        </Pie>
        <Tooltip
          formatter={(v) => [`${v}%`]}
          contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 11 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function SortTh({ label, col, sortCol, sortDir, onSort }: { label: string; col: string; sortCol: string; sortDir: string; onSort: (c: string) => void }) {
  const active = sortCol === col;
  return (
    <th
      className="text-left px-3 py-2.5 font-semibold text-[#6B7280] uppercase tracking-wider text-[10px] cursor-pointer hover:text-[#111827] select-none whitespace-nowrap"
      onClick={() => onSort(col)}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown size={9} className={active ? "text-[#0B5D3B]" : "text-[#D1D5DB]"} />
      </span>
    </th>
  );
}

function AnalystMini({ ar }: { ar: Holding["analystRating"] }) {
  if (!ar || ar.total === 0) return <span className="text-[#D1D5DB] text-xs">—</span>;
  const buy = Math.round((ar.buy / ar.total) * 100);
  const hold = Math.round((ar.hold / ar.total) * 100);
  const sell = Math.max(0, 100 - buy - hold);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex h-1.5 w-16 rounded-full overflow-hidden bg-[#F3F4F6]">
        <div className="bg-[#0B5D3B]" style={{ width: `${buy}%` }} />
        <div className="bg-amber-400" style={{ width: `${hold}%` }} />
        <div className="bg-red-400" style={{ width: `${sell}%` }} />
      </div>
      <span className="text-[10px] text-[#6B7280] tabular-nums">{buy}%</span>
    </div>
  );
}

function InsightBox({ text }: { text: string }) {
  return (
    <div className="mt-3 bg-[#F8FAF8] border border-[#E5E7EB] rounded-lg px-4 py-3 flex items-start gap-2.5">
      <Sparkles size={12} className="text-[#0B5D3B] mt-0.5 flex-shrink-0" />
      <p className="text-xs text-[#6B7280] leading-relaxed">{text}</p>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function PortfolioPage() {
  const [holdings, setHoldings] = useState<{ ticker: string; allocation: number }[]>([{ ticker: "", allocation: 0 }]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PortfolioResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState<"1M" | "3M" | "6M" | "1Y">("1Y");
  const [sortCol, setSortCol] = useState("weight");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(true);
  const dashRef = useRef<HTMLDivElement>(null);
  const updatedAt = useRef<string>("");

  function addRow() { setHoldings(p => [...p, { ticker: "", allocation: 0 }]); }
  function removeRow(i: number) { setHoldings(p => p.filter((_, idx) => idx !== i)); }
  function updateRow(i: number, f: "ticker" | "allocation", v: string) {
    setHoldings(p => { const n = [...p]; if (f === "ticker") n[i].ticker = v.toUpperCase(); else n[i].allocation = parseFloat(v) || 0; return n; });
  }
  function loadDemo() {
    setHoldings([
      { ticker: "AAPL", allocation: 25000 }, { ticker: "MSFT", allocation: 20000 },
      { ticker: "NVDA", allocation: 18000 }, { ticker: "AMZN", allocation: 12000 },
      { ticker: "GOOGL", allocation: 10000 }, { ticker: "JPM", allocation: 8000 },
      { ticker: "JNJ", allocation: 7000 },
    ]);
  }

  async function analyze() {
    const valid = holdings.filter(h => h.ticker.trim() && h.allocation > 0);
    if (!valid.length) { setError("Add at least one holding with a ticker and allocation."); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/portfolio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ holdings: valid }) });
      if (!res.ok) throw new Error((await res.json()).error ?? "Analysis failed");
      setResult(await res.json() as PortfolioResponse);
      updatedAt.current = new Date().toLocaleTimeString();
      setShowInput(false);
      setTimeout(() => dashRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleSort(col: string) {
    if (sortCol === col) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortCol(col); setSortDir("desc"); }
  }

  const p = result?.portfolio;
  const h = result?.holdings ?? [];

  const chartData = useMemo(() => {
    if (!p?.performanceChart?.length) return [];
    const all = p.performanceChart;
    const n = chartRange === "1M" ? 4 : chartRange === "3M" ? 13 : chartRange === "6M" ? 26 : all.length;
    return all.slice(-n);
  }, [p?.performanceChart, chartRange]);

  const sortedHoldings = useMemo(() => {
    return [...h].sort((a, b) => {
      let av: number | null = null; let bv: number | null = null;
      if (sortCol === "weight") { av = a.weight; bv = b.weight; }
      else if (sortCol === "changePercent") { av = a.changePercent; bv = b.changePercent; }
      else if (sortCol === "beta") { av = a.beta; bv = b.beta; }
      else if (sortCol === "pe") { av = a.pe; bv = b.pe; }
      else if (sortCol === "revenueGrowth") { av = a.revenueGrowth; bv = b.revenueGrowth; }
      else if (sortCol === "priceTargetUpside") { av = a.priceTargetUpside; bv = b.priceTargetUpside; }
      else if (sortCol === "recommendationScore") { av = a.recommendationScore; bv = b.recommendationScore; }
      if (av == null) return 1; if (bv == null) return -1;
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [h, sortCol, sortDir]);

  const chartReturn = chartData.length > 1 ? chartData[chartData.length - 1].portfolio - 100 : null;
  const spyReturn = chartData.length > 1 ? chartData[chartData.length - 1].spy - 100 : null;

  const advisorCards = useMemo(() => p ? buildAdvisorCards(p) : [], [p]);

  const qualityScore = p ? Math.round((p.healthScore.valuation.score + p.healthScore.growth.score) / 2) : 0;
  const qualityGrade = gradeOf(qualityScore);

  const optimizedPortfolio = useMemo(() => {
    if (!p || !h.length) return null;
    const removeTickers = new Set(p.optimization.remove.map(r => r.ticker));
    let after = h
      .filter(hold => !removeTickers.has(hold.ticker))
      .map(hold => {
        const reduction = p.optimization.reduce.find(r => r.ticker === hold.ticker);
        return {
          ticker: hold.ticker,
          before: hold.weight,
          after: reduction?.suggestedAlloc ?? hold.weight,
          changed: !!reduction,
          removed: false,
        };
      });
    const adds = p.optimization.add.slice(0, 2).map(a => ({
      ticker: a.suggestion.length > 10 ? a.suggestion.slice(0, 10) : a.suggestion,
      before: 0,
      after: 5,
      changed: true,
      removed: false,
      isNew: true,
    }));
    after = [...after, ...adds];
    const total = after.reduce((s, x) => s + x.after, 0);
    after = after.map(x => ({ ...x, after: Math.round((x.after / total) * 1000) / 10 }));
    return after;
  }, [p, h]);

  return (
    <div className="min-h-screen bg-[#F8FAF8]">
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#0B5D3B] rounded-lg flex items-center justify-center">
              <BarChart2 size={14} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-[#111827] text-sm">Portfolio Intelligence</span>
              <span className="text-[#9CA3AF] text-xs ml-2 hidden sm:inline">Institutional Analytics Platform</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {updatedAt.current && (
              <span className="hidden md:flex items-center gap-1.5 text-xs text-[#9CA3AF]">
                <Clock size={11} /> Updated {updatedAt.current}
              </span>
            )}
            {p && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-[#9CA3AF]">
                <Database size={11} /> Finnhub · Live
              </span>
            )}
            <button
              onClick={() => setShowInput(!showInput)}
              className="text-xs font-medium text-[#6B7280] border border-[#E5E7EB] hover:border-[#0B5D3B] hover:text-[#0B5D3B] rounded-lg px-3 py-1.5 transition-colors"
            >
              {showInput ? "Hide Input" : "Edit Portfolio"}
            </button>
            {!p && (
              <button
                onClick={analyze}
                disabled={loading}
                className="bg-[#0B5D3B] hover:bg-[#1E7A52] disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                {loading ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing…</> : <><Activity size={12} />Run Analysis</>}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Section Nav ──────────────────────────────────────────────────── */}
      {p && (
        <div className="bg-white border-b border-[#E5E7EB] sticky top-14 z-40">
          <div className="max-w-screen-xl mx-auto px-5">
            <div className="flex gap-0 overflow-x-auto scrollbar-none">
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className="text-xs font-medium text-[#6B7280] hover:text-[#0B5D3B] px-4 py-3 border-b-2 border-transparent hover:border-[#0B5D3B] transition-colors whitespace-nowrap flex-shrink-0"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-screen-xl mx-auto px-5 py-6 space-y-8">
        {/* ── Input Panel ──────────────────────────────────────────────── */}
        {showInput && (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F3F4F6] flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-[#111827] text-sm">Portfolio Holdings</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">Enter ticker symbols and allocation values — any consistent unit works (dollars, percentages, or shares)</p>
              </div>
              <button
                onClick={loadDemo}
                className="text-xs text-[#0B5D3B] hover:text-[#1E7A52] font-medium border border-[#C5DDD3] hover:border-[#0B5D3B] rounded-lg px-3 py-1.5 transition-colors"
              >
                Load Demo Portfolio
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-12 gap-2 text-[10px] text-[#9CA3AF] font-semibold uppercase tracking-wider mb-2 px-1">
                <div className="col-span-4">Ticker</div>
                <div className="col-span-7">Allocation</div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {holdings.map((row, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      value={row.ticker}
                      onChange={e => updateRow(i, "ticker", e.target.value)}
                      placeholder="AAPL"
                      maxLength={6}
                      className="col-span-4 border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm font-mono uppercase text-[#111827] placeholder-[#D1D5DB] focus:border-[#0B5D3B] focus:ring-1 focus:ring-[#0B5D3B]/10 focus:outline-none bg-white"
                    />
                    <input
                      value={row.allocation || ""}
                      onChange={e => updateRow(i, "allocation", e.target.value)}
                      placeholder="10000"
                      type="number"
                      min="0"
                      className="col-span-7 border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#111827] placeholder-[#D1D5DB] focus:border-[#0B5D3B] focus:ring-1 focus:ring-[#0B5D3B]/10 focus:outline-none bg-white"
                    />
                    <button onClick={() => removeRow(i)} className="col-span-1 flex justify-center text-[#D1D5DB] hover:text-red-400 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#F3F4F6]">
                <button onClick={addRow} className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#111827] transition-colors font-medium">
                  <Plus size={13} /> Add Holding
                </button>
                <div className="flex-1" />
                {error && <p className="text-xs text-red-500">{error}</p>}
                <button
                  onClick={analyze}
                  disabled={loading}
                  className="bg-[#0B5D3B] hover:bg-[#1E7A52] disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors flex items-center gap-2"
                >
                  {loading ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing…</> : <><Activity size={14} />Run Analysis</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Dashboard ──────────────────────────────────────────────── */}
        {p && (
          <div ref={dashRef} className="space-y-8">

            {/* ── 1. OVERVIEW ──────────────────────────────────────────── */}
            <section>
              <SectionLabel id="overview">Portfolio Overview</SectionLabel>

              {/* Score cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                <KpiScoreCard label="Portfolio Health" score={p.healthScore.overall} grade={gradeOf(p.healthScore.overall)} icon={Gauge} />
                <KpiScoreCard label="Diversification" score={p.healthScore.diversification.score} grade={gradeOf(p.healthScore.diversification.score)} icon={Layers} />
                <KpiScoreCard label="Risk Score" score={p.healthScore.risk.score} grade={gradeOf(p.healthScore.risk.score)} icon={Shield} />
                <KpiScoreCard label="Quality Score" score={qualityScore} grade={qualityGrade} icon={Award} />
                <KpiScoreCard label="Income Score" score={p.healthScore.income.score} grade={gradeOf(p.healthScore.income.score)} icon={DollarSign} />
              </div>

              {/* Portfolio metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <KpiCard label="Portfolio Value" value={fmtDollar(p.totalAllocation)} sub="Total allocated capital" icon={DollarSign} trend="neutral" />
                <KpiCard label="Daily P&L" value={`${p.dailyPnL >= 0 ? "+" : ""}${fmtDollar(p.dailyPnL)}`} sub={`${fmtPct(p.dailyPnLPct)} today`} icon={p.dailyPnL >= 0 ? TrendingUp : TrendingDown} trend={p.dailyPnL >= 0 ? "up" : "down"} />
                <KpiCard label="1-Year Return" value={chartReturn != null ? `${chartReturn >= 0 ? "+" : ""}${chartReturn.toFixed(1)}%` : "—"} sub={spyReturn != null ? `S&P 500: ${spyReturn >= 0 ? "+" : ""}${spyReturn.toFixed(1)}%` : "vs benchmark"} icon={Activity} trend={chartReturn != null ? (chartReturn >= 0 ? "up" : "down") : "neutral"} />
                <KpiCard label="Portfolio Beta" value={p.riskMetrics.weightedBeta != null ? fmt(p.riskMetrics.weightedBeta) : "—"} sub={`${h.length} holdings · ${p.metrics.numSectors} sectors`} icon={Activity} trend={p.riskMetrics.weightedBeta != null ? (p.riskMetrics.weightedBeta < 1 ? "up" : p.riskMetrics.weightedBeta > 1.3 ? "down" : "neutral") : "neutral"} />
              </div>

              {/* Sub-score detail */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-card p-5">
                <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-4">Dimension Breakdown</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
                  {([
                    ["Diversification", p.healthScore.diversification],
                    ["Risk Mgmt", p.healthScore.risk],
                    ["Sector Balance", p.healthScore.sectorConcentration],
                    ["Valuation", p.healthScore.valuation],
                    ["Growth", p.healthScore.growth],
                    ["Income", p.healthScore.income],
                  ] as [string, HealthDim][]).map(([label, dim]) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wide">{label}</span>
                        <span className="text-xs font-bold" style={{ color: GRADE_CONFIG[gradeBase(gradeOf(dim.score))]?.color ?? "#6B7280" }}>
                          {gradeOf(dim.score)}
                        </span>
                      </div>
                      <div className="h-1 bg-[#F3F4F6] rounded-full overflow-hidden mb-1">
                        <div className="h-full rounded-full" style={{ width: `${dim.score}%`, backgroundColor: GRADE_CONFIG[gradeBase(gradeOf(dim.score))]?.color ?? "#6B7280" }} />
                      </div>
                      <p className="text-[10px] text-[#9CA3AF] leading-tight">{dim.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── PORTFOLIO INTELLIGENCE ENGINE ────────────────────────── */}
            <section>
              <SectionLabel id="intelligence">Portfolio Intelligence Engine</SectionLabel>
              <div className="bg-[#060D16] rounded-xl border border-[#1A2840] overflow-hidden">
                <div className="px-5 py-3 border-b border-[#1A2840] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={11} className="text-[#22C55E]" />
                    <span className="text-[9px] font-mono font-bold text-[#22C55E] tracking-widest uppercase">AI Portfolio Analysis Engine</span>
                  </div>
                  <span className="text-[9px] font-mono text-[#2A4A6A]">Generated from actual portfolio calculations — no hallucinations</span>
                </div>
                <div className="p-4 space-y-2">
                  {buildIntelligenceInsights(p, h).length === 0 ? (
                    <p className="text-xs text-[#3A5A7A] px-2 py-3 font-mono">No significant risk flags detected for this portfolio composition.</p>
                  ) : (
                    buildIntelligenceInsights(p, h).map((insight, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-3 px-4 py-3 rounded-lg ${
                          insight.severity === "warning"
                            ? "bg-[#1A0E0E] border border-[#3D1A1A]"
                            : insight.severity === "positive"
                            ? "bg-[#0D1A10] border border-[#1A3D20]"
                            : "bg-[#0D1520] border border-[#1A2D40]"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                            insight.severity === "warning"
                              ? "bg-[#EF4444]"
                              : insight.severity === "positive"
                              ? "bg-[#22C55E]"
                              : "bg-[#60A5FA]"
                          }`}
                        />
                        <p className="text-xs text-[#CBD5E1] leading-relaxed font-mono">{insight.text}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-5 py-2.5 border-t border-[#1A2840]">
                  <p className="text-[9px] font-mono text-[#2A3A4A]">
                    Data source: Finnhub API ·{" "}
                    <span className="text-[#EF4444]">●</span> Warning &nbsp;
                    <span className="text-[#22C55E]">●</span> Positive &nbsp;
                    <span className="text-[#60A5FA]">●</span> Informational
                  </p>
                </div>
              </div>
            </section>

            {/* ── 2. PERFORMANCE ───────────────────────────────────────── */}
            <section>
              <SectionLabel id="performance">Performance &amp; Benchmarks</SectionLabel>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-3 bg-white border border-[#E5E7EB] rounded-xl shadow-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-[#111827]">Portfolio vs. Benchmark</p>
                      <p className="text-xs text-[#9CA3AF]">Indexed to 100 at period start · Weekly data points</p>
                    </div>
                    <div className="flex gap-1">
                      {(["1M","3M","6M","1Y"] as const).map(r => (
                        <button
                          key={r}
                          onClick={() => setChartRange(r)}
                          className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${chartRange === r ? "bg-[#0B5D3B] text-white" : "text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]"}`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  {chartData.length > 2 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={chartData} margin={{ left: -10, right: 5, top: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9CA3AF" }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickFormatter={v => `${v}`} width={40} domain={["auto","auto"]} />
                        <Tooltip
                          contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 11, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                          formatter={(v, name) => [`${Number(v).toFixed(1)}`, name === "portfolio" ? "Portfolio" : name === "spy" ? "S&P 500" : "Nasdaq"]}
                        />
                        <ReferenceLine y={100} stroke="#E5E7EB" strokeDasharray="4 2" />
                        <Line type="monotone" dataKey="portfolio" stroke="#0B5D3B" dot={false} strokeWidth={2.5} name="portfolio" />
                        <Line type="monotone" dataKey="spy" stroke="#9CA3AF" dot={false} strokeWidth={1.5} strokeDasharray="5 3" name="spy" />
                        <Line type="monotone" dataKey="qqq" stroke="#D1D5DB" dot={false} strokeWidth={1.5} strokeDasharray="5 3" name="qqq" />
                        <Legend iconType="line" iconSize={12} wrapperStyle={{ fontSize: 11, color: "#6B7280", paddingTop: 8 }}
                          formatter={(v: string) => v === "portfolio" ? "Portfolio" : v === "spy" ? "S&P 500" : "Nasdaq"} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[260px] flex items-center justify-center text-[#D1D5DB] text-sm">
                      <div className="text-center"><Activity size={32} className="mx-auto mb-2 opacity-30" /><p>Performance data unavailable</p><p className="text-xs mt-1 text-[#9CA3AF]">Historical data may be temporarily unavailable</p></div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {([
                    ["Period Return", chartReturn != null ? `${chartReturn >= 0 ? "+" : ""}${chartReturn.toFixed(1)}%` : "—", chartReturn != null ? chartReturn >= 0 : null],
                    ["vs S&P 500", chartReturn != null && spyReturn != null ? `${(chartReturn - spyReturn) >= 0 ? "+" : ""}${(chartReturn - spyReturn).toFixed(1)}%` : "—", chartReturn != null && spyReturn != null ? chartReturn >= spyReturn : null],
                    ["Annualized Ret.", p.riskMetrics.annualReturn != null ? `${p.riskMetrics.annualReturn >= 0 ? "+" : ""}${p.riskMetrics.annualReturn.toFixed(1)}%` : "—", p.riskMetrics.annualReturn != null ? p.riskMetrics.annualReturn >= 0 : null],
                    ["Volatility", p.riskMetrics.volatility != null ? `${p.riskMetrics.volatility.toFixed(1)}%` : "—", null],
                    ["Sharpe Ratio", p.riskMetrics.sharpe != null ? fmt(p.riskMetrics.sharpe) : "—", p.riskMetrics.sharpe != null ? p.riskMetrics.sharpe > 1 : null],
                    ["Max Drawdown", p.riskMetrics.maxDrawdown != null ? `-${p.riskMetrics.maxDrawdown.toFixed(1)}%` : "—", false],
                  ] as [string, string, boolean | null][]).map(([label, value, positive]) => (
                    <div key={label} className="bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 shadow-card flex items-center justify-between">
                      <span className="text-xs text-[#6B7280] font-medium">{label}</span>
                      <span className={`text-sm font-bold font-mono ${positive === true ? "text-[#0B5D3B]" : positive === false ? "text-red-500" : "text-[#111827]"}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── 3. EXPOSURE ANALYTICS ────────────────────────────────── */}
            <section>
              <SectionLabel id="exposure">Exposure Analytics</SectionLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Sector */}
                <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-card p-5">
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Sector Exposure</p>
                  <DonutChart data={p.sectorAllocation.map((s, i) => ({ name: s.sector, value: s.percentage, color: s.color || CHART_PALETTE[i % CHART_PALETTE.length] }))} />
                  <div className="space-y-1.5 mt-2">
                    {p.sectorAllocation.map((s, i) => (
                      <div key={s.sector} className="flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color || CHART_PALETTE[i % CHART_PALETTE.length] }} />
                        <span className="text-[#6B7280] flex-1 truncate text-[11px]">{s.sector}</span>
                        <div className="w-12 h-1 bg-[#F3F4F6] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${s.percentage}%`, backgroundColor: s.color || CHART_PALETTE[i % CHART_PALETTE.length] }} />
                        </div>
                        <span className="font-mono font-bold text-[#111827] w-7 text-right text-[11px]">{s.percentage}%</span>
                      </div>
                    ))}
                  </div>
                  <InsightBox text={getSectorInsight(p.sectorAllocation)} />
                </div>

                {/* Market Cap */}
                <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-card p-5">
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Market Cap Profile</p>
                  <DonutChart data={p.marketCapAllocation.map((m, i) => ({ name: m.category, value: m.percentage, color: m.color || CHART_PALETTE[i % CHART_PALETTE.length] }))} />
                  <div className="space-y-1.5 mt-2">
                    {p.marketCapAllocation.map((m, i) => (
                      <div key={m.category} className="flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.color || CHART_PALETTE[i % CHART_PALETTE.length] }} />
                        <span className="text-[#6B7280] flex-1 text-[11px]">{m.category}</span>
                        <div className="w-12 h-1 bg-[#F3F4F6] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${m.percentage}%`, backgroundColor: m.color || CHART_PALETTE[i % CHART_PALETTE.length] }} />
                        </div>
                        <span className="font-mono font-bold text-[#111827] w-7 text-right text-[11px]">{m.percentage}%</span>
                      </div>
                    ))}
                  </div>
                  <InsightBox text={getMarketCapInsight(p.marketCapAllocation)} />
                </div>

                {/* Geographic */}
                <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-card p-5">
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Geographic Exposure</p>
                  <div className="space-y-3 mt-2">
                    {p.geographicAllocation.map((g, i) => (
                      <div key={g.country}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-[#111827]">{g.country === "US" ? "United States" : g.country}</span>
                          <span className="text-xs font-bold font-mono text-[#111827]">{g.percentage}%</span>
                        </div>
                        <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${g.percentage}%`, backgroundColor: CHART_PALETTE[i % CHART_PALETTE.length] }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <InsightBox text={getGeoInsight(p.geographicAllocation)} />
                </div>

                {/* Sector bar chart */}
                <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-card p-5">
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Sector Concentration</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={p.sectorAllocation.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 20 }}>
                      <XAxis type="number" tick={{ fontSize: 9, fill: "#9CA3AF" }} tickFormatter={v => `${v}%`} />
                      <YAxis type="category" dataKey="sector" tick={{ fontSize: 9, fill: "#6B7280" }} width={80} tickFormatter={v => v.length > 12 ? v.slice(0, 12) + "…" : v} />
                      <Tooltip formatter={(v) => [`${v}%`]} contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 11 }} />
                      <Bar dataKey="percentage" radius={[0, 3, 3, 0]}>
                        {p.sectorAllocation.slice(0, 6).map((e, i) => <Cell key={i} fill={e.color || CHART_PALETTE[i % CHART_PALETTE.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-3 pt-3 border-t border-[#F3F4F6] grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-sm font-bold font-mono text-[#111827]">{p.concentrationRisk.top1}%</p>
                      <p className="text-[10px] text-[#9CA3AF]">Top 1</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold font-mono text-[#111827]">{p.concentrationRisk.top3}%</p>
                      <p className="text-[10px] text-[#9CA3AF]">Top 3</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold font-mono text-[#111827]">{p.concentrationRisk.hhi}</p>
                      <p className="text-[10px] text-[#9CA3AF]">HHI</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── 4. HOLDINGS TABLE ────────────────────────────────────── */}
            <section>
              <div className="flex items-center justify-between mb-5 pt-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-0.5 h-5 bg-[#0B5D3B] rounded-full" />
                  <h2 id="holdings" className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest">Holdings</h2>
                </div>
                <p className="text-xs text-[#9CA3AF]">{h.length} positions · click row to expand</p>
              </div>
              <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#F8FAF8] border-b border-[#E5E7EB]">
                        <SortTh label="Ticker" col="ticker" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                        <SortTh label="Weight" col="weight" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                        <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">Price</th>
                        <SortTh label="Day Chg" col="changePercent" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                        <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider hidden md:table-cell">Sector</th>
                        <SortTh label="Beta" col="beta" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                        <SortTh label="P/E" col="pe" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                        <SortTh label="Rev Grw" col="revenueGrowth" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                        <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider hidden lg:table-cell">Analysts</th>
                        <SortTh label="Signal" col="recommendationScore" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                        <SortTh label="PT Up" col="priceTargetUpside" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F4F6]">
                      {sortedHoldings.map((row) => (
                        <Fragment key={row.ticker}>
                          <tr
                            className="hover:bg-[#F8FAF8] cursor-pointer transition-colors"
                            onClick={() => setExpandedRow(expandedRow === row.ticker ? null : row.ticker)}
                          >
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-1.5">
                                <div>
                                  <p className="font-bold font-mono text-[#111827] text-sm">{row.ticker}</p>
                                  <p className="text-[10px] text-[#9CA3AF] truncate max-w-[100px]">{row.name}</p>
                                </div>
                                <Link
                                  href={`/research/${row.ticker}`}
                                  onClick={(e) => e.stopPropagation()}
                                  title="View Research Report"
                                  className="text-[#9CA3AF] hover:text-[#0B5D3B] transition-colors ml-0.5"
                                >
                                  <ExternalLink size={10} />
                                </Link>
                                {expandedRow === row.ticker ? <ChevronUp size={10} className="text-[#9CA3AF] ml-0.5" /> : <ChevronDown size={10} className="text-[#9CA3AF] ml-0.5" />}
                              </div>
                            </td>
                            <td className="px-3 py-3 font-mono font-bold text-[#111827] text-sm">{row.weight}%</td>
                            <td className="px-3 py-3 font-mono text-[#6B7280] text-sm">${row.price.toFixed(2)}</td>
                            <td className={`px-3 py-3 font-mono font-bold text-sm ${row.changePercent >= 0 ? "text-[#0B5D3B]" : "text-red-500"}`}>
                              {row.changePercent >= 0 ? "+" : ""}{row.changePercent.toFixed(2)}%
                            </td>
                            <td className="px-3 py-3 hidden md:table-cell">
                              <span className="text-[11px] text-[#6B7280]">{row.sector}</span>
                            </td>
                            <td className="px-3 py-3 font-mono text-[#6B7280] text-sm">{row.beta?.toFixed(2) ?? "—"}</td>
                            <td className="px-3 py-3 font-mono text-[#6B7280] text-sm">{row.pe?.toFixed(1) ?? "—"}x</td>
                            <td className="px-3 py-3 font-mono text-sm">
                              <span className={row.revenueGrowth != null ? (row.revenueGrowth >= 0 ? "text-[#0B5D3B]" : "text-red-500") : "text-[#D1D5DB]"}>
                                {row.revenueGrowth != null ? `${row.revenueGrowth > 0 ? "+" : ""}${(row.revenueGrowth * 100).toFixed(1)}%` : "—"}
                              </span>
                            </td>
                            <td className="px-3 py-3 hidden lg:table-cell"><AnalystMini ar={row.analystRating} /></td>
                            <td className="px-3 py-3"><RecBadge rec={row.recommendation} /></td>
                            <td className={`px-3 py-3 font-mono font-bold text-sm ${row.priceTargetUpside != null ? (row.priceTargetUpside >= 0 ? "text-[#0B5D3B]" : "text-red-500") : "text-[#D1D5DB]"}`}>
                              {row.priceTargetUpside != null ? `${row.priceTargetUpside >= 0 ? "+" : ""}${row.priceTargetUpside}%` : "—"}
                            </td>
                          </tr>
                          {expandedRow === row.ticker && (
                            <tr className="bg-[#F8FAF8]">
                              <td colSpan={11} className="px-4 py-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5">Signal Rationale</p>
                                    <ul className="space-y-1">
                                      {row.recommendationReasons.map((r, i) => (
                                        <li key={i} className="text-xs text-[#6B7280] flex items-start gap-1.5">
                                          <ChevronRight size={10} className="text-[#0B5D3B] mt-0.5 flex-shrink-0" /> {r}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                    {[["Market Cap", row.marketCap], ["Category", row.marketCapCategory], ["Dividend Yield", `${row.dividendYield.toFixed(2)}%`], ["Country", row.country], ["52W High", `$${row.fiftyTwoWeekHigh.toFixed(2)}`], ["52W Low", `$${row.fiftyTwoWeekLow.toFixed(2)}`]].map(([l, v]) => (
                                      <div key={l}><span className="text-[#9CA3AF]">{l}: </span><span className="text-[#111827] font-medium font-mono">{v}</span></div>
                                    ))}
                                  </div>
                                  {row.priceTarget && (
                                    <div>
                                      <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5">Analyst Price Target</p>
                                      <p className="text-xs text-[#6B7280] font-mono">${row.priceTarget.low} – ${row.priceTarget.high}</p>
                                      <p className="text-xs text-[#9CA3AF]">Consensus mean: <span className="font-bold text-[#111827]">${row.priceTarget.mean}</span></p>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* ── 5. RISK CENTER ───────────────────────────────────────── */}
            <section>
              <SectionLabel id="risk">Risk Center</SectionLabel>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {([
                  ["Portfolio Beta", fmt(p.riskMetrics.weightedBeta), "Market sensitivity vs S&P 500", p.riskMetrics.weightedBeta != null && p.riskMetrics.weightedBeta > 1.2 ? "down" : "neutral"],
                  ["Volatility", p.riskMetrics.volatility != null ? `${p.riskMetrics.volatility.toFixed(1)}%` : "—", "Annualized (weekly estimate)", "neutral"],
                  ["Sharpe Ratio", p.riskMetrics.sharpe != null ? fmt(p.riskMetrics.sharpe) : "—", "Risk-adjusted return (4.5% rf)", p.riskMetrics.sharpe != null && p.riskMetrics.sharpe >= 1 ? "up" : p.riskMetrics.sharpe != null && p.riskMetrics.sharpe < 0.5 ? "down" : "neutral"],
                  ["Max Drawdown", p.riskMetrics.maxDrawdown != null ? `-${p.riskMetrics.maxDrawdown.toFixed(1)}%` : "—", "Peak-to-trough (1Y period)", "down"],
                ] as [string, string, string, "up" | "down" | "neutral"][]).map(([label, value, sub, trend]) => (
                  <KpiCard key={label} label={label} value={value} sub={sub} trend={trend} />
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Position concentration bars */}
                <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-xl shadow-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Position Risk Contribution</p>
                    <div className="flex items-center gap-3 text-[10px] text-[#9CA3AF]">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#0B5D3B] rounded-full" /> Low (&lt;15%)</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full" /> Moderate</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full" /> High (&gt;25%)</span>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {[...h].sort((a, b) => b.weight - a.weight).map(hold => (
                      <div key={hold.ticker} className="flex items-center gap-3">
                        <span className="font-mono font-bold text-[#6B7280] text-xs w-12 flex-shrink-0">{hold.ticker}</span>
                        <div className="flex-1 h-2.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${hold.weight > 25 ? "bg-red-400" : hold.weight > 15 ? "bg-amber-400" : "bg-[#0B5D3B]"}`}
                            style={{ width: `${Math.min(hold.weight, 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-[#6B7280] w-10 text-right flex-shrink-0">{hold.weight}%</span>
                        <span className="text-xs text-[#9CA3AF] w-12 text-right flex-shrink-0 hidden sm:block">β {hold.beta?.toFixed(2) ?? "—"}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#F3F4F6] grid grid-cols-3 gap-4 text-center">
                    <div><p className="text-xs text-[#9CA3AF]">HHI Index</p><p className="font-bold font-mono text-[#111827]">{p.concentrationRisk.hhi}</p><p className="text-[10px] text-[#9CA3AF]">{p.concentrationRisk.hhi > 0.35 ? "Highly Concentrated" : p.concentrationRisk.hhi > 0.18 ? "Moderate Concentration" : "Well Diversified"}</p></div>
                    <div><p className="text-xs text-[#9CA3AF]">Top 3 Concentration</p><p className="font-bold font-mono text-[#111827]">{p.concentrationRisk.top3}%</p><p className="text-[10px] text-[#9CA3AF]">of portfolio</p></div>
                    <div><p className="text-xs text-[#9CA3AF]">Weighted P/E</p><p className="font-bold font-mono text-[#111827]">{p.metrics.weightedPE ?? "—"}x</p><p className="text-[10px] text-[#9CA3AF]">blended valuation</p></div>
                  </div>
                </div>

                {/* Risk plain-English panel */}
                <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-card p-5">
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-4">Risk Assessment</p>
                  <div className="space-y-3">
                    {p.analysis.majorRisks.length > 0 ? p.analysis.majorRisks.map((r, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <AlertTriangle size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-[#6B7280] leading-relaxed">{r}</p>
                      </div>
                    )) : (
                      <p className="text-xs text-[#9CA3AF]">No major risk factors identified.</p>
                    )}
                    {p.analysis.hiddenRisks?.length > 0 && (
                      <div className="pt-3 mt-3 border-t border-[#F3F4F6]">
                        <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">Hidden Risk Factors</p>
                        {p.analysis.hiddenRisks.map((r, i) => (
                          <div key={i} className="flex items-start gap-2.5 mb-2">
                            <Info size={11} className="text-[#9CA3AF] mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-[#9CA3AF] leading-relaxed">{r}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* ── 6. AI PORTFOLIO ADVISOR ──────────────────────────────── */}
            <section>
              <SectionLabel id="advisor">AI Portfolio Advisor</SectionLabel>
              {advisorCards.length === 0 ? (
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 text-center text-[#9CA3AF] shadow-card">
                  <Sparkles size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No actionable recommendations at this time. Portfolio metrics are within acceptable ranges.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {advisorCards.map((card, i) => {
                    const sev = SEVERITY_CONFIG[card.severity];
                    return (
                      <div key={i} className="bg-white border border-[#E5E7EB] rounded-xl shadow-card overflow-hidden">
                        <div className={`px-4 py-2 border-b flex items-center justify-between ${sev.bg} ${sev.border}`}>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">{card.category}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sev.bg} ${sev.color}`}>{card.severity} Priority</span>
                        </div>
                        <div className="p-4 space-y-3">
                          <div>
                            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">Issue</p>
                            <p className="text-xs font-semibold text-[#111827]">{card.issue}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">Impact</p>
                            <p className="text-xs text-[#6B7280] leading-relaxed">{card.impact}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">Recommended Action</p>
                            <p className="text-xs text-[#111827] leading-relaxed">{card.action}</p>
                          </div>
                          <div className="bg-[#F0F7F4] border border-[#C5DDD3] rounded-lg px-3 py-2">
                            <p className="text-[10px] font-semibold text-[#0B5D3B] uppercase tracking-wider mb-0.5">Expected Benefit</p>
                            <p className="text-xs text-[#1E7A52] leading-relaxed">{card.benefit}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Strengths */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-card p-5">
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-[#0B5D3B]" /> Portfolio Strengths
                  </p>
                  <ul className="space-y-2">
                    {p.analysis.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-[#6B7280] flex items-start gap-2 leading-relaxed">
                        <span className="text-[#0B5D3B] mt-0.5 flex-shrink-0 font-bold">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-card p-5">
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Target size={12} className="text-[#0B5D3B]" /> Long-Term Outlook
                  </p>
                  <p className="text-sm text-[#6B7280] leading-relaxed">{p.analysis.longTermOutlook}</p>
                </div>
              </div>
            </section>

            {/* ── 7. PORTFOLIO OPTIMIZER ───────────────────────────────── */}
            <section>
              <SectionLabel id="optimizer">Portfolio Optimizer</SectionLabel>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-card p-5">
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <TrendingDown size={12} /> Reduce Positions
                  </p>
                  {p.optimization.reduce.length > 0 ? (
                    <div className="space-y-3">
                      {p.optimization.reduce.map((r, i) => (
                        <div key={i} className="border border-amber-100 bg-amber-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-bold text-sm font-mono text-[#111827]">{r.ticker}</p>
                            {r.currentAlloc && r.suggestedAlloc && (
                              <span className="text-[10px] font-mono text-amber-700">{r.currentAlloc}% → {r.suggestedAlloc}%</span>
                            )}
                          </div>
                          <p className="text-xs text-[#6B7280] leading-snug">{r.reason}</p>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-[#9CA3AF]">No positions require trimming at current weights.</p>}
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-card p-5">
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Trash2 size={12} /> Exit Candidates
                  </p>
                  {p.optimization.remove.length > 0 ? (
                    <div className="space-y-3">
                      {p.optimization.remove.map((r, i) => (
                        <div key={i} className="border border-red-100 bg-red-50 rounded-lg p-3">
                          <p className="font-bold text-sm font-mono text-[#111827] mb-1">{r.ticker}</p>
                          <p className="text-xs text-[#6B7280] leading-snug">{r.reason}</p>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-[#9CA3AF]">No positions flagged for exit.</p>}
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-card p-5">
                  <p className="text-xs font-semibold text-[#0B5D3B] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Plus size={12} /> Missing Exposure
                  </p>
                  {p.optimization.add.length > 0 ? (
                    <div className="space-y-3">
                      {p.optimization.add.map((a, i) => (
                        <div key={i} className="border border-[#C5DDD3] bg-[#F0F7F4] rounded-lg p-3">
                          <p className="font-bold text-xs text-[#0B5D3B] mb-0.5">{a.suggestion}</p>
                          <p className="text-[10px] text-[#9CA3AF] mb-1">{a.category}</p>
                          <p className="text-xs text-[#6B7280] leading-snug">{a.reason}</p>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-[#9CA3AF]">Portfolio has adequate sector coverage.</p>}
                </div>
              </div>

              {/* Before / After comparison */}
              {optimizedPortfolio && optimizedPortfolio.some(x => x.changed) && (
                <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-card overflow-hidden">
                  <div className="px-5 py-3 border-b border-[#F3F4F6] flex items-center gap-2">
                    <Sliders size={13} className="text-[#0B5D3B]" />
                    <p className="text-xs font-semibold text-[#111827]">Before vs. After Allocation</p>
                    <span className="text-[10px] text-[#9CA3AF] ml-1">Simulated optimization applying all recommendations</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-[#F8FAF8] border-b border-[#E5E7EB]">
                          <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Holding</th>
                          <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Current Weight</th>
                          <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Optimized Weight</th>
                          <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Change</th>
                          <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F3F4F6]">
                        {optimizedPortfolio.map((row) => {
                          const diff = row.after - row.before;
                          const isNew = (row as { isNew?: boolean }).isNew;
                          return (
                            <tr key={row.ticker} className={isNew ? "bg-[#F0F7F4]" : ""}>
                              <td className="px-4 py-2.5 font-bold font-mono text-[#111827] text-sm">{row.ticker}</td>
                              <td className="px-4 py-2.5 font-mono text-[#6B7280] text-sm">{row.before > 0 ? `${row.before}%` : "—"}</td>
                              <td className="px-4 py-2.5 font-mono font-bold text-[#111827] text-sm">{row.after}%</td>
                              <td className={`px-4 py-2.5 font-mono font-bold text-sm ${diff > 0 ? "text-[#0B5D3B]" : diff < 0 ? "text-red-500" : "text-[#9CA3AF]"}`}>
                                {diff === 0 ? "—" : `${diff > 0 ? "+" : ""}${diff.toFixed(1)}%`}
                              </td>
                              <td className="px-4 py-2.5">
                                {isNew ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F0F7F4] text-[#0B5D3B] border border-[#C5DDD3]">NEW</span>
                                ) : row.changed ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">MODIFIED</span>
                                ) : (
                                  <span className="text-[10px] text-[#9CA3AF]">Unchanged</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            {/* ── 8. SCENARIO ANALYSIS ─────────────────────────────────── */}
            <section>
              <SectionLabel id="scenarios">Scenario Analysis</SectionLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {p.stressTests.map(test => {
                  const isPositive = test.estimatedImpact > 0;
                  const absImpact = Math.abs(test.estimatedImpact);
                  const barPct = Math.min(absImpact * 1.5, 100);
                  const { barColor, textColor, bg, border } =
                    test.severity === "extreme" ? { barColor: "#DC2626", textColor: "text-red-600", bg: "bg-red-50", border: "border-red-100" } :
                    test.severity === "high"    ? { barColor: "#F97316", textColor: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" } :
                    test.severity === "medium"  ? { barColor: "#F59E0B", textColor: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" } :
                                                  { barColor: "#0B5D3B", textColor: "text-[#0B5D3B]", bg: "bg-[#F0F7F4]", border: "border-[#C5DDD3]" };
                  return (
                    <div key={test.name} className="bg-white border border-[#E5E7EB] rounded-xl shadow-card overflow-hidden">
                      <div className={`px-4 py-2 border-b ${bg} ${border}`}>
                        <p className="text-xs font-bold text-[#111827]">{test.name}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{test.period}</p>
                      </div>
                      <div className="p-4">
                        <p className={`text-3xl font-bold font-mono mb-3 ${isPositive ? "text-[#0B5D3B]" : textColor}`}>
                          {isPositive ? "+" : ""}{test.estimatedImpact}%
                        </p>
                        <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden mb-3">
                          <div className="h-full rounded-full" style={{ width: `${barPct}%`, backgroundColor: barColor }} />
                        </div>
                        <p className="text-[11px] text-[#6B7280] leading-snug">{test.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── 9. INVESTMENT COMMITTEE ──────────────────────────────── */}
            <section>
              <SectionLabel id="committee">Investment Committee</SectionLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={14} className="text-[#0B5D3B]" />
                    <p className="text-xs font-bold text-[#0B5D3B] uppercase tracking-wider">Bull Case</p>
                  </div>
                  <ul className="space-y-2.5">
                    {p.investmentCommittee.bullCase.map((pt, i) => (
                      <li key={i} className="text-xs text-[#6B7280] leading-relaxed flex items-start gap-1.5">
                        <span className="text-[#0B5D3B] mt-0.5 flex-shrink-0 font-bold">+</span> {pt}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown size={14} className="text-red-500" />
                    <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Bear Case</p>
                  </div>
                  <ul className="space-y-2.5">
                    {p.investmentCommittee.bearCase.map((pt, i) => (
                      <li key={i} className="text-xs text-[#6B7280] leading-relaxed flex items-start gap-1.5">
                        <span className="text-red-400 mt-0.5 flex-shrink-0 font-bold">−</span> {pt}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield size={14} className="text-amber-600" />
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Risk Manager</p>
                  </div>
                  <ul className="space-y-2.5">
                    {p.investmentCommittee.riskManagerView.map((pt, i) => (
                      <li key={i} className="text-xs text-[#6B7280] leading-relaxed flex items-start gap-1.5">
                        <span className="text-amber-500 mt-0.5 flex-shrink-0 font-bold">!</span> {pt}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[#0B5D3B] border border-[#0B5D3B] rounded-xl shadow-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Award size={14} className="text-white/70" />
                    <p className="text-xs font-bold text-white/80 uppercase tracking-wider">Final Verdict</p>
                  </div>
                  <div className="mb-3">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/15 text-white text-sm font-bold tracking-wide">
                      {p.investmentCommittee.finalVerdict.rating}
                    </span>
                    <span className="ml-2 text-xs text-white/50">Confidence: {p.investmentCommittee.finalVerdict.confidence}</span>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">{p.investmentCommittee.finalVerdict.text}</p>
                </div>
              </div>
            </section>

            {/* Data footer */}
            <div className="border-t border-[#E5E7EB] pt-6 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#9CA3AF]">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><Database size={10} /> Market data: Finnhub API</span>
                <span className="flex items-center gap-1.5"><Activity size={10} /> Performance: Yahoo Finance</span>
                <span className="flex items-center gap-1.5"><Clock size={10} /> Prices cached 5 min</span>
              </div>
              <div className="flex items-center gap-3">
                <span>Scoring: 6-factor weighted composite</span>
                <span className="flex items-center gap-1.5"><Info size={10} /> For informational purposes only — not investment advice</span>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
