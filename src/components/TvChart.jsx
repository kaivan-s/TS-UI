/**
 * Candlestick + Volume chart using TradingView's lightweight-charts.
 *
 * Data comes from our own backend (/api/chart-data) which pulls from
 * Yahoo Finance. No embed restrictions — we own the data and the chart.
 */

import { useEffect, useRef, useState, memo } from "react";
import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { createChart, ColorType } from "lightweight-charts";
import { C } from "../theme.js";
import { getChartData } from "../api.js";

const PERIODS = [
  { value: "6mo", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "2y", label: "2Y" },
  { value: "5y", label: "5Y" },
];

const CHART_COLORS = {
  bg: "#141414",
  text: "rgba(238,234,227,0.45)",
  grid: "rgba(238,234,227,0.04)",
  border: "rgba(238,234,227,0.08)",
  up: "#7dba96",
  down: "#e57373",
  crosshair: "rgba(238,234,227,0.2)",
};

function TvChartInner({ symbol, height = 400 }) {
  const chartRef = useRef(null);
  const containerRef = useRef(null);
  const [period, setPeriod] = useState("1y");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!symbol || !containerRef.current) return;

    const container = containerRef.current;

    // Create chart
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: CHART_COLORS.bg },
        textColor: CHART_COLORS.text,
        fontFamily: "'Inter', -apple-system, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: CHART_COLORS.grid },
        horzLines: { color: CHART_COLORS.grid },
      },
      crosshair: {
        vertLine: { color: CHART_COLORS.crosshair, labelBackgroundColor: "#333" },
        horzLine: { color: CHART_COLORS.crosshair, labelBackgroundColor: "#333" },
      },
      rightPriceScale: {
        borderColor: CHART_COLORS.border,
      },
      timeScale: {
        borderColor: CHART_COLORS.border,
        timeVisible: false,
      },
      width: container.clientWidth,
      height: height - 36,
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: CHART_COLORS.up,
      downColor: CHART_COLORS.down,
      borderUpColor: CHART_COLORS.up,
      borderDownColor: CHART_COLORS.down,
      wickUpColor: CHART_COLORS.up,
      wickDownColor: CHART_COLORS.down,
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = { chart, candleSeries, volumeSeries };

    // Resize handler
    const ro = new ResizeObserver(() => {
      if (container.clientWidth > 0) {
        chart.applyOptions({ width: container.clientWidth });
      }
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [symbol, height]);

  // Fetch data when symbol or period changes
  useEffect(() => {
    if (!symbol || !chartRef.current) return;

    setLoading(true);
    setError("");

    getChartData(symbol, period)
      .then((d) => {
        if (!chartRef.current) return;
        const { candleSeries, volumeSeries, chart } = chartRef.current;

        if (!d.data?.length) {
          setError("No chart data available");
          return;
        }

        candleSeries.setData(d.data);
        volumeSeries.setData(d.volume || []);
        chart.timeScale().fitContent();
      })
      .catch((e) => setError(e.message || "Failed to load chart"))
      .finally(() => setLoading(false));
  }, [symbol, period]);

  if (!symbol) return null;

  return (
    <Box
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        border: `1px solid ${CHART_COLORS.border}`,
        bgcolor: CHART_COLORS.bg,
        position: "relative",
      }}
    >
      {/* Period selector */}
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
              borderColor: CHART_COLORS.border, textTransform: "none",
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

      {/* Chart container */}
      <div ref={containerRef} style={{ width: "100%", height: height - 36 }} />

      {/* Loading / error overlay */}
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
