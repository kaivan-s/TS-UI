/**
 * Market — unified view merging Circuit carry and Market scanners.
 *
 * Top-level screens:
 *   Gap-ups in downtrends (09:00–09:30) · Circuit carry · Big movers ·
 *   Unusual volume · Streaks · 52w breakouts · Sector pulse
 *
 * Circuit carry has its own internal sub-tabs (Today's scan / Past observations).
 */

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { getCarryIntraday, getGapFade, getScanners } from "../api.js";
import { C } from "../theme.js";
import { TvCopyButton } from "./ui.jsx";

import CarryView from "./CarryView.jsx";
import GapFadeView from "./GapFadeView.jsx";
import ScannersView from "./ScannersView.jsx";

const MONO = '"IBM Plex Mono", ui-monospace, monospace';
const POLL_MS = 5 * 60 * 1000;
const GAP_POLL_MS = 30 * 1000;
const GAP_TAB = 6;

function istMinutes() {
  const ist = new Date(Date.now() + (5.5 * 60 + new Date().getTimezoneOffset()) * 60000);
  return { day: ist.getDay(), mins: ist.getHours() * 60 + ist.getMinutes() };
}

// 08:59–09:35 IST on weekdays: pre-open through the end of the gap window.
function gapWindowNow() {
  const { day, mins } = istMinutes();
  return day >= 1 && day <= 5 && mins >= 8 * 60 + 59 && mins <= 9 * 60 + 35;
}

// NSE cash session, Mon–Fri 09:15–15:30 IST. Exchange holidays aren't known
// here, so a holiday weekday reads as open until the data says otherwise.
function marketOpenNow() {
  const ist = new Date(Date.now() + (5.5 * 60 + new Date().getTimezoneOffset()) * 60000);
  const day = ist.getDay();
  const mins = ist.getHours() * 60 + ist.getMinutes();
  return day >= 1 && day <= 5 && mins >= 9 * 60 + 15 && mins <= 15 * 60 + 30;
}

export default function MarketView({ onOpenStock }) {
  const [tab, setTab] = useState(() => (gapWindowNow() ? GAP_TAB : 0));
  const [intradayData, setIntradayData] = useState(null);
  const [scanData, setScanData] = useState(null);
  const [gapData, setGapData] = useState(null);
  const [gapErr, setGapErr] = useState(null);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState(null);

  const loadGap = useCallback(async (force = false) => {
    try {
      setGapData(await getGapFade(force));
      setGapErr(null);
    } catch (e) {
      setGapErr(e?.message || "Could not load pre-open data");
    }
  }, []);

  const load = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      const [intraday, scanners] = await Promise.all([
        getCarryIntraday(),
        getScanners(),
        loadGap(),
      ]);
      setIntradayData(intraday);
      setScanData(scanners);
    } catch (e) {
      setErr(e?.message || "Could not load market data");
    } finally {
      setBusy(false);
    }
  }, [loadGap]);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => {
      if (gapWindowNow()) loadGap();
    }, GAP_POLL_MS);
    return () => clearInterval(id);
  }, [loadGap]);

  if (busy && !intradayData && !scanData) {
    return (
      <Box
        sx={{
          p: 6,
          borderRadius: 3,
          bgcolor: "#15161b",
          border: `1px solid ${C.line}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <CircularProgress size={24} sx={{ color: C.accent }} />
        <Typography sx={{ fontFamily: MONO, fontSize: 12.5, color: C.muted }}>
          Loading market scanners &amp; circuit telemetry…
        </Typography>
      </Box>
    );
  }

  if (err && !intradayData && !scanData) {
    return (
      <Box
        sx={{
          p: 3,
          borderRadius: 2.5,
          bgcolor: "rgba(200,122,122,0.08)",
          border: "1px solid rgba(200,122,122,0.22)",
          color: C.bad,
          fontSize: 14,
        }}
      >
        {err}
      </Box>
    );
  }

  const movers = scanData?.big_movers || [];
  const volume = scanData?.unusual_volume || [];
  const streaks = scanData?.momentum_streaks || [];
  const breakouts = scanData?.breakouts_52w || [];
  const sectors = scanData?.sector_pulse || [];
  const intradayLatest = intradayData?.latest || [];
  const intradayCount = intradayLatest.length;
  const gapRows = gapData?.rows || [];

  const TABS = [
    { id: GAP_TAB, label: "Gap-Ups in Downtrends", count: gapRows.length, symbols: gapRows.map((r) => r.symbol) },
    { id: 0, label: "Circuit Carry", count: intradayCount, symbols: intradayLatest.map((r) => r.symbol) },
    { id: 1, label: "Big Movers", count: movers.length, symbols: movers.map((r) => r.symbol) },
    { id: 2, label: "Unusual Volume", count: volume.length, symbols: volume.map((r) => r.symbol) },
    { id: 3, label: "Momentum Streaks", count: streaks.length, symbols: streaks.map((r) => r.symbol) },
    { id: 4, label: "52W Breakouts", count: breakouts.length, symbols: breakouts.map((r) => r.symbol) },
    { id: 5, label: "Sector Pulse", count: sectors.length, symbols: sectors.map((r) => r.best_stock).filter(Boolean) },
  ];

  const activeSymbols = TABS.find((t) => t.id === tab)?.symbols || [];
  const live = marketOpenNow();

  return (
    <Box sx={{ pb: 6 }}>
      {/* Top Architectural Header Card */}
      <Box
        sx={{
          p: { xs: 2.5, sm: 3.25 },
          mb: 3,
          borderRadius: 3,
          bgcolor: "#15161b",
          border: `1px solid ${C.line}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            alignItems: { xs: "flex-start", lg: "flex-end" },
            justifyContent: "space-between",
            gap: 2.5,
          }}
        >
          <Box sx={{ maxWidth: 640 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: live ? C.good : C.muted }} />
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: 10.5,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: C.accent,
                }}
              >
                INTRADAY &amp; EOD SCANNERS {scanData?.scan_time ? `· ${scanData.scan_time} IST` : ""}
              </Typography>
              <Box
                component="span"
                sx={{
                  px: 0.75,
                  py: "1px",
                  borderRadius: 0.75,
                  fontFamily: MONO,
                  fontSize: 9.5,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  color: live ? C.good : C.muted,
                  bgcolor: live ? "rgba(125,186,150,0.12)" : "rgba(238,234,227,0.05)",
                  border: `1px solid ${live ? "rgba(125,186,150,0.32)" : "rgba(238,234,227,0.16)"}`,
                }}
              >
                {live ? "LIVE" : "MARKET CLOSED"}
              </Box>
            </Box>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: 22, sm: 26 },
                fontWeight: 600,
                color: C.text,
                letterSpacing: "-0.03em",
                mb: 0.75,
              }}
            >
              Market Scanners &amp; Circuit Carry
            </Typography>
            <Typography sx={{ fontSize: 13.75, color: C.muted, lineHeight: 1.6 }}>
              Upper-circuit carries with order-book fill telemetry alongside big movers, volume spikes, multi-day streaks, 52-week highs, and sector breadth.
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: live ? C.muted : C.warn, lineHeight: 1.55, mt: 0.75 }}>
              {live
                ? "Live while the market is open (Mon–Fri, 9:15 AM – 3:30 PM IST), refreshing every 5 minutes."
                : "Live only while the market is open (Mon–Fri, 9:15 AM – 3:30 PM IST). Right now you're seeing the last session's data."}
            </Typography>
          </Box>

          {/* Refresh & TradingView Copy */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
            {activeSymbols.length > 0 && <TvCopyButton symbols={activeSymbols} />}
            <Button
              size="small"
              variant="outlined"
              onClick={load}
              disabled={busy}
              startIcon={
                busy ? (
                  <CircularProgress size={13} sx={{ color: C.muted }} />
                ) : (
                  <RefreshRoundedIcon sx={{ fontSize: 15 }} />
                )
              }
              sx={{
                fontSize: 12,
                fontFamily: MONO,
                color: C.text,
                borderColor: C.line,
                bgcolor: "#0e0f12",
                px: 1.5,
                "&:hover": { borderColor: C.accent, color: C.accent },
              }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Bottom Segmented Scanner Navigation */}
        <Box
          sx={{
            mt: 2.75,
            pt: 2.25,
            borderTop: `1px solid ${C.line}`,
            display: "flex",
            flexWrap: "wrap",
            gap: 0.85,
          }}
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <Box
                key={t.id}
                role="button"
                tabIndex={0}
                onClick={() => setTab(t.id)}
                onKeyDown={(e) => e.key === "Enter" && setTab(t.id)}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 1.5,
                  cursor: "pointer",
                  bgcolor: active ? "rgba(238,234,227,0.1)" : "#0e0f12",
                  border: `1px solid ${active ? "rgba(238,234,227,0.22)" : C.line}`,
                  color: active ? C.text : C.muted,
                  transition: "all 0.15s ease",
                  "&:hover": { color: C.text, borderColor: "rgba(238,234,227,0.2)" },
                }}
              >
                <Typography sx={{ fontSize: 12.75, fontWeight: active ? 600 : 500 }}>
                  {t.label}
                </Typography>
                <Box
                  component="span"
                  sx={{
                    px: 0.65,
                    py: "1px",
                    borderRadius: 0.75,
                    bgcolor: active ? "rgba(142,180,196,0.18)" : "rgba(255,255,255,0.04)",
                    fontFamily: MONO,
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: active ? C.accent : C.muted,
                  }}
                >
                  {t.count}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Active Scanner View */}
      {tab === GAP_TAB && (
        <GapFadeView data={gapData} error={gapErr} onOpenStock={onOpenStock} />
      )}
      {tab === 0 && (
        <CarryView
          onOpenStock={onOpenStock}
          externalIntraday={intradayData}
          embedded
        />
      )}
      {tab === 1 && (
        <ScannersView onOpenStock={onOpenStock} externalData={scanData} embedded embeddedTab={0} />
      )}
      {tab === 2 && (
        <ScannersView onOpenStock={onOpenStock} externalData={scanData} embedded embeddedTab={1} />
      )}
      {tab === 3 && (
        <ScannersView onOpenStock={onOpenStock} externalData={scanData} embedded embeddedTab={2} />
      )}
      {tab === 4 && (
        <ScannersView onOpenStock={onOpenStock} externalData={scanData} embedded embeddedTab={3} />
      )}
      {tab === 5 && (
        <ScannersView onOpenStock={onOpenStock} externalData={scanData} embedded embeddedTab={4} />
      )}
    </Box>
  );
}
