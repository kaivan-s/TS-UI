import { Box, Tooltip, Typography } from "@mui/material";
import { C } from "../theme.js";
import { BASE_RATES, EVIDENCE_WINDOW, baseRateSource } from "../evidence.js";

/**
 * What this list has historically been worth, stated up front.
 *
 * This replaces the paragraph of disclaimers each list used to carry. A
 * reader who sees "66% beat the market, median +3.7%" already knows a third
 * of these go nowhere, which the hedging was trying and failing to say.
 */
export default function BaseRate({ metric }) {
  const r = BASE_RATES[metric];
  if (!r) return null;

  const stats = [
    { value: `${Math.round(r.winRate * 100)}%`, label: "beat the market over 20 days" },
    { value: `+${(r.medianExcess * 100).toFixed(1)}%`, label: "median excess return" },
    { value: r.n, label: "names measured" },
  ];

  return (
    <Tooltip title={baseRateSource(metric)} placement="top" arrow enterDelay={200}>
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          flexWrap: "wrap",
          gap: { xs: 2, sm: 3.5 },
          mb: 2.5,
          px: 2,
          py: 1.5,
          borderRadius: 2,
          cursor: "help",
          bgcolor: "rgba(142,180,196,0.05)",
          border: "1px solid rgba(142,180,196,0.12)",
        }}
      >
        {stats.map((s) => (
          <Box key={s.label} sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
            <Typography
              component="span"
              sx={{ fontSize: 17, fontWeight: 600, color: C.text, lineHeight: 1 }}
              className="num"
            >
              {s.value}
            </Typography>
            <Typography component="span" sx={{ fontSize: 12, color: C.muted }}>
              {s.label}
            </Typography>
          </Box>
        ))}
        <Typography
          component="span"
          sx={{ fontSize: 11.5, color: C.muted, ml: "auto", opacity: 0.8 }}
        >
          backtest, {EVIDENCE_WINDOW}
        </Typography>
      </Box>
    </Tooltip>
  );
}
