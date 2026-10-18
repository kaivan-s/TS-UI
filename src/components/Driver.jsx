/**
 * Likely-driver display shared by Insights and the stock page: the move type
 * the evidence points to, its confidence, what supports it and what doesn't fit.
 */

import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { C } from "../theme.js";

const MONO = '"IBM Plex Mono", ui-monospace, monospace';

const CONFIDENCE = {
  High: { fg: C.good, bg: "rgba(125,186,150,0.12)", bd: "rgba(125,186,150,0.32)" },
  Medium: { fg: C.warn, bg: "rgba(196,164,106,0.12)", bd: "rgba(196,164,106,0.32)" },
  Low: { fg: C.muted, bg: "rgba(238,234,227,0.05)", bd: "rgba(238,234,227,0.16)" },
};

export function ConfidencePill({ level }) {
  const t = CONFIDENCE[level] || CONFIDENCE.Low;
  return (
    <Box
      component="span"
      title="How strongly the evidence on record fits this reading, and how little contradicts it"
      sx={{
        px: 0.8,
        py: 0.15,
        borderRadius: 1,
        bgcolor: t.bg,
        border: `1px solid ${t.bd}`,
        color: t.fg,
        fontFamily: MONO,
        fontSize: 9.5,
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {level} confidence
    </Box>
  );
}

function EvidenceList({ items, ok, limit }) {
  if (!items?.length) return null;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4 }}>
      {items.slice(0, limit).map((t, i) => (
        <Box key={i} sx={{ display: "flex", gap: 0.85, alignItems: "flex-start" }}>
          <Box
            component="span"
            sx={{
              fontFamily: MONO,
              fontSize: 11,
              fontWeight: 700,
              color: ok ? C.good : C.warn,
              lineHeight: 1.5,
              flexShrink: 0,
              width: 10,
            }}
          >
            {ok ? "✓" : "✗"}
          </Box>
          <Typography sx={{ fontSize: 12, color: ok ? C.text : C.muted, lineHeight: 1.5 }}>{t}</Typography>
        </Box>
      ))}
    </Box>
  );
}

const signed = (v) => (v == null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(1)}%`);

function sinceLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return ` since ${d.toLocaleString("en-IN", { month: "short", year: "numeric" })}`;
}

/** What followed past moves with the same label: from the next open, ranked against all stocks. */
function BaseRate({ rate, compact }) {
  const h5 = rate?.h5;
  if (!h5) return null;
  const h20 = rate.h20;
  const cases = `${h5.n.toLocaleString("en-IN")} past moves like this${sinceLabel(rate.since)}`;
  const lead = {
    lagged: `${cases} usually lagged the market afterwards`,
    beat: `${cases} usually did better than the market afterwards`,
    mixed: `${cases} showed no consistent follow-through — outcomes split roughly evenly`,
  }[h5.verdict];
  const detail = h5.verdict === "mixed"
    ? " — about as many did better than other stocks as did worse."
    : `: over the next 5 sessions the median was ${signed(h5.median_ret)}, and ${h5.bottom_half}% ended in the bottom half of all stocks.`;
  const color = h5.verdict === "lagged" ? C.warn : h5.verdict === "beat" ? C.good : C.muted;
  return (
    <Box sx={{ pt: compact ? 0.4 : 0.75, borderTop: `1px solid ${C.line}` }}>
      <Typography sx={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.08em", color, textTransform: "uppercase", mb: 0.4 }}>
        What usually followed
      </Typography>
      <Typography sx={{ fontSize: compact ? 11.75 : 12.5, color: C.text, lineHeight: 1.55 }}>
        {lead}
        {detail}
      </Typography>
      {!compact && (
        <Box sx={{ display: "flex", gap: 2.25, mt: 0.75, flexWrap: "wrap" }}>
          {[
            ["5-day median", signed(h5.median_ret)],
            ["20-day median", signed(h20?.median_ret)],
            ["Worst 10% (5d)", signed(h5.worst10)],
            ["Best 10% (5d)", signed(h5.best10)],
          ].map(([k, v]) => (
            <Box key={k}>
              <Typography sx={{ fontFamily: MONO, fontSize: 9.5, color: C.muted, letterSpacing: "0.06em" }}>{k}</Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: C.text }}>{v}</Typography>
            </Box>
          ))}
        </Box>
      )}
      <Typography sx={{ fontSize: 10.5, color: C.muted, mt: 0.6, lineHeight: 1.5 }}>
        Measured from the next day&apos;s open. A record of past cases, not a forecast for this one.
      </Typography>
    </Box>
  );
}

export function DriverPanel({ driver, fallback, full = false, compact = false }) {
  const [showEvidence, setShowEvidence] = useState(false);
  if (!driver) {
    return fallback ? (
      <Typography sx={{ fontSize: 13.25, fontWeight: 500, color: C.text, lineHeight: 1.5 }}>
        {fallback}
      </Typography>
    ) : null;
  }
  const limit = full ? 99 : 3;
  const evidence = !compact || showEvidence;
  const nEvidence = (driver.supports?.length || 0) + (driver.against?.length || 0);
  return (
    <Box
      sx={{
        p: compact ? 1 : 1.35,
        borderRadius: 1.5,
        bgcolor: compact ? "#0e0f12" : "#111216",
        border: `1px solid ${C.line}`,
        display: "flex",
        flexDirection: "column",
        gap: compact ? 0.6 : 0.9,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.85, flexWrap: "wrap" }}>
        <Typography sx={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.08em", color: C.muted, textTransform: "uppercase" }}>
          Likely driver
        </Typography>
        <Typography sx={{ fontSize: compact ? 12.5 : 13.5, fontWeight: 650, color: C.text }}>{driver.label}</Typography>
        <ConfidencePill level={driver.confidence} />
      </Box>
      <Typography sx={{ fontSize: compact ? 12 : 13, color: compact ? C.muted : C.text, lineHeight: 1.55 }}>
        {driver.why}
      </Typography>
      {evidence && (
        <>
          <EvidenceList items={driver.supports} ok limit={limit} />
          <EvidenceList items={driver.against} ok={false} limit={limit} />
          {driver.also?.length > 0 && (
            <Typography sx={{ fontSize: 11.75, color: C.muted, lineHeight: 1.5 }}>
              <Box component="span" sx={{ fontFamily: MONO, fontSize: 10, color: C.accent, mr: 0.75 }}>
                ALSO FITS:
              </Box>
              {driver.also.map((a) => a.label).join(" · ")}
            </Typography>
          )}
        </>
      )}
      <BaseRate rate={driver.base_rate} compact={compact} />
      {compact && nEvidence > 0 && (
        <Typography
          role="button"
          tabIndex={0}
          onClick={() => setShowEvidence((v) => !v)}
          sx={{ fontFamily: MONO, fontSize: 10.5, color: C.accent, cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
        >
          {showEvidence ? "Hide evidence" : `Show evidence (${nEvidence})`}
        </Typography>
      )}
    </Box>
  );
}
