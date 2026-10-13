/**
 * TradingView chart — iframe embed.
 *
 * Uses TV's widgetembed iframe directly rather than the JS widget API.
 * More reliable: no script loading, no CSP issues, no race conditions.
 */

import { memo } from "react";
import { Box } from "@mui/material";

function TvChartInner({ symbol, height = 420 }) {
  if (!symbol) return null;

  const params = new URLSearchParams({
    symbol: `NSE:${symbol}`,
    interval: "D",
    theme: "dark",
    style: "1",
    timezone: "Asia/Kolkata",
    locale: "en",
    toolbar_bg: "141414",
    hide_legend: "0",
    hide_side_toolbar: "1",
    allow_symbol_change: "0",
    save_image: "0",
    calendar: "0",
    studies: "RSI@tv-basicstudies",
    withdateranges: "true",
  });

  const src = `https://s.tradingview.com/widgetembed/?${params.toString()}`;

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
      <iframe
        key={symbol}
        src={src}
        title={`${symbol} chart`}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    </Box>
  );
}

export default memo(TvChartInner);
