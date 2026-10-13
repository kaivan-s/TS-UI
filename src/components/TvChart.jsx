/**
 * TradingView Advanced Chart widget — embedded in StockDrawer.
 *
 * Uses TV's free widget via script injection. The widget loads in a container
 * div and rebuilds when the symbol changes. Dark theme matches Morrow Desk.
 */

import { useEffect, useRef, memo } from "react";
import { Box } from "@mui/material";

const WIDGET_SCRIPT = "https://s.tradingview.com/tv.js";

function TvChartInner({ symbol, height = 400 }) {
  const containerRef = useRef(null);
  const widgetId = useRef(0);

  useEffect(() => {
    if (!symbol || !containerRef.current) return;

    const id = ++widgetId.current;
    const container = containerRef.current;

    // Clear previous widget
    container.innerHTML = "";

    const loadWidget = () => {
      // Guard against stale loads
      if (id !== widgetId.current) return;

      try {
        new window.TradingView.widget({
          symbol: `NSE:${symbol}`,
          container_id: container.id,
          autosize: true,
          interval: "D",
          timezone: "Asia/Kolkata",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#141414",
          hide_top_toolbar: false,
          hide_legend: false,
          hide_side_toolbar: true,
          allow_symbol_change: false,
          save_image: false,
          calendar: false,
          studies: ["RSIStudy@tv-basicstudies"],
          withdateranges: true,
          enabled_features: [],
          disabled_features: [
            "header_symbol_search",
            "symbol_search_hot_key",
            "header_compare",
            "header_undo_redo",
            "go_to_date",
          ],
          overrides: {
            "paneProperties.background": "#141414",
            "paneProperties.backgroundType": "solid",
            "scalesProperties.backgroundColor": "#141414",
          },
        });
      } catch (e) {
        console.warn("TradingView widget error:", e);
      }
    };

    // Load script if not already loaded
    if (window.TradingView) {
      loadWidget();
    } else {
      const existing = document.querySelector(`script[src="${WIDGET_SCRIPT}"]`);
      if (existing) {
        existing.addEventListener("load", loadWidget);
      } else {
        const script = document.createElement("script");
        script.src = WIDGET_SCRIPT;
        script.async = true;
        script.onload = loadWidget;
        script.onerror = () => {
          container.innerHTML =
            '<p style="color:#666;font-size:13px;padding:24px">Chart unavailable — could not load TradingView widget.</p>';
        };
        document.head.appendChild(script);
      }
    }

    return () => {
      widgetId.current++;
    };
  }, [symbol]);

  return (
    <Box
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid rgba(238,234,227,0.08)",
        height,
        bgcolor: "#141414",
      }}
    >
      <div
        id={`tv-chart-${symbol}`}
        ref={containerRef}
        style={{ width: "100%", height: "100%" }}
      />
    </Box>
  );
}

export default memo(TvChartInner);
