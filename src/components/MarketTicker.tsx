"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import type { TickerItem, TickerType } from "@/app/api/ticker/route";

// ── Market status ──────────────────────────────────────────────────────────────
type MarketStatus = "OPEN" | "PRE-MARKET" | "AFTER-HOURS" | "CLOSED";

function getMarketStatus(): MarketStatus {
  const et   = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day  = et.getDay();
  const mins = et.getHours() * 60 + et.getMinutes();
  if (day === 0 || day === 6)           return "CLOSED";
  if (mins < 240)                       return "CLOSED";      // before 4 AM
  if (mins < 570)                       return "PRE-MARKET";  // 4:00–9:30
  if (mins < 960)                       return "OPEN";        // 9:30–16:00
  if (mins < 1200)                      return "AFTER-HOURS"; // 16:00–20:00
  return "CLOSED";
}

// ── Price formatting ───────────────────────────────────────────────────────────
function fmtPrice(price: number, type: TickerType): string {
  if (type === "yield")  return `${price.toFixed(2)}%`;
  if (type === "vix")    return price.toFixed(2);
  if (type === "dxy")    return price.toFixed(2);
  if (type === "index")  return price >= 10000
    ? price.toLocaleString("en-US", { maximumFractionDigits: 0 })
    : price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (type === "crypto") return `$${price.toLocaleString("en-US", { maximumFractionDigits: price >= 1000 ? 0 : 2 })}`;
  return `$${price.toFixed(2)}`;
}

function fmtChange(change: number, type: TickerType): string {
  const abs = Math.abs(change);
  const sign = change >= 0 ? "+" : "−";
  if (type === "yield" || type === "vix" || type === "dxy" || type === "index") {
    return `${sign}${abs.toFixed(2)}`;
  }
  if (type === "crypto") return `${sign}$${abs >= 1000 ? abs.toLocaleString("en-US", { maximumFractionDigits: 0 }) : abs.toFixed(2)}`;
  return `${sign}$${abs.toFixed(2)}`;
}

// ── Inline SVG sparkline ───────────────────────────────────────────────────────
function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  if (data.length < 2) return null;
  const min   = Math.min(...data);
  const max   = Math.max(...data);
  const range = max - min || 1;
  const W = 44, H = 18;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const color = up ? "#22c55e" : "#ef4444";
  const fillId = `sf-${up ? "g" : "r"}`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="opacity-80">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0"    />
        </linearGradient>
      </defs>
      <polyline
        points={`0,${H} ${pts} ${W},${H}`}
        fill={`url(#${fillId})`}
        stroke="none"
      />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Type badge label ───────────────────────────────────────────────────────────
function typeBadge(type: TickerType): string | null {
  if (type === "index" || type === "vix" || type === "yield" || type === "dxy") return "IDX";
  if (type === "etf")    return "ETF";
  if (type === "crypto") return "CRYPTO";
  return null;
}

// ── Href for click-through ─────────────────────────────────────────────────────
function itemHref(item: TickerItem): string | null {
  if (item.type === "stock" || item.type === "etf") return `/research/${item.sym}`;
  return null;
}

// ── Single ticker item ─────────────────────────────────────────────────────────
function TickerItemCard({ item }: { item: TickerItem }) {
  const up    = item.change >= 0;
  const color = up ? "text-emerald-400" : "text-red-400";
  const glow  = up ? "drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]" : "drop-shadow-[0_0_4px_rgba(248,113,113,0.5)]";
  const badge = typeBadge(item.type);
  const href  = itemHref(item);

  const inner = (
    <div className="flex items-center gap-2.5 px-5 cursor-default select-none group">
      {/* Symbol + optional type badge */}
      <div className="flex items-center gap-1.5">
        <span className="text-[12px] font-bold text-white font-mono tracking-wide group-hover:text-white/90 transition-colors">
          {item.display}
        </span>
        {badge && (
          <span className="text-[8px] font-bold text-white/25 tracking-widest uppercase leading-none pt-px">
            {badge}
          </span>
        )}
      </div>

      {/* Price */}
      <span className="text-[12px] font-mono text-white/85 tabular-nums">
        {fmtPrice(item.price, item.type)}
      </span>

      {/* Arrow + change + pct */}
      <div className={`flex items-center gap-1 ${color} ${glow}`}>
        <span className="text-[11px] font-bold leading-none">{up ? "▲" : "▼"}</span>
        <span className="text-[11px] font-mono tabular-nums font-semibold">
          {fmtChange(item.change, item.type)}
        </span>
        <span className="text-[11px] font-mono tabular-nums font-medium opacity-80">
          ({up ? "+" : "−"}{Math.abs(item.changePct).toFixed(2)}%)
        </span>
      </div>

      {/* Sparkline */}
      {item.sparkline.length >= 2 && (
        <Sparkline data={item.sparkline} up={up} />
      )}

      {/* Separator */}
      <span className="text-white/10 text-sm font-light ml-1">|</span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex hover:bg-white/5 rounded transition-colors">
        {inner}
      </Link>
    );
  }
  return <div className="inline-flex">{inner}</div>;
}

// ── Status badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: MarketStatus }) {
  const cfg: Record<MarketStatus, { color: string; bg: string; label: string }> = {
    "OPEN":        { color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", label: "OPEN"       },
    "PRE-MARKET":  { color: "text-amber-400",   bg: "bg-amber-400/10 border-amber-400/20",     label: "PRE-MKT"   },
    "AFTER-HOURS": { color: "text-sky-400",     bg: "bg-sky-400/10 border-sky-400/20",         label: "AH"        },
    "CLOSED":      { color: "text-white/30",    bg: "bg-white/5 border-white/10",              label: "CLOSED"    },
  };
  const c = cfg[status];
  return (
    <span className={`text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded border ${c.color} ${c.bg}`}>
      {c.label}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function MarketTicker() {
  const [items, setItems]         = useState<TickerItem[]>([]);
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [status, setStatus]       = useState<MarketStatus>("CLOSED");
  const [lastUpdate, setLastUpdate] = useState("");
  const [tickerPaused, setTickerPaused]   = useState(false);
  const [newsPaused, setNewsPaused]       = useState(false);
  const [loaded, setLoaded]       = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res  = await fetch("/api/ticker", { cache: "no-store" });
      const json = await res.json() as { items: TickerItem[]; headlines: string[] };
      if (json.items?.length)     setItems(json.items);
      if (json.headlines?.length) setHeadlines(json.headlines);
      setLastUpdate(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
      setLoaded(true);
    } catch {
      /* silent — keep showing last data */
    }
  }, []);

  // Initial fetch + 30s polling; pauses when tab is hidden
  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 30_000);

    const onVisibility = () => {
      if (document.hidden) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        fetchData();
        intervalRef.current = setInterval(fetchData, 30_000);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchData]);

  // Market status; recalculate every minute
  useEffect(() => {
    setStatus(getMarketStatus());
    const id = setInterval(() => setStatus(getMarketStatus()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!loaded) {
    // Skeleton — keeps layout from jumping
    return (
      <div className="bg-[#020817] border-b border-white/5 h-[60px] flex items-center px-4 gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <div className="h-3 w-24 rounded bg-white/10 animate-pulse" />
        <div className="h-3 w-48 rounded bg-white/5 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-[#020817] border-b border-white/5 overflow-hidden">

      {/* ── Row 1: Price ticker ──────────────────────────────────────────── */}
      <div className="flex items-center h-10 border-b border-white/5">

        {/* Left panel: LIVE + status */}
        <div
          className="flex-shrink-0 flex items-center gap-2.5 px-4 border-r border-white/10 h-full"
          style={{ background: "linear-gradient(90deg,#020817 80%,transparent)" }}
        >
          {/* LIVE badge */}
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-500"
              style={{ animation: "live-pulse 1.8s ease-in-out infinite" }}
            />
            <span className="text-[9px] font-bold text-white/60 tracking-[0.2em] uppercase">LIVE</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <StatusBadge status={status} />
        </div>

        {/* Scrolling price track */}
        <div
          className="flex-1 overflow-hidden relative h-full"
          onMouseEnter={() => setTickerPaused(true)}
          onMouseLeave={() => setTickerPaused(false)}
        >
          {/* Left/right fade masks */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 z-10"
            style={{ background: "linear-gradient(90deg,#020817,transparent)" }} />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 z-10"
            style={{ background: "linear-gradient(270deg,#020817,transparent)" }} />

          <div
            className="flex items-center h-full"
            style={{
              animation:          "ticker-scroll 90s linear infinite",
              animationPlayState: tickerPaused ? "paused" : "running",
              willChange:         "transform",
              width:              "max-content",
            }}
          >
            {/* Duplicated for seamless loop */}
            {[...items, ...items].map((item, i) => (
              <TickerItemCard key={`${item.sym}-${i}`} item={item} />
            ))}
          </div>
        </div>

        {/* Right panel: timestamp */}
        <div className="flex-shrink-0 px-4 border-l border-white/10 h-full flex items-center gap-2">
          <span className="text-[9px] font-mono text-white/25 tabular-nums">{lastUpdate} ET</span>
        </div>
      </div>

      {/* ── Row 2: News headline ticker ──────────────────────────────────── */}
      {headlines.length > 0 && (
        <div className="flex items-center h-[26px]">
          {/* Label */}
          <div className="flex-shrink-0 flex items-center h-full px-3 border-r border-white/10"
            style={{ background: "#B91C1C" }}>
            <span className="text-[9px] font-black text-white tracking-[0.15em] uppercase">
              NEWS
            </span>
          </div>

          {/* Scrolling headlines */}
          <div
            className="flex-1 overflow-hidden relative h-full flex items-center"
            onMouseEnter={() => setNewsPaused(true)}
            onMouseLeave={() => setNewsPaused(false)}
          >
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-10"
              style={{ background: "linear-gradient(90deg,#020817,transparent)" }} />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-10"
              style={{ background: "linear-gradient(270deg,#020817,transparent)" }} />

            <div
              className="flex items-center"
              style={{
                animation:          "ticker-scroll-slow 180s linear infinite",
                animationPlayState: newsPaused ? "paused" : "running",
                willChange:         "transform",
                width:              "max-content",
              }}
            >
              {[...headlines, ...headlines].map((h, i) => (
                <span key={i} className="flex items-center whitespace-nowrap">
                  <span className="text-[10px] text-white/50 px-8 leading-none tracking-wide">{h}</span>
                  <span className="text-white/15 text-[8px]">◆</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
