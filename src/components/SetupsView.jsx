/**
 * Setups — one page, two cuts of the same coil pool.
 *
 * "Sector agrees" is the default: coiled stocks whose sector is also moving.
 * "Leaders at rest" drops the sector-acting condition (keeping only the
 * DISQUALIFIED exclusion) and instead ranks the market leaders in the pool by
 * risk-adjusted 12-month momentum, keeping 20.
 *
 * Both are deliberately short. The unranked 63-name pool and the separate
 * 80-name momentum list were removed because neither was a list anyone would
 * finish reading, and ranking the pool by momentum measured better than
 * either of them — see eval_listsize.py.
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

const MONO = '"IBM Plex Mono", ui-monospace, monospace';
const FREE_PREVIEW_SETUPS = 1;
const FREE_PREVIEW_LEADERS = 2;

const FILTERS = [
  {
    id: "agree",
    label: "Sector agrees",
    sub: "Sector must agree (Crossing / Pullback)",
    help: "Coiled stocks whose sector is also waking up or resting after waking up. Grouped by sector, because names inside one sector tend to resolve together. In the backtest window, more of these traded above the same session's all-stock median 20 days later than coils alone. One window, not a promise.",
  },
  {
    id: "rest",
    label: "Leaders at rest",
    sub: "Top 30% 12M momentum · Steadiest trends",
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
        mb: 3,
        p: { xs: 2.5, sm: 3.5 },
        borderRadius: 2.5,
        border: `1px solid ${C.line}`,
        bgcolor: "#15161b",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.75, mb: 2.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: "rgba(196,164,106,0.12)",
            border: "1px solid rgba(196,164,106,0.28)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.warn,
            flexShrink: 0,
          }}
        >
          <PauseCircleOutlineRoundedIcon sx={{ fontSize: 22 }} />
        </Box>
        <Box>
          <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: C.warn, mb: 0.35 }}>
            ZERO SECTOR INTERSECTION · SITTING OUT
          </Typography>
          <Typography sx={{ fontSize: 16.5, fontWeight: 600, color: C.text }}>
            Market isn&apos;t offering sector-aligned setups right now
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: C.muted }}>
            As of {session} — the scan ran, but no Acting sectors intersected with coiled stocks
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: "#111216", border: `1px solid ${C.line}` }}>
          <Typography sx={{ fontFamily: MONO, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Sectors in uptrend
          </Typography>
          <Typography sx={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, color: bullish > 0 ? C.warn : C.muted, mt: 0.4 }}>
            {bullish}
            <Typography component="span" sx={{ fontFamily: MONO, fontSize: 13, color: C.muted, fontWeight: 400 }}>
              /{total}
            </Typography>
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: C.muted, mt: 0.2 }}>
            {pct}% — needs ≥40% breadth for broad setups
          </Typography>
        </Box>
        <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: "#111216", border: `1px solid ${C.line}` }}>
          <Typography sx={{ fontFamily: MONO, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Coiled stocks in pool
          </Typography>
          <Typography sx={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, color: C.text, mt: 0.4 }}>
            {nCoil}
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: C.muted, mt: 0.2 }}>
            Compressed — waiting for sector rotation
          </Typography>
        </Box>
        <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: "#111216", border: `1px solid ${C.line}` }}>
          <Typography sx={{ fontFamily: MONO, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Last qualifying setups
          </Typography>
          <Typography sx={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, color: C.text, mt: 0.4 }}>
            {lastSetupDate || "—"}
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: C.muted, mt: 0.2 }}>
            Most recent qualifying list
          </Typography>
        </Box>
      </Box>

      <Typography sx={{ fontSize: 13.25, color: C.muted, lineHeight: 1.65 }}>
        Setups appear when a coiled stock&apos;s sector is also in <Box component="span" sx={{ fontFamily: MONO, color: C.text }}>CROSSING</Box> or <Box component="span" sx={{ fontFamily: MONO, color: C.text }}>PULLBACK</Box>.
        Right now most sectors are basing or declining, so the intersection is empty.
        This is the system working — not every session produces a setup, and sitting out is part of the methodology.
      </Typography>

      <Box
        role="button"
        tabIndex={0}
        onClick={onSwitchToRest}
        sx={{
          mt: 2,
          p: 1.5,
          borderRadius: 1.75,
          bgcolor: "rgba(142,180,196,0.06)",
          border: "1px solid rgba(142,180,196,0.18)",
          display: "inline-flex",
          alignItems: "center",
          gap: 1,
          cursor: "pointer",
          "&:hover": { bgcolor: "rgba(142,180,196,0.10)" },
        }}
      >
        <Typography sx={{ fontSize: 12.5, color: C.accent, fontWeight: 500 }}>
          Switch to &ldquo;Leaders at rest&rdquo; →
        </Typography>
        <Typography sx={{ fontSize: 12, color: C.muted }}>
          Ranks coiled 12-month leaders without requiring immediate sector agreement.
        </Typography>
      </Box>
    </Box>
  );
}

function StaleSetupsBanner({ status }) {
  return (
    <Box
      sx={{
        mb: 2.5,
        px: 2.25,
        py: 1.5,
        borderRadius: 2,
        border: "1px solid rgba(196,164,106,0.25)",
        bgcolor: "rgba(196,164,106,0.07)",
        display: "flex",
        alignItems: "flex-start",
        gap: 1.5,
      }}
    >
      <WarningAmberRoundedIcon sx={{ fontSize: 19, color: C.warn, mt: 0.25 }} />
      <Box>
        <Typography sx={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: C.warn }}>
          No sector agreed in the {status?.session || status?.as_of} session
        </Typography>
        <Typography sx={{ fontSize: 12.5, color: C.muted, mt: 0.25 }}>
          Below is the last list that had any, from{" "}
          <Box component="span" sx={{ fontFamily: MONO, color: C.text }}>{status?.dates?.setups}</Box> — historical reference, not tonight&apos;s candidates.{" "}
          <Box component="span" sx={{ color: C.text }}>Leaders at rest</Box> is current.
        </Typography>
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
    const agreeSectors = new Set(buys.map((r) => r.sector).filter(Boolean)).size;
    return {
      nConfirmed,
      agreeSectors,
      nCoil: status?.n_coil ?? (buys.length + rest.length),
      session: status?.as_of || status?.session || "Latest EOD",
    };
  }, [buys, rest, status]);

  const activeSymbols = useMemo(() => {
    const list = filter === "agree" ? previewBuys : previewRest;
    return list.map((r) => r.symbol).filter(Boolean);
  }, [filter, previewBuys, previewRest]);

  return (
    <Box sx={{ maxWidth: 1320, pb: 6 }}>
      <UpdateBanner asOf={status?.as_of} />

      {/* Architectural Header Card */}
      <Box
        sx={{
          bgcolor: "#15161b",
          border: `1px solid ${C.line}`,
          borderRadius: 3,
          p: { xs: 2.5, sm: 3.5 },
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            gap: 2,
            mb: 2.5,
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 0.75 }}>
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: 10.5,
                  letterSpacing: "0.18em",
                  color: C.accent,
                  textTransform: "uppercase",
                }}
              >
                POST-MARKET COIL SHORTLIST
              </Typography>
              <Box
                component="span"
                sx={{
                  px: 1,
                  py: 0.2,
                  borderRadius: 1,
                  bgcolor: "rgba(255,255,255,0.04)",
                  border: `1px solid ${C.line}`,
                  fontFamily: MONO,
                  fontSize: 10.5,
                  color: C.muted,
                }}
              >
                As of {telemetry.session} · 20:30 IST
              </Box>
            </Box>
            <Typography
              sx={{
                fontSize: { xs: 22, sm: 26 },
                fontWeight: 600,
                letterSpacing: "-0.025em",
                color: C.text,
                lineHeight: 1.2,
              }}
            >
              Actionable Setups & Coiled Leaders
            </Typography>
            <Typography sx={{ fontSize: 13.75, color: C.muted, mt: 0.6, maxWidth: 700 }}>
              {filter === "agree"
                ? "Coiled stocks whose sector is also waking up or resting after a volume surge. Wait for a close through the breakout level on heavy volume — none of these has triggered at today's price."
                : "Coiled stocks in the top 30% of the market on 12-month return, ordered by risk-adjusted trend steadiness and capped at 20."}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            {activeSymbols.length > 0 && <TvCopyButton symbols={activeSymbols} />}
          </Box>
        </Box>

        {/* Live 4-Metric Telemetry Strip */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
            gap: 1.5,
            mb: 2.5,
          }}
        >
          {[
            {
              label: "SECTOR AGREES",
              value: buys.length,
              color: buys.length > 0 ? C.good : C.muted,
              sub: `${telemetry.agreeSectors} active ${telemetry.agreeSectors === 1 ? "sector" : "sectors"}`,
            },
            {
              label: "SHAPE CONFIRMED",
              value: telemetry.nConfirmed,
              color: telemetry.nConfirmed > 0 ? C.good : C.muted,
              sub: "Passed all pullback checks",
            },
            {
              label: "LEADERS AT REST",
              value: rest.length,
              color: C.accent,
              sub: "Top 30% 12M momentum",
            },
            {
              label: "UNIVERSE COIL POOL",
              value: telemetry.nCoil,
              color: C.text,
              sub: "Clearing all 7 coil gates",
            },
          ].map((m) => (
            <Box
              key={m.label}
              sx={{
                p: 1.75,
                borderRadius: 2,
                bgcolor: "#111216",
                border: `1px solid ${C.line}`,
              }}
            >
              <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", color: C.muted }}>
                {m.label}
              </Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, color: m.color, mt: 0.4 }}>
                {m.value}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: C.muted, mt: 0.2 }}>
                {m.sub}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Segmented Mode Switcher */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              flexWrap: "wrap",
              gap: 0.75,
              p: 0.6,
              borderRadius: 2,
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
                      gap: 1,
                      px: 2,
                      py: 0.85,
                      borderRadius: 1.5,
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
                        fontSize: 13,
                        fontWeight: active ? 600 : 400,
                        color: active ? C.text : C.muted,
                      }}
                    >
                      {f.label}
                    </Typography>
                    <Box
                      component="span"
                      sx={{
                        px: 0.8,
                        py: 0.15,
                        borderRadius: 1,
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

          <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.muted, display: { xs: "none", sm: "block" } }}>
            {filter === "agree"
              ? "MODE: SECTOR INTERSECTION (CROSSING / PULLBACK)"
              : "MODE: RISK-ADJUSTED 12M MOMENTUM (TOP 20)"}
          </Typography>
        </Box>
      </Box>

      {filter === "agree" ? (
        <>
          {noSetupsAtAll ? (
            <MarketQuietCard status={status} onSwitchToRest={() => setFilter("rest")} />
          ) : setupsStale ? (
            <>
              <StaleSetupsBanner status={status} />
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
