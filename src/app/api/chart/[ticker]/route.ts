import { NextResponse } from "next/server";

interface RangeCfg { interval: string; range: string; revalidate: number }

const CFG: Record<string, RangeCfg> = {
  "1D":  { interval: "5m",  range: "1d",   revalidate: 60 },
  "5D":  { interval: "15m", range: "5d",   revalidate: 60 },
  "1M":  { interval: "1d",  range: "1mo",  revalidate: 300 },
  "3M":  { interval: "1d",  range: "3mo",  revalidate: 300 },
  "6M":  { interval: "1d",  range: "6mo",  revalidate: 300 },
  "YTD": { interval: "1d",  range: "ytd",  revalidate: 300 },
  "1Y":  { interval: "1d",  range: "1y",   revalidate: 300 },
  "5Y":  { interval: "1wk", range: "5y",   revalidate: 3600 },
  "MAX": { interval: "1mo", range: "max",  revalidate: 3600 },
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const t = ticker.toUpperCase();
  const r = new URL(req.url).searchParams.get("range") ?? "1Y";
  const cfg = CFG[r] ?? CFG["1Y"];

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${t}?interval=${cfg.interval}&range=${cfg.range}`,
      {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; SMServices/1.0)" },
        next: { revalidate: cfg.revalidate },
      }
    );
    if (!res.ok) return NextResponse.json({ error: "upstream_error" }, { status: 502 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await res.json() as any;
    const result = data?.chart?.result?.[0];
    if (!result) return NextResponse.json({ error: "no_data" }, { status: 404 });

    const ts: number[]       = result.timestamp ?? [];
    const q                   = result.indicators?.quote?.[0] ?? {};
    const open:   (number|null)[] = q.open   ?? [];
    const high:   (number|null)[] = q.high   ?? [];
    const low:    (number|null)[] = q.low    ?? [];
    const close:  (number|null)[] = q.close  ?? [];
    const volume: (number|null)[] = q.volume ?? [];

    const bars = ts.reduce<{ time: number; open: number; high: number; low: number; close: number; volume: number }[]>((acc, time, i) => {
      const c = close[i];
      if (c == null) return acc;
      acc.push({
        time,
        open:   open[i]   ?? c,
        high:   high[i]   ?? c,
        low:    low[i]    ?? c,
        close:  c,
        volume: volume[i] ?? 0,
      });
      return acc;
    }, []);

    return NextResponse.json({ bars, interval: cfg.interval });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
