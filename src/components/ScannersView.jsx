/**
 * Market scanners — broader watchlists that complement the circuit carry.
 *
 * These are informational: "what's moving" not "what to buy." The circuit
 * carry tab is the one with a measured edge; everything here is context.
 *
 * Tabs: Big movers · Unusual volume · Momentum streaks · 52-week breakouts · Sector pulse
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { getScanners } from "../api.js";
import { C } from "../theme.js";
import { num } from "../format.js";
import { HeadCell, Note, PageIntro, TabLabel, useTableSort } from "./ui.jsx";

const POLL_MS = 5 * 60 * 1000;

const color = (v) => (v == null ? C.muted : v >= 0 ? C.good : C.bad);

function MoversTable({ rows, onOpenStock }) {
  const sort = useTableSort({ key: "pchange", dir: "desc", dirFor: (k) => (k === "symbol" || k === "sector" ? "asc" : "desc") });
  const shown = useMemo(() => sort.apply(rows), [rows, sort.key, sort.dir]);
  if (!shown.length) return <Note>No stocks up 5%+ right now.</Note>;

  return (
    <TableContainer sx={{ bgcolor: C.paper, border: `1px solid ${C.line}`, borderRadius: 1, overflowX: "auto", mb: 3 }}>
      <Table size="small" sx={{ minWidth: 600 }}>
        <TableHead>
          <TableRow>
            <HeadCell label="Symbol" sort={sort} sortKey="symbol" />
            <HeadCell label="Change" align="right" sort={sort} sortKey="pchange" />
            <HeadCell label="Price" align="right" sort={sort} sortKey="ltp" />
            <HeadCell label="Prev close" align="right" />
            <HeadCell label="High" align="right" />
            <HeadCell label="Turnover" align="right" sort={sort} sortKey="turnover_cr" />
            <HeadCell label="Sector" sort={sort} sortKey="sector" />
          </TableRow>
        </TableHead>
        <TableBody>
          {shown.map((r) => (
            <TableRow key={r.symbol} hover>
              <TableCell className="row-click linkish" onClick={() => onOpenStock?.(r.symbol)} sx={{ fontWeight: 500 }}>{r.symbol}</TableCell>
              <TableCell align="right" className="num" sx={{ color: C.good }}>+{r.pchange?.toFixed(1)}%</TableCell>
              <TableCell align="right" className="num">{num(r.ltp)}</TableCell>
              <TableCell align="right" className="num">{num(r.prev_close)}</TableCell>
              <TableCell align="right" className="num">{num(r.high)}</TableCell>
              <TableCell align="right" className="num">₹{r.turnover_cr} cr</TableCell>
              <TableCell sx={{ fontSize: 12.5, color: C.muted }}>{r.sector}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function VolumeTable({ rows, onOpenStock }) {
  const sort = useTableSort({ key: "vol_ratio", dir: "desc", dirFor: (k) => (k === "symbol" || k === "sector" ? "asc" : "desc") });
  const shown = useMemo(() => sort.apply(rows), [rows, sort.key, sort.dir]);
  if (!shown.length) return <Note>No stocks with 2x+ unusual volume right now.</Note>;

  return (
    <TableContainer sx={{ bgcolor: C.paper, border: `1px solid ${C.line}`, borderRadius: 1, overflowX: "auto", mb: 3 }}>
      <Table size="small" sx={{ minWidth: 600 }}>
        <TableHead>
          <TableRow>
            <HeadCell label="Symbol" sort={sort} sortKey="symbol" />
            <HeadCell label="Vol ratio" help="Today's volume divided by the 20-day average." align="right" sort={sort} sortKey="vol_ratio" />
            <HeadCell label="Change" align="right" sort={sort} sortKey="pchange" />
            <HeadCell label="Price" align="right" sort={sort} sortKey="ltp" />
            <HeadCell label="Turnover" align="right" sort={sort} sortKey="turnover_cr" />
            <HeadCell label="Sector" sort={sort} sortKey="sector" />
          </TableRow>
        </TableHead>
        <TableBody>
          {shown.map((r) => (
            <TableRow key={r.symbol} hover>
              <TableCell className="row-click linkish" onClick={() => onOpenStock?.(r.symbol)} sx={{ fontWeight: 500 }}>{r.symbol}</TableCell>
              <TableCell align="right" className="num" sx={{ color: r.vol_ratio >= 3 ? C.good : C.text }}>{r.vol_ratio}×</TableCell>
              <TableCell align="right" className="num" sx={{ color: color(r.pchange) }}>+{r.pchange?.toFixed(1)}%</TableCell>
              <TableCell align="right" className="num">{num(r.ltp)}</TableCell>
              <TableCell align="right" className="num">₹{r.turnover_cr} cr</TableCell>
              <TableCell sx={{ fontSize: 12.5, color: C.muted }}>{r.sector}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function StreaksTable({ rows, onOpenStock }) {
  const sort = useTableSort({ key: "cum_return", dir: "desc", dirFor: (k) => (k === "symbol" || k === "sector" ? "asc" : "desc") });
  const shown = useMemo(() => sort.apply(rows), [rows, sort.key, sort.dir]);
  if (!shown.length) return <Note>No momentum streaks found. This updates after market close.</Note>;

  return (
    <TableContainer sx={{ bgcolor: C.paper, border: `1px solid ${C.line}`, borderRadius: 1, overflowX: "auto", mb: 3 }}>
      <Table size="small" sx={{ minWidth: 600 }}>
        <TableHead>
          <TableRow>
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
            <TableRow key={r.symbol} hover>
              <TableCell className="row-click linkish" onClick={() => onOpenStock?.(r.symbol)} sx={{ fontWeight: 500 }}>{r.symbol}</TableCell>
              <TableCell align="right" className="num">{r.streak} days</TableCell>
              <TableCell align="right" className="num" sx={{ color: C.good }}>+{r.cum_return}%</TableCell>
              <TableCell align="right" className="num">{num(r.close)}</TableCell>
              <TableCell align="right" className="num">₹{r.turnover_cr} cr</TableCell>
              <TableCell sx={{ fontSize: 12.5, color: C.muted }}>{r.sector}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function BreakoutsTable({ rows, onOpenStock }) {
  const sort = useTableSort({ key: "from_high", dir: "desc", dirFor: (k) => (k === "symbol" || k === "sector" ? "asc" : "desc") });
  const shown = useMemo(() => sort.apply(rows), [rows, sort.key, sort.dir]);
  if (!shown.length) return <Note>No 52-week breakouts found. This updates after market close.</Note>;

  return (
    <TableContainer sx={{ bgcolor: C.paper, border: `1px solid ${C.line}`, borderRadius: 1, overflowX: "auto", mb: 3 }}>
      <Table size="small" sx={{ minWidth: 700 }}>
        <TableHead>
          <TableRow>
            <HeadCell label="Symbol" sort={sort} sortKey="symbol" />
            <HeadCell label="Close" align="right" sort={sort} sortKey="close" />
            <HeadCell label="52w high" align="right" />
            <HeadCell label="From high" help="How far from the 52-week high. 0% = at the high." align="right" sort={sort} sortKey="from_high" />
            <HeadCell label="Change" align="right" sort={sort} sortKey="change" />
            <HeadCell label="Vol ratio" align="right" sort={sort} sortKey="vol_ratio" />
            <HeadCell label="Turnover" align="right" sort={sort} sortKey="turnover_cr" />
            <HeadCell label="Sector" sort={sort} sortKey="sector" />
          </TableRow>
        </TableHead>
        <TableBody>
          {shown.map((r) => (
            <TableRow key={r.symbol} hover>
              <TableCell className="row-click linkish" onClick={() => onOpenStock?.(r.symbol)} sx={{ fontWeight: 500 }}>{r.symbol}</TableCell>
              <TableCell align="right" className="num">{num(r.close)}</TableCell>
              <TableCell align="right" className="num">{num(r.high_52w)}</TableCell>
              <TableCell align="right" className="num" sx={{ color: r.from_high >= 0 ? C.good : C.muted }}>
                {r.from_high >= 0 ? "NEW HIGH" : `${r.from_high}%`}
              </TableCell>
              <TableCell align="right" className="num" sx={{ color: color(r.change) }}>+{r.change}%</TableCell>
              <TableCell align="right" className="num">{r.vol_ratio}×</TableCell>
              <TableCell align="right" className="num">₹{r.turnover_cr} cr</TableCell>
              <TableCell sx={{ fontSize: 12.5, color: C.muted }}>{r.sector}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function SectorTable({ rows }) {
  if (!rows.length) return <Note>No sector data yet.</Note>;

  return (
    <TableContainer sx={{ bgcolor: C.paper, border: `1px solid ${C.line}`, borderRadius: 1, overflowX: "auto", mb: 3 }}>
      <Table size="small" sx={{ minWidth: 600 }}>
        <TableHead>
          <TableRow>
            <HeadCell label="Sector" />
            <HeadCell label="Stocks" align="right" />
            <HeadCell label="Advancing" align="right" />
            <HeadCell label="Adv %" align="right" />
            <HeadCell label="Avg change" align="right" />
            <HeadCell label="Top stock" />
            <HeadCell label="Top change" align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.sector} hover>
              <TableCell sx={{ fontWeight: 500 }}>{r.sector}</TableCell>
              <TableCell align="right" className="num">{r.stocks}</TableCell>
              <TableCell align="right" className="num">{r.advancing}</TableCell>
              <TableCell align="right" className="num">
                <Chip size="small" label={`${r.adv_pct}%`}
                  sx={{ bgcolor: r.adv_pct >= 60 ? "rgba(125,186,150,0.15)" : r.adv_pct <= 30 ? "rgba(200,122,122,0.15)" : "rgba(255,255,255,0.04)",
                        color: r.adv_pct >= 60 ? C.good : r.adv_pct <= 30 ? C.bad : C.muted,
                        fontSize: 11, height: 20, borderRadius: 1 }} />
              </TableCell>
              <TableCell align="right" className="num" sx={{ color: color(r.avg_change) }}>
                {r.avg_change > 0 ? "+" : ""}{r.avg_change}%
              </TableCell>
              <TableCell sx={{ fontSize: 12.5 }}>{r.best_stock}</TableCell>
              <TableCell align="right" className="num" sx={{ color: C.good }}>+{r.best_change}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function ScannersView({ onOpenStock, externalData, embedded, embeddedTab }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(!embedded);
  const [err, setErr] = useState(null);
  const [tab, setTab] = useState(0);

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
    return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress size={28} sx={{ color: C.accent }} /></Box>;
  }
  if (!embedded && err && !d) return <Note>{err}</Note>;

  const movers = d?.big_movers || [];
  const volume = d?.unusual_volume || [];
  const streaks = d?.momentum_streaks || [];
  const breakouts = d?.breakouts_52w || [];
  const sectors = d?.sector_pulse || [];
  const scanTime = d?.scan_time;

  const content = (
    <>
      {activeTab === 0 && <>
        <Typography sx={{ fontSize: 13, color: C.muted, mb: 1.5 }}>
          Stocks up 5% or more from the previous close right now.
        </Typography>
        <MoversTable rows={movers} onOpenStock={onOpenStock} />
      </>}
      {activeTab === 1 && <>
        <Typography sx={{ fontSize: 13, color: C.muted, mb: 1.5 }}>
          Stocks trading at 2× or more their normal 20-day average volume, with positive momentum.
        </Typography>
        <VolumeTable rows={volume} onOpenStock={onOpenStock} />
      </>}
      {activeTab === 2 && <>
        <Typography sx={{ fontSize: 13, color: C.muted, mb: 1.5 }}>
          Stocks with 3 or more consecutive up days and at least 5% cumulative gain. Updates after market close.
        </Typography>
        <StreaksTable rows={streaks} onOpenStock={onOpenStock} />
      </>}
      {activeTab === 3 && <>
        <Typography sx={{ fontSize: 13, color: C.muted, mb: 1.5 }}>
          Stocks at or within 2% of their 52-week high, with above-average volume. Updates after market close.
        </Typography>
        <BreakoutsTable rows={breakouts} onOpenStock={onOpenStock} />
      </>}
      {activeTab === 4 && <>
        <Typography sx={{ fontSize: 13, color: C.muted, mb: 1.5 }}>
          Which sectors are moving today — sorted by average stock performance.
        </Typography>
        <SectorTable rows={sectors} />
      </>}

      <Note>
        Informational watchlists, not recommendations. A stock appearing here means it had
        notable price or volume action today — it says nothing about what it will do tomorrow.
      </Note>
    </>
  );

  if (embedded) return content;

  return (
    <Box>
      <PageIntro
        title="Market scanners"
        action={
          <Button size="small" variant="outlined" onClick={load} disabled={busy}
            startIcon={busy ? <CircularProgress size={14} /> : <RefreshRoundedIcon fontSize="small" />}
            sx={{ color: C.muted, borderColor: "rgba(238,234,227,0.12)", textTransform: "none" }}>
            Refresh
          </Button>
        }
      >
        What's moving in the market right now. These are informational watchlists —
        the momentum study found none of these patterns have a tradeable next-day edge
        after costs. The circuit carry tab is the one with a measured edge; everything
        here is context.
        {scanTime && <Typography component="span" sx={{ display: "block", fontSize: 12, color: C.muted, mt: 0.5 }}>
          Last scan: {scanTime} IST
        </Typography>}
      </PageIntro>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
        sx={{ mb: 2, borderBottom: `1px solid ${C.line}` }}>
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
