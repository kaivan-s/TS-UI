/**
 * Candlestick + Volume chart using TradingView's lightweight-charts v5.
 *
 * Data comes from our own backend (/api/chart-data) which pulls from
 * Yahoo Finance. Waits for the drawer animation before creating the chart
 * so the container has a real width.
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
  const [period, setPeriod] = useState("1y");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const container = containerRef.current;
    if (!symbol || !container) return;

    let cancelled = false;
    let chart = null;
    let ro = null;
    const chartHeight = height - 36;

    // Wait for the drawer slide animation to finish so the container
    // has a real width. Without this, createChart gets width=0.
    const timer = setTimeout(() => {
      if (cancelled) return;

      const w = container.clientWidth;
      if (w < 50) return; // still not visible

      chart = createChart(container, {
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
        width: w,
        height: chartHeight,
      });

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: COLORS.up,
        downColor: COLORS.down,
        borderUpColor: COLORS.up,
        borderDownColor: COLORS.down,
        wickUpColor: COLORS.up,
        wickDownColor: COLORS.down,
      });

      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });

      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });

      ro = new ResizeObserver(() => {
        if (container.clientWidth > 0 && chart) {
          chart.applyOptions({ width: container.clientWidth });
        }
      });
      ro.observe(container);

      // Fetch data
      setLoading(true);
      setError("");

      getChartData(symbol, period)
        .then((d) => {
          if (cancelled || !chart) return;
          if (!d.data?.length) {
            setError("No chart data available");
            return;
          }
          candleSeries.setData(d.data);
          volumeSeries.setData(d.volume || []);
          chart.timeScale().fitContent();
        })
        .catch((e) => {
          if (!cancelled) setError(e.message || "Failed to load chart");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 350); // wait for MUI Drawer slide transition

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (ro) ro.disconnect();
      if (chart) chart.remove();
    };
  }, [symbol, period, height]);

  if (!symbol) return null;

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

      <div ref={containerRef} style={{ width: "100%", height: height - 36 }} />

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
