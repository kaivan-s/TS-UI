/**
 * Candlestick + Volume chart — follows the official lightweight-charts
 * React example exactly, adapted for async data + MUI Drawer.
 *
 * @see https://tradingview.github.io/lightweight-charts/tutorials/react/simple
 */

import { createChart, ColorType, CandlestickSeries, HistogramSeries } from "lightweight-charts";
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

function ChartComponent({ data, volumeData, height }) {
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
  }, [data, volumeData, height]);

  return <div ref={chartContainerRef} />;
}

export default function TvChart({ symbol, height = 400 }) {
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
        <ChartComponent data={chartData} volumeData={volumeData} height={chartHeight} />
      )}
    </Box>
  );
}
