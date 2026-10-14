/**
 * Setups — one page, two cuts of the same coil pool.
 *
 * "Sector agrees" is the default: coiled stocks whose sector is also moving.
 * "Leaders at rest" drops the sector-acting condition (keeping only the
 * DISQUALIFIED exclusion) and instead ranks the market leaders in the pool by
 * risk-adjusted 12-month momentum, keeping 20.
 */

import { useMemo, useState } from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import PauseCircleOutlineRoundedIcon from "@mui/icons-material/PauseCircleOutlineRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
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

const FILTERS = [
  {
    id: "agree",
    label: "Sector agrees",
    help: "Coiled stocks whose sector is also waking up or resting after waking up. Grouped by sector, because names inside one sector tend to resolve together. In the backtest window, more of these traded above the same session's all-stock median 20 days later than coils alone. One window, not a promise.",
  },
  {
    id: "rest",
    label: "Leaders at rest",
    help: "The same coil pool, kept to stocks in the top 30% of the market on return over the twelve months ending a month ago and outside disqualified sectors, then ranked with steadier trends first and cut to 20. A proven leader that has gone quiet.",
  },
];

function MarketQuietCard({ status, onSwitchToRest }) {
  const bullish = status?.bullish_sectors ?? 0;
  const total = status?.total_sectors ?? 59;
  const pct = total ? Math.round((bullish / total) * 100) : 0;
  const nCoil = status?.n_coil ?? 0;
  const session = status?.session || status?.as_of || "—";
  const lastSetupDate = status?.dates?.setups;

  return (
    <Box
      sx={{
        mb: 2.5,
        p: { xs: 2.25, sm: 3 },
        borderRadius: 2.5,
        border: `1px solid ${C.line}`,
        bgcolor: "#15161b",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.75,
            bgcolor: "rgba(196,164,106,0.12)",
            border: "1px solid rgba(196,164,106,0.28)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.warn,
            flexShrink: 0,
          }}
        >
          <PauseCircleOutlineRoundedIcon sx={{ fontSize: 20 }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: 15.5, fontWeight: 600, color: C.text }}>
            Market isn&apos;t offering sector-aligned setups right now
          </Typography>
          <Typography sx={{ fontSize: 12, color: C.muted }}>
            As of {session} — the scan ran, but no Acting sectors intersected with coiled stocks
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          gap: 1.25,
          mb: 2,
        }}
      >
        <Box sx={{ p: 1.5, borderRadius: 1.75, bgcolor: "#111216", border: `1px solid ${C.line}` }}>
          <Typography sx={{ fontFamily: MONO, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Sectors in uptrend
          </Typography>
          <Typography sx={{ fontFamily: MONO, fontSize: 19, fontWeight: 600, color: bullish > 0 ? C.warn : C.muted, mt: 0.25 }}>
            {bullish}
            <Typography component="span" sx={{ fontFamily: MONO, fontSize: 12, color: C.muted, fontWeight: 400 }}>
              /{total} ({pct}%)
            </Typography>
          </Typography>
        </Box>
        <Box sx={{ p: 1.5, borderRadius: 1.75, bgcolor: "#111216", border: `1px solid ${C.line}` }}>
          <Typography sx={{ fontFamily: MONO, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Coiled stocks in pool
          </Typography>
          <Typography sx={{ fontFamily: MONO, fontSize: 19, fontWeight: 600, color: C.text, mt: 0.25 }}>
            {nCoil}
          </Typography>
        </Box>
        <Box sx={{ p: 1.5, borderRadius: 1.75, bgcolor: "#111216", border: `1px solid ${C.line}` }}>
          <Typography sx={{ fontFamily: MONO, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Last qualifying setups
          </Typography>
          <Typography sx={{ fontFamily: MONO, fontSize: 19, fontWeight: 600, color: C.text, mt: 0.25 }}>
            {lastSetupDate || "—"}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5 }}>
        <Typography sx={{ fontSize: 12.75, color: C.muted }}>
          Setups appear when a coiled stock&apos;s sector is in <Box component="span" sx={{ fontFamily: MONO, color: C.text }}>CROSSING</Box> or <Box component="span" sx={{ fontFamily: MONO, color: C.text }}>PULLBACK</Box>. Sitting out is part of the methodology.
        </Typography>
        <Box
          role="button"
          tabIndex={0}
          onClick={onSwitchToRest}
          sx={{
            px: 1.5,
            py: 0.65,
            borderRadius: 1.5,
            bgcolor: "rgba(142,180,196,0.08)",
            border: "1px solid rgba(142,180,196,0.22)",
            cursor: "pointer",
            "&:hover": { bgcolor: "rgba(142,180,196,0.14)" },
          }}
        >
          <Typography sx={{ fontSize: 12, color: C.accent, fontWeight: 600 }}>
            View Leaders at rest →
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function StaleSetupsBanner({ status, onSwitchToRest }) {
  return (
    <Box
      sx={{
        mb: 1.75,
        px: 2,
        py: 1,
        borderRadius: 2,
        border: "1px solid rgba(196,164,106,0.25)",
        bgcolor: "rgba(196,164,106,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 1.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <WarningAmberRoundedIcon sx={{ fontSize: 17, color: C.warn, flexShrink: 0 }} />
        <Typography sx={{ fontSize: 12.5, color: C.muted }}>
          <Box component="span" sx={{ fontFamily: MONO, fontWeight: 600, color: C.warn }}>
            No sector agreed in {status?.session || status?.as_of}:
          </Box>{" "}
          showing last qualifying list from{" "}
          <Box component="span" sx={{ fontFamily: MONO, color: C.text }}>{status?.dates?.setups}</Box>{" "}
          (historical reference).
        </Typography>
      </Box>
      <Box
        role="button"
        tabIndex={0}
        onClick={onSwitchToRest}
        sx={{
          fontFamily: MONO,
          fontSize: 11.5,
          color: C.accent,
          cursor: "pointer",
          "&:hover": { textDecoration: "underline" },
        }}
      >
        Leaders at rest is current →
      </Box>
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
  const [filter, setFilter] = useState("agree");

  const counts = { agree: buys.length, rest: rest.length };

  const previewBuys = isPremium ? buys : buys.slice(0, FREE_PREVIEW_SETUPS);
  const previewRest = isPremium ? rest : rest.slice(0, FREE_PREVIEW_LEADERS);

  const setupsStale = (status?.stale || []).includes("setups");
  const noSetupsAtAll = buys.length === 0 && setupsStale;

  const telemetry = useMemo(() => {
    const nConfirmed = buys.filter((r) => r.shape_confirmed).length;
    const bySector = buys.reduce((acc, r) => {
      acc[r.sector] = (acc[r.sector] || 0) + 1;
      return acc;
    }, {});
    const sectors = Object.keys(bySector).sort((a, b) => bySector[b] - bySector[a]);
    const topSector = sectors[0];
    return {
      nConfirmed,
      agreeSectors: sectors.length,
      topSector,
      topSectorCount: topSector ? bySector[topSector] : 0,
      nCoil: status?.n_coil ?? (buys.length + rest.length),
      session: status?.as_of || status?.session || "Latest EOD",
    };
  }, [buys, rest, status]);

  const activeSymbols = useMemo(() => {
    const list = filter === "agree" ? previewBuys : previewRest;
    return list.map((r) => r.symbol).filter(Boolean);
  }, [filter, previewBuys, previewRest]);

  const baseStrip = STAT_STRIPS.setups;

  return (
    <Box sx={{ pb: 6 }}>
      <UpdateBanner asOf={status?.as_of} />

      {/* Compact Architectural Header Card */}
      <Box
        sx={{
          bgcolor: "#15161b",
          border: `1px solid ${C.line}`,
          borderRadius: 2.5,
          p: { xs: 2, sm: 2.5 },
          mb: 2,
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
          {/* Title & concise description */}
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
              Actionable Setups &amp; Coiled Leaders
            </Typography>
            <Typography sx={{ fontSize: 13, color: C.muted, mt: 0.35 }}>
              {filter === "agree"
                ? "Coiled stocks whose sector is also waking up or resting after a volume surge. Act on a close through the breakout level on heavy volume."
                : "Coiled stocks in the top 30% of the market on 12-month return, ordered by risk-adjusted trend steadiness (top 20)."}
            </Typography>
          </Box>

          {/* Segmented Mode Switcher + TV Copy */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap", flexShrink: 0 }}>
            <Box
              sx={{
                display: "inline-flex",
                gap: 0.5,
                p: 0.5,
                borderRadius: 1.75,
                bgcolor: "#0c0d10",
                border: `1px solid ${C.line}`,
              }}
            >
              {FILTERS.map((f) => {
                const active = filter === f.id;
                return (
                  <Tooltip key={f.id} title={f.help} placement="top" arrow enterDelay={300}>
                    <Box
                      role="button"
                      tabIndex={0}
                      onClick={() => setFilter(f.id)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.85,
                        px: 1.5,
                        py: 0.65,
                        borderRadius: 1.25,
                        cursor: "pointer",
                        bgcolor: active ? "#1b1d24" : "transparent",
                        border: active ? "1px solid rgba(238,234,227,0.14)" : "1px solid transparent",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          bgcolor: active ? "#1b1d24" : "rgba(255,255,255,0.03)",
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 12.5,
                          fontWeight: active ? 600 : 400,
                          color: active ? C.text : C.muted,
                        }}
                      >
                        {f.label}
                      </Typography>
                      <Box
                        component="span"
                        sx={{
                          px: 0.7,
                          py: 0.1,
                          borderRadius: 0.85,
                          bgcolor: active ? "rgba(142,180,196,0.16)" : "rgba(255,255,255,0.04)",
                          fontFamily: MONO,
                          fontSize: 10.5,
                          color: active ? C.accent : C.muted,
                        }}
                      >
                        {counts[f.id] || 0}
                      </Box>
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>

            {activeSymbols.length > 0 && <TvCopyButton symbols={activeSymbols} />}
          </Box>
        </Box>

        {/* Compact Single-Line Telemetry Bar */}
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
              <Typography sx={{ fontSize: 11.5, color: C.muted }}>
                ({telemetry.nConfirmed} shape confirmed)
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>UNIVERSE COIL POOL:</Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 600, color: C.text }}>
                {telemetry.nCoil}
              </Typography>
            </Box>

            {filter === "agree" && buys.length > 1 && telemetry.topSector && (
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
                <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>CONCENTRATION:</Typography>
                <Typography sx={{ fontSize: 12, color: C.text, fontWeight: 500 }}>
                  {telemetry.topSector}
                </Typography>
                <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: C.good }}>
                  ({telemetry.topSectorCount}/{buys.length} · {Math.round((telemetry.topSectorCount / buys.length) * 100)}%)
                </Typography>
              </Box>
            )}
          </Box>

          {filter === "agree" && baseStrip && (
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

      {filter === "agree" ? (
        <>
          {noSetupsAtAll ? (
            <MarketQuietCard status={status} onSwitchToRest={() => setFilter("rest")} />
          ) : setupsStale ? (
            <>
              <StaleSetupsBanner status={status} onSwitchToRest={() => setFilter("rest")} />
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
            </>
          ) : (
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
          )}
        </>
      ) : (
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
      )}
    </Box>
  );
}
