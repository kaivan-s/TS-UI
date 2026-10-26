/**
 * Setups — unified view with tabs for coils, market scanners, and circuit carry.
 *
 * Tabs: Coils | Big Movers | Unusual Volume | 52w Breakouts | Streaks | Sector Pulse | Circuit Carry
 *
 * Coils tab shows the original coil watchlist. Market scanner tabs lazy-load
 * data from /api/scanners and /api/carry/intraday on first click.
 */

import { useCallback, useEffect, useMemo, useState, Fragment } from "react";
import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { PremiumOverlay } from "./Premium.jsx";
import { useAuth } from "../auth.jsx";
import UpdateBanner from "./UpdateBanner.jsx";
import { CoilBar, HeadCell, MultiSelect, TvCopyButton, WhyRow, useTableSort } from "./ui.jsx";
import { BookmarkButton } from "../watchlist.jsx";
import { C } from "../theme.js";
import { num, pct } from "../format.js";
import { EVIDENCE_WINDOW, STAT_STRIPS } from "../evidence.js";
import { getCarryIntraday, getGapFade, getScanners } from "../api.js";
import ScannersView from "./ScannersView.jsx";
import GapFadeView from "./GapFadeView.jsx";
import CarryView from "./CarryView.jsx";

const MONO = '"IBM Plex Mono", ui-monospace, monospace';
const FREE_PREVIEW = 3;
const COL_SPAN = 15;

const TABLE_SX = {
  "& .MuiTableCell-stickyHeader, & .MuiTableCell-head": {
    bgcolor: "#0e0f12",
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    py: 1.4,
  },
};

const TREND_STYLE = {
  "↑↑": { color: C.good, label: "Accelerating" },
  "↑": { color: C.good, label: "Growing" },
  "→": { color: "#c4a46a", label: "Flat" },
  "↓": { color: C.bad, label: "Declining" },
  "?": { color: C.muted, label: "No data" },
};

const TAG = {
  agree: {
    label: "Sector agrees",
    color: C.good,
    tip: "This stock's sector is also waking up or resting after a volume surge — the backtested setup.",
  },
  emerging: {
    label: "Emerging",
    color: "#7b8ab8",
    tip: "This stock's sector expanded but breadth or delivery is narrow — watch, don't act.",
  },
  leader: {
    label: "Leader",
    color: C.accent,
    tip: "Top 30% on twelve-month momentum, coiled and quietly basing. Sector-agnostic.",
  },
};

function SourceTag({ type }) {
  const t = TAG[type];
  if (!t) return null;
  return (
    <Tooltip title={t.tip} placement="top" arrow>
      <Box
        component="span"
        sx={{
          px: 0.7,
          py: 0.12,
          borderRadius: 1,
          bgcolor: `${t.color}14`,
          border: `1px solid ${t.color}33`,
          color: t.color,
          fontFamily: MONO,
          fontSize: 9.5,
          fontWeight: 600,
          cursor: "help",
          whiteSpace: "nowrap",
        }}
      >
        {t.label}
      </Box>
    </Tooltip>
  );
}

function EarningsCell({ trend }) {
  const t = trend || "?";
  const s = TREND_STYLE[t] || TREND_STYLE["?"];
  return (
    <Tooltip title={s.label} placement="top" arrow>
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 26,
          px: 0.65,
          py: 0.15,
          borderRadius: 1,
          bgcolor: `${s.color}14`,
          border: `1px solid ${s.color}33`,
          fontFamily: MONO,
          fontSize: 12,
          color: s.color,
          fontWeight: 600,
          cursor: "help",
        }}
      >
        {t}
      </Box>
    </Tooltip>
  );
}

function DividerRow({ label, count, color }) {
  return (
    <TableRow>
      <TableCell
        colSpan={COL_SPAN}
        sx={{
          py: 0.75,
          px: 2,
          bgcolor: "#0c0d10",
          borderBottom: `1px solid ${C.line}`,
          borderTop: `1px solid ${C.line}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: color }} />
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: "0.12em",
              fontWeight: 700,
              color,
              textTransform: "uppercase",
            }}
          >
            {label}
          </Typography>
          <Box
            component="span"
            sx={{
              px: 0.6,
              py: 0.1,
              borderRadius: 0.75,
              bgcolor: `${color}14`,
              border: `1px solid ${color}30`,
              fontFamily: MONO,
              fontSize: 9.5,
              fontWeight: 600,
              color,
            }}
          >
            {count}
          </Box>
        </Box>
      </TableCell>
    </TableRow>
  );
}

// NSE cash session, Mon–Fri 09:15–15:30 IST.
function marketOpenNow() {
  const ist = new Date(Date.now() + (5.5 * 60 + new Date().getTimezoneOffset()) * 60000);
  const day = ist.getDay();
  const mins = ist.getHours() * 60 + ist.getMinutes();
  return day >= 1 && day <= 5 && mins >= 9 * 60 + 15 && mins <= 15 * 60 + 30;
}

const SCAN_POLL_MS = 5 * 60 * 1000;
const GAP_POLL_MS = 30 * 1000;

// 08:59–09:35 IST on weekdays: pre-open through the end of the gap window.
function gapWindowNow() {
  const ist = new Date(Date.now() + (5.5 * 60 + new Date().getTimezoneOffset()) * 60000);
  const day = ist.getDay();
  const mins = ist.getHours() * 60 + ist.getMinutes();
  return day >= 1 && day <= 5 && mins >= 8 * 60 + 59 && mins <= 9 * 60 + 35;
}

const TOP_TABS = [
  { id: "coils", label: "Coils" },
  { id: "gap_fade", label: "Gap-Ups in Downtrends", live: true },
  { id: "big_movers", label: "Big Movers", live: true },
  { id: "unusual_volume", label: "Unusual Vol", live: true },
  { id: "breakouts_52w", label: "52W Breakouts" },
  { id: "momentum_streaks", label: "Streaks" },
  { id: "sector_pulse", label: "Sector Pulse", live: true },
  { id: "circuit_carry", label: "Circuit Carry", live: true },
];

export default function SetupsView({
  buys,
  rest,
  status,
  onOpenSector,
  onOpenStock,
}) {
  const { isPremium } = useAuth();
  const [topTab, setTopTab] = useState(() => (gapWindowNow() ? "gap_fade" : "coils"));
  const [gapData, setGapData] = useState(null);
  const [gapErr, setGapErr] = useState(null);

  const loadGap = useCallback(async () => {
    try {
      setGapData(await getGapFade());
      setGapErr(null);
    } catch (e) {
      setGapErr(e?.message || "Could not load pre-open data");
    }
  }, []);

  useEffect(() => {
    loadGap();
    const id = setInterval(() => {
      if (gapWindowNow()) loadGap();
    }, GAP_POLL_MS);
    return () => clearInterval(id);
  }, [loadGap]);
  const [q, setQ] = useState("");
  const [sectorPick, setSectorPick] = useState([]);

  // Lazy-load market scanner data
  const [scanData, setScanData] = useState(null);
  const [intradayData, setIntradayData] = useState(null);
  const [scanBusy, setScanBusy] = useState(false);
  const [scanLoaded, setScanLoaded] = useState(false);

  const loadScanners = useCallback(async () => {
    if (scanBusy) return;
    setScanBusy(true);
    try {
      const [scanners, intraday] = await Promise.all([
        getScanners(),
        getCarryIntraday(),
      ]);
      setScanData(scanners);
      setIntradayData(intraday);
      setScanLoaded(true);
    } catch {
      // silent — scanner data is supplementary
    } finally {
      setScanBusy(false);
    }
  }, [scanBusy]);

  // Load scanner data on first non-coils tab click, then poll while market is open
  useEffect(() => {
    if (topTab === "coils") return;
    if (!scanLoaded) loadScanners();
  }, [topTab, scanLoaded]);

  useEffect(() => {
    if (topTab === "coils" || !scanLoaded) return;
    const id = setInterval(loadScanners, SCAN_POLL_MS);
    return () => clearInterval(id);
  }, [topTab, scanLoaded]);

  const isMarketTab = topTab !== "coils";

  const sort = useTableSort({
    key: null,
    dir: "asc",
    dirFor: (k) =>
      k === "symbol" || k === "sector" ? "asc" : "desc",
  });

  // Build a unified list: tag each row with its source(s)
  const { merged, nAgree, nLeader, nEmerging } = useMemo(() => {
    const agreeSet = new Set(buys.map((r) => r.symbol));
    const leaderSet = new Set(rest.map((r) => r.symbol));

    const bySymbol = new Map();

    // Sector-agrees rows first
    for (const r of buys) {
      const isEmerging = r.sector_klass === "CROSSING_UNVERIFIED";
      bySymbol.set(r.symbol, {
        ...r,
        _agree: !isEmerging,
        _emerging: isEmerging,
        _leader: leaderSet.has(r.symbol),
        _section: isEmerging ? "emerging" : "agree",
      });
    }

    // Leaders-at-rest rows (only add if not already in buys)
    for (const r of rest) {
      if (bySymbol.has(r.symbol)) {
        // Already present from buys — just tag as leader too
        const existing = bySymbol.get(r.symbol);
        existing._leader = true;
        // Merge momentum data from leader row
        if (r.mom12_1 != null) existing.mom12_1 = r.mom12_1;
        if (r.episode_days != null) existing.episode_days = r.episode_days;
        if (r.episode_new != null) existing.episode_new = r.episode_new;
      } else {
        bySymbol.set(r.symbol, {
          ...r,
          _agree: false,
          _emerging: false,
          _leader: true,
          _section: "leader",
        });
      }
    }

    const all = Array.from(bySymbol.values());
    return {
      merged: all,
      nAgree: all.filter((r) => r._agree).length,
      nEmerging: all.filter((r) => r._emerging).length,
      nLeader: all.filter((r) => r._leader && !r._agree && !r._emerging).length,
    };
  }, [buys, rest]);

  // Filter
  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    const filtered = merged.filter((r) => {
      if (sectorPick.length && !sectorPick.includes(r.sector)) return false;
      if (!query) return true;
      return (
        (r.symbol || "").toLowerCase().includes(query) ||
        (r.sector || "").toLowerCase().includes(query)
      );
    });

    // When sorting is active, sort flat; otherwise keep section grouping
    if (sort.key) return sort.apply(filtered);

    // Default order: agree → emerging → leader-only
    const order = { agree: 0, emerging: 1, leader: 2 };
    return filtered.sort(
      (a, b) =>
        (order[a._section] ?? 9) - (order[b._section] ?? 9) ||
        (b.coil ?? 0) - (a.coil ?? 0),
    );
  }, [merged, q, sectorPick, sort.key, sort.dir]);

  const sectorOptions = useMemo(
    () => [...new Set(merged.map((r) => r.sector).filter(Boolean))].sort(),
    [merged],
  );

  const previewRows = isPremium ? shown : shown.slice(0, FREE_PREVIEW);
  const filtering = q.trim() || sectorPick.length;

  const setupsStale = (status?.stale || []).includes("setups");
  const session = status?.as_of || status?.session || "Latest EOD";

  const baseStrip = STAT_STRIPS.setups;

  // Split shown rows into sections for divider rows (only when not custom-sorted)
  const agreeRows = previewRows.filter((r) => r._section === "agree");
  const emergingRows = previewRows.filter((r) => r._section === "emerging");
  const leaderRows = previewRows.filter((r) => r._section === "leader");
  const useSections = !sort.key;

  // Scanner tab counts
  const scanCounts = useMemo(() => {
    if (!scanData) return {};
    return {
      big_movers: (scanData.big_movers || []).length,
      unusual_volume: (scanData.unusual_volume || []).length,
      breakouts_52w: (scanData.breakouts_52w || []).length,
      momentum_streaks: (scanData.momentum_streaks || []).length,
      sector_pulse: (scanData.sector_pulse || []).length,
      circuit_carry: (intradayData?.latest || []).length,
    };
  }, [scanData, intradayData]);
  const tabCounts = { ...scanCounts, gap_fade: gapData ? (gapData.rows || []).length : undefined };

  // Map scanner tab id to ScannersView embeddedTab index
  const SCANNER_TAB_MAP = {
    big_movers: 0,
    unusual_volume: 1,
    momentum_streaks: 2,
    breakouts_52w: 3,
    sector_pulse: 4,
  };

  const live = marketOpenNow();

  return (
    <Box sx={{ pb: 6 }}>
      <UpdateBanner asOf={status?.as_of} />

      {/* ─── Top-level tab bar ─── */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 0.75,
          mb: 2.5,
        }}
      >
        {TOP_TABS.map((t) => {
          const active = topTab === t.id;
          const count = t.id === "coils"
            ? merged.length
            : tabCounts[t.id];
          const showDot = t.live && live;
          return (
            <Box
              key={t.id}
              role="button"
              tabIndex={0}
              onClick={() => setTopTab(t.id)}
              onKeyDown={(e) => e.key === "Enter" && setTopTab(t.id)}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.85,
                px: 1.5,
                py: 0.75,
                borderRadius: 1.5,
                cursor: "pointer",
                bgcolor: active ? "rgba(238,234,227,0.1)" : "#15161b",
                border: `1px solid ${active ? "rgba(238,234,227,0.22)" : C.line}`,
                color: active ? C.text : C.muted,
                transition: "all 0.15s ease",
                "&:hover": { color: C.text, borderColor: "rgba(238,234,227,0.2)" },
              }}
            >
              {showDot && (
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: C.good,
                    flexShrink: 0,
                    boxShadow: "0 0 4px rgba(125,186,150,0.5)",
                  }}
                />
              )}
              <Typography sx={{ fontSize: 12.75, fontWeight: active ? 600 : 500 }}>
                {t.label}
              </Typography>
              {count != null && (
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
                  {count}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      {topTab === "gap_fade" && (
        <GapFadeView data={gapData} error={gapErr} onOpenStock={onOpenStock} />
      )}

      {/* ─── Market scanner tabs ─── */}
      {isMarketTab && topTab !== "gap_fade" && (
        scanBusy && !scanLoaded ? (
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
              Loading market scanners…
            </Typography>
          </Box>
        ) : topTab === "circuit_carry" ? (
          <CarryView
            onOpenStock={onOpenStock}
            externalIntraday={intradayData}
            embedded
          />
        ) : SCANNER_TAB_MAP[topTab] != null ? (
          <ScannersView
            onOpenStock={onOpenStock}
            externalData={scanData}
            embedded
            embeddedTab={SCANNER_TAB_MAP[topTab]}
          />
        ) : null
      )}

      {/* ─── Coils tab content ─── */}
      {topTab === "coils" && <>

      {/* ─── Page header ─── */}
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
                POST-MARKET COIL SHORTLIST · {session} (20:30 IST)
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
              Coil Watchlist
            </Typography>
            <Typography sx={{ fontSize: 13, color: C.muted, mt: 0.35, maxWidth: 680 }}>
              Stocks passing all seven coil filters, split by conviction.
              Sector-agrees names are backtested; leaders are proven
              momentum stocks quietly basing.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexShrink: 0 }}>
            {previewRows.length > 0 && (
              <TvCopyButton symbols={previewRows.map((r) => r.symbol)} />
            )}
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
          <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: { xs: 1.5, sm: 3 } }}>
            <TelemetryItem
              label="Sector agrees"
              value={nAgree}
              color={nAgree > 0 ? C.good : C.muted}
            />
            {nEmerging > 0 && (
              <TelemetryItem
                label="Emerging"
                value={nEmerging}
                color="#7b8ab8"
              />
            )}
            <TelemetryItem
              label="Leaders at rest"
              value={rest.length}
              color={rest.length > 0 ? C.accent : C.muted}
            />
            <TelemetryItem
              label="Coil pool"
              value={status?.n_coil ?? merged.length}
              color={C.text}
            />
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

      {/* Stale banner */}
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
            No sector agreed in the latest session — sector-agrees rows are from{" "}
            <Box component="span" sx={{ fontFamily: MONO, color: C.text }}>
              {status?.dates?.setups}
            </Box>{" "}
            (historical reference). Leaders at rest is current.
          </Typography>
        </Box>
      )}

      {/* ─── Filter bar ─── */}
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
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <MultiSelect
            label="Sector"
            options={sectorOptions}
            selected={sectorPick}
            onChange={setSectorPick}
            width={260}
          />
          <TextField
            size="small"
            placeholder="Symbol or sector…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            sx={{
              width: { xs: "100%", sm: 200 },
              "& .MuiOutlinedInput-root": {
                bgcolor: "#0e0f12",
                borderRadius: 1.5,
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: C.muted }} />
                </InputAdornment>
              ),
            }}
          />
          {filtering && (
            <>
              <Typography sx={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>
                {shown.length} of {merged.length}
              </Typography>
              <Button
                size="small"
                onClick={() => { setQ(""); setSectorPick([]); }}
                sx={{ textTransform: "none", color: C.accent, fontWeight: 500, fontSize: 12 }}
              >
                Clear
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* ─── Unified table ─── */}
      <PremiumOverlay
        previewCount={FREE_PREVIEW}
        totalCount={merged.length}
        feature="Full coil watchlist"
      >
        {merged.length === 0 ? (
          <Box
            sx={{
              p: 4,
              borderRadius: 2.5,
              bgcolor: "#15161b",
              border: `1px solid ${C.line}`,
              textAlign: "center",
            }}
          >
            <Typography sx={{ fontSize: 13.75, color: C.muted, lineHeight: 1.6, maxWidth: 560, mx: "auto" }}>
              No stocks are coiling today — the seven filters found nothing
              that is near its highs, on dry volume, in a tight range, with
              money quietly coming in.
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              bgcolor: "#15161b",
              border: `1px solid ${C.line}`,
              borderRadius: 2.5,
              overflow: "hidden",
            }}
          >
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table stickyHeader sx={{ minWidth: 1020, ...TABLE_SX }}>
                <TableHead>
                  <TableRow>
                    <HeadCell label="" sx={{ width: 34, p: 0 }} />
                    <HeadCell label="Symbol" sort={sort} sortKey="symbol" />
                    <HeadCell label="Source" help="Which list this stock qualifies for" />
                    <HeadCell
                      label="Coiled"
                      help="Sessions since this base first cleared all seven filters. Gaps of up to three sessions do not restart the count, so a base that wobbles for a day keeps its real age. 'New' means it genuinely started today."
                      align="right"
                      sort={sort}
                      sortKey="episode_days"
                    />
                    <HeadCell label="Sector" sort={sort} sortKey="sector" />
                    <HeadCell
                      label="Earnings"
                      help="Trajectory of year-on-year profit growth across recent quarters."
                      align="center"
                      sort={sort}
                      sortKey="earnings_trend"
                    />
                    <HeadCell k="adj" align="right" sort={sort} />
                    <HeadCell k="coil" sx={{ minWidth: 120 }} sort={sort} />
                    <HeadCell k="pos_hi" align="right" sort={sort} />
                    <HeadCell k="to_trigger" align="right" sort={sort} />
                    <HeadCell k="rsi" align="right" sort={sort} />
                    <HeadCell k="vol_ratio" align="right" sort={sort} />
                    <HeadCell k="range20" align="right" sort={sort} />
                    <HeadCell k="cmf" align="right" sort={sort} />
                    <HeadCell
                      label="12m mom"
                      help="Return over twelve months ending one month ago. Shown for leaders at rest."
                      align="right"
                      sort={sort}
                      sortKey="mom12_1"
                    />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {useSections ? (
                    <>
                      {agreeRows.length > 0 && (
                        <>
                          <DividerRow
                            label="Sector agrees"
                            count={nAgree}
                            color={C.good}
                          />
                          {agreeRows.map((r) => (
                            <StockRow
                              key={r.symbol}
                              r={r}
                              onOpenSector={onOpenSector}
                              onOpenStock={onOpenStock}
                            />
                          ))}
                        </>
                      )}
                      {emergingRows.length > 0 && (
                        <>
                          <DividerRow
                            label="Emerging"
                            count={nEmerging}
                            color="#7b8ab8"
                          />
                          {emergingRows.map((r) => (
                            <StockRow
                              key={r.symbol}
                              r={r}
                              onOpenSector={onOpenSector}
                              onOpenStock={onOpenStock}
                            />
                          ))}
                        </>
                      )}
                      {leaderRows.length > 0 && (
                        <>
                          <DividerRow
                            label="Leaders at rest"
                            count={rest.length}
                            color={C.accent}
                          />
                          {leaderRows.map((r) => (
                            <StockRow
                              key={r.symbol}
                              r={r}
                              onOpenSector={onOpenSector}
                              onOpenStock={onOpenStock}
                            />
                          ))}
                        </>
                      )}
                    </>
                  ) : (
                    previewRows.map((r) => (
                      <StockRow
                        key={r.symbol}
                        r={r}
                        onOpenSector={onOpenSector}
                        onOpenStock={onOpenStock}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </PremiumOverlay>

      </>}
    </Box>
  );
}

function TelemetryItem({ label, value, color }) {
  return (
    <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
      <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>
        {label.toUpperCase()}:
      </Typography>
      <Typography
        sx={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 600, color }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function StockRow({ r, onOpenSector, onOpenStock }) {
  const accentColor = r._agree
    ? C.good
    : r._emerging
      ? "#7b8ab8"
      : C.accent;

  return (
    <Fragment>
      <TableRow
        hover
        sx={{
          "& td:first-of-type": { boxShadow: `inset 2px 0 0 ${accentColor}` },
          "&:hover": { bgcolor: "rgba(255,255,255,0.025) !important" },
        }}
      >
        <TableCell sx={{ py: 0, px: 0.5, width: 34 }}>
          <BookmarkButton symbol={r.symbol} />
        </TableCell>
        <TableCell
          onClick={() => onOpenStock?.(r.symbol)}
          sx={{
            fontFamily: MONO,
            fontSize: 13,
            fontWeight: 600,
            color: C.text,
            cursor: onOpenStock ? "pointer" : "default",
            "&:hover": onOpenStock ? { color: C.accent } : {},
          }}
        >
          {r.symbol}
        </TableCell>
        <TableCell sx={{ py: 0.75 }}>
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {r._agree && <SourceTag type="agree" />}
            {r._emerging && <SourceTag type="emerging" />}
            {r._leader && <SourceTag type="leader" />}
            {r.shape_confirmed && (
              <Tooltip
                title="Every shape check passed on this sector: the crossing came from quiet and the red days traded lighter."
                placement="top"
                arrow
              >
                <Box
                  component="span"
                  sx={{
                    px: 0.6,
                    py: 0.1,
                    borderRadius: 1,
                    bgcolor: "rgba(125,186,150,0.14)",
                    border: "1px solid rgba(125,186,150,0.32)",
                    color: C.good,
                    fontFamily: MONO,
                    fontSize: 9,
                    fontWeight: 600,
                    cursor: "help",
                  }}
                >
                  Shape ✓
                </Box>
              </Tooltip>
            )}
          </Box>
        </TableCell>
        <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
          {r.episode_new ? (
            <Box
              component="span"
              sx={{
                px: 0.75,
                py: 0.15,
                borderRadius: 1,
                bgcolor: "rgba(142,180,196,0.15)",
                border: "1px solid rgba(142,180,196,0.32)",
                fontFamily: MONO,
                fontSize: 10,
                fontWeight: 600,
                color: C.accent,
              }}
            >
              NEW
            </Box>
          ) : r.episode_days != null || r.coil_days != null ? (
            `${r.episode_days ?? r.coil_days}d`
          ) : (
            "—"
          )}
        </TableCell>
        <TableCell
          onClick={() => onOpenSector?.(r.sector)}
          sx={{
            maxWidth: 200,
            fontSize: 12.5,
            color: C.muted,
            cursor: onOpenSector ? "pointer" : "default",
            "&:hover": onOpenSector ? { color: C.accent } : {},
          }}
        >
          {r.sector}
        </TableCell>
        <TableCell align="center">
          <EarningsCell trend={r.earnings_trend} />
        </TableCell>
        <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
          {num(r.adj, 2)}
        </TableCell>
        <TableCell>
          <CoilBar value={r.coil} />
        </TableCell>
        <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
          {pct(r.pos_hi, 1)}
        </TableCell>
        <TableCell
          align="right"
          className="num"
          sx={{
            fontFamily: MONO,
            fontSize: 12.5,
            color: r.to_trigger <= 3 ? C.good : C.text,
            fontWeight: r.to_trigger <= 3 ? 600 : 400,
          }}
        >
          {pct(r.to_trigger, 1)}
        </TableCell>
        <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
          {num(r.rsi, 1)}
        </TableCell>
        <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
          {num(r.vol_ratio)}
        </TableCell>
        <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
          {pct(r.range20, 1)}
        </TableCell>
        <TableCell
          align="right"
          className="num"
          sx={{
            fontFamily: MONO,
            fontSize: 12.5,
            color: r.cmf > 0 ? C.good : r.cmf < 0 ? C.bad : C.muted,
          }}
        >
          {num(r.cmf)}
        </TableCell>
        <TableCell
          align="right"
          className="num"
          sx={{
            fontFamily: MONO,
            fontSize: 12.5,
            color: r.mom12_1 != null ? C.good : C.muted,
            fontWeight: r.mom12_1 != null ? 600 : 400,
          }}
        >
          {r.mom12_1 != null ? pct(r.mom12_1, 0) : "—"}
        </TableCell>
      </TableRow>
      {r.why && <WhyRow cols={COL_SPAN}>{r.why}</WhyRow>}
    </Fragment>
  );
}
