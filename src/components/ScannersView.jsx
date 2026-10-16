/**
 * Market scanners — broader watchlists that complement the circuit carry.
 *
 * Tabs: Big movers · Unusual volume · Momentum streaks · 52-week breakouts · Sector pulse
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchIcon from "@mui/icons-material/Search";
import { getScanners } from "../api.js";
import { C } from "../theme.js";
import { num } from "../format.js";
import { BookmarkButton } from "../watchlist.jsx";
import { HeadCell, PageIntro, TabLabel, useTableSort } from "./ui.jsx";

const MONO = '"IBM Plex Mono", ui-monospace, monospace';
const POLL_MS = 5 * 60 * 1000;

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

const color = (v) => (v == null ? C.muted : v >= 0 ? C.good : C.bad);

function EmptyScannerState({ text }) {
  return (
    <Box
      sx={{
        p: 4.5,
        mb: 3,
        borderRadius: 2.5,
        bgcolor: "#15161b",
        border: `1px solid ${C.line}`,
        textAlign: "center",
      }}
    >
      <Typography sx={{ fontSize: 14, color: C.muted }}>{text}</Typography>
    </Box>
  );
}

function MoversTable({ rows, onOpenStock }) {
  const sort = useTableSort({
    key: "pchange",
    dir: "desc",
    dirFor: (k) => (k === "symbol" || k === "sector" ? "asc" : "desc"),
  });
  const shown = useMemo(() => sort.apply(rows), [rows, sort.key, sort.dir]);
  if (!shown.length) return <EmptyScannerState text="No stocks up 5%+ matching the filter right now." />;

  return (
    <Box
      sx={{
        bgcolor: "#15161b",
        border: `1px solid ${C.line}`,
        borderRadius: 2.5,
        overflow: "hidden",
        mb: 3,
      }}
    >
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 680, ...TABLE_SX }}>
          <TableHead>
            <TableRow>
              <HeadCell label="" sx={{ width: 36, p: 0 }} />
              <HeadCell label="Symbol" sort={sort} sortKey="symbol" />
              <HeadCell label="Change" align="right" sort={sort} sortKey="pchange" />
              <HeadCell label="Price" align="right" sort={sort} sortKey="ltp" />
              <HeadCell label="Prev Close" align="right" />
              <HeadCell label="Day High" align="right" />
              <HeadCell label="Turnover" align="right" sort={sort} sortKey="turnover_cr" />
              <HeadCell label="Sector" sort={sort} sortKey="sector" />
            </TableRow>
          </TableHead>
          <TableBody>
            {shown.map((r) => (
              <TableRow
                key={r.symbol}
                hover
                sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.025) !important" } }}
              >
                <TableCell sx={{ py: 0, px: 0.75, width: 36 }}>
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
                <TableCell
                  align="right"
                  className="num"
                  sx={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 500, color: C.good }}
                >
                  +{r.pchange?.toFixed(1)}%
                </TableCell>
                <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                  {num(r.ltp)}
                </TableCell>
                <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5, color: C.muted }}>
                  {num(r.prev_close)}
                </TableCell>
                <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                  {num(r.high)}
                </TableCell>
                <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                  ₹{r.turnover_cr} cr
                </TableCell>
                <TableCell sx={{ fontSize: 12, color: C.muted }}>{r.sector || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function VolumeTable({ rows, onOpenStock }) {
  const sort = useTableSort({
    key: "vol_ratio",
    dir: "desc",
    dirFor: (k) => (k === "symbol" || k === "sector" ? "asc" : "desc"),
  });
  const shown = useMemo(() => sort.apply(rows), [rows, sort.key, sort.dir]);
  if (!shown.length) return <EmptyScannerState text="No stocks with 2x+ unusual volume right now." />;

  return (
    <Box
      sx={{
        bgcolor: "#15161b",
        border: `1px solid ${C.line}`,
        borderRadius: 2.5,
        overflow: "hidden",
        mb: 3,
      }}
    >
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 660, ...TABLE_SX }}>
          <TableHead>
            <TableRow>
              <HeadCell label="" sx={{ width: 36, p: 0 }} />
              <HeadCell label="Symbol" sort={sort} sortKey="symbol" />
              <HeadCell
                label="Vol Ratio"
                help="Today's volume divided by the 20-day average."
                align="right"
                sort={sort}
                sortKey="vol_ratio"
              />
              <HeadCell label="Change" align="right" sort={sort} sortKey="pchange" />
              <HeadCell label="Price" align="right" sort={sort} sortKey="ltp" />
              <HeadCell label="Turnover" align="right" sort={sort} sortKey="turnover_cr" />
              <HeadCell label="Sector" sort={sort} sortKey="sector" />
            </TableRow>
          </TableHead>
          <TableBody>
            {shown.map((r) => (
              <TableRow
                key={r.symbol}
                hover
                sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.025) !important" } }}
              >
                <TableCell sx={{ py: 0, px: 0.75, width: 36 }}>
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
                <TableCell
                  align="right"
                  className="num"
                  sx={{
                    fontFamily: MONO,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: r.vol_ratio >= 3 ? C.good : C.text,
                  }}
                >
                  {r.vol_ratio}×
                </TableCell>
                <TableCell
                  align="right"
                  className="num"
                  sx={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 500, color: color(r.pchange) }}
                >
                  {r.pchange > 0 ? "+" : ""}
                  {r.pchange?.toFixed(1)}%
                </TableCell>
                <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                  {num(r.ltp)}
                </TableCell>
                <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                  ₹{r.turnover_cr} cr
                </TableCell>
                <TableCell sx={{ fontSize: 12, color: C.muted }}>{r.sector || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function StreaksTable({ rows, onOpenStock }) {
  const sort = useTableSort({
    key: "cum_return",
    dir: "desc",
    dirFor: (k) => (k === "symbol" || k === "sector" ? "asc" : "desc"),
  });
  const shown = useMemo(() => sort.apply(rows), [rows, sort.key, sort.dir]);
  if (!shown.length) return <EmptyScannerState text="No momentum streaks found. Updates after market close." />;

  return (
    <Box
      sx={{
        bgcolor: "#15161b",
        border: `1px solid ${C.line}`,
        borderRadius: 2.5,
        overflow: "hidden",
        mb: 3,
      }}
    >
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 660, ...TABLE_SX }}>
          <TableHead>
            <TableRow>
              <HeadCell label="" sx={{ width: 36, p: 0 }} />
              <HeadCell label="Symbol" sort={sort} sortKey="symbol" />
              <HeadCell label="Streak" help="Consecutive days closing higher." align="right" sort={sort} sortKey="streak" />
              <HeadCell label="Cumulative" help="Total return over the streak." align="right" sort={sort} sortKey="cum_return" />
              <HeadCell label="Close" align="right" sort={sort} sortKey="close" />
              <HeadCell label="Turnover" align="right" sort={sort} sortKey="turnover_cr" />
              <HeadCell label="Sector" sort={sort} sortKey="sector" />
            </TableRow>
          </TableHead>
          <TableBody>
            {shown.map((r) => (
              <TableRow
                key={r.symbol}
                hover
                sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.025) !important" } }}
              >
                <TableCell sx={{ py: 0, px: 0.75, width: 36 }}>
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
                <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                  {r.streak}d
                </TableCell>
                <TableCell
                  align="right"
                  className="num"
                  sx={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: C.good }}
                >
                  +{r.cum_return}%
                </TableCell>
                <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                  {num(r.close)}
                </TableCell>
                <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                  ₹{r.turnover_cr} cr
                </TableCell>
                <TableCell sx={{ fontSize: 12, color: C.muted }}>{r.sector || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function BreakoutsTable({ rows, onOpenStock }) {
  const sort = useTableSort({
    key: "from_high",
    dir: "desc",
    dirFor: (k) => (k === "symbol" || k === "sector" ? "asc" : "desc"),
  });
  const shown = useMemo(() => sort.apply(rows), [rows, sort.key, sort.dir]);
  if (!shown.length) return <EmptyScannerState text="No 52-week breakouts found. Updates after market close." />;

  return (
    <Box
      sx={{
        bgcolor: "#15161b",
        border: `1px solid ${C.line}`,
        borderRadius: 2.5,
        overflow: "hidden",
        mb: 3,
      }}
    >
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 740, ...TABLE_SX }}>
          <TableHead>
            <TableRow>
              <HeadCell label="" sx={{ width: 36, p: 0 }} />
              <HeadCell label="Symbol" sort={sort} sortKey="symbol" />
              <HeadCell label="Close" align="right" sort={sort} sortKey="close" />
              <HeadCell label="52W High" align="right" />
              <HeadCell
                label="From High"
                help="Distance from 52-week high. 0% = at the high."
                align="right"
                sort={sort}
                sortKey="from_high"
              />
              <HeadCell label="Change" align="right" sort={sort} sortKey="change" />
              <HeadCell label="Vol Ratio" align="right" sort={sort} sortKey="vol_ratio" />
              <HeadCell label="Turnover" align="right" sort={sort} sortKey="turnover_cr" />
              <HeadCell label="Sector" sort={sort} sortKey="sector" />
            </TableRow>
          </TableHead>
          <TableBody>
            {shown.map((r) => (
              <TableRow
                key={r.symbol}
                hover
                sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.025) !important" } }}
              >
                <TableCell sx={{ py: 0, px: 0.75, width: 36 }}>
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
                <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                  {num(r.close)}
                </TableCell>
                <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5, color: C.muted }}>
                  {num(r.high_52w)}
                </TableCell>
                <TableCell align="right" className="num">
                  {r.from_high >= 0 ? (
                    <Box
                      component="span"
                      sx={{
                        px: 0.85,
                        py: 0.2,
                        borderRadius: 1,
                        bgcolor: "rgba(125,186,150,0.14)",
                        border: "1px solid rgba(125,186,150,0.28)",
                        fontFamily: MONO,
                        fontSize: 10.5,
                        fontWeight: 600,
                        color: C.good,
                      }}
                    >
                      NEW HIGH
                    </Box>
                  ) : (
                    <Typography sx={{ fontFamily: MONO, fontSize: 12.5, color: C.muted }}>
                      {r.from_high}%
                    </Typography>
                  )}
                </TableCell>
                <TableCell
                  align="right"
                  className="num"
                  sx={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 500, color: color(r.change) }}
                >
                  {r.change > 0 ? "+" : ""}
                  {r.change}%
                </TableCell>
                <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                  {r.vol_ratio}×
                </TableCell>
                <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                  ₹{r.turnover_cr} cr
                </TableCell>
                <TableCell sx={{ fontSize: 12, color: C.muted }}>{r.sector || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function SectorTable({ rows, onOpenStock }) {
  const sort = useTableSort({
    key: "avg_change",
    dir: "desc",
    dirFor: (k) => (k === "sector" || k === "best_stock" ? "asc" : "desc"),
  });
  const shown = useMemo(() => sort.apply(rows), [rows, sort.key, sort.dir]);
  if (!shown.length) return <EmptyScannerState text="No sector pulse data yet." />;

  return (
    <Box
      sx={{
        bgcolor: "#15161b",
        border: `1px solid ${C.line}`,
        borderRadius: 2.5,
        overflow: "hidden",
        mb: 3,
      }}
    >
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 660, ...TABLE_SX }}>
          <TableHead>
            <TableRow>
              <HeadCell label="Sector" sort={sort} sortKey="sector" />
              <HeadCell label="Stocks" align="right" sort={sort} sortKey="stocks" />
              <HeadCell label="Advancing" align="right" sort={sort} sortKey="advancing" />
              <HeadCell label="Adv %" align="right" sort={sort} sortKey="adv_pct" />
              <HeadCell label="Avg Change" align="right" sort={sort} sortKey="avg_change" />
              <HeadCell label="Top Leader" sort={sort} sortKey="best_stock" />
              <HeadCell label="Leader Change" align="right" sort={sort} sortKey="best_change" />
            </TableRow>
          </TableHead>
          <TableBody>
            {shown.map((r) => {
              const advColor = r.adv_pct >= 60 ? C.good : r.adv_pct <= 30 ? C.bad : C.muted;
              return (
                <TableRow
                  key={r.sector}
                  hover
                  sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.025) !important" } }}
                >
                  <TableCell sx={{ fontWeight: 500, color: C.text }}>{r.sector}</TableCell>
                  <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                    {r.stocks}
                  </TableCell>
                  <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                    {r.advancing}
                  </TableCell>
                  <TableCell align="right" className="num">
                    <Box
                      component="span"
                      sx={{
                        px: 0.85,
                        py: 0.2,
                        borderRadius: 1,
                        bgcolor: `${advColor}18`,
                        border: `1px solid ${advColor}33`,
                        fontFamily: MONO,
                        fontSize: 10.5,
                        fontWeight: 600,
                        color: advColor,
                      }}
                    >
                      {r.adv_pct}%
                    </Box>
                  </TableCell>
                  <TableCell
                    align="right"
                    className="num"
                    sx={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 500, color: color(r.avg_change) }}
                  >
                    {r.avg_change > 0 ? "+" : ""}
                    {r.avg_change}%
                  </TableCell>
                  <TableCell
                    onClick={() => r.best_stock && onOpenStock?.(r.best_stock)}
                    sx={{
                      fontFamily: MONO,
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: C.text,
                      cursor: onOpenStock && r.best_stock ? "pointer" : "default",
                      "&:hover": onOpenStock && r.best_stock ? { color: C.accent } : {},
                    }}
                  >
                    {r.best_stock || "—"}
                  </TableCell>
                  <TableCell
                    align="right"
                    className="num"
                    sx={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 500, color: C.good }}
                  >
                    +{r.best_change}%
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

const SCANNER_META = [
  {
    tag: "BIG MOVERS · ≥ 5% GAIN",
    desc: "Stocks up 5% or more from the previous session close.",
    live: true,
  },
  {
    tag: "UNUSUAL VOLUME · ≥ 2.0× AVG",
    desc: "Stocks trading at 2× or more their 20-day average volume with positive momentum.",
    live: true,
  },
  {
    tag: "MOMENTUM STREAKS · ≥ 3 DAYS",
    desc: "Stocks with 3 or more consecutive up days and at least 5% cumulative gain.",
    live: false,
  },
  {
    tag: "52-WEEK BREAKOUTS · ≤ 2% FROM HIGH",
    desc: "Stocks at or within 2% of their 52-week high on above-average volume.",
    live: false,
  },
  {
    tag: "SECTOR PULSE · BREADTH RANKING",
    desc: "Industries ranked by average constituent return and advancing participation.",
    live: true,
  },
];

function marketOpenNow() {
  const ist = new Date(Date.now() + (5.5 * 60 + new Date().getTimezoneOffset()) * 60000);
  const day = ist.getDay();
  const mins = ist.getHours() * 60 + ist.getMinutes();
  return day >= 1 && day <= 5 && mins >= 9 * 60 + 15 && mins <= 15 * 60 + 30;
}

export default function ScannersView({ onOpenStock, externalData, embedded, embeddedTab }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(!embedded);
  const [err, setErr] = useState(null);
  const [tab, setTab] = useState(0);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    if (embedded) return;
    setBusy(true);
    setErr(null);
    try {
      setData(await getScanners());
    } catch (e) {
      setErr(e?.message || "Could not load scanners");
    } finally {
      setBusy(false);
    }
  }, [embedded]);

  useEffect(() => {
    if (embedded) return;
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load, embedded]);

  const d = embedded ? externalData : data;
  const activeTab = embedded ? embeddedTab : tab;

  if (!embedded && busy && !d) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={28} sx={{ color: C.accent }} />
      </Box>
    );
  }
  if (!embedded && err && !d) {
    return (
      <Box sx={{ p: 3, borderRadius: 2, bgcolor: "#15161b", border: `1px solid ${C.line}`, color: C.bad }}>
        {err}
      </Box>
    );
  }

  const filterList = (arr) => {
    const query = q.trim().toLowerCase();
    if (!query) return arr;
    return arr.filter(
      (r) =>
        (r.symbol || "").toLowerCase().includes(query) ||
        (r.sector || "").toLowerCase().includes(query) ||
        (r.best_stock || "").toLowerCase().includes(query)
    );
  };

  const movers = filterList(d?.big_movers || []);
  const volume = filterList(d?.unusual_volume || []);
  const streaks = filterList(d?.momentum_streaks || []);
  const breakouts = filterList(d?.breakouts_52w || []);
  const sectors = filterList(d?.sector_pulse || []);
  const meta = SCANNER_META[activeTab] || SCANNER_META[0];
  const isLive = marketOpenNow();
  const scanTime = d?.scan_time;
  const asOf = d?.as_of;

  const content = (
    <>
      {/* Sub-header & quick filter */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          px: 2.5,
          py: 1.75,
          mb: 2.5,
          borderRadius: 2.5,
          bgcolor: "#15161b",
          border: `1px solid ${C.line}`,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.25 }}>
            <Typography sx={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.14em", color: C.accent }}>
              {meta.tag}
            </Typography>
            {meta.live ? (
              <Box
                component="span"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 0.75,
                  py: "1px",
                  borderRadius: 0.75,
                  fontFamily: MONO,
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  color: isLive ? C.good : C.muted,
                  bgcolor: isLive ? "rgba(125,186,150,0.12)" : "rgba(238,234,227,0.05)",
                  border: `1px solid ${isLive ? "rgba(125,186,150,0.32)" : "rgba(238,234,227,0.16)"}`,
                }}
              >
                {isLive && (
                  <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: C.good, boxShadow: "0 0 4px rgba(125,186,150,0.5)" }} />
                )}
                {isLive ? (scanTime ? `LIVE · ${scanTime} IST` : "LIVE") : "LAST SESSION"}
              </Box>
            ) : (
              <Box
                component="span"
                sx={{
                  px: 0.75,
                  py: "1px",
                  borderRadius: 0.75,
                  fontFamily: MONO,
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  color: C.muted,
                  bgcolor: "rgba(238,234,227,0.05)",
                  border: "1px solid rgba(238,234,227,0.16)",
                }}
              >
                EOD{asOf ? ` · ${asOf}` : ""}
              </Box>
            )}
          </Box>
          <Typography sx={{ fontSize: 13.25, color: C.muted, mt: 0.25 }}>
            {meta.desc}
          </Typography>
        </Box>

        <TextField
          size="small"
          placeholder="Filter symbol or sector…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{
            width: { xs: "100%", sm: 210 },
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
      </Box>

      {activeTab === 0 && <MoversTable rows={movers} onOpenStock={onOpenStock} />}
      {activeTab === 1 && <VolumeTable rows={volume} onOpenStock={onOpenStock} />}
      {activeTab === 2 && <StreaksTable rows={streaks} onOpenStock={onOpenStock} />}
      {activeTab === 3 && <BreakoutsTable rows={breakouts} onOpenStock={onOpenStock} />}
      {activeTab === 4 && <SectorTable rows={sectors} onOpenStock={onOpenStock} />}

      <Box
        sx={{
          p: 2.5,
          borderRadius: 2.5,
          bgcolor: "#15161b",
          border: `1px solid ${C.line}`,
        }}
      >
        <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: C.muted, mb: 0.5 }}>
          SCANNER NOTE
        </Typography>
        <Typography sx={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6 }}>
          Informational watchlists, not recommendations. A stock appearing here means it had notable price or volume action today — it says nothing about what it will do tomorrow.
        </Typography>
      </Box>
    </>
  );

  if (embedded) return content;

  return (
    <Box>
      <PageIntro
        title="Market scanners"
        action={
          <Button
            size="small"
            variant="outlined"
            onClick={load}
            disabled={busy}
            startIcon={busy ? <CircularProgress size={14} /> : <RefreshRoundedIcon fontSize="small" />}
            sx={{ color: C.muted, borderColor: "rgba(238,234,227,0.12)", textTransform: "none" }}
          >
            Refresh
          </Button>
        }
      >
        What&apos;s moving in the market right now.
      </PageIntro>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2, borderBottom: `1px solid ${C.line}` }}
      >
        <Tab label={<TabLabel name="Big movers" count={movers.length} />} sx={{ textTransform: "none" }} />
        <Tab label={<TabLabel name="Unusual volume" count={volume.length} />} sx={{ textTransform: "none" }} />
        <Tab label={<TabLabel name="Streaks" count={streaks.length} />} sx={{ textTransform: "none" }} />
        <Tab label={<TabLabel name="52w breakouts" count={breakouts.length} />} sx={{ textTransform: "none" }} />
        <Tab label={<TabLabel name="Sector pulse" count={sectors.length} />} sx={{ textTransform: "none" }} />
      </Tabs>

      {content}
    </Box>
  );
}
