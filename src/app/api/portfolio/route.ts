import { NextResponse } from "next/server";

const KEY = process.env.FINNHUB_API_KEY;
const BASE = "https://finnhub.io/api/v1";
type FHData = Record<string, unknown>;

async function fh(path: string): Promise<FHData | null> {
  try {
    const res = await fetch(`${BASE}${path}&token=${KEY}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function yahooChart(ticker: string, range = "1y"): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=${range}`,
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; InvestSmartAI/1.0)" }, next: { revalidate: 3600 } }
    );
    if (!res.ok) return map;
    const json = await res.json() as FHData;
    const result = (json as { chart?: { result?: { timestamp?: number[]; indicators?: { quote?: { close?: (number | null)[] }[] } }[] } })?.chart?.result?.[0];
    if (!result?.timestamp || !result?.indicators?.quote?.[0]?.close) return map;
    const closes = result.indicators.quote[0].close!;
    result.timestamp.forEach((ts, i) => {
      if (closes[i] != null) map.set(new Date(ts * 1000).toISOString().slice(0, 10), closes[i]!);
    });
  } catch { /* return empty map */ }
  return map;
}

function today() { return new Date().toISOString().slice(0, 10); }
function nDaysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }

function formatLarge(n: number): string {
  if (!n || isNaN(n)) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toFixed(0)}`;
}

function marketCapCategory(millions: number): { label: string; color: string } {
  if (millions >= 200000) return { label: "Mega Cap", color: "#00A86B" };
  if (millions >= 10000) return { label: "Large Cap", color: "#3B82F6" };
  if (millions >= 2000) return { label: "Mid Cap", color: "#F59E0B" };
  if (millions >= 300) return { label: "Small Cap", color: "#8B5CF6" };
  return { label: "Micro Cap", color: "#6B7280" };
}

function grade(score: number): string {
  if (score >= 80) return "A"; if (score >= 65) return "B"; if (score >= 50) return "C";
  if (score >= 35) return "D"; return "F";
}
function gradeLabel(score: number): string {
  if (score >= 80) return "Excellent"; if (score >= 65) return "Good"; if (score >= 50) return "Average";
  if (score >= 35) return "Below Average"; return "Poor";
}
function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

const PALETTE = ["#00A86B","#3B82F6","#F59E0B","#EC4899","#8B5CF6","#06B6D4","#EF4444","#84CC16","#D97706","#7C3AED","#0891B2","#F97316","#14B8A6","#A855F7"];

const SECTOR_COLORS: Record<string, string> = {
  Technology: "#00A86B", "Communication Services": "#3B82F6", "Consumer Cyclical": "#F59E0B",
  "Consumer Defensive": "#84CC16", Healthcare: "#8B5CF6", "Financial Services": "#EC4899",
  Industrials: "#06B6D4", Energy: "#EF4444", "Basic Materials": "#D97706",
  "Real Estate": "#7C3AED", Utilities: "#0891B2",
};

const SECTOR_NORMALIZE: Record<string, string> = {
  Semiconductors: "Technology", "Software—Application": "Technology", "Software—Infrastructure": "Technology",
  "Consumer Electronics": "Technology", "Electronic Components": "Technology", "Information Technology Services": "Technology",
  "Computer Hardware": "Technology", "Semiconductor Equipment & Materials": "Technology",
  "Internet Content & Information": "Communication Services", "Telecom Services": "Communication Services",
  Broadcasting: "Communication Services", Entertainment: "Communication Services",
  "Electronic Gaming & Multimedia": "Communication Services",
  "Auto Manufacturers": "Consumer Cyclical", "Internet Retail": "Consumer Cyclical",
  "Specialty Retail": "Consumer Cyclical", Restaurants: "Consumer Cyclical",
  "Home Improvement Retail": "Consumer Cyclical", "Apparel Retail": "Consumer Cyclical",
  "Broadline Retail": "Consumer Cyclical", "Auto Parts": "Consumer Cyclical",
  "Beverages—Non-Alcoholic": "Consumer Defensive", "Household & Personal Products": "Consumer Defensive",
  "Food Distribution": "Consumer Defensive", "Grocery Stores": "Consumer Defensive",
  "Packaged Foods": "Consumer Defensive", Tobacco: "Consumer Defensive",
  "Drug Manufacturers—General": "Healthcare", "Drug Manufacturers—Specialty & Generic": "Healthcare",
  Biotechnology: "Healthcare", "Medical Devices": "Healthcare", "Health Care Plans": "Healthcare",
  "Medical Instruments & Supplies": "Healthcare", "Diagnostics & Research": "Healthcare",
  "Medical Care Facilities": "Healthcare",
  Banks: "Financial Services", "Banks—Regional": "Financial Services", "Banks—Diversified": "Financial Services",
  "Credit Services": "Financial Services", "Asset Management": "Financial Services",
  Insurance: "Financial Services", "Insurance—Diversified": "Financial Services",
  "Capital Markets": "Financial Services", "Financial Data & Stock Exchanges": "Financial Services",
  Aerospace: "Industrials", "Aerospace & Defense": "Industrials", "Specialty Industrial Machinery": "Industrials",
  "Farm & Heavy Construction Machinery": "Industrials", Airlines: "Industrials",
  "Integrated Freight & Logistics": "Industrials", Railroads: "Industrials",
  "Waste Management": "Industrials", "Engineering & Construction": "Industrials",
  "Oil & Gas Integrated": "Energy", "Oil & Gas E&P": "Energy", "Oil & Gas Midstream": "Energy",
  "Oil & Gas Refining & Marketing": "Energy", "Oil & Gas Equipment & Services": "Energy",
  "Specialty Chemicals": "Basic Materials", Gold: "Basic Materials", Steel: "Basic Materials",
  Chemicals: "Basic Materials", "Agricultural Inputs": "Basic Materials",
  "REIT—Industrial": "Real Estate", "REIT—Office": "Real Estate", "REIT—Retail": "Real Estate",
  "REIT—Residential": "Real Estate", "REIT—Diversified": "Real Estate", "Real Estate Services": "Real Estate",
  "Utilities—Regulated Electric": "Utilities", "Utilities—Renewable": "Utilities",
  "Utilities—Diversified": "Utilities", "Utilities—Regulated Gas": "Utilities",
};

function normalizeSector(raw: string): string {
  if (!raw) return "Other";
  if (SECTOR_COLORS[raw]) return raw;
  if (SECTOR_NORMALIZE[raw]) return SECTOR_NORMALIZE[raw];
  const l = raw.toLowerCase();
  if (l.includes("tech") || l.includes("software") || l.includes("semi")) return "Technology";
  if (l.includes("financ") || l.includes("bank") || l.includes("insur")) return "Financial Services";
  if (l.includes("health") || l.includes("pharma") || l.includes("biotech") || l.includes("medical")) return "Healthcare";
  if (l.includes("energy") || l.includes("oil") || l.includes("gas")) return "Energy";
  if (l.includes("industrial") || l.includes("aero") || l.includes("defense")) return "Industrials";
  if (l.includes("consumer") && (l.includes("cycl") || l.includes("discret"))) return "Consumer Cyclical";
  if (l.includes("consumer") && (l.includes("def") || l.includes("staple"))) return "Consumer Defensive";
  if (l.includes("communicat") || l.includes("telecom") || l.includes("media")) return "Communication Services";
  if (l.includes("material") || l.includes("chemical") || l.includes("mining")) return "Basic Materials";
  if (l.includes("real estate") || l.includes("reit")) return "Real Estate";
  if (l.includes("util")) return "Utilities";
  return "Other";
}

const STRESS_SCENARIOS = [
  { name: "2008 Financial Crisis", period: "Sep 2008 – Mar 2009", description: "Global financial system collapse triggered by subprime mortgage contagion",
    impacts: { Technology: -0.45, "Communication Services": -0.40, "Consumer Cyclical": -0.52, "Consumer Defensive": -0.15, Energy: -0.55, "Financial Services": -0.72, Healthcare: -0.22, Industrials: -0.45, "Basic Materials": -0.50, "Real Estate": -0.67, Utilities: -0.18, Other: -0.40 } },
  { name: "COVID-19 Crash", period: "Feb – Mar 2020", description: "Fastest 30%+ market decline in history; pandemic-driven demand shock",
    impacts: { Technology: -0.18, "Communication Services": -0.22, "Consumer Cyclical": -0.38, "Consumer Defensive": -0.18, Energy: -0.55, "Financial Services": -0.32, Healthcare: -0.10, Industrials: -0.30, "Basic Materials": -0.26, "Real Estate": -0.28, Utilities: -0.18, Other: -0.28 } },
  { name: "2022 Rate Shock", period: "Jan – Dec 2022", description: "Fed's fastest rate-hiking cycle in 40 years crushed growth and rate-sensitive assets",
    impacts: { Technology: -0.35, "Communication Services": -0.42, "Consumer Cyclical": -0.28, "Consumer Defensive": -0.03, Energy: 0.58, "Financial Services": -0.05, Healthcare: -0.05, Industrials: -0.10, "Basic Materials": 0.05, "Real Estate": -0.28, Utilities: -0.12, Other: -0.20 } },
  { name: "Stagflation Scenario", period: "Hypothetical", description: "High inflation + rising unemployment + GDP contraction environment",
    impacts: { Technology: -0.28, "Communication Services": -0.25, "Consumer Cyclical": -0.40, "Consumer Defensive": -0.05, Energy: 0.10, "Financial Services": -0.32, Healthcare: -0.08, Industrials: -0.30, "Basic Materials": -0.15, "Real Estate": -0.30, Utilities: -0.05, Other: -0.22 } },
];

function computePortfolioChart(
  holdingMaps: Map<string, number>[],
  weights: number[],
  spyMap: Map<string, number>,
  qqqMap: Map<string, number>
): { date: string; portfolio: number; spy: number; qqq: number }[] {
  const spyDates = Array.from(spyMap.keys()).sort();
  if (spyDates.length < 5) return [];

  // Find first date where SPY has data (proxy for market open)
  const firstDate = spyDates[0];
  const lastDate = spyDates[spyDates.length - 1];

  // Get start prices for each holding (first available price on/after firstDate)
  const startPrices = holdingMaps.map(m => {
    for (const d of spyDates) { const p = m.get(d); if (p) return p; }
    return 0;
  });
  const spyStart = spyMap.get(firstDate) ?? 0;
  const qqqStart = qqqMap.get(firstDate) ?? 0;

  // Sample every 5 trading days (weekly)
  const result: { date: string; portfolio: number; spy: number; qqq: number }[] = [];
  const lastKnown = [...startPrices];

  for (let i = 0; i < spyDates.length; i += 5) {
    const date = spyDates[i];
    let portfolioIdx = 0;
    let validWeightSum = 0;

    holdingMaps.forEach((m, j) => {
      const p = m.get(date);
      if (p != null) lastKnown[j] = p;
      if (startPrices[j] > 0) {
        portfolioIdx += weights[j] * (lastKnown[j] / startPrices[j]);
        validWeightSum += weights[j];
      }
    });

    // Normalize by valid weight sum (handles missing holdings)
    const portVal = validWeightSum > 0 ? (portfolioIdx / validWeightSum) * 100 : 100;
    const spyPrice = spyMap.get(date) ?? spyStart;
    const qqqPrice = qqqMap.get(date) ?? qqqStart;

    result.push({
      date: date.slice(5).replace("-", "/"), // MM/DD
      portfolio: Math.round(portVal * 10) / 10,
      spy: spyStart > 0 ? Math.round((spyPrice / spyStart) * 1000) / 10 : 100,
      qqq: qqqStart > 0 ? Math.round((qqqPrice / qqqStart) * 1000) / 10 : 100,
    });
  }

  // Always include last date
  if (spyDates[spyDates.length - 1] !== spyDates[Math.floor((spyDates.length - 1) / 5) * 5]) {
    const date = lastDate;
    let portfolioIdx = 0;
    let validWeightSum = 0;
    holdingMaps.forEach((m, j) => {
      const p = m.get(date); if (p != null) lastKnown[j] = p;
      if (startPrices[j] > 0) { portfolioIdx += weights[j] * (lastKnown[j] / startPrices[j]); validWeightSum += weights[j]; }
    });
    const portVal = validWeightSum > 0 ? (portfolioIdx / validWeightSum) * 100 : 100;
    const spyPrice = spyMap.get(date) ?? spyStart;
    const qqqPrice = qqqMap.get(date) ?? qqqStart;
    result.push({ date: date.slice(5).replace("-", "/"), portfolio: Math.round(portVal * 10) / 10, spy: spyStart > 0 ? Math.round((spyPrice / spyStart) * 1000) / 10 : 100, qqq: qqqStart > 0 ? Math.round((qqqPrice / qqqStart) * 1000) / 10 : 100 });
  }

  return result;
}

function computeRiskMetrics(chart: { portfolio: number }[]) {
  if (chart.length < 20) return { volatility: null, sharpe: null, maxDrawdown: null };
  const dailyReturns: number[] = [];
  for (let i = 1; i < chart.length; i++) {
    const prev = chart[i - 1].portfolio; const cur = chart[i].portfolio;
    if (prev > 0) dailyReturns.push((cur - prev) / prev);
  }
  // Each point is weekly (5 days), so annualize with sqrt(52)
  const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((a, b) => a + (b - mean) ** 2, 0) / dailyReturns.length;
  const weeklyVol = Math.sqrt(variance);
  const annualVol = weeklyVol * Math.sqrt(52);
  const annualReturn = mean * 52;
  const riskFree = 0.045 / 52;
  const sharpeWeekly = weeklyVol > 0 ? (mean - riskFree) / weeklyVol * Math.sqrt(52) : null;

  let maxDD = 0; let peak = chart[0].portfolio;
  for (const pt of chart) {
    if (pt.portfolio > peak) peak = pt.portfolio;
    const dd = (peak - pt.portfolio) / peak;
    if (dd > maxDD) maxDD = dd;
  }

  return {
    volatility: Math.round(annualVol * 1000) / 10,
    sharpe: sharpeWeekly != null ? Math.round(sharpeWeekly * 100) / 100 : null,
    maxDrawdown: Math.round(maxDD * 1000) / 10,
    annualReturn: Math.round(annualReturn * 1000) / 10,
  };
}

const SECTOR_ADDITIONS: Record<string, { suggestion: string; category: string; reason: string }> = {
  Healthcare: { suggestion: "XLV, JNJ, LLY, UNH", category: "Defensive / Healthcare", reason: "Demographic tailwinds and recession resistance provide defensive cushion" },
  "Consumer Defensive": { suggestion: "VDC, KO, PG, WMT", category: "Defensive / Staples", reason: "Recession-proof staples provide income and downside protection" },
  Energy: { suggestion: "XLE, XOM, CVX", category: "Inflation Hedge", reason: "Commodity exposure hedges inflation and adds economic cycle diversification" },
  Industrials: { suggestion: "XLI, GE, CAT, HON", category: "Cyclical / Infrastructure", reason: "Infrastructure tailwinds and manufacturing diversify away from tech concentration" },
  "Financial Services": { suggestion: "XLF, JPM, V, BRK.B", category: "Cyclical / Financials", reason: "Banking and fintech participation with dividend income" },
  Utilities: { suggestion: "XLU, NEE, DUK", category: "Defensive / Income", reason: "Stable dividends and low-beta defensive characteristics" },
  "Real Estate": { suggestion: "VNQ, PLD, AMT", category: "Real Assets / Income", reason: "Inflation protection and income via REIT dividends" },
  "Basic Materials": { suggestion: "XLB, FCX, NEM", category: "Commodities", reason: "Materials exposure diversifies against pure equity concentration" },
};

export async function POST(req: Request) {
  if (!KEY) return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  const body = await req.json() as { holdings: { ticker: string; allocation: number }[] };
  if (!body.holdings?.length) return NextResponse.json({ error: "No holdings provided" }, { status: 400 });

  const totalAllocation = body.holdings.reduce((s, h) => s + h.allocation, 0);

  // Kick off benchmarks immediately alongside holdings — don't wait sequentially
  const spyPromise = yahooChart("SPY");
  const qqqPromise = yahooChart("QQQ");

  // Fetch all holding data in parallel (6 Finnhub + 1 Yahoo per holding)
  const holdings = await Promise.all(body.holdings.map(async (h) => {
    const t = h.ticker.toUpperCase();
    const [quote, profile, metrics, rec, pt, news, chart] = await Promise.all([
      fh(`/quote?symbol=${t}`),
      fh(`/stock/profile2?symbol=${t}`),
      fh(`/stock/metric?symbol=${t}&metric=all`),
      fh(`/stock/recommendation?symbol=${t}`),
      fh(`/stock/price-target?symbol=${t}`),
      fh(`/company-news?symbol=${t}&from=${nDaysAgo(7)}&to=${today()}`),
      yahooChart(t),
    ]);

    const q = quote ?? {}; const p = profile ?? {};
    const m = (metrics as FHData & { metric?: FHData })?.metric ?? {};
    const r0 = Array.isArray(rec) && rec.length > 0 ? (rec[0] as FHData) : null;
    const ptd = pt as FHData | null;
    const newsArr = Array.isArray(news) ? (news as FHData[]).slice(0, 3) : [];

    const price = (q.c as number) ?? 0;
    const mcapM = (p.marketCapitalization as number) ?? 0;
    const mcCat = marketCapCategory(mcapM);
    const beta = m.beta != null ? Math.round((m.beta as number) * 100) / 100 : null;
    const pe = m.peBasicExclExtraTTM != null ? Math.round((m.peBasicExclExtraTTM as number) * 10) / 10 : null;
    const revenueGrowth = m.revenueGrowthTTMYoy != null ? (m.revenueGrowthTTMYoy as number) : null;
    const dividendYield = (m.dividendYieldIndicatedAnnual as number) ?? 0;

    let analystRating: { buy: number; hold: number; sell: number; total: number } | null = null;
    if (r0) {
      const buy = ((r0.buy as number) ?? 0) + ((r0.strongBuy as number) ?? 0);
      const hold = (r0.hold as number) ?? 0;
      const sell = ((r0.sell as number) ?? 0) + ((r0.strongSell as number) ?? 0);
      const total = buy + hold + sell;
      if (total > 0) analystRating = { buy, hold, sell, total };
    }

    let priceTarget: { mean: number; high: number; low: number } | null = null;
    let priceTargetUpside: number | null = null;
    if (ptd?.targetMean) {
      priceTarget = { mean: Math.round((ptd.targetMean as number) * 100) / 100, high: Math.round(((ptd.targetHigh as number) ?? 0) * 100) / 100, low: Math.round(((ptd.targetLow as number) ?? 0) * 100) / 100 };
      if (price > 0) priceTargetUpside = Math.round(((priceTarget.mean - price) / price) * 1000) / 10;
    }

    let score = 50;
    if (analystRating) {
      const buyRatio = analystRating.buy / analystRating.total;
      const sellRatio = analystRating.sell / analystRating.total;
      if (buyRatio > 0.65) score += 28; else if (buyRatio > 0.5) score += 15; else if (buyRatio > 0.35) score += 5;
      if (sellRatio > 0.3) score -= 18; else if (sellRatio > 0.2) score -= 8;
    }
    if (priceTargetUpside != null) {
      if (priceTargetUpside > 25) score += 20; else if (priceTargetUpside > 15) score += 12;
      else if (priceTargetUpside > 5) score += 5; else if (priceTargetUpside < -5) score -= 10; else if (priceTargetUpside < -15) score -= 18;
    }
    if (revenueGrowth != null) { if (revenueGrowth > 0.20) score += 12; else if (revenueGrowth > 0.10) score += 7; else if (revenueGrowth < 0) score -= 12; }
    if (pe != null && pe > 0) { if (pe < 15) score += 8; else if (pe < 20) score += 4; else if (pe > 60) score -= 14; else if (pe > 40) score -= 7; }
    score = clamp(Math.round(score), 0, 100);

    const recommendation = score >= 75 ? "strong_buy" : score >= 60 ? "buy" : score >= 40 ? "hold" : score >= 25 ? "sell" : "strong_sell";

    const reasons: string[] = [];
    if (analystRating) { const bp = Math.round((analystRating.buy / analystRating.total) * 100); reasons.push(`${bp}% Buy consensus from ${analystRating.total} analysts`); }
    if (priceTargetUpside != null && priceTarget) { const dir = priceTargetUpside >= 0 ? "upside" : "downside"; reasons.push(`Analyst target $${priceTarget.mean} implies ${Math.abs(priceTargetUpside)}% ${dir}`); }
    if (revenueGrowth != null) { const pct = Math.round(revenueGrowth * 100); reasons.push(pct >= 0 ? `Revenue growing ${pct}% YoY TTM` : `Revenue declining ${Math.abs(pct)}% YoY TTM`); }
    if (pe != null && pe > 0) reasons.push(`Trades at ${pe}x P/E`);
    if (reasons.length === 0) reasons.push("Insufficient data for full analysis");

    // Compute 1-year return for this holding from Yahoo chart
    let oneYearReturn: number | null = null;
    if (chart.size > 10) {
      const dates = Array.from(chart.keys()).sort();
      const startP = chart.get(dates[0]);
      const endP = chart.get(dates[dates.length - 1]);
      if (startP && endP && startP > 0) oneYearReturn = Math.round(((endP - startP) / startP) * 1000) / 10;
    }

    return {
      ticker: t, name: (p.name as string) ?? t,
      allocation: h.allocation, weight: Math.round((h.allocation / totalAllocation) * 1000) / 10,
      price, change: (q.d as number) ?? 0, changePercent: (q.dp as number) ?? 0,
      sector: normalizeSector((p.finnhubIndustry as string) ?? ""),
      industry: (p.finnhubIndustry as string) ?? "Other",
      country: (p.country as string) ?? "US",
      marketCap: formatLarge(mcapM * 1_000_000), marketCapCategory: mcCat.label, marketCapColor: mcCat.color, marketCapM: mcapM,
      beta, pe, revenueGrowth,
      grossMargin: m.grossMarginTTM != null ? Math.round((m.grossMarginTTM as number) * 10) / 10 : null,
      dividendYield,
      fiftyTwoWeekHigh: (m["52WeekHigh"] as number) ?? 0, fiftyTwoWeekLow: (m["52WeekLow"] as number) ?? 0,
      recommendation, recommendationScore: score, recommendationReasons: reasons.slice(0, 3),
      analystRating, priceTarget, priceTargetUpside, oneYearReturn,
      news: newsArr.map((n) => ({ headline: (n.headline as string) ?? "", source: (n.source as string) ?? "", datetime: (n.datetime as number) ?? 0, url: (n.url as string) ?? "" })),
      valid: !!(p.name as string),
      _chart: chart,
    };
  }));

  const [spyMap, qqqMap] = await Promise.all([spyPromise, qqqPromise]);

  // Build portfolio performance chart
  const weights = holdings.map(h => h.allocation / totalAllocation);
  const holdingMaps = holdings.map(h => h._chart);
  const performanceChart = computePortfolioChart(holdingMaps, weights, spyMap, qqqMap);

  // Risk metrics from performance chart
  const riskFromChart = computeRiskMetrics(performanceChart);

  // YTD return
  const yearStart = `${new Date().getFullYear()}-01-01`;
  let ytdReturn: number | null = null;
  if (performanceChart.length > 5) {
    const ytdPoint = performanceChart.find(p => {
      const month = parseInt(p.date.split("/")[0] ?? "0");
      return month >= 1;
    });
    const first = performanceChart[0]?.portfolio ?? 100;
    const last = performanceChart[performanceChart.length - 1]?.portfolio ?? 100;
    if (first > 0) ytdReturn = Math.round(((last - first) / first) * 1000) / 10;
  }
  void yearStart;

  // Portfolio metrics
  const sectorMap: Record<string, number> = {};
  holdings.forEach(h => { sectorMap[h.sector] = (sectorMap[h.sector] ?? 0) + (h.allocation / totalAllocation) * 100; });
  const sectorAllocation = Object.entries(sectorMap).sort((a, b) => b[1] - a[1])
    .map(([sector, percentage], idx) => ({ sector, percentage: Math.round(percentage), color: SECTOR_COLORS[sector] ?? PALETTE[idx % PALETTE.length] }));

  const mcapMap2: Record<string, number> = {}; const mcapColors: Record<string, string> = {};
  holdings.forEach(h => { mcapMap2[h.marketCapCategory] = (mcapMap2[h.marketCapCategory] ?? 0) + (h.allocation / totalAllocation) * 100; mcapColors[h.marketCapCategory] = h.marketCapColor; });
  const mcapOrder = ["Mega Cap", "Large Cap", "Mid Cap", "Small Cap", "Micro Cap"];
  const marketCapAllocation = mcapOrder.filter(c => mcapMap2[c]).map(c => ({ category: c, percentage: Math.round(mcapMap2[c]), color: mcapColors[c] }));

  const geoMap: Record<string, number> = {};
  holdings.forEach(h => { const c = h.country || "US"; geoMap[c] = (geoMap[c] ?? 0) + (h.allocation / totalAllocation) * 100; });
  const geographicAllocation = Object.entries(geoMap).sort((a, b) => b[1] - a[1]).map(([country, percentage]) => ({ country, percentage: Math.round(percentage) }));

  const holdingsWithBeta = holdings.filter(h => h.beta != null);
  const weightedBeta = holdingsWithBeta.length >= Math.ceil(holdings.length * 0.5)
    ? Math.round(holdingsWithBeta.reduce((s, h) => s + h.beta! * h.allocation, 0) / holdingsWithBeta.reduce((s, h) => s + h.allocation, 0) * 100) / 100 : null;

  const holdingsWithPE = holdings.filter(h => h.pe != null && h.pe > 0 && h.pe < 300);
  const weightedPE = holdingsWithPE.length > 0
    ? Math.round(holdingsWithPE.reduce((s, h) => s + h.pe! * h.allocation, 0) / holdingsWithPE.reduce((s, h) => s + h.allocation, 0) * 10) / 10 : null;

  const avgDividendYield = Math.round(holdings.reduce((s, h) => s + h.dividendYield * (h.allocation / totalAllocation), 0) * 100) / 100;
  const numSectors = sectorAllocation.length;
  const sortedByAlloc = [...holdings].sort((a, b) => b.allocation - a.allocation);
  const topConcentration = Math.round((sortedByAlloc[0]?.allocation / totalAllocation) * 100);
  const largestSector = sectorAllocation[0]?.percentage ?? 0;
  const hhi = Math.round(sectorAllocation.reduce((s, sec) => s + Math.pow(sec.percentage / 100, 2), 0) * 100) / 100;
  const concentrationRisk = {
    top1: topConcentration,
    top3: Math.round(sortedByAlloc.slice(0, 3).reduce((s, h) => s + h.allocation, 0) / totalAllocation * 100),
    top5: Math.round(sortedByAlloc.slice(0, 5).reduce((s, h) => s + h.allocation, 0) / totalAllocation * 100),
    hhi,
  };

  // Daily P&L
  const dailyPnL = Math.round(holdings.reduce((s, h) => s + h.allocation * (h.changePercent / 100), 0) * 100) / 100;
  const dailyPnLPct = totalAllocation > 0 ? Math.round((dailyPnL / totalAllocation) * 10000) / 100 : 0;

  // Health score
  let diversification = 70;
  if (holdings.length >= 15) diversification += 18; else if (holdings.length >= 10) diversification += 12; else if (holdings.length >= 7) diversification += 7; else if (holdings.length < 5) diversification -= 22;
  if (numSectors >= 6) diversification += 10; else if (numSectors >= 4) diversification += 5;
  if (topConcentration > 40) diversification -= 25; else if (topConcentration > 25) diversification -= 10;
  diversification = clamp(diversification, 10, 100);

  let riskScore = 65;
  if (weightedBeta != null) { if (weightedBeta > 1.5) riskScore -= 25; else if (weightedBeta > 1.3) riskScore -= 15; else if (weightedBeta > 1.1) riskScore -= 8; else if (weightedBeta < 0.8) riskScore += 12; }
  if (topConcentration > 40) riskScore -= 10; else if (topConcentration > 30) riskScore -= 5;
  if (largestSector > 60) riskScore -= 20; else if (largestSector > 50) riskScore -= 12;
  if (holdings.length < 5) riskScore -= 12;
  riskScore = clamp(riskScore, 10, 100);

  const sectorConc = clamp(Math.round(100 - largestSector - hhi * 25), 10, 100);

  let valuation = 55;
  if (weightedPE != null) { if (weightedPE < 15) valuation = 90; else if (weightedPE < 20) valuation = 80; else if (weightedPE < 25) valuation = 70; else if (weightedPE < 30) valuation = 60; else if (weightedPE < 40) valuation = 50; else if (weightedPE < 55) valuation = 38; else valuation = 25; }

  const holdingsWithGrowth = holdings.filter(h => h.revenueGrowth != null);
  let growthScore = 55;
  if (holdingsWithGrowth.length > 0) {
    const avgG = holdingsWithGrowth.reduce((s, h) => s + h.revenueGrowth! * (h.allocation / totalAllocation), 0);
    if (avgG > 0.25) growthScore = 92; else if (avgG > 0.15) growthScore = 80; else if (avgG > 0.08) growthScore = 68; else if (avgG > 0.03) growthScore = 55; else if (avgG >= 0) growthScore = 42; else growthScore = 28;
  }

  let incomeScore = 22;
  if (avgDividendYield > 4) incomeScore = 90; else if (avgDividendYield > 3) incomeScore = 78; else if (avgDividendYield > 2) incomeScore = 65; else if (avgDividendYield > 1) incomeScore = 50; else if (avgDividendYield > 0.5) incomeScore = 38;

  const overall = Math.round(diversification * 0.25 + riskScore * 0.20 + sectorConc * 0.20 + valuation * 0.15 + growthScore * 0.15 + incomeScore * 0.05);

  const healthScore = {
    overall, grade: grade(overall), label: gradeLabel(overall),
    diversification: { score: Math.round(diversification), grade: grade(diversification), detail: `${holdings.length} holdings across ${numSectors} sectors` },
    risk: { score: Math.round(riskScore), grade: grade(riskScore), detail: weightedBeta != null ? `Weighted beta ${weightedBeta}x` : "Beta data limited" },
    sectorConcentration: { score: Math.round(sectorConc), grade: grade(sectorConc), detail: `${sectorAllocation[0]?.sector ?? "—"} at ${largestSector}%` },
    valuation: { score: Math.round(valuation), grade: grade(valuation), detail: weightedPE != null ? `Weighted P/E ${weightedPE}x` : "PE data limited" },
    growth: { score: Math.round(growthScore), grade: grade(growthScore), detail: "Based on TTM revenue growth" },
    income: { score: Math.round(incomeScore), grade: grade(incomeScore), detail: `Avg yield ${avgDividendYield.toFixed(2)}%` },
  };

  // Stress tests
  const stressTests = STRESS_SCENARIOS.map(scenario => {
    let impact = 0;
    holdings.forEach(h => { const w = h.allocation / totalAllocation; const si = (scenario.impacts as Record<string, number>)[h.sector] ?? -0.30; impact += w * si; });
    const pct = Math.round(impact * 100 * 10) / 10;
    return { name: scenario.name, period: scenario.period, description: scenario.description, estimatedImpact: pct, severity: pct <= -25 ? "extreme" : pct <= -15 ? "high" : pct <= -8 ? "medium" : "low" };
  });

  // Text analysis
  const topSector = sectorAllocation[0];
  const growthSectors = ["Technology", "Communication Services", "Consumer Cyclical"];
  const defensiveSectors = ["Healthcare", "Consumer Defensive", "Utilities"];
  const growthPct = Math.round(sectorAllocation.filter(s => growthSectors.includes(s.sector)).reduce((a, s) => a + s.percentage, 0));
  const defensivePct = Math.round(sectorAllocation.filter(s => defensiveSectors.includes(s.sector)).reduce((a, s) => a + s.percentage, 0));
  const missingKeys = Object.keys(SECTOR_ADDITIONS).filter(s => !sectorMap[s]);

  const strengths: string[] = [];
  if (holdings.length >= 8) strengths.push(`${holdings.length} holdings meaningfully reduces single-stock idiosyncratic risk`);
  if (numSectors >= 5) strengths.push(`Exposure across ${numSectors} distinct sectors provides multi-cycle resilience`);
  if (topConcentration <= 20) strengths.push(`No single holding exceeds ${topConcentration}% — disciplined position sizing`);
  if (weightedBeta != null && weightedBeta < 1.0) strengths.push(`Below-market beta of ${weightedBeta}x dampens portfolio volatility`);
  if (defensivePct > 15) strengths.push(`${defensivePct}% defensive allocation provides downside cushion`);
  if (avgDividendYield > 1.5) strengths.push(`Average yield of ${avgDividendYield.toFixed(2)}% provides income component`);
  if (growthScore >= 70) strengths.push("Above-average revenue growth signals strong fundamental momentum");
  if (strengths.length === 0) strengths.push("Portfolio reflects disciplined allocation with intentional sector weighting");

  const weaknesses: string[] = [];
  if (topConcentration > 30) weaknesses.push(`${sortedByAlloc[0]?.ticker} at ${topConcentration}% represents significant single-stock concentration`);
  if (holdings.length < 6) weaknesses.push(`Only ${holdings.length} holdings — 10–15 positions is generally recommended for adequate diversification`);
  if (largestSector > 50) weaknesses.push(`${topSector?.sector} at ${largestSector}% creates heavy sector correlation risk`);
  if (weightedBeta != null && weightedBeta > 1.3) weaknesses.push(`Elevated beta of ${weightedBeta}x amplifies losses in market downturns`);
  if (avgDividendYield < 0.5) weaknesses.push("Near-zero dividend yield: portfolio entirely dependent on capital appreciation");
  if (defensivePct < 5 && holdings.length >= 5) weaknesses.push("Minimal defensive exposure leaves portfolio vulnerable to sharp sell-offs");
  if (weaknesses.length === 0) weaknesses.push("Portfolio construction is sound — no major structural weaknesses identified");

  const majorRisks = [
    topSector ? `Sector concentration: ${largestSector}% in ${topSector.sector} creates vulnerability to industry-specific headwinds` : null,
    weightedBeta != null && weightedBeta > 1.1 ? `Market sensitivity: beta ${weightedBeta}x implies ~${Math.round(weightedBeta * 10)}% loss on a 10% market decline` : null,
    weightedPE != null && weightedPE > 30 ? `Valuation risk: ${weightedPE}x P/E susceptible to multiple compression if rates rise or earnings disappoint` : null,
    "Mega-cap concentration means individual earnings misses can disproportionately impact the portfolio",
  ].filter(Boolean) as string[];

  const hiddenRisks = [
    geographicAllocation.length === 1 && geographicAllocation[0]?.country === "US" ? "100% US-listed: no international growth markets or currency diversification" : null,
    growthPct > 60 ? `${growthPct}% growth-sector concentration creates interest rate sensitivity — rising rates compress growth multiples` : null,
    "Correlation clustering: holdings in the same sector behave like a single position in a broad macro shock",
    incomeScore < 35 ? "Zero income generation means no buffer during sideways or down markets" : null,
  ].filter(Boolean) as string[];

  const missingExposure = missingKeys.slice(0, 5).map(s => `${s}: ${SECTOR_ADDITIONS[s].suggestion} — ${SECTOR_ADDITIONS[s].reason}`);
  if (geographicAllocation.length === 1) missingExposure.push("International: VXUS or EFA adds global diversification and access to faster-growing economies");

  const longTermOutlook = `Portfolio is positioned ${growthPct > 50 ? "offensively, skewed toward growth sectors" : defensivePct > 30 ? "defensively, with meaningful downside protection" : "in a balanced configuration"}. ${numSectors >= 5 ? "Multi-sector exposure supports resilience through varying cycles." : "Limited diversification increases dependency on a single economic theme."} ${weightedBeta != null ? `Beta of ${weightedBeta}x ${weightedBeta > 1.2 ? "suggests outperformance in bull markets but amplified losses in corrections" : "provides stable long-term compounding with lower volatility drag"}.` : ""} ${growthScore >= 70 ? "Strong revenue growth trends are a positive indicator for long-term capital appreciation." : ""}`.trim();

  // Investment Committee
  const bullCase = [
    growthScore >= 70 ? "Portfolio revenue growth trends are above-market, indicating strong fundamental momentum in core positions" : "Holdings demonstrate resilience with diversified revenue streams across multiple end markets",
    numSectors >= 4 ? `Multi-sector exposure across ${numSectors} sectors provides participation in multiple economic growth drivers simultaneously` : "Focused sector bets allow the portfolio to capitalize on concentrated thematic tailwinds",
    holdings.some(h => h.priceTargetUpside != null && h.priceTargetUpside > 0) ? "Analyst price targets imply positive upside across multiple holdings based on institutional coverage" : "Institutional analyst coverage supports the investment thesis for key holdings",
    weightedPE != null && weightedPE < 30 ? `Portfolio P/E of ${weightedPE}x is reasonable for current growth profiles — limited downside multiple compression risk` : "Growth-oriented positioning benefits from continued earnings power expansion",
  ];

  const bearCase = [
    largestSector > 40 ? `${largestSector}% concentration in ${topSector?.sector} creates asymmetric downside if sector faces regulatory, competitive, or macro headwinds` : "Sector diversification limits any single theme but means the portfolio captures average market returns, not concentrated alpha",
    weightedBeta != null && weightedBeta > 1.0 ? `Portfolio beta of ${weightedBeta}x means it is expected to underperform in risk-off environments — vulnerable to sentiment-driven de-risking` : "Defensive positioning limits upside capture in strong bull markets",
    weightedPE != null && weightedPE > 25 ? `Premium valuation of ${weightedPE}x P/E leaves limited margin of safety — any earnings miss could trigger sharp de-rating` : "Near-market valuations offer limited cushion against negative earnings surprises",
    "Rising interest rates remain a structural headwind for growth equities — higher discount rates compress long-duration asset valuations",
  ];

  const riskManagerView = [
    `Portfolio beta of ${weightedBeta ?? "N/A"}x requires active monitoring — a 20% market correction would imply an estimated ${weightedBeta != null ? Math.round(weightedBeta * 20) : "~20"}% portfolio drawdown`,
    `Sector HHI of ${hhi} indicates ${hhi > 0.30 ? "elevated" : hhi > 0.18 ? "moderate" : "acceptable"} concentration risk — recommend ${hhi > 0.25 ? "reducing top sector exposure by 10–15 percentage points" : "monitoring current levels as market conditions evolve"}`,
    stressTests[0] ? `2008-equivalent scenario estimates a ${stressTests[0].estimatedImpact}% portfolio impact — ensure position sizing is consistent with drawdown tolerance` : "Historical stress scenarios indicate manageable but material downside in extreme market events",
    "Recommend maintaining at least 15–20% defensive sector allocation (healthcare, staples, utilities) as a structural hedge against economic deterioration",
  ];

  const recCounts = { buy: holdings.filter(h => h.recommendation === "buy" || h.recommendation === "strong_buy").length, hold: holdings.filter(h => h.recommendation === "hold").length, sell: holdings.filter(h => h.recommendation === "sell" || h.recommendation === "strong_sell").length };
  const majoritySignal = recCounts.buy > recCounts.hold && recCounts.buy > recCounts.sell ? "constructive" : recCounts.sell > recCounts.hold ? "cautious" : "neutral";

  const finalVerdict = {
    rating: healthScore.grade === "A" ? "OVERWEIGHT" : healthScore.grade === "B" ? "MARKET WEIGHT" : healthScore.grade === "C" ? "NEUTRAL" : "UNDERWEIGHT",
    confidence: healthScore.overall >= 75 ? "High" : healthScore.overall >= 55 ? "Medium" : "Low",
    text: `Portfolio receives a Health Grade of ${healthScore.grade} (${healthScore.overall}/100). The ${holdings.length}-holding portfolio is ${majoritySignal === "constructive" ? "positioned constructively" : majoritySignal === "cautious" ? "showing caution signals" : "neutrally positioned"} with ${recCounts.buy} buy, ${recCounts.hold} hold, and ${recCounts.sell} sell signals from institutional analyst consensus. ${healthScore.overall >= 70 ? "The portfolio is well-constructed for the current market environment with manageable risk." : healthScore.overall >= 50 ? "The portfolio is adequately constructed but would benefit from targeted improvements in diversification and risk management." : "The portfolio requires structural changes — concentration and risk metrics are outside acceptable thresholds for long-term wealth preservation."}`,
  };

  // Optimization
  const reduce = sortedByAlloc.filter(h => (h.allocation / totalAllocation) > 0.25 && h.recommendation !== "strong_buy").slice(0, 3)
    .map(h => ({ ticker: h.ticker, reason: `Overweight at ${Math.round((h.allocation / totalAllocation) * 100)}% — trim to 10–15% to reduce single-stock risk`, currentAlloc: Math.round((h.allocation / totalAllocation) * 100), suggestedAlloc: 12 }));
  const remove = holdings.filter(h => (h.recommendation === "sell" || h.recommendation === "strong_sell") && (h.revenueGrowth ?? 0) < 0)
    .map(h => ({ ticker: h.ticker, reason: `${h.recommendationReasons[0] ?? "Weak fundamentals"} with declining revenue — consider exiting` }));
  const add = missingKeys.slice(0, 4).map(s => ({ suggestion: SECTOR_ADDITIONS[s].suggestion, reason: SECTOR_ADDITIONS[s].reason, category: SECTOR_ADDITIONS[s].category }));

  // Strip _chart from response (too large)
  const cleanHoldings = holdings.map(({ _chart, ...rest }) => { void _chart; return rest; });

  return NextResponse.json({
    holdings: cleanHoldings,
    portfolio: {
      totalAllocation, numHoldings: holdings.length,
      dailyPnL, dailyPnLPct,
      ytdReturn,
      performanceChart,
      riskMetrics: {
        weightedBeta,
        volatility: riskFromChart.volatility,
        sharpe: riskFromChart.sharpe,
        maxDrawdown: riskFromChart.maxDrawdown,
        annualReturn: riskFromChart.annualReturn,
      },
      healthScore,
      metrics: { weightedBeta, weightedPE, avgDividendYield, numSectors, topConcentration },
      sectorAllocation,
      marketCapAllocation,
      geographicAllocation,
      concentrationRisk,
      stressTests,
      analysis: { summary: `${holdings.length}-holding portfolio across ${numSectors} sectors. ${topSector ? `${topSector.sector} is the largest sector at ${largestSector}%.` : ""} ${weightedBeta != null ? `Weighted beta ${weightedBeta}x.` : ""} ${weightedPE != null ? `Weighted P/E ${weightedPE}x.` : ""}`, strengths, weaknesses, majorRisks, hiddenRisks, missingExposure, longTermOutlook },
      optimization: { reduce, remove, add },
      investmentCommittee: { bullCase, bearCase, riskManagerView, finalVerdict },
    },
  });
}
