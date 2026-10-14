/**
 * Candlestick + Volume chart — follows the official lightweight-charts
 * React example exactly, adapted for async data + MUI Drawer.
 *
 * @see https://tradingview.github.io/lightweight-charts/tutorials/react/simple
 */

import {
  createChart,
  createSeriesMarkers,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  LineStyle,
} from "lightweight-charts";
import React, { useEffect, useRef, useState } from "react";
import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { C } from "../theme.js";
import { getChartData } from "../api.js";

const PERIODS = [
  { value: "6mo", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "2y", label: "2Y" },
  { value: "5y", label: "5Y" },
];

const EMA_LINES = [
  { span: 50, color: "rgba(142,180,196,0.85)", label: "50-day avg" },
  { span: 200, color: "rgba(196,164,106,0.85)", label: "200-day avg" },
];

function emaSeries(candles, span) {
  const k = 2 / (span + 1);
  const out = [];
  let ema = null;
  let sum = 0;
  candles.forEach((c, i) => {
    if (i < span) {
      sum += c.close;
      if (i === span - 1) {
        ema = sum / span;
        out.push({ time: c.time, value: ema });
      }
      return;
    }
    ema = c.close * k + ema * (1 - k);
    out.push({ time: c.time, value: ema });
  });
  return out;
}

function ChartComponent({ data, volumeData, height, markers, levels }) {
  const chartContainerRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const container = chartContainerRef.current;
    if (!container) return;

    const handleResize = () => {
      chart.applyOptions({ width: container.clientWidth });
    };

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "#141414" },
        textColor: "rgba(238,234,227,0.45)",
        fontFamily: "'Inter', -apple-system, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(238,234,227,0.04)" },
        horzLines: { color: "rgba(238,234,227,0.04)" },
      },
      crosshair: {
        vertLine: { color: "rgba(238,234,227,0.2)", labelBackgroundColor: "#333" },
        horzLine: { color: "rgba(238,234,227,0.2)", labelBackgroundColor: "#333" },
      },
      rightPriceScale: { borderColor: "rgba(238,234,227,0.08)" },
      timeScale: { borderColor: "rgba(238,234,227,0.08)", timeVisible: false },
      width: container.clientWidth,
      height: height,
    });

    chart.timeScale().fitContent();

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#7dba96",
      downColor: "#e57373",
      borderUpColor: "#7dba96",
      borderDownColor: "#e57373",
      wickUpColor: "#7dba96",
      wickDownColor: "#e57373",
      borderVisible: false,
    });

    candleSeries.setData(data);

    EMA_LINES.forEach(({ span, color }) => {
      if (data.length <= span) return;
      const line = chart.addSeries(LineSeries, {
        color,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      line.setData(emaSeries(data, span));
    });

    (levels || []).forEach((lv) => {
      if (lv?.price == null) return;
      candleSeries.createPriceLine({
        price: lv.price,
        color: lv.color,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: lv.label,
      });
    });

    if (markers?.length) {
      const times = new Set(data.map((d) => d.time));
      const visible = markers
        .filter((mk) => times.has(mk.time))
        .sort((a, b) => (a.time < b.time ? -1 : 1));
      if (visible.length) createSeriesMarkers(candleSeries, visible);
    }

    if (volumeData && volumeData.length > 0) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });
      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeSeries.setData(volumeData);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, volumeData, height, markers, levels]);

  return <div ref={chartContainerRef} />;
}

export default function TvChart({ symbol, height = 400, markers, levels, showLegend = false }) {
  const [period, setPeriod] = useState("1y");
  const [chartData, setChartData] = useState(null);
  const [volumeData, setVolumeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;

    setLoading(true);
    setError("");

    getChartData(symbol, period)
      .then((d) => {
        if (cancelled) return;
        if (!d.data?.length) {
          setError("No chart data");
          setChartData(null);
          return;
        }
        setChartData(d.data);
        setVolumeData(d.volume || []);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message || "Failed to load");
          setChartData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [symbol, period]);

  if (!symbol) return null;

  const chartHeight = height - 36;

  return (
    <Box
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid rgba(238,234,227,0.08)",
        bgcolor: "#141414",
        position: "relative",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.5,
          pt: 1,
          pb: 0.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.75, flexWrap: "wrap" }}>
          <Typography sx={{ fontSize: 11, color: C.muted }}>
            NSE:{symbol}
          </Typography>
          {showLegend && EMA_LINES.map((l) => (
            <Box key={l.span} sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
              <Box sx={{ width: 14, height: 2, bgcolor: l.color, borderRadius: 1 }} />
              <Typography sx={{ fontSize: 10.5, color: C.muted }}>{l.label}</Typography>
            </Box>
          ))}
        </Box>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={period}
          onChange={(_, v) => v && setPeriod(v)}
          sx={{
            "& .MuiToggleButton-root": {
              px: 1, py: 0.25, fontSize: 11, color: C.muted,
              borderColor: "rgba(238,234,227,0.08)", textTransform: "none",
              "&.Mui-selected": { color: C.text, bgcolor: "rgba(238,234,227,0.06)" },
            },
          }}
        >
          {PERIODS.map((p) => (
            <ToggleButton key={p.value} value={p.value}>
              {p.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Chart or status */}
      {loading && (
        <Box sx={{ height: chartHeight, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography sx={{ fontSize: 13, color: C.muted }}>Loading chart…</Typography>
        </Box>
      )}

      {error && !loading && (
        <Box sx={{ height: chartHeight, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography sx={{ fontSize: 13, color: C.bad }}>{error}</Typography>
        </Box>
      )}

      {chartData && !loading && !error && (
        <ChartComponent
          data={chartData}
          volumeData={volumeData}
          height={chartHeight}
          markers={markers}
          levels={levels}
        />
      )}
    </Box>
  );
}
