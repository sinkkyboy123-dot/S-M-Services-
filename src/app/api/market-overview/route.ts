import { NextResponse } from "next/server";

const KEY = process.env.FINNHUB_API_KEY!;
const BASE = "https://finnhub.io/api/v1";

const TRENDING = ["AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL"];
const TRENDING_NAMES: Record<string, string> = {
  AAPL: "Apple", MSFT: "Microsoft", NVDA: "NVIDIA",
  AMZN: "Amazon", META: "Meta", GOOGL: "Alphabet",
};


const SECTORS = [
  { ticker: "XLK", name: "Technology" },
  { ticker: "XLF", name: "Financials" },
  { ticker: "XLV", name: "Healthcare" },
  { ticker: "XLI", name: "Industrials" },
  { ticker: "XLY", name: "Consumer" },
  { ticker: "XLE", name: "Energy" },
  { ticker: "XLU", name: "Utilities" },
  { ticker: "XLB", name: "Materials" },
  { ticker: "XLC", name: "Comm Svcs" },
];

interface YahooQuote {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
}

async function yahooScreener(scrId: "day_gainers" | "day_losers", count = 6) {
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&scrIds=${scrId}&count=${count}&region=US&lang=en-US`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SMServices/1.0)" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json() as { finance?: { result?: Array<{ quotes?: YahooQuote[] }> } };
    const quotes = data?.finance?.result?.[0]?.quotes ?? [];
    return quotes.map((q) => ({
      ticker: q.symbol,
      name: q.shortName ?? q.longName ?? q.symbol,
      price: q.regularMarketPrice ?? null,
      change: q.regularMarketChange ?? null,
      changePct: q.regularMarketChangePercent ?? null,
    }));
  } catch { return []; }
}

async function fhQuote(ticker: string) {
  try {
    const res = await fetch(`${BASE}/quote?symbol=${ticker}&token=${KEY}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json() as Promise<{ c: number; d: number; dp: number; h: number; l: number; o: number; pc: number } | null>;
  } catch { return null; }
}

async function fhNews() {
  try {
    const res = await fetch(`${BASE}/news?category=general&minId=0&token=${KEY}`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json() as Array<{ headline: string; source: string; datetime: number; url: string; summary: string }>;
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

async function yahooIndexQuote(symbol: string) {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`,
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; SMServices/1.0)" }, next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const data = await res.json() as { chart?: { result?: Array<{ indicators: { quote: Array<{ close: (number | null)[] }> } }> } };
    const result = data?.chart?.result?.[0];
    const close = result?.indicators?.quote?.[0]?.close;
    if (!close || close.length < 2) return null;
    const current = close[close.length - 1];
    const previous = close[close.length - 2];
    if (current == null || previous == null) return null;
    const change = current - previous;
    const changePct = (change / previous) * 100;
    return { value: current, change, changePct };
  } catch { return null; }
}

export async function GET() {
  const [trendingQuotes, gainers, losers, sectorQuotes, newsRaw, spxData, ixicData, vixData] =
    await Promise.all([
      Promise.all(TRENDING.map((t) => fhQuote(t))),
      yahooScreener("day_gainers", 6),
      yahooScreener("day_losers", 6),
      Promise.all(SECTORS.map((s) => fhQuote(s.ticker))),
      fhNews(),
      yahooIndexQuote("^GSPC"),
      yahooIndexQuote("^IXIC"),
      yahooIndexQuote("^VIX"),
    ]);

  const trending = TRENDING.map((ticker, i) => ({
    ticker,
    name: TRENDING_NAMES[ticker] ?? ticker,
    price: trendingQuotes[i]?.c ?? null,
    change: trendingQuotes[i]?.d ?? null,
    changePct: trendingQuotes[i]?.dp ?? null,
  }));

  const sectors = SECTORS.map((s, i) => ({
    name: s.name,
    ticker: s.ticker,
    changePct: sectorQuotes[i]?.dp ?? null,
    price: sectorQuotes[i]?.c ?? null,
  }));

  const news = newsRaw.slice(0, 8).map((n) => ({
    headline: n.headline,
    source: n.source,
    datetime: n.datetime,
    url: n.url,
    summary: n.summary,
  }));

  const indices = [
    { name: "S&P 500", value: spxData?.value ?? null, change: spxData?.change ?? null, changePct: spxData?.changePct ?? null },
    { name: "NASDAQ",  value: ixicData?.value ?? null, change: ixicData?.change ?? null, changePct: ixicData?.changePct ?? null },
    { name: "VIX",     value: vixData?.value ?? null, change: vixData?.change ?? null, changePct: vixData?.changePct ?? null },
  ];

  return NextResponse.json({ trending, gainers, losers, sectors, news, indices });
}
