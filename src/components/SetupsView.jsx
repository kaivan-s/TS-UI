/**
 * Setups — one scrollable page showing both cuts of the coil pool.
 *
 * 1. "Sector agrees" at the top: coiled stocks whose sector is also moving.
 * 2. "Leaders at rest" below: proven momentum leaders that are quietly coiling,
 *    regardless of sector state.
 */

import { useMemo } from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import { PremiumOverlay } from "./Premium.jsx";
import { useAuth } from "../auth.jsx";
import UpdateBanner from "./UpdateBanner.jsx";
import BuysTab from "./BuysTab.jsx";
import LeadersAtRestTab from "./LeadersAtRestTab.jsx";
import { TvCopyButton } from "./ui.jsx";
import { C } from "../theme.js";
import { EVIDENCE_WINDOW, STAT_STRIPS } from "../evidence.js";

const MONO = '"IBM Plex Mono", ui-monospace, monospace';
const FREE_PREVIEW_SETUPS = 1;
const FREE_PREVIEW_LEADERS = 2;

function SectionDivider({ label, sublabel, count, color, children }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 1.5,
        mb: 1.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: 1 }}>
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
          <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: color }} />
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: "0.1em",
              fontWeight: 700,
              color,
              textTransform: "uppercase",
            }}
          >
            {label}
          </Typography>
        </Box>
        {sublabel && (
          <Typography sx={{ fontSize: 12.5, color: C.muted }}>{sublabel}</Typography>
        )}
        {count != null && (
          <Box
            component="span"
            sx={{
              px: 0.75,
              py: 0.15,
              borderRadius: 1,
              bgcolor: `${color}14`,
              border: `1px solid ${color}30`,
              fontFamily: MONO,
              fontSize: 10,
              fontWeight: 600,
              color,
            }}
          >
            {count}
          </Box>
        )}
      </Box>
      {children}
    </Box>
  );
}

export default function SetupsView({
  buys,
  rest,
  status,
  onOpenSector,
  onOpenStock,
}) {
  const { isPremium } = useAuth();

  const previewBuys = isPremium ? buys : buys.slice(0, FREE_PREVIEW_SETUPS);
  const previewRest = isPremium ? rest : rest.slice(0, FREE_PREVIEW_LEADERS);

  const setupsStale = (status?.stale || []).includes("setups");

  const telemetry = useMemo(() => {
    const nConfirmed = buys.filter((r) => r.shape_confirmed).length;
    return {
      nConfirmed,
      nCoil: status?.n_coil ?? (buys.length + rest.length),
      session: status?.as_of || status?.session || "Latest EOD",
    };
  }, [buys, rest, status]);

  const allSymbols = useMemo(
    () =>
      [...previewBuys, ...previewRest]
        .map((r) => r.symbol)
        .filter((s, i, a) => s && a.indexOf(s) === i),
    [previewBuys, previewRest],
  );

  const baseStrip = STAT_STRIPS.setups;

  return (
    <Box sx={{ pb: 6 }}>
      <UpdateBanner asOf={status?.as_of} />

      {/* ─── Page header ─── */}
      <Box
        sx={{
          bgcolor: "#15161b",
          border: `1px solid ${C.line}`,
          borderRadius: 2.5,
          p: { xs: 2, sm: 2.5 },
          mb: 2.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            alignItems: { xs: "flex-start", lg: "center" },
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.4 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: C.good }} />
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: "0.16em",
                  color: C.accent,
                  textTransform: "uppercase",
                }}
              >
                POST-MARKET COIL SHORTLIST · {telemetry.session} (20:30 IST)
              </Typography>
            </Box>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: 20, sm: 23 },
                fontWeight: 600,
                letterSpacing: "-0.025em",
                color: C.text,
                lineHeight: 1.2,
              }}
            >
              Setups &amp; Coiled Leaders
            </Typography>
            <Typography sx={{ fontSize: 13, color: C.muted, mt: 0.35, maxWidth: 680 }}>
              Two views of the same coil pool: stocks whose sector is also
              moving (backtested), and proven momentum leaders that are
              quietly basing (sector-agnostic).
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexShrink: 0 }}>
            {allSymbols.length > 0 && <TvCopyButton symbols={allSymbols} />}
          </Box>
        </Box>

        {/* Telemetry bar */}
        <Box
          sx={{
            mt: 1.75,
            pt: 1.5,
            borderTop: `1px solid ${C.line}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>SECTOR AGREES:</Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 600, color: buys.length > 0 ? C.good : C.muted }}>
                {buys.length}
              </Typography>
              {telemetry.nConfirmed > 0 && (
                <Typography sx={{ fontSize: 11.5, color: C.muted }}>
                  ({telemetry.nConfirmed} shape confirmed)
                </Typography>
              )}
            </Box>

            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>LEADERS AT REST:</Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 600, color: rest.length > 0 ? C.accent : C.muted }}>
                {rest.length}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>COIL POOL:</Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 600, color: C.text }}>
                {telemetry.nCoil}
              </Typography>
            </Box>
          </Box>

          {baseStrip && (
            <Tooltip title={baseStrip.tip} placement="top" arrow enterDelay={200}>
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 1.25,
                  py: 0.35,
                  borderRadius: 1.25,
                  bgcolor: "#0e0f12",
                  border: `1px solid ${C.line}`,
                  cursor: "help",
                }}
              >
                {baseStrip.stats.map((s) => (
                  <Box key={s.label} sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                    <Typography sx={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: C.good }}>
                      {s.value}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: C.muted }}>{s.label}</Typography>
                  </Box>
                ))}
                <Typography sx={{ fontFamily: MONO, fontSize: 10, color: C.muted, opacity: 0.75 }}>
                  · {baseStrip.window || EVIDENCE_WINDOW}
                </Typography>
              </Box>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* ─── Section 1: Sector Agrees ─── */}
      <SectionDivider
        label="Sector Agrees"
        sublabel="Coiled stocks whose sector is waking up or resting after a surge"
        count={buys.length}
        color={C.good}
      >
        {previewBuys.length > 0 && (
          <TvCopyButton
            symbols={previewBuys.map((r) => r.symbol)}
            size="small"
          />
        )}
      </SectionDivider>

      {setupsStale && buys.length > 0 && (
        <Box
          sx={{
            mb: 1.5,
            px: 2,
            py: 0.85,
            borderRadius: 1.5,
            border: "1px solid rgba(196,164,106,0.22)",
            bgcolor: "rgba(196,164,106,0.05)",
          }}
        >
          <Typography sx={{ fontSize: 12, color: C.muted }}>
            No sector agreed in the latest session — showing last qualifying
            list from{" "}
            <Box component="span" sx={{ fontFamily: MONO, color: C.text }}>
              {status?.dates?.setups}
            </Box>{" "}
            (historical reference).
          </Typography>
        </Box>
      )}

      <PremiumOverlay
        previewCount={FREE_PREVIEW_SETUPS}
        totalCount={buys.length}
        feature="Full setups list"
      >
        <BuysTab
          rows={previewBuys}
          onOpenSector={onOpenSector}
          onOpenStock={onOpenStock}
        />
      </PremiumOverlay>

      {/* ─── Separator ─── */}
      <Box
        sx={{
          my: 3.5,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box sx={{ flex: 1, height: "1px", bgcolor: C.line }} />
        <Typography
          sx={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: "0.14em",
            color: C.muted,
            textTransform: "uppercase",
            flexShrink: 0,
          }}
        >
          sector-agnostic
        </Typography>
        <Box sx={{ flex: 1, height: "1px", bgcolor: C.line }} />
      </Box>

      {/* ─── Section 2: Leaders at Rest ─── */}
      <SectionDivider
        label="Leaders at Rest"
        sublabel="Top 30% momentum leaders that are quietly coiling (top 20)"
        count={rest.length}
        color={C.accent}
      >
        {previewRest.length > 0 && (
          <TvCopyButton
            symbols={previewRest.map((r) => r.symbol)}
            size="small"
          />
        )}
      </SectionDivider>

      <PremiumOverlay
        previewCount={FREE_PREVIEW_LEADERS}
        totalCount={rest.length}
        feature="Leaders at rest"
      >
        <LeadersAtRestTab
          rows={previewRest}
          coilReady={rest.length > 0 || status?.coil_ready !== false}
          onOpenSector={onOpenSector}
          onOpenStock={onOpenStock}
        />
      </PremiumOverlay>
    </Box>
  );
}
