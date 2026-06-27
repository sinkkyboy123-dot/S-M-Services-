"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Maximize2, Minimize2, RotateCcw, X, Plus, ChevronDown } from "lucide-react";
import clsx from "clsx";

// ── Types ─────────────────────────────────────────────────────────────────────
type Range     = "1D" | "5D" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "5Y" | "MAX";
type ChartMode = "Line" | "Candlestick" | "Area";

interface Bar {
  time: number;
  open: number; high: number; low: number; close: number;
  volume: number;
}

interface Tooltip {
  date: string;
  open: string; high: string; low: string; close: string;
  volume: string; change: string; changePct: string;
  up: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const RANGES: Range[]     = ["1D", "5D", "1M", "3M", "6M", "YTD", "1Y", "5Y", "MAX"];
const MODES: ChartMode[]  = ["Line", "Candlestick", "Area"];
const G = "#0B5D3B";
const R = "#EF4444";

function fmtVol(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toString();
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function StockChart({ ticker }: { ticker: string }) {
  // DOM refs
  const wrapRef  = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);

  // lightweight-charts refs (typed as any — dynamically imported)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef  = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mainSRef  = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const volSRef   = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cmpSRef   = useRef<any>(null);

  // Mutable data refs
  const cacheRef      = useRef<Map<string, Bar[]>>(new Map());
  const barsRef       = useRef<Bar[]>([]);
  const barMapRef     = useRef<Map<number, number>>(new Map());  // time → index
  const cmpBarsRef    = useRef<Bar[]>([]);
  const rangeRef      = useRef<Range>("1Y");
  const modeRef       = useRef<ChartMode>("Line");
  const cmpTickerRef  = useRef<string>("");
  const cmpActiveRef  = useRef<boolean>(false);

  // UI state
  const [range, setRange]               = useState<Range>("1Y");
  const [mode, setMode]                 = useState<ChartMode>("Line");
  const [loading, setLoading]           = useState(true);
  const [fullscreen, setFullscreen]     = useState(false);
  const [showCmpInput, setShowCmpInput] = useState(false);
  const [cmpInput, setCmpInput]         = useState("");
  const [cmpLabel, setCmpLabel]         = useState("");
  const [modeOpen, setModeOpen]         = useState(false);
  const [tooltip, setTooltip]           = useState<Tooltip | null>(null);

  // ── Internal helpers ─────────────────────────────────────────────────────────

  async function fetchBars(sym: string, r: Range): Promise<Bar[]> {
    const key = `${sym}:${r}`;
    if (cacheRef.current.has(key)) return cacheRef.current.get(key)!;
    const res  = await fetch(`/api/chart/${sym}?range=${r}`);
    const json = await res.json() as { bars?: Bar[] };
    const bars = json.bars ?? [];
    cacheRef.current.set(key, bars);
    return bars;
  }

  async function buildMainSeries(bars: Bar[], chartMode: ChartMode, compare: boolean) {
    const c = chartRef.current;
    if (!c) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lc = await import("lightweight-charts") as any;

    if (mainSRef.current) { c.removeSeries(mainSRef.current); mainSRef.current = null; }

    if (compare) {
      const base = bars[0]?.close ?? 1;
      const data = bars.map(b => ({ time: b.time, value: +((b.close / base - 1) * 100).toFixed(4) }));
      const s = c.addLineSeries({
        color: G, lineWidth: 2,
        lastValueVisible: false, priceLineVisible: false,
        crosshairMarkerVisible: true, crosshairMarkerRadius: 4,
        priceFormat: { type: "custom", formatter: (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%` },
      });
      s.setData(data);
      mainSRef.current = s;
      return;
    }

    if (chartMode === "Candlestick") {
      const s = c.addCandlestickSeries({
        upColor: G, downColor: R,
        borderUpColor: G, borderDownColor: R,
        wickUpColor: G, wickDownColor: R,
        lastValueVisible: true, priceLineVisible: true,
      });
      s.setData(bars.map(b => ({ time: b.time, open: b.open, high: b.high, low: b.low, close: b.close })));
      mainSRef.current = s;
    } else if (chartMode === "Area") {
      const s = c.addAreaSeries({
        lineColor: G, topColor: `${G}28`, bottomColor: `${G}00`,
        lineWidth: 2, lastValueVisible: true, priceLineVisible: true,
        crosshairMarkerVisible: true, crosshairMarkerRadius: 4,
      });
      s.setData(bars.map(b => ({ time: b.time, value: b.close })));
      mainSRef.current = s;
    } else {
      const s = c.addLineSeries({
        color: G, lineWidth: 2,
        lastValueVisible: true, priceLineVisible: true,
        crosshairMarkerVisible: true, crosshairMarkerRadius: 4,
      });
      s.setData(bars.map(b => ({ time: b.time, value: b.close })));
      mainSRef.current = s;
    }
    void lc; // suppress unused warning
  }

  async function buildCompareSeries(bars: Bar[]) {
    const c = chartRef.current;
    if (!c || !bars.length) return;
    if (cmpSRef.current) { c.removeSeries(cmpSRef.current); cmpSRef.current = null; }
    const base = bars[0].close;
    const data = bars.map(b => ({ time: b.time, value: +((b.close / base - 1) * 100).toFixed(4) }));
    const s = c.addLineSeries({
      color: "#2563EB", lineWidth: 2,
      lastValueVisible: false, priceLineVisible: false,
      crosshairMarkerVisible: true, crosshairMarkerRadius: 4,
      priceFormat: { type: "custom", formatter: (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%` },
    });
    s.setData(data);
    cmpSRef.current = s;
  }

  function updateVolume(bars: Bar[]) {
    if (!volSRef.current) return;
    volSRef.current.setData(bars.map(b => ({
      time: b.time, value: b.volume,
      color: b.close >= b.open ? "#0B5D3B2A" : "#EF44442A",
    })));
  }

  function rebuildBarMap(bars: Bar[]) {
    const m = new Map<number, number>();
    bars.forEach((b, i) => m.set(b.time, i));
    barMapRef.current = m;
  }

  async function loadRange(r: Range) {
    setLoading(true);
    setTooltip(null);

    const bars = await fetchBars(ticker, r);
    barsRef.current  = bars;
    rangeRef.current = r;
    rebuildBarMap(bars);

    await buildMainSeries(bars, modeRef.current, cmpActiveRef.current);
    updateVolume(bars);

    if (cmpActiveRef.current) {
      const cmpBars = await fetchBars(cmpTickerRef.current, r);
      cmpBarsRef.current = cmpBars;
      await buildCompareSeries(cmpBars);
    }

    chartRef.current?.timeScale().fitContent();
    setLoading(false);
  }

  // ── Init chart (once on mount) ───────────────────────────────────────────────
  useEffect(() => {
    if (!mountRef.current) return;
    let dead = false;

    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lc = await import("lightweight-charts") as any;
      if (dead || !mountRef.current) return;

      const c = lc.createChart(mountRef.current, {
        width:  mountRef.current.clientWidth,
        height: 420,
        layout: {
          background: { type: lc.ColorType.Solid, color: "#ffffff" },
          textColor: "#374151",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: "#F3F4F6" },
          horzLines: { color: "#F3F4F6" },
        },
        crosshair: { mode: lc.CrosshairMode.Normal },
        timeScale: {
          borderColor: "#E5E7EB",
          timeVisible: true,
          secondsVisible: false,
          rightOffset: 10,
          fixLeftEdge: false,
          fixRightEdge: false,
        },
        rightPriceScale: {
          borderColor: "#E5E7EB",
          scaleMargins: { top: 0.05, bottom: 0.2 },
        },
        handleScroll: true,
        handleScale:  true,
      });
      chartRef.current = c;

      // Volume series (occupies bottom 18% of chart area)
      const vs = c.addHistogramSeries({
        priceFormat: { type: "volume" },
        priceScaleId: "vol",
        lastValueVisible: false,
        priceLineVisible: false,
      });
      c.priceScale("vol").applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 },
        visible: false,
      });
      volSRef.current = vs;

      // Crosshair tooltip (subscribe once; uses refs for fresh data)
      c.subscribeCrosshairMove((param: any) => {
        if (!param.time || !param.point) { setTooltip(null); return; }
        const idx = barMapRef.current.get(param.time as number);
        if (idx == null) { setTooltip(null); return; }
        const bar  = barsRef.current[idx];
        const prev = barsRef.current[idx - 1];
        if (!bar) { setTooltip(null); return; }

        const chg    = prev ? bar.close - prev.close : 0;
        const chgPct = prev && prev.close > 0 ? (chg / prev.close) * 100 : 0;
        const intraday = ["1D", "5D"].includes(rangeRef.current);
        const d = new Date(bar.time * 1000);
        const dateStr = intraday
          ? d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
          : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

        setTooltip({
          date:      dateStr,
          open:      bar.open.toFixed(2),
          high:      bar.high.toFixed(2),
          low:       bar.low.toFixed(2),
          close:     bar.close.toFixed(2),
          volume:    fmtVol(bar.volume),
          change:    `${chg >= 0 ? "+" : ""}${chg.toFixed(2)}`,
          changePct: `${chgPct >= 0 ? "+" : ""}${chgPct.toFixed(2)}%`,
          up:        chg >= 0,
        });
      });

      // Resize observer
      const ro = new ResizeObserver(() => {
        if (mountRef.current && chartRef.current) {
          chartRef.current.applyOptions({ width: mountRef.current.clientWidth });
        }
      });
      ro.observe(mountRef.current);

      await loadRange("1Y");

      if (dead) { ro.disconnect(); return; }
      return () => ro.disconnect();
    })().catch(console.error);

    return () => {
      dead = true;
      chartRef.current?.remove();
      chartRef.current = null;
      mainSRef.current = null;
      volSRef.current  = null;
      cmpSRef.current  = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fullscreen event listener ─────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ── Event handlers ────────────────────────────────────────────────────────────

  async function handleRangeChange(r: Range) {
    setRange(r);
    await loadRange(r);
  }

  async function handleModeChange(m: ChartMode) {
    setMode(m);
    modeRef.current = m;
    setModeOpen(false);
    if (!barsRef.current.length || cmpActiveRef.current) return;
    await buildMainSeries(barsRef.current, m, false);
  }

  async function handleCompareSubmit() {
    const sym = cmpInput.trim().toUpperCase();
    if (!sym || sym === ticker) return;
    cmpTickerRef.current = sym;
    cmpActiveRef.current = true;

    // Switch main series to % change
    await buildMainSeries(barsRef.current, modeRef.current, true);

    setLoading(true);
    const cmpBars = await fetchBars(sym, rangeRef.current);
    cmpBarsRef.current = cmpBars;
    await buildCompareSeries(cmpBars);
    setLoading(false);

    setCmpLabel(sym);
    setShowCmpInput(false);
  }

  async function handleRemoveCompare() {
    cmpActiveRef.current = false;
    cmpBarsRef.current   = [];
    cmpTickerRef.current = "";
    if (cmpSRef.current) { chartRef.current?.removeSeries(cmpSRef.current); cmpSRef.current = null; }
    setCmpLabel("");
    setCmpInput("");
    await buildMainSeries(barsRef.current, modeRef.current, false);
  }

  function handleFullscreen() {
    if (!wrapRef.current) return;
    if (!document.fullscreenElement) {
      wrapRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  function handleDownload() {
    if (!chartRef.current) return;
    const canvas = chartRef.current.takeScreenshot() as HTMLCanvasElement;
    const a = document.createElement("a");
    a.href     = canvas.toDataURL("image/png");
    a.download = `${ticker}-${rangeRef.current}-chart.png`;
    a.click();
  }

  function handleReset() {
    chartRef.current?.timeScale().fitContent();
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div ref={wrapRef} className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm overflow-hidden">

      {/* ── Controls header ──────────────────────────────────────────────────── */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">

          {/* Title + compare label */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider flex-shrink-0">
              Price Chart
            </span>
            {cmpLabel && (
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-px bg-[#E5E7EB]" />
                <span className="text-[10px] font-bold text-[#0B5D3B]">{ticker}</span>
                <span className="text-[10px] text-[#9CA3AF]">vs</span>
                <span className="text-[10px] font-bold text-[#2563EB]">{cmpLabel}</span>
                <button onClick={handleRemoveCompare}
                  className="text-[#C4C9D1] hover:text-red-500 transition-colors ml-0.5">
                  <X size={10} />
                </button>
              </div>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0">

            {/* Chart type */}
            <div className="relative">
              <button
                onClick={() => setModeOpen(p => !p)}
                className="flex items-center gap-1 text-[11px] font-medium text-[#374151] px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] hover:border-[#0B5D3B]/40 hover:bg-[#F0F7F4] transition-all"
              >
                {mode} <ChevronDown size={10} />
              </button>
              {modeOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-[#E5E7EB] rounded-xl shadow-xl z-50 py-1.5 min-w-[130px]">
                  {MODES.map(m => (
                    <button key={m} onClick={() => handleModeChange(m)}
                      className={clsx(
                        "w-full text-left text-[11px] px-3.5 py-2 hover:bg-[#F0F7F4] transition-colors",
                        m === mode ? "text-[#0B5D3B] font-semibold" : "text-[#374151]"
                      )}>
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Compare */}
            <button
              onClick={() => setShowCmpInput(p => !p)}
              className={clsx(
                "flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-all",
                (showCmpInput || cmpLabel)
                  ? "bg-[#EFF6FF] border-[#2563EB]/30 text-[#2563EB]"
                  : "border-[#E5E7EB] text-[#374151] hover:border-[#0B5D3B]/40 hover:bg-[#F0F7F4]"
              )}
            >
              <Plus size={10} /> Compare
            </button>

            <div className="w-px h-4 bg-[#E5E7EB]" />

            {/* Fullscreen */}
            <button onClick={handleFullscreen}
              className="p-1.5 rounded-lg hover:bg-[#F3F4F6] text-[#9CA3AF] hover:text-[#374151] transition-all"
              title="Fullscreen (F)">
              {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            {/* Download */}
            <button onClick={handleDownload}
              className="p-1.5 rounded-lg hover:bg-[#F3F4F6] text-[#9CA3AF] hover:text-[#374151] transition-all"
              title="Download PNG">
              <Download size={14} />
            </button>

            {/* Reset zoom */}
            <button onClick={handleReset}
              className="p-1.5 rounded-lg hover:bg-[#F3F4F6] text-[#9CA3AF] hover:text-[#374151] transition-all"
              title="Reset zoom">
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Compare input */}
        {showCmpInput && !cmpLabel && (
          <div className="mt-3 flex items-center gap-2">
            <input
              autoFocus
              value={cmpInput}
              onChange={e => setCmpInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && handleCompareSubmit()}
              placeholder="Enter ticker to compare (e.g. MSFT)"
              className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-[#E5E7EB] focus:border-[#2563EB] focus:outline-none font-mono placeholder:text-[#C4C9D1]"
            />
            <button onClick={handleCompareSubmit}
              className="text-xs px-3 py-1.5 bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Add
            </button>
            <button onClick={() => { setShowCmpInput(false); setCmpInput(""); }}
              className="text-[#9CA3AF] hover:text-red-500 transition-colors p-1">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Range buttons */}
        <div className="flex items-center gap-0.5 mt-3">
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => handleRangeChange(r)}
              className={clsx(
                "text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all duration-150",
                r === range
                  ? "bg-[#0B5D3B] text-white shadow-sm"
                  : "text-[#6B7280] hover:bg-[#F0F7F4] hover:text-[#0B5D3B]"
              )}
            >
              {r}
            </button>
          ))}
          {cmpLabel && (
            <span className="ml-auto text-[10px] text-[#9CA3AF] font-medium">% change</span>
          )}
        </div>
      </div>

      {/* ── OHLCV tooltip bar ────────────────────────────────────────────────── */}
      <div className="px-5 py-2 border-y border-[#F3F4F6] bg-[#FAFAFA] min-h-[34px] flex items-center">
        {tooltip ? (
          <div className="flex items-center gap-3 flex-wrap text-[11px]">
            <span className="text-[#6B7280] font-medium">{tooltip.date}</span>
            <span className={`font-bold ${tooltip.up ? "text-[#0B5D3B]" : "text-red-500"}`}>
              {tooltip.change} ({tooltip.changePct})
            </span>
            <span className="text-[#9CA3AF]">
              O <span className="font-mono text-[#374151]">{tooltip.open}</span>
            </span>
            <span className="text-[#9CA3AF]">
              H <span className="font-mono text-[#374151]">{tooltip.high}</span>
            </span>
            <span className="text-[#9CA3AF]">
              L <span className="font-mono text-[#374151]">{tooltip.low}</span>
            </span>
            <span className="text-[#9CA3AF]">
              C <span className="font-mono text-[#374151]">{tooltip.close}</span>
            </span>
            <span className="text-[#9CA3AF]">
              Vol <span className="font-mono text-[#374151]">{tooltip.volume}</span>
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-[#D1D5DB]">Hover to inspect OHLCV data</span>
        )}
      </div>

      {/* ── Chart area ───────────────────────────────────────────────────────── */}
      <div className="relative">
        {/* Loading skeleton */}
        {loading && (
          <div className="absolute inset-0 z-10 bg-white">
            <div className="px-5 py-5 space-y-3 h-full">
              <div className="h-[320px] bg-gradient-to-r from-[#F3F4F6] via-[#E5E7EB] to-[#F3F4F6] rounded-lg animate-pulse"
                style={{ backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
              <div className="h-[60px] bg-gradient-to-r from-[#F3F4F6] via-[#E5E7EB] to-[#F3F4F6] rounded-lg animate-pulse" />
            </div>
          </div>
        )}
        <div ref={mountRef} className="w-full" style={{ height: 420 }} />
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <div className="px-5 py-2 border-t border-[#F3F4F6] flex items-center justify-between">
        <p className="text-[9px] text-[#D1D5DB]">
          Price data · Yahoo Finance · Scroll to zoom · Drag to pan
        </p>
        <p className="text-[9px] text-[#D1D5DB]">
          {cmpLabel ? "Normalized to % change from period start" : ""}
        </p>
      </div>
    </div>
  );
}
