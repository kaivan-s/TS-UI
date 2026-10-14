import { Box, Tooltip, Typography } from "@mui/material";
import { C } from "../theme.js";
import { EVIDENCE_WINDOW, STAT_STRIPS } from "../evidence.js";

const MONO = '"IBM Plex Mono", ui-monospace, monospace';

/**
 * What a list has historically been worth, stated up front.
 *
 * This replaces the paragraph of disclaimers each list used to carry. A
 * reader who sees "66% above the market median, 20 days later" already
 * knows a third of these go nowhere. The figure is a backtest base rate,
 * not a return to expect.
 */
export default function BaseRate({ metric }) {
  const strip = STAT_STRIPS[metric];
  if (!strip) return null;

  return (
    <Tooltip title={strip.tip} placement="top" arrow enterDelay={200}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: { xs: 2, sm: 3.5 },
          mb: 2.5,
          px: 2.5,
          py: 1.75,
          borderRadius: 2.5,
          cursor: "help",
          bgcolor: "#15161b",
          border: `1px solid ${C.line}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: { xs: 2.5, sm: 4 } }}>
          {strip.stats.map((s) => (
            <Box key={s.label} sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
              <Typography
                component="span"
                sx={{
                  fontFamily: MONO,
                  fontSize: 18,
                  fontWeight: 600,
                  color: C.good,
                  lineHeight: 1,
                }}
                className="num"
              >
                {s.value}
              </Typography>
              <Typography component="span" sx={{ fontSize: 12.5, color: C.muted }}>
                {s.label}
              </Typography>
            </Box>
          ))}
        </Box>
        <Box
          component="span"
          sx={{
            px: 1.1,
            py: 0.35,
            borderRadius: 1,
            bgcolor: "#0e0f12",
            border: `1px solid ${C.line}`,
            fontFamily: MONO,
            fontSize: 10.5,
            color: C.muted,
          }}
        >
          EMPIRICAL BASE RATE · {strip.window || EVIDENCE_WINDOW}
        </Box>
      </Box>
    </Tooltip>
  );
}
