/**
 * Candlestick + Volume chart using TradingView's lightweight-charts v5.
 *
 * Uses autoSize:true so the chart fills its container automatically —
 * no manual width measurement, no drawer animation timing issues.
 * Data from our backend (/api/chart-data → Yahoo Finance).
 */

import { useEffect, useRef, useState, memo } from "react";
import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { createChart, ColorType, CandlestickSeries, HistogramSeries } from "lightweight-charts";
import { C } from "../theme.js";
import { getChartData } from "../api.js";

const PERIODS = [
  { value: "6mo", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "2y", label: "2Y" },
  { value: "5y", label: "5Y" },
];

const COLORS = {
  bg: "#141414",
  text: "rgba(238,234,227,0.45)",
  grid: "rgba(238,234,227,0.04)",
  border: "rgba(238,234,227,0.08)",
  up: "#7dba96",
  down: "#e57373",
  crosshair: "rgba(238,234,227,0.2)",
};

function TvChartInner({ symbol, height = 400 }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleRef = useRef(null);
  const volumeRef = useRef(null);
  const [period, setPeriod] = useState("1y");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Create chart once per symbol — autoSize handles drawer animation
  useEffect(() => {
    if (!symbol || !containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: COLORS.bg },
        textColor: COLORS.text,
        fontFamily: "'Inter', -apple-system, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: COLORS.grid },
        horzLines: { color: COLORS.grid },
      },
      crosshair: {
        vertLine: { color: COLORS.crosshair, labelBackgroundColor: "#333" },
        horzLine: { color: COLORS.crosshair, labelBackgroundColor: "#333" },
      },
      rightPriceScale: { borderColor: COLORS.border },
      timeScale: { borderColor: COLORS.border, timeVisible: false },
    });

    const candles = chart.addSeries(CandlestickSeries, {
      upColor: COLORS.up,
      downColor: COLORS.down,
      borderUpColor: COLORS.up,
      borderDownColor: COLORS.down,
      wickUpColor: COLORS.up,
      wickDownColor: COLORS.down,
    });

    const volumes = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleRef.current = candles;
    volumeRef.current = volumes;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
    };
  }, [symbol]);

  // Fetch data when symbol or period changes
  useEffect(() => {
    if (!symbol || !candleRef.current) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    getChartData(symbol, period)
      .then((d) => {
        if (cancelled || !candleRef.current) return;
        if (!d.data?.length) {
          setError("No chart data available");
          return;
        }
        candleRef.current.setData(d.data);
        volumeRef.current.setData(d.volume || []);
        chartRef.current.timeScale().fitContent();
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load chart");
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
        border: `1px solid ${COLORS.border}`,
        bgcolor: COLORS.bg,
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
        <Typography sx={{ fontSize: 11, color: C.muted }}>
          NSE:{symbol}
        </Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={period}
          onChange={(_, v) => v && setPeriod(v)}
          sx={{
            "& .MuiToggleButton-root": {
              px: 1, py: 0.25, fontSize: 11, color: C.muted,
              borderColor: COLORS.border, textTransform: "none",
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

      {/* Container must have explicit height for autoSize to work */}
      <div
        ref={containerRef}
        style={{ width: "100%", height: chartHeight }}
      />

      {(loading || error) && (
        <Box
          sx={{
            position: "absolute",
            top: 36,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: loading ? "rgba(20,20,20,0.7)" : "transparent",
            pointerEvents: "none",
          }}
        >
          <Typography sx={{ fontSize: 13, color: error ? C.bad : C.muted }}>
            {error || "Loading chart…"}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default memo(TvChartInner);
