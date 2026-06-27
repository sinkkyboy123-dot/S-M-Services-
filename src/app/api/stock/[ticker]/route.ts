import { NextResponse } from "next/server";

const KEY = process.env.FINNHUB_API_KEY!;
const BASE = "https://finnhub.io/api/v1";

type FHData = Record<string, unknown>;
type Para = { type: "fact" | "analysis"; text: string };

async function fh(path: string): Promise<FHData | null> {
  try {
    const res = await fetch(`${BASE}${path}&token=${KEY}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function fhArr(path: string): Promise<FHData[]> {
  try {
    const res = await fetch(`${BASE}${path}&token=${KEY}`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const d = await res.json();
    return Array.isArray(d) ? d : [];
  } catch { return []; }
}

async function fetchYahooChart(ticker: string) {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1y`,
      {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; SMServices/1.0)" },
        next: { revalidate: 300 },
      }
    );
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

function today() { return new Date().toISOString().slice(0, 10); }
function nDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function formatLarge(n: number): string {
  if (!n || isNaN(n)) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toFixed(0)}`;
}

// ── AI Report Builder ─────────────────────────────────────────────────────────

function fact(text: string): Para { return { type: "fact", text }; }
function analysis(text: string): Para { return { type: "analysis", text }; }
function compact(arr: (Para | null)[]): Para[] { return arr.filter(Boolean) as Para[]; }

function buildAIReport(
  ticker: string,
  profile: FHData,
  q: FHData,
  m: FHData,
  recs: FHData[],
  pt: FHData | null,
  peers: string[]
): Record<string, Para[] | string> {
  const name = (profile.name as string) ?? ticker;
  const exchange = (profile.exchange as string) ?? "N/A";
  const country = (profile.country as string) ?? "N/A";
  const industry = (profile.finnhubIndustry as string) ?? "N/A";
  const mcapM = (profile.marketCapitalization as number) ?? 0;
  const mcap = formatLarge(mcapM * 1_000_000);
  const employees = profile.employeeTotal ? Number(profile.employeeTotal).toLocaleString() : null;
  const ipoYear = (profile.ipo as string)?.slice(0, 4) ?? null;

  const price = (q.c as number) ?? 0;

  const pe = (m.peBasicExclExtraTTM as number) ?? null;
  const eps = (m.epsBasicExclExtraAnnual as number) ?? null;
  const revGrowth = (m.revenueGrowthTTMYoy as number) ?? null;
  const revGrowth3Y = (m.revenueGrowth3Y as number) ?? null;
  const epsGrowth = (m.epsGrowthTTMYoy as number) ?? null;
  const grossMargin = (m.grossMarginTTM as number) ?? null;
  const opMargin = (m.operatingMarginTTM as number) ?? null;
  const netMargin = (m.netProfitMarginTTM as number) ?? null;
  const roe = (m.roeTTM as number) ?? null;
  const roa = (m.roaTTM as number) ?? null;
  const debtEq = (m.debtEquityAnnual as number) ?? null;
  const currentRatio = (m.currentRatioAnnual as number) ?? null;
  const beta = (m.beta as number) ?? null;
  const divYield = (m.dividendYieldIndicatedAnnual as number) ?? null;
  const weekHigh = (m["52WeekHigh"] as number) ?? null;
  const weekLow  = (m["52WeekLow"] as number) ?? null;
  const yearReturn = (m["52WeekPriceReturnDaily"] as number) ?? null;
  const ps = (m.psTTM as number) ?? null;
  const pb = (m.pbAnnual as number) ?? null;

  const r0 = recs[0] ?? null;
  const buyTotal = r0 ? ((r0.buy as number ?? 0) + (r0.strongBuy as number ?? 0)) : 0;
  const holdTotal = r0 ? (r0.hold as number ?? 0) : 0;
  const sellTotal = r0 ? ((r0.sell as number ?? 0) + (r0.strongSell as number ?? 0)) : 0;
  const totalRecs = buyTotal + holdTotal + sellTotal;
  const buyPct   = totalRecs > 0 ? Math.round((buyTotal / totalRecs) * 100) : null;
  const holdPct  = totalRecs > 0 ? Math.round((holdTotal / totalRecs) * 100) : null;
  const sellPct  = totalRecs > 0 ? Math.round((sellTotal / totalRecs) * 100) : null;
  const recPeriod = (r0?.period as string) ?? null;

  const ptMean = pt?.targetMean ? Math.round((pt.targetMean as number) * 100) / 100 : null;
  const ptHigh = pt?.targetHigh ? Math.round((pt.targetHigh as number) * 100) / 100 : null;
  const ptLow  = pt?.targetLow  ? Math.round((pt.targetLow  as number) * 100) / 100 : null;
  const ptUpside = ptMean && price > 0 ? Math.round(((ptMean - price) / price) * 1000) / 10 : null;

  const mcapCat = mcapM >= 200000 ? "mega-cap" : mcapM >= 10000 ? "large-cap" : mcapM >= 2000 ? "mid-cap" : mcapM >= 300 ? "small-cap" : "micro-cap";

  // ── Executive Summary ───────────────────────────────────────────────────────
  const executiveSummary = compact([
    fact(`${name} (${ticker}) is listed on ${exchange} in the ${industry} sector. Market capitalization stands at approximately ${mcap}.`),
    yearReturn != null ? fact(`The stock has ${yearReturn >= 0 ? "gained" : "declined"} ${Math.abs(yearReturn).toFixed(1)}% over the trailing 52 weeks, trading at $${price.toFixed(2)}.`) : null,
    totalRecs > 0 && buyPct != null ? fact(`Of ${totalRecs} Wall Street analysts covering ${ticker}${recPeriod ? ` (as of ${recPeriod})` : ""}, ${buyPct}% rate the stock Buy or Strong Buy, ${holdPct}% Hold, and ${sellPct}% Sell.`) : null,
    ptMean != null ? fact(`The analyst consensus price target is $${ptMean}${ptUpside != null ? `, implying ${ptUpside >= 0 ? "+" : ""}${ptUpside}% from current levels` : ""}.`) : null,
    analysis(`${name} presents as a ${mcapCat} operator in ${industry}. ${buyPct != null && buyPct > 60 ? "The strong analyst buy consensus reflects institutional confidence in the company's near-term prospects." : buyPct != null && buyPct < 40 ? "Subdued analyst consensus warrants careful examination of fundamentals before initiating a position." : totalRecs > 0 ? "Mixed analyst opinion reflects uncertainty around near-term catalysts." : "Analyst coverage data is not available from the provider for this reporting period."} ${revGrowth != null ? `Revenue momentum (${(revGrowth * 100).toFixed(1)}% TTM YoY) ${revGrowth > 0.15 ? "supports a constructive growth narrative." : revGrowth > 0 ? "is positive but modest relative to high-growth peers." : "is negative, signalling potential headwinds to the core business."}` : ""}`),
  ]);

  // ── Business Model ──────────────────────────────────────────────────────────
  const businessModel = compact([
    fact(`${name} is publicly traded on ${exchange} and classified in the ${industry} industry. The company is headquartered in ${country}.`),
    ipoYear != null ? fact(`${name} has been publicly listed since approximately ${ipoYear}.`) : null,
    employees != null ? fact(`The company reported approximately ${employees} employees in its most recent filing.`) : null,
    analysis(`Based on sector classification (${industry}) and the available margin profile, ${name} operates in a ${grossMargin != null && grossMargin > 50 ? "high-margin, differentiated product or platform" : grossMargin != null && grossMargin > 30 ? "moderately differentiated business with meaningful gross economics" : "lower-margin business that may depend on volume or service scale"} model. ${opMargin != null ? `An operating margin of ${opMargin.toFixed(1)}% suggests ${opMargin > 20 ? "strong operational efficiency" : opMargin > 10 ? "adequate cost control" : "tight or challenged operational leverage"}.` : ""}`),
    analysis(`For a comprehensive business description, investors should review ${name}'s most recent 10-K filing and earnings call transcripts, which provide segment-level detail not captured by market data feeds.`),
  ]);

  // ── Competitive Advantages ──────────────────────────────────────────────────
  const competitiveAdvantages = compact([
    grossMargin != null ? fact(`Gross margin (TTM): ${grossMargin.toFixed(1)}%. ${grossMargin > 60 ? "Gross margins above 60% typically indicate strong pricing power, brand moats, or intellectual property-driven differentiation." : grossMargin > 40 ? "Gross margins between 40–60% suggest meaningful product differentiation above pure commodity status." : "Gross margins below 40% imply limited pricing power relative to input costs, often characteristic of hardware, distribution, or highly competitive segments."}`) : null,
    roe != null ? fact(`Return on equity (ROE) TTM: ${roe.toFixed(1)}%. ${roe > 20 ? "ROE above 20% demonstrates efficient use of shareholder capital and suggests durable competitive positioning." : roe > 10 ? "ROE between 10–20% is adequate, indicating moderate capital efficiency." : "ROE below 10% may indicate underutilized assets or earnings pressure."}`) : null,
    roa != null ? fact(`Return on assets (ROA) TTM: ${roa.toFixed(1)}%.`) : null,
    peers.length > 0 ? fact(`Identified peer group includes: ${peers.slice(0, 6).join(", ")}. Relative competitive positioning should be assessed against these peers on margins and growth metrics.`) : null,
    analysis(`${name}'s competitive moat can be inferred from its margin and return profile. ${grossMargin != null && grossMargin > 55 && roe != null && roe > 15 ? "The combination of high gross margins and strong ROE is characteristic of companies with durable competitive advantages — pricing power, network effects, switching costs, or proprietary IP." : grossMargin != null && grossMargin > 35 ? "Margins suggest a differentiated business, though the depth of the competitive moat requires review of market share trends, patent portfolios, and switching cost analysis." : "Available margin data suggests a competitive landscape without a clearly dominant moat — competitive intensity likely limits long-term pricing power."}`),
  ]);

  // ── Growth Drivers ──────────────────────────────────────────────────────────
  const growthDrivers = compact([
    revGrowth != null ? fact(`Revenue growth (TTM YoY): ${(revGrowth * 100).toFixed(1)}%. ${revGrowth > 0.20 ? "Above-market revenue growth signals strong end-market demand and potential share gains." : revGrowth > 0 ? "Positive but moderate growth indicates stable demand without accelerating expansion." : "Negative revenue growth requires understanding whether it reflects cyclical conditions, competitive losses, or structural decline."}`) : null,
    revGrowth3Y != null ? fact(`Three-year revenue CAGR approximates ${(revGrowth3Y * 100).toFixed(1)}%, providing context for the sustainability of recent growth trends.`) : null,
    epsGrowth != null && revGrowth != null ? fact(`EPS growth (TTM YoY): ${(epsGrowth * 100).toFixed(1)}%, indicating ${epsGrowth > revGrowth ? "margin expansion alongside top-line growth" : "revenue growth is not yet translating to proportional earnings improvement"}.`) : null,
    ptUpside != null && ptUpside > 0 ? fact(`Sell-side analyst price targets imply ${ptUpside}% upside to consensus mean of $${ptMean}, with targets ranging from $${ptLow} to $${ptHigh}.`) : null,
    analysis(`${revGrowth != null ? `At ${(revGrowth * 100).toFixed(1)}% TTM revenue growth, ${name} is ${revGrowth > 0.25 ? "exhibiting high-growth characteristics that typically command premium valuations. Sustaining this trajectory requires continued market expansion, product innovation, or geographic diversification." : revGrowth > 0.05 ? "growing steadily. Key growth drivers to monitor include market share trends, new product cycles, and international expansion progress." : revGrowth >= 0 ? "in low-growth mode. Re-acceleration catalysts — new product launches, market expansion, cost discipline — would be necessary to improve growth profile." : "experiencing revenue contraction. Management's plan to stabilize and return to growth is the critical variable for the investment case."}` : "Revenue growth data is unavailable from the provider. Monitor quarterly earnings reports for trajectory."}`),
  ]);

  // ── Risks ───────────────────────────────────────────────────────────────────
  const risks = compact([
    beta != null ? fact(`Beta: ${beta.toFixed(2)}x (vs. S&P 500 = 1.00). ${beta > 1.4 ? "High beta signals above-market sensitivity — the stock historically experiences amplified drawdowns during broad market selloffs." : beta > 1.1 ? "Moderate beta above 1.0 indicates somewhat elevated market sensitivity." : beta < 0.8 ? "Below-market beta suggests lower volatility relative to the broad market." : "Beta near 1.0 indicates broadly market-correlated volatility."}`) : null,
    pe != null && pe > 35 ? fact(`P/E ratio of ${pe.toFixed(1)}x prices in sustained above-average earnings growth. Any earnings miss or guidance cut could trigger sharp multiple compression.`) : null,
    debtEq != null && debtEq > 1.0 ? fact(`Debt-to-equity (Annual): ${debtEq.toFixed(2)}x. Elevated leverage amplifies both upside and downside, and introduces refinancing risk in rising interest rate environments.`) : null,
    revGrowth != null && revGrowth < 0 ? fact(`Revenue has declined ${(Math.abs(revGrowth) * 100).toFixed(1)}% TTM YoY, indicating potential demand headwinds or competitive displacement requiring management action.`) : null,
    sellPct != null && sellPct > 20 ? fact(`${sellPct}% of ${totalRecs} covering analysts hold Sell or Strong Sell ratings, reflecting institutional skepticism about near-term performance.`) : null,
    analysis(`The primary risk profile of ${name} is characterized by ${beta != null && beta > 1.4 ? "elevated market sensitivity, " : ""}${pe != null && pe > 35 ? "valuation risk from premium multiples, " : ""}${debtEq != null && debtEq > 1 ? "balance sheet leverage, " : ""}${revGrowth != null && revGrowth < 0 ? "negative revenue momentum, " : ""}and broader sector-specific and macroeconomic risks. Investors should size positions in accordance with their individual risk tolerance.`),
  ]);

  // ── Bull Case ───────────────────────────────────────────────────────────────
  const bullCaseDetailed = compact([
    buyPct != null && buyPct > 50 ? fact(`${buyPct}% of ${totalRecs} analysts covering ${ticker} recommend Buy or Strong Buy — indicating broad institutional confidence in the investment case.`) : null,
    revGrowth != null && revGrowth > 0 ? fact(`Positive revenue growth of ${(revGrowth * 100).toFixed(1)}% TTM demonstrates continued business expansion and resilient demand.`) : null,
    grossMargin != null && grossMargin > 40 ? fact(`Gross margin of ${grossMargin.toFixed(1)}% indicates strong pricing power and favorable unit economics that can drive operating leverage at scale.`) : null,
    roe != null && roe > 15 ? fact(`ROE of ${roe.toFixed(1)}% signals efficient capital allocation and shareholder value generation above most peers.`) : null,
    ptUpside != null && ptUpside > 10 ? fact(`Analyst consensus price target of $${ptMean} implies ${ptUpside}% upside from current price — above the 10% threshold typically required for institutional buy recommendations.`) : null,
    divYield != null && divYield > 0 ? fact(`Dividend yield of ${divYield.toFixed(2)}% provides income component, signaling management confidence in cash flow durability.`) : null,
    analysis(`The constructive bull thesis for ${name} is supported by ${revGrowth != null && revGrowth > 0.10 ? "above-average revenue growth, " : ""}${grossMargin != null && grossMargin > 40 ? "strong margin profile, " : ""}${buyPct != null && buyPct > 55 ? "broad analyst buy consensus, " : ""}${ptUpside != null && ptUpside > 0 ? `and analyst price targets implying ${ptUpside}% upside. ` : ""}Key upside catalysts include accelerating revenue growth, margin expansion, and continued institutional accumulation.`),
  ]);

  // ── Bear Case ───────────────────────────────────────────────────────────────
  const bearCaseDetailed = compact([
    pe != null && pe > 30 ? fact(`Current P/E of ${pe.toFixed(1)}x demands consistent above-market earnings delivery. Valuation leaves limited margin of safety against an earnings miss or guidance reduction.`) : null,
    beta != null && beta > 1.3 ? fact(`Beta of ${beta.toFixed(2)} implies the stock is expected to fall ${Math.round(beta * 20)}% in a 20% broad market correction — amplifying drawdowns relative to diversified portfolios.`) : null,
    sellPct != null && sellPct > 15 ? fact(`${sellPct}% institutional analyst Sell rating reflects skepticism about whether current fundamentals justify the valuation.`) : null,
    debtEq != null && debtEq > 0.8 ? fact(`Debt-to-equity of ${debtEq.toFixed(2)}x introduces financial leverage risk. Rising interest rates or refinancing at higher yields would increase interest burden and reduce earnings.`) : null,
    revGrowth != null && revGrowth < 0.03 ? fact(`${revGrowth < 0 ? "Negative" : "Near-zero"} revenue growth of ${(revGrowth * 100).toFixed(1)}% TTM suggests limited top-line catalysts in the near term.`) : null,
    analysis(`The bear thesis centers on ${pe != null && pe > 30 ? "valuation risk — at current multiples, a growth deceleration or earnings disappointment could trigger significant re-rating. " : ""}${beta != null && beta > 1.3 ? "Elevated market sensitivity amplifies downside in risk-off environments. " : ""}Long-term investors should consider position sizing that accounts for potential drawdowns if the growth narrative fails to materialize.`),
  ]);

  // ── Financial Health ────────────────────────────────────────────────────────
  const financialHealth = compact([
    grossMargin != null ? fact(`Gross margin (TTM): ${grossMargin.toFixed(1)}%.`) : null,
    opMargin != null ? fact(`Operating margin (TTM): ${opMargin.toFixed(1)}%.`) : null,
    netMargin != null ? fact(`Net profit margin (TTM): ${netMargin.toFixed(1)}%.`) : null,
    roe != null ? fact(`Return on equity (ROE) TTM: ${roe.toFixed(1)}%.`) : null,
    roa != null ? fact(`Return on assets (ROA) TTM: ${roa.toFixed(1)}%.`) : null,
    debtEq != null ? fact(`Debt-to-equity ratio (Annual): ${debtEq.toFixed(2)}x.`) : null,
    currentRatio != null ? fact(`Current ratio (Annual): ${currentRatio.toFixed(2)}x. ${currentRatio > 2 ? "Comfortable short-term liquidity cushion." : currentRatio > 1 ? "Adequate near-term coverage of current liabilities." : "Current ratio below 1.0 may indicate liquidity pressure."}`) : null,
    divYield != null ? fact(`Annual dividend yield: ${divYield.toFixed(2)}%.`) : null,
    analysis(`${name}'s financial health appears ${opMargin != null && opMargin > 20 && (debtEq == null || debtEq < 1) ? "strong, with high operating margins and manageable leverage" : opMargin != null && opMargin > 10 ? "adequate, with positive operating economics and tolerable balance sheet risk" : "under scrutiny — margin compression or leverage warrants monitoring"}. ${netMargin != null && netMargin > 15 ? "High net margins indicate robust earnings conversion." : netMargin != null && netMargin > 5 ? "Net margins are positive but leave limited buffer for cost increases." : netMargin != null && netMargin <= 0 ? "Negative net margins mean the company is currently unprofitable on a reported basis." : ""} Investors should review the most recent quarterly filings for any off-balance-sheet obligations or non-recurring items not reflected in these trailing metrics.`),
  ]);

  // ── Valuation Observations ──────────────────────────────────────────────────
  const valuationObservations = compact([
    pe != null ? fact(`Price-to-Earnings (P/E) TTM: ${pe.toFixed(1)}x. ${pe > 40 ? "Elevated multiple pricing in strong future growth expectations." : pe > 20 ? "Above-average valuation relative to broad market historical norms (~15-17x)." : pe > 0 ? "Below-average valuation suggesting either a value opportunity or an earnings quality concern." : "Negative P/E indicates the company is currently reporting net losses."}`) : null,
    ps != null ? fact(`Price-to-Sales (P/S) TTM: ${ps.toFixed(1)}x.`) : null,
    pb != null ? fact(`Price-to-Book (P/B) Annual: ${pb.toFixed(1)}x.`) : null,
    weekHigh != null && weekLow != null && price > 0 ? fact(`52-week range: $${weekLow.toFixed(2)} – $${weekHigh.toFixed(2)}. Current price of $${price.toFixed(2)} is ${Math.round(((price - weekLow) / (weekHigh - weekLow)) * 100)}% of the way through that range.`) : null,
    eps != null && pe != null && revGrowth != null && revGrowth > 0 ? analysis(`A rough PEG-like view: at ${pe.toFixed(1)}x earnings with ${(revGrowth * 100).toFixed(1)}% revenue growth, the growth-adjusted multiple is approximately ${(pe / (revGrowth * 100)).toFixed(1)}x. ${pe / (revGrowth * 100) < 1 ? "Below 1.0 traditionally suggests the stock may be undervalued relative to its growth rate." : pe / (revGrowth * 100) > 2 ? "Above 2.0 may indicate the market is pricing in growth beyond what current trends support." : "Between 1.0–2.0 is consistent with fair-to-moderate valuation given the growth profile."}`) : null,
    analysis(`Valuation is inherently forward-looking. At current multiples, the market is pricing ${pe != null && pe > 30 ? `significant earnings growth ahead. Any slowdown in that trajectory carries downside re-rating risk` : pe != null && pe > 0 ? `modest-to-reasonable growth expectations, offering more margin of safety against earnings disappointments` : `a recovery in earnings, making the investment case binary on operational execution`}. Peer comparison and discounted cash flow analysis using management guidance are recommended for a complete picture.`),
  ]);

  // ── Final Thesis ────────────────────────────────────────────────────────────
  const finalThesis = compact([
    analysis(`${name} (${ticker}) is a ${mcapCat} ${industry} company with the following key investment characteristics: ${grossMargin != null ? `gross margin of ${grossMargin.toFixed(1)}%, ` : ""}${revGrowth != null ? `revenue growth of ${(revGrowth * 100).toFixed(1)}% TTM, ` : ""}${pe != null ? `trading at ${pe.toFixed(1)}x earnings, ` : ""}${buyPct != null ? `and ${buyPct}% analyst buy consensus.` : "insufficient analyst coverage data."}`),
    analysis(`Key variables to monitor: (1) Revenue growth trajectory — deceleration from current levels would pressure the growth premium in the multiple; (2) Margin evolution — operating leverage should drive margin expansion as the business scales; (3) Balance sheet health — leverage and liquidity in the context of rate environment and capex requirements; (4) Analyst sentiment revisions — upgrades and target increases are historically correlated with price momentum.`),
    analysis(`${ptMean != null ? `Sell-side consensus targets $${ptMean} (range $${ptLow}–$${ptHigh}), implying ${ptUpside != null ? `${ptUpside >= 0 ? "+" : ""}${ptUpside}%` : "some"} upside from current levels. These targets reflect analyst models, not guaranteed outcomes, and should be evaluated against the assumptions underlying each firm's thesis.` : "No consensus price target data is available from the provider."}`),
    analysis(`IMPORTANT: This analysis is generated algorithmically from market data provided by Finnhub and represents quantitative pattern recognition, not personalized investment advice. Past performance and analyst ratings are not guarantees of future results. All investments involve risk, including the possible loss of principal. Consult a qualified financial advisor before making investment decisions.`),
  ]);

  return {
    executiveSummary,
    businessModel,
    competitiveAdvantages,
    growthDrivers,
    risks,
    bullCaseDetailed,
    bearCaseDetailed,
    financialHealth,
    valuationObservations,
    finalThesis,
    generatedAt: new Date().toISOString(),
    disclaimer: "Generated from Finnhub market data. Not investment advice.",
  };
}

// ── Main Handler ──────────────────────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const t = ticker.toUpperCase();

  if (!KEY) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

  const [quote, profile, metrics, news, yahooChart, recommendations, priceTarget, earnings, peersRaw] =
    await Promise.all([
      fh(`/quote?symbol=${t}`),
      fh(`/stock/profile2?symbol=${t}`),
      fh(`/stock/metric?symbol=${t}&metric=all`),
      fhArr(`/company-news?symbol=${t}&from=${nDaysAgo(30)}&to=${today()}`),
      fetchYahooChart(t),
      fhArr(`/stock/recommendation?symbol=${t}`),
      fh(`/stock/price-target?symbol=${t}`),
      fhArr(`/stock/earnings?symbol=${t}&limit=8`),
      fhArr(`/stock/peers?symbol=${t}`),
    ]);

  if (!profile || !profile.name) {
    return NextResponse.json({ error: "Ticker not found" }, { status: 404 });
  }

  const m = (metrics as FHData & { metric?: FHData })?.metric ?? {};
  const q = quote ?? {};

  // ── Price history (Yahoo Finance) ─────────────────────────────────────────
  const priceHistory: { date: string; price: number; volume: number }[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const yResult = (yahooChart as any)?.chart?.result?.[0];
  if (yResult?.timestamp && yResult?.indicators?.quote?.[0]) {
    const { timestamp, indicators } = yResult;
    const { close, volume } = indicators.quote[0];
    (timestamp as number[]).forEach((ts, i) => {
      if ((close as (number | null)[])[i] != null) {
        priceHistory.push({
          date: new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          price: Math.round((close as number[])[i] * 100) / 100,
          volume: (volume as number[])[i] ?? 0,
        });
      }
    });
  }

  // ── Analyst recommendations ───────────────────────────────────────────────
  let analystRating: { buy: number; hold: number; sell: number; total: number } | null = null;
  if (recommendations.length > 0) {
    const r = recommendations[0];
    const buy  = ((r.buy as number) ?? 0) + ((r.strongBuy as number) ?? 0);
    const hold = (r.hold as number) ?? 0;
    const sell = ((r.sell as number) ?? 0) + ((r.strongSell as number) ?? 0);
    if (buy + hold + sell > 0) analystRating = { buy, hold, sell, total: buy + hold + sell };
  }

  // ── Price target ──────────────────────────────────────────────────────────
  let priceTargetData: { mean: number; high: number; low: number; median: number; upside: number | null } | null = null;
  if (priceTarget?.targetMean) {
    const mean   = Math.round((priceTarget.targetMean as number) * 100) / 100;
    const price  = (q.c as number) ?? 0;
    priceTargetData = {
      mean,
      high:   Math.round((priceTarget.targetHigh   as number) * 100) / 100,
      low:    Math.round((priceTarget.targetLow    as number) * 100) / 100,
      median: Math.round((priceTarget.targetMedian as number) * 100) / 100,
      upside: price > 0 ? Math.round(((mean - price) / price) * 1000) / 10 : null,
    };
  }

  // ── Quarterly EPS ─────────────────────────────────────────────────────────
  interface EarningsEntry { actual: number | null; estimate: number | null; quarter: number; year: number; }
  const quarterlyEPS: { quarter: string; actual: number | null; estimate: number }[] = [];
  if (earnings.length > 0) {
    const sorted = [...earnings]
      .sort((a, b) => {
        const ae = a as unknown as EarningsEntry;
        const be = b as unknown as EarningsEntry;
        return ae.year !== be.year ? ae.year - be.year : ae.quarter - be.quarter;
      })
      .slice(-8);
    sorted.forEach((e) => {
      const en = e as unknown as EarningsEntry;
      quarterlyEPS.push({
        quarter:  `Q${en.quarter} '${String(en.year).slice(2)}`,
        actual:   en.actual   != null ? Math.round(en.actual   * 100) / 100 : null,
        estimate: en.estimate != null ? Math.round(en.estimate * 100) / 100 : 0,
      });
    });
  }

  // ── Peers ─────────────────────────────────────────────────────────────────
  const peers: string[] = (peersRaw as unknown as string[])
    .filter((p) => typeof p === "string" && p !== t && p.length <= 5)
    .slice(0, 10);

  // ── Structured news ───────────────────────────────────────────────────────
  const newsItems = news.slice(0, 10).map((n) => ({
    headline: (n.headline as string) ?? "",
    source:   (n.source   as string) ?? "",
    datetime: (n.datetime as number) ?? 0,
    url:      (n.url      as string) ?? "",
    summary:  (n.summary  as string) ?? "",
  })).filter((n) => n.headline);

  // ── AI Report ─────────────────────────────────────────────────────────────
  const aiReport = buildAIReport(t, profile, q, m, recommendations, priceTarget, peers);

  // ── Final payload ─────────────────────────────────────────────────────────
  return NextResponse.json({
    name:        profile.name,
    ticker:      t,
    price:       q.c  ?? 0,
    change:      q.d  ?? 0,
    changePercent: q.dp ?? 0,
    marketCap:   formatLarge((profile.marketCapitalization as number) * 1_000_000),
    marketCapM:  profile.marketCapitalization ?? 0,
    sector:      profile.finnhubIndustry ?? "—",
    industry:    profile.finnhubIndustry ?? "—",
    founded:     profile.ipo ? (profile.ipo as string).slice(0, 4) : "—",
    employees:   profile.employeeTotal ? Number(profile.employeeTotal).toLocaleString() : "—",
    headquarters: profile.country ?? "—",
    exchange:    profile.exchange ?? "—",
    currency:    profile.currency ?? "USD",
    weburl:      profile.weburl  ?? "",
    logo:        profile.logo    ?? "",
    keyMetrics: {
      pe:             m.peBasicExclExtraTTM      ?? null,
      eps:            m.epsBasicExclExtraAnnual  ?? null,
      epsGrowth:      m.epsGrowthTTMYoy          ?? null,
      revenueGrowth:  m.revenueGrowthTTMYoy      ?? null,
      revenueGrowth3Y: m.revenueGrowth3Y         ?? null,
      grossMargin:    m.grossMarginTTM            ?? null,
      operatingMargin: m.operatingMarginTTM       ?? null,
      netMargin:      m.netProfitMarginTTM        ?? null,
      roe:            m.roeTTM                    ?? null,
      roa:            m.roaTTM                    ?? null,
      debtToEquity:   m.debtEquityAnnual          ?? null,
      currentRatio:   m.currentRatioAnnual        ?? null,
      dividendYield:  m.dividendYieldIndicatedAnnual ?? null,
      beta:           m.beta                      ?? null,
      fiftyTwoWeekHigh: m["52WeekHigh"]           ?? q.h ?? 0,
      fiftyTwoWeekLow:  m["52WeekLow"]            ?? q.l ?? 0,
      yearReturn:     m["52WeekPriceReturnDaily"]  ?? null,
      psTTM:          m.psTTM                     ?? null,
      pbAnnual:       m.pbAnnual                  ?? null,
    },
    openPrice:   q.o  ?? 0,
    dayHigh:     q.h  ?? 0,
    dayLow:      q.l  ?? 0,
    prevClose:   q.pc ?? 0,
    priceHistory,
    analystRating,
    priceTarget: priceTargetData,
    quarterlyEPS,
    peers,
    newsItems,
    // Legacy fields kept for backward compat
    recentNews: newsItems.slice(0, 5).map((n) => n.headline),
    bullCase:   buildBullCase(m as Record<string, number>, q as Record<string, number>, t),
    bearCase:   buildBearCase(m as Record<string, number>, q as Record<string, number>),
    aiReport,
  });
}

// ── Legacy helpers (kept for backward compat) ─────────────────────────────────

function buildBullCase(m: Record<string, number>, q: Record<string, number>, ticker: string): string[] {
  const pts: string[] = [];
  if (m.revenueGrowthTTMYoy && m.revenueGrowthTTMYoy > 0)
    pts.push(`Revenue growing ${(m.revenueGrowthTTMYoy * 100).toFixed(1)}% TTM — positive momentum in core business`);
  if (m.grossMarginTTM && m.grossMarginTTM > 40)
    pts.push(`High gross margin of ${m.grossMarginTTM.toFixed(1)}% signals strong pricing power and competitive moat`);
  if (m.roeTTM && m.roeTTM > 15)
    pts.push(`ROE of ${m.roeTTM.toFixed(1)}% demonstrates efficient capital deployment and shareholder value creation`);
  if (m.currentRatioAnnual && m.currentRatioAnnual > 1.5)
    pts.push(`Current ratio of ${m.currentRatioAnnual.toFixed(2)}x — healthy liquidity with comfortable short-term coverage`);
  if (m["52WeekHigh"] && q.c && q.c > m["52WeekHigh"] * 0.85)
    pts.push(`Price near 52-week high signals sustained institutional demand and positive price momentum`);
  if (m.dividendYieldIndicatedAnnual && m.dividendYieldIndicatedAnnual > 0)
    pts.push(`Dividend yield of ${m.dividendYieldIndicatedAnnual.toFixed(2)}% provides income floor and signals management confidence in cash flows`);
  if (pts.length < 3) pts.push(`${ticker} operates in a growing industry with potential for continued market share expansion`);
  if (pts.length < 4) pts.push("Monitor analyst upgrades and institutional buying activity for near-term catalysts");
  return pts.slice(0, 6);
}

function buildBearCase(m: Record<string, number>, q: Record<string, number>): string[] {
  const pts: string[] = [];
  if (m.peBasicExclExtraTTM && m.peBasicExclExtraTTM > 35)
    pts.push(`Elevated P/E of ${m.peBasicExclExtraTTM.toFixed(1)}x prices in significant future growth — any earnings miss could trigger a sharp re-rating`);
  if (m.debtEquityAnnual && m.debtEquityAnnual > 1)
    pts.push(`Debt/equity of ${m.debtEquityAnnual.toFixed(2)}x — financial leverage amplifies downside risk in a rising rate environment`);
  if (m.beta && m.beta > 1.4)
    pts.push(`High beta of ${m.beta.toFixed(2)} means the stock typically falls harder than the market during risk-off sell-offs`);
  if (m.revenueGrowthTTMYoy && m.revenueGrowthTTMYoy < 0)
    pts.push(`Revenue declining ${(Math.abs(m.revenueGrowthTTMYoy) * 100).toFixed(1)}% TTM — headwinds in core business need monitoring`);
  if (m["52WeekLow"] && q.c && q.c < m["52WeekLow"] * 1.15)
    pts.push("Trading near 52-week lows — price action suggests weak demand and possible further downside if support breaks");
  if (pts.length < 3) pts.push("Macro headwinds (interest rates, consumer sentiment) could weigh on near-term earnings");
  if (pts.length < 4) pts.push("Competitive threats and potential market disruption remain ongoing risks for long-term investors");
  return pts.slice(0, 5);
}
