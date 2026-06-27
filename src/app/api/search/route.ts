import { NextResponse } from "next/server";

const KEY = process.env.FINNHUB_API_KEY;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q || !KEY) return NextResponse.json({ results: [] });

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(q)}&token=${KEY}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return NextResponse.json({ results: [] });

    const data = await res.json() as {
      result?: { symbol: string; description: string; type: string }[];
    };

    const results = (data.result ?? [])
      .filter((r) =>
        r.type === "Common Stock" &&
        !r.symbol.includes(".") &&
        !r.symbol.includes("-") &&
        r.symbol.length <= 5
      )
      .slice(0, 8)
      .map((r) => ({ ticker: r.symbol, name: r.description }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
