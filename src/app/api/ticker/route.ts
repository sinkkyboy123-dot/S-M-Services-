import { NextResponse } from "next/server";

const FH_KEY  = process.env.FINNHUB_API_KEY!;
const YF_HDR  = { "User-Agent": "Mozilla/5.0 (compatible; SMServices/1.0)" };

export type TickerType = "index" | "vix" | "yield" | "dxy" | "stock" | "etf" | "crypto";

const SYMBOLS: { sym: string; display: string; type: TickerType }[] = [
  // Indices
  { sym: "^GSPC",    display: "S&P 500",  type: "index"  },
  { sym: "^IXIC",    display: "NASDAQ",   type: "index"  },
  { sym: "^DJI",     display: "DOW",      type: "index"  },
  { sym: "^RUT",     display: "RUT 2K",   type: "index"  },
  { sym: "^VIX",     display: "VIX",      type: "vix"    },
  { sym: "^TNX",     display: "10Y",      type: "yield"  },
  { sym: "DX-Y.NYB", display: "DXY",      type: "dxy"    },
  // Mega-cap tech
  { sym: "NVDA",     display: "NVDA",     type: "stock"  },
  { sym: "MSFT",     display: "MSFT",     type: "stock"  },
  { sym: "AAPL",     display: "AAPL",     type: "stock"  },
  { sym: "AMZN",     display: "AMZN",     type: "stock"  },
  { sym: "GOOGL",    display: "GOOGL",    type: "stock"  },
  { sym: "META",     display: "META",     type: "stock"  },
  { sym: "AVGO",     display: "AVGO",     type: "stock"  },
  { sym: "TSLA",     display: "TSLA",     type: "stock"  },
  { sym: "NFLX",     display: "NFLX",     type: "stock"  },
  { sym: "AMD",      display: "AMD",      type: "stock"  },
  // Financials
  { sym: "JPM",      display: "JPM",      type: "stock"  },
  { sym: "GS",       display: "GS",       type: "stock"  },
  { sym: "BAC",      display: "BAC",      type: "stock"  },
  { sym: "V",        display: "V",        type: "stock"  },
  { sym: "MA",       display: "MA",       type: "stock"  },
  // Healthcare
  { sym: "LLY",      display: "LLY",      type: "stock"  },
  { sym: "UNH",      display: "UNH",      type: "stock"  },
  // Energy
  { sym: "XOM",      display: "XOM",      type: "stock"  },
  { sym: "CVX",      display: "CVX",      type: "stock"  },
  // ETFs
  { sym: "SPY",      display: "SPY",      type: "etf"    },
  { sym: "QQQ",      display: "QQQ",      type: "etf"    },
  { sym: "VOO",      display: "VOO",      type: "etf"    },
  { sym: "SCHD",     display: "SCHD",     type: "etf"    },
  { sym: "IWM",      display: "IWM",      type: "etf"    },
  // Crypto
  { sym: "BTC-USD",  display: "BTC",      type: "crypto" },
  { sym: "ETH-USD",  display: "ETH",      type: "crypto" },
];

export interface TickerItem {
  sym:        string;
  display:    string;
  type:       TickerType;
  price:      number;
  change:     number;
  changePct:  number;
  sparkline:  number[];
}

async function fetchSymbol(sym: string): Promise<TickerItem | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=5d`;
    const res = await fetch(url, { headers: YF_HDR, next: { revalidate: 60 } });
    if (!res.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await res.json() as any;
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const meta       = result.meta ?? {};
    const price: number = meta.regularMarketPrice ?? 0;
    const prevClose: number = meta.previousClose ?? meta.chartPreviousClose ?? price;
    const change    = price - prevClose;
    const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;

    // Sparkline: last 5 daily closes
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];
    const sparkline = closes.filter((c): c is number => c != null).slice(-5);

    const cfg = SYMBOLS.find(s => s.sym === sym)!;
    return { sym, display: cfg.display, type: cfg.type, price, change, changePct, sparkline };
  } catch {
    return null;
  }
}

const NEWS_SYMBOLS = ["NVDA", "AAPL", "MSFT", "AMZN", "META", "TSLA", "GOOGL", "JPM", "AMD", "NFLX"];

async function fetchNews(): Promise<string[]> {
  const today   = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);

  const results = await Promise.all(
    NEWS_SYMBOLS.map(async (sym) => {
      try {
        const res = await fetch(
          `https://finnhub.io/api/v1/company-news?symbol=${sym}&from=${weekAgo}&to=${today}&token=${FH_KEY}`,
          { next: { revalidate: 300 } }
        );
        if (!res.ok) return [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await res.json() as any[];
        if (!Array.isArray(data)) return [];
        return data
          .slice(0, 3)
          .map((n) => {
            const headline = (n.headline as string) ?? "";
            return headline ? `${sym}: ${headline}` : "";
          })
          .filter(Boolean);
      } catch {
        return [];
      }
    })
  );

  // Flatten, deduplicate, shuffle for variety
  const all = results.flat() as string[];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.slice(0, 30);
}

export async function GET() {
  const [results, headlines] = await Promise.all([
    Promise.all(SYMBOLS.map(s => fetchSymbol(s.sym))),
    fetchNews(),
  ]);

  const items: TickerItem[] = results.filter((r): r is TickerItem => r !== null);

  return NextResponse.json({ items, headlines, ts: Date.now() });
}
