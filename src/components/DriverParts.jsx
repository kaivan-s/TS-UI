/**
 * Shared pieces for commodity/macro drivers: sparkline, change figures,
 * measured-link chips and the headline list.
 */

import { Box, Link, Tooltip, Typography } from "@mui/material";
import { C } from "../theme.js";

export const MONO = '"IBM Plex Mono", ui-monospace, monospace';

// Sensitivities are per 10% move for commodities; currencies rarely move 10%.
export const scaleFor = (key) => (key === "USDINR" ? 1 : 10);

export function fmtPrice(m, unit) {
  if (!m || m.price == null) return "—";
  const v = m.price;
  const s = v >= 1000 ? v.toLocaleString("en-IN", { maximumFractionDigits: 0 }) : v.toFixed(2);
  return unit === "%" ? `${s}%` : s;
}

export function Change({ v, points, label }) {
  const color = v == null ? C.muted : v > 0 ? C.good : v < 0 ? C.bad : C.muted;
  const txt = v == null ? "—" : points
    ? `${v > 0 ? "+" : ""}${(v * 100).toFixed(0)}bp`
    : `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      {label && (
        <Typography sx={{ fontFamily: MONO, fontSize: 9.5, color: C.muted, letterSpacing: "0.08em" }}>
          {label}
        </Typography>
      )}
      <Typography sx={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color }}>{txt}</Typography>
    </Box>
  );
}

export function Sparkline({ data, width = 120, height = 34 }) {
  if (!data || data.length < 2) return null;
  const lo = Math.min(...data);
  const hi = Math.max(...data);
  const span = hi - lo || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - lo) / span) * (height - 4) - 2}`)
    .join(" ");
  const up = data[data.length - 1] >= data[0];
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={up ? C.good : C.bad} strokeWidth="1.5" />
    </svg>
  );
}

export function LinkChip({ r, driverKey, driverLabel, onOpenStock }) {
  const scale = scaleFor(driverKey);
  const move = r.beta * scale;
  const color = r.beta > 0 ? C.good : C.bad;
  const basis = r.basis === "peers"
    ? "Confirmed: another stock in the same industry shows the same link."
    : "Expected for this industry, and stable in this stock's own prices.";
  return (
    <Tooltip
      arrow
      placement="top"
      title={`${r.symbol}${r.industry ? ` · ${r.industry}` : ""}. Over the measured window, a ${scale}% rise in ${driverLabel} went with a ${move > 0 ? "+" : ""}${move.toFixed(1)}% move in ${r.symbol} beyond the Nifty's own move (t = ${r.t}). ${basis}`}
    >
      <Box
        component="span"
        onClick={() => onOpenStock?.(r.symbol)}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.6,
          px: 0.9,
          py: 0.3,
          borderRadius: 1,
          border: `1px solid ${color}33`,
          bgcolor: `${color}10`,
          cursor: onOpenStock ? "pointer" : "help",
          "&:hover": onOpenStock ? { borderColor: `${color}77` } : {},
        }}
      >
        <Typography sx={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600, color: C.text }}>
          {r.symbol}
        </Typography>
        <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color }}>
          {move > 0 ? "+" : ""}{move.toFixed(1)}%
        </Typography>
        {r.basis === "peers" && (
          <Typography sx={{ fontFamily: MONO, fontSize: 9.5, color: C.muted }}>✓</Typography>
        )}
      </Box>
    </Tooltip>
  );
}

export function NewsList({ news, max = 4 }) {
  const items = news?.items || [];
  if (!items.length) {
    const msg = news?.status === "loading" || news?.status == null
      ? "Fetching headlines…"
      : "Headlines unavailable right now — the news source is rate-limiting. They refresh in the background.";
    return <Typography sx={{ fontSize: 12, color: C.muted }}>{msg}</Typography>;
  }
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.85 }}>
      {items.slice(0, max).map((n) => (
        <Box key={n.url || n.title}>
          <Link
            href={n.url}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{ fontSize: 12.75, color: C.text, lineHeight: 1.4, display: "block" }}
          >
            {n.title}
          </Link>
          <Typography sx={{ fontFamily: MONO, fontSize: 10, color: C.muted, mt: 0.15 }}>
            {n.source}{n.date ? ` · ${n.date}` : ""}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
