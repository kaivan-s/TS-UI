/**
 * Circuit carry — stocks that closed on their upper price band, and what they
 * did the next session.
 *
 * The list is written by the 15:22 IST snapshot (with the order book behind
 * each name) or, if that was missed, rebuilt from end-of-day data by the
 * post-market run. Outcomes are filled in the evening after the next session.
 *
 * This is a paper-tracking screen. The pattern is measured on end-of-day data
 * that cannot say whether a buy at the circuit would have filled, so the
 * "Sellers" column and the live buckets in the track record are the point of
 * the page, not decoration.
 */

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { getCarry, getCarryIntraday } from "../api.js";
import { C } from "../theme.js";
import { fmtDate, num, pct } from "../format.js";
import { HeadCell, Note, PageIntro, TabLabel, useTableSort } from "./ui.jsx";

const POLL_MS = 5 * 60 * 1000;

const BUCKET_LABEL = {
  all: "All sessions",
  "all live": "Live snapshots",
  "live: sellers present": "Live — sellers present",
  "live: no sellers (queue)": "Live — queue only",
  "eod backfill (fill unknown)": "Rebuilt from EOD data",
  "band 5%": "5% band",
  "band 10%": "10% band",
  "band 20%": "20% band",
};

const BUCKET_HELP = {
  "live: sellers present":
    "At the circuit at 15:22 with shares on offer. These are the only trades that could actually have filled — the bucket that decides whether this list is usable.",
  "live: no sellers (queue)":
    "At the circuit with nothing on offer. A buy order would have joined the queue and most likely not filled.",
  "eod backfill (fill unknown)":
    "Sessions rebuilt from end-of-day data. The pattern is real here, but the order book is unknown.",
};

// Intraday scanner status colors and labels
const STATUS_CONFIG = {
  approaching: { label: "Approaching", color: C.warn, bg: "rgba(196,164,106,0.12)", desc: "Within 1% of circuit — may still be buyable" },
  at_circuit: { label: "At circuit", color: C.good, bg: "rgba(125,186,150,0.12)", desc: "At the upper limit with sellers present" },
  heating: { label: "Heating up", color: C.accent, bg: "rgba(99,102,241,0.12)", desc: "Showing momentum toward circuit" },
  locked: { label: "Locked", color: C.bad, bg: "rgba(200,122,122,0.12)", desc: "At circuit with no sellers — cannot buy" },
};

const color = (v) => (v == null ? C.muted : v >= 0 ? C.good : C.bad);
const signedPct = (v, d = 1) =>
  v == null ? "—" : `${v > 0 ? "+" : ""}${(v * 100).toFixed(d)}%`;
const crore = (lakh) => (lakh == null ? "—" : `₹${(lakh / 100).toFixed(1)} cr`);
const qty = (v) => {
  if (v == null) return "—";
  const n = Number(v);
  if (n >= 1e7) return `${(n / 1e7).toFixed(1)} cr`;
  if (n >= 1e5) return `${(n / 1e5).toFixed(1)} L`;
  return n.toLocaleString("en-IN");
};
const timeIST = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
};

function FillChip({ row }) {
  if (row.source !== "live" || row.fillable == null) {
    return (
      <Tooltip title="Rebuilt from end-of-day data — the order book at the close is not known." arrow>
        <Chip size="small" label="Unknown" sx={{ bgcolor: "rgba(255,255,255,0.04)", color: C.muted, fontSize: 11.5, height: 22, borderRadius: 1 }} />
      </Tooltip>
    );
  }
  const ok = row.fillable === true;
  return (
    <Tooltip
      title={ok
        ? "Shares were on offer at the circuit at 15:22 — a buy could have filled."
        : "Nothing on offer at the circuit — a buy would have queued."}
      arrow
    >
      <Chip
        size="small"
        label={ok ? "Sellers present" : "Queue only"}
        sx={{
          bgcolor: ok ? "rgba(125,186,150,0.12)" : "rgba(196,164,106,0.10)",
          color: ok ? C.good : C.warn,
          fontSize: 11.5,
          height: 22,
          borderRadius: 1,
        }}
      />
    </Tooltip>
  );
}

function ResultChip({ row }) {
  if (row.btst == null) {
    return <Typography sx={{ fontSize: 12.5, color: C.muted }}>Pending</Typography>;
  }
  const hit = row.hit4 === true;
  return (
    <Chip
      size="small"
      label={hit ? `Hit +4% · ${signedPct(row.btst)}` : `Missed · ${signedPct(row.btst)}`}
      sx={{
        bgcolor: hit ? "rgba(125,186,150,0.12)" : "rgba(200,122,122,0.12)",
        color: hit ? C.good : C.bad,
        fontSize: 11.5,
        height: 22,
        borderRadius: 1,
      }}
    />
  );
}

function StatusChip({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: C.muted, bg: "rgba(255,255,255,0.04)", desc: "" };
  return (
    <Tooltip title={cfg.desc} arrow>
      <Chip
        size="small"
        label={cfg.label}
        sx={{ bgcolor: cfg.bg, color: cfg.color, fontSize: 11.5, height: 22, borderRadius: 1 }}
      />
    </Tooltip>
  );
}

function IntradayStrip({ data }) {
  const { summary, latest_scan, scans } = data;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: { xs: 1.5, sm: 2.5 },
        px: { xs: 1.5, sm: 2 },
        py: 1.5,
        mb: 2,
        bgcolor: C.paper,
        border: `1px solid ${C.line}`,
        borderRadius: 1,
      }}
    >
      <Typography sx={{ fontSize: 12, color: C.muted, letterSpacing: 0.4 }}>
        INTRADAY SCAN {data.as_of}
      </Typography>
      {(summary?.approaching || 0) > 0 && (
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
          <Typography sx={{ fontSize: 17, color: C.warn, fontWeight: 500 }}>{summary.approaching}</Typography>
          <Typography sx={{ fontSize: 13, color: C.muted }}>approaching</Typography>
        </Box>
      )}
      {(summary?.at_circuit || 0) > 0 && (
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
          <Typography sx={{ fontSize: 17, color: C.good, fontWeight: 500 }}>{summary.at_circuit}</Typography>
          <Typography sx={{ fontSize: 13, color: C.muted }}>at circuit</Typography>
        </Box>
      )}
      {(summary?.heating || 0) > 0 && (
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
          <Typography sx={{ fontSize: 17, color: C.accent, fontWeight: 500 }}>{summary.heating}</Typography>
          <Typography sx={{ fontSize: 13, color: C.muted }}>heating</Typography>
        </Box>
      )}
      <Box sx={{ flex: 1 }} />
      <Typography sx={{ fontSize: 12.5, color: C.muted }}>
        {latest_scan ? `Last scan: ${latest_scan} IST` : "No scans yet"} · {scans?.length || 0} scans today
      </Typography>
    </Box>
  );
}

function IntradayTable({ rows, onOpenStock }) {
  const sort = useTableSort({
    key: "distance_to_circuit",
    dir: "asc",
    dirFor: (k) => (k === "symbol" || k === "sector" || k === "status" ? "asc" : k === "distance_to_circuit" ? "asc" : "desc"),
  });
  const shown = useMemo(() => sort.apply(rows), [rows, sort.key, sort.dir]);

  if (!shown.length) {
    return <Note>No stocks approaching the circuit right now. Run the scan during market hours (10:00 - 15:00 IST).</Note>;
  }

  return (
    <TableContainer sx={{ bgcolor: C.paper, border: `1px solid ${C.line}`, borderRadius: 1, overflowX: "auto", mb: 3 }}>
      <Table size="small" sx={{ minWidth: 880 }}>
        <TableHead>
          <TableRow>
            <HeadCell label="Symbol" help="Click to open the stock." sort={sort} sortKey="symbol" />
            <HeadCell label="Status" help="How close to the circuit: heating (2-4%), approaching (within 1%), at_circuit, locked." sort={sort} sortKey="status" />
            <HeadCell label="Distance" help="How far from the upper circuit (0% = at circuit)." align="right" sort={sort} sortKey="distance_to_circuit" />
            <HeadCell label="Band" help="The price band (5%, 10%, or 20%)." align="right" sort={sort} sortKey="band" />
            <HeadCell label="Change" help="Change from the previous close." align="right" sort={sort} sortKey="pchange" />
            <HeadCell label="Price" help="Last traded price." align="right" sort={sort} sortKey="ltp" />
            <HeadCell label="Circuit" help="Upper circuit limit." align="right" sort={sort} sortKey="upper_circuit" />
            <HeadCell label="Sellers" help="Shares on offer. Zero means no sellers — cannot buy." align="right" sort={sort} sortKey="total_sell_qty" />
            <HeadCell label="Sector" sort={sort} sortKey="sector" />
          </TableRow>
        </TableHead>
        <TableBody>
          {shown.map((r) => (
            <TableRow key={`${r.as_of}-${r.scan_time}-${r.symbol}`} hover>
              <TableCell
                className="row-click linkish"
                role="button"
                tabIndex={0}
                onClick={() => onOpenStock?.(r.symbol)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onOpenStock?.(r.symbol); }}
                sx={{ fontWeight: 500 }}
              >
                {r.symbol}
              </TableCell>
              <TableCell><StatusChip status={r.status} /></TableCell>
              <TableCell align="right" className="num">
                {r.distance_to_circuit == null ? "—" : `${(r.distance_to_circuit * 100).toFixed(2)}%`}
              </TableCell>
              <TableCell align="right" className="num">{r.band == null ? "—" : `${Math.round(r.band * 100)}%`}</TableCell>
              <TableCell align="right" className="num" sx={{ color: C.good }}>
                {r.pchange == null ? "—" : `+${Number(r.pchange).toFixed(2)}%`}
              </TableCell>
              <TableCell align="right" className="num">{num(r.ltp)}</TableCell>
              <TableCell align="right" className="num">{num(r.upper_circuit)}</TableCell>
              <TableCell align="right" className="num" sx={{ color: (r.total_sell_qty || 0) > 0 ? C.good : C.bad }}>
                {qty(r.total_sell_qty)}
              </TableCell>
              <TableCell sx={{ fontSize: 12.5, color: C.muted }}>{r.sector || "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function IntradayProgression({ progression, onOpenStock }) {
  const [open, setOpen] = useState(null);

  if (!progression?.length) {
    return <Note>No progression data yet. Stocks are tracked as they appear in multiple scans.</Note>;
  }

  return (
    <TableContainer sx={{ bgcolor: C.paper, border: `1px solid ${C.line}`, borderRadius: 1, overflowX: "auto", mb: 3 }}>
      <Table size="small" sx={{ minWidth: 700 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 32 }} />
            <HeadCell label="Symbol" help="Click to open the stock." />
            <HeadCell label="Current" help="Current status." />
            <HeadCell label="Change" align="right" />
            <HeadCell label="Distance" help="Distance to upper circuit." align="right" />
            <HeadCell label="First seen" />
            <HeadCell label="Times seen" align="right" />
            <HeadCell label="Fillable" help="Whether sellers are present." />
            <HeadCell label="Sector" />
          </TableRow>
        </TableHead>
        <TableBody>
          {progression.map((p) => {
            const isOpen = open === p.symbol;
            return (
              <Fragment key={p.symbol}>
                <TableRow hover className="row-click" onClick={() => setOpen(isOpen ? null : p.symbol)} sx={{ cursor: "pointer" }}>
                  <TableCell sx={{ color: C.muted, pr: 0 }}>
                    {isOpen ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
                  </TableCell>
                  <TableCell
                    className="row-click linkish"
                    onClick={(e) => { e.stopPropagation(); onOpenStock?.(p.symbol); }}
                    sx={{ fontWeight: 500 }}
                  >
                    {p.symbol}
                  </TableCell>
                  <TableCell><StatusChip status={p.current_status} /></TableCell>
                  <TableCell align="right" className="num" sx={{ color: C.good }}>
                    {p.pchange == null ? "—" : `+${Number(p.pchange).toFixed(2)}%`}
                  </TableCell>
                  <TableCell align="right" className="num">
                    {p.distance_to_circuit == null ? "—" : `${(p.distance_to_circuit * 100).toFixed(2)}%`}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12.5, color: C.muted }}>{p.first_seen}</TableCell>
                  <TableCell align="right" className="num">{p.times_seen}</TableCell>
                  <TableCell>
                    {p.fillable === true ? (
                      <Chip size="small" label="Yes" sx={{ bgcolor: "rgba(125,186,150,0.12)", color: C.good, fontSize: 11, height: 20, borderRadius: 1 }} />
                    ) : p.fillable === false ? (
                      <Chip size="small" label="No" sx={{ bgcolor: "rgba(200,122,122,0.12)", color: C.bad, fontSize: 11, height: 20, borderRadius: 1 }} />
                    ) : (
                      <Typography sx={{ fontSize: 12, color: C.muted }}>—</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12.5, color: C.muted }}>{p.sector || "—"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={9} sx={{ p: 0, borderBottom: isOpen ? undefined : "none" }}>
                    <Collapse in={isOpen} unmountOnExit>
                      <Box sx={{ px: 2, py: 1.5, bgcolor: C.surface }}>
                        <Typography sx={{ fontSize: 12, color: C.muted, mb: 1 }}>
                          Progression through today's scans:
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {(p.history || []).map((h, i) => (
                            <Box
                              key={i}
                              sx={{
                                px: 1.5, py: 0.75,
                                bgcolor: STATUS_CONFIG[h.status]?.bg || "rgba(255,255,255,0.04)",
                                border: `1px solid ${C.line}`,
                                borderRadius: 1,
                              }}
                            >
                              <Typography sx={{ fontSize: 11, color: C.muted }}>{h.time}</Typography>
                              <Typography sx={{ fontSize: 12, color: STATUS_CONFIG[h.status]?.color || C.text, fontWeight: 500 }}>
                                {STATUS_CONFIG[h.status]?.label || h.status}
                              </Typography>
                              <Typography sx={{ fontSize: 11, color: C.muted }}>
                                +{Number(h.pchange).toFixed(1)}% · {(h.distance * 100).toFixed(2)}% away
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function Strip({ data, latest }) {
  const snap = timeIST(data.logged_at);
  const sellers = latest.filter((r) => r.fillable === true).length;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: { xs: 1.5, sm: 2.5 },
        px: { xs: 1.5, sm: 2 },
        py: 1.5,
        mb: 2,
        bgcolor: C.paper,
        border: `1px solid ${C.line}`,
        borderRadius: 1,
      }}
    >
      <Typography sx={{ fontSize: 12, color: C.muted, letterSpacing: 0.4 }}>
        LIST FOR {fmtDate(data.as_of)}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
        <Typography sx={{ fontSize: 17, color: C.text, fontWeight: 500 }}>{latest.length}</Typography>
        <Typography sx={{ fontSize: 13, color: C.muted }}>at the upper circuit</Typography>
      </Box>
      {data.source === "live" && (
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
          <Typography sx={{ fontSize: 17, color: C.good, fontWeight: 500 }}>{sellers}</Typography>
          <Typography sx={{ fontSize: 13, color: C.muted }}>with sellers</Typography>
        </Box>
      )}
      <Box sx={{ flex: 1 }} />
      <Typography sx={{ fontSize: 12.5, color: C.muted }}>
        {data.source === "live"
          ? `Live snapshot${snap ? ` · ${snap} IST` : ""}`
          : "Rebuilt from EOD data · no order book"}
      </Typography>
    </Box>
  );
}

function TodayTable({ rows, onOpenStock }) {
  const sort = useTableSort({
    key: "pchange",
    dir: "desc",
    dirFor: (k) => (k === "symbol" || k === "sector" ? "asc" : "desc"),
  });
  const shown = useMemo(() => sort.apply(rows), [rows, sort.key, sort.dir]);
  const scored = rows.some((r) => r.btst != null);

  return (
    <TableContainer sx={{ bgcolor: C.paper, border: `1px solid ${C.line}`, borderRadius: 1, overflowX: "auto", mb: 3 }}>
      <Table size="small" sx={{ minWidth: 880 }}>
        <TableHead>
          <TableRow>
            <HeadCell label="Symbol" help="Click to open the stock." sort={sort} sortKey="symbol" />
            <HeadCell label="Band" help="The price band the stock closed on. 10% and 20% band names have been the stronger carries." align="right" sort={sort} sortKey="band" />
            <HeadCell label="Change" help="Change from the previous close at the time of the snapshot." align="right" sort={sort} sortKey="pchange" />
            <HeadCell label="Price" help="Last traded price — the upper circuit." align="right" sort={sort} sortKey="ltp" />
            <HeadCell label="Buyers queued" help="Total buy quantity pending at 15:22." align="right" sort={sort} sortKey="total_buy_qty" />
            <HeadCell label="Sellers" help="Total sell quantity pending at 15:22. Zero means nothing is on offer at the circuit." align="right" sort={sort} sortKey="total_sell_qty" />
            <HeadCell label="Fill" help="Whether a buy at the circuit could plausibly have filled." />
            <HeadCell label="Turnover" help="Median daily turnover over the last 20 sessions." align="right" sort={sort} sortKey="med_turn20" />
            {scored && <HeadCell label="Next session" help="Hit +4% above the close, and the carry trade's result." />}
            <HeadCell label="Sector" sort={sort} sortKey="sector" />
          </TableRow>
        </TableHead>
        <TableBody>
          {shown.map((r) => (
            <TableRow key={`${r.as_of}-${r.symbol}`} hover>
              <TableCell
                className="row-click linkish"
                role="button"
                tabIndex={0}
                onClick={() => onOpenStock?.(r.symbol)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onOpenStock?.(r.symbol); }}
                sx={{ fontWeight: 500 }}
              >
                {r.symbol}
              </TableCell>
              <TableCell align="right" className="num">{r.band == null ? "—" : `${Math.round(r.band * 100)}%`}</TableCell>
              <TableCell align="right" className="num" sx={{ color: C.good }}>
                {r.pchange == null ? "—" : `+${Number(r.pchange).toFixed(2)}%`}
              </TableCell>
              <TableCell align="right" className="num">{num(r.ltp)}</TableCell>
              <TableCell align="right" className="num">{qty(r.total_buy_qty)}</TableCell>
              <TableCell align="right" className="num" sx={{ color: r.total_sell_qty > 0 ? C.good : undefined }}>
                {qty(r.total_sell_qty)}
              </TableCell>
              <TableCell><FillChip row={r} /></TableCell>
              <TableCell align="right" className="num">{crore(r.med_turn20)}</TableCell>
              {scored && <TableCell><ResultChip row={r} /></TableCell>}
              <TableCell sx={{ fontSize: 12.5, color: C.muted }}>{r.sector || "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function Stat({ label, value, sub, tone }) {
  return (
    <Box sx={{ flex: "1 1 140px", px: 2, py: 1.5, bgcolor: C.paper, border: `1px solid ${C.line}`, borderRadius: 1 }}>
      <Typography sx={{ fontSize: 11.5, color: C.muted, letterSpacing: 0.4, mb: 0.5 }}>{label}</Typography>
      <Typography sx={{ fontSize: 20, fontWeight: 500, color: tone || C.text }}>{value}</Typography>
      {sub && <Typography sx={{ fontSize: 12, color: C.muted, mt: 0.25 }}>{sub}</Typography>}
    </Box>
  );
}

function Summary({ summary }) {
  const all = summary.find((s) => s.bucket === "all");
  if (!all) return <Note>Nothing scored yet. The first results arrive the evening after the first list.</Note>;
  const order = [
    "live: sellers present", "live: no sellers (queue)", "all live",
    "eod backfill (fill unknown)", "band 5%", "band 10%", "band 20%",
  ];
  const rows = order.map((b) => summary.find((s) => s.bucket === b)).filter(Boolean);

  return (
    <>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
        <Stat label="STOCKS TRACKED" value={all.n} sub={`${all.sessions} sessions`} />
        <Stat label="REACHED +4% NEXT DAY" value={pct(all.hit4, 0)} tone={C.good} sub={`${pct(all.gap4, 0)} opened above it`} />
        <Stat label="AVG CARRY TRADE" value={signedPct(all.mean_btst)} tone={color(all.mean_btst)} sub={`${signedPct(all.net_mean)} after costs`} />
        <Stat label="WIN RATE" value={pct(all.win_rate, 0)} sub={`worst ${signedPct(all.worst)}`} />
      </Box>

      <TableContainer sx={{ bgcolor: C.paper, border: `1px solid ${C.line}`, borderRadius: 1, overflowX: "auto", mb: 3 }}>
        <Table size="small" sx={{ minWidth: 760 }}>
          <TableHead>
            <TableRow>
              <HeadCell label="Group" />
              <HeadCell label="Stocks" align="right" />
              <HeadCell label="Hit +4%" help="Next session's high at least 4% above the entry close." align="right" />
              <HeadCell label="Gap ≥4%" help="Opened at least 4% up — sold at the open." align="right" />
              <HeadCell label="Avg trade" help="Buy at the close; sell at the open if it gaps past +4%, at +4% if touched, else at the next close." align="right" />
              <HeadCell label="Median" align="right" />
              <HeadCell label="After costs" help="Average minus a 0.25% delivery round trip." align="right" />
              <HeadCell label="Win rate" align="right" />
              <HeadCell label="Buy at open" help="Alternative that avoids the circuit queue: buy at the next open, sell at +4% or the close. Has only paid on the 20% band." align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((s) => (
              <TableRow key={s.bucket} hover>
                <TableCell>
                  {BUCKET_HELP[s.bucket] ? (
                    <Tooltip title={BUCKET_HELP[s.bucket]} arrow>
                      <Box component="span" sx={{ borderBottom: `1px dotted ${C.muted}`, cursor: "help" }}>
                        {BUCKET_LABEL[s.bucket] || s.bucket}
                      </Box>
                    </Tooltip>
                  ) : (BUCKET_LABEL[s.bucket] || s.bucket)}
                </TableCell>
                <TableCell align="right" className="num">{s.n}</TableCell>
                <TableCell align="right" className="num">{pct(s.hit4, 0)}</TableCell>
                <TableCell align="right" className="num">{pct(s.gap4, 0)}</TableCell>
                <TableCell align="right" className="num" sx={{ color: color(s.mean_btst) }}>{signedPct(s.mean_btst)}</TableCell>
                <TableCell align="right" className="num">{signedPct(s.median_btst)}</TableCell>
                <TableCell align="right" className="num" sx={{ color: color(s.net_mean) }}>{signedPct(s.net_mean)}</TableCell>
                <TableCell align="right" className="num">{pct(s.win_rate, 0)}</TableCell>
                <TableCell align="right" className="num" sx={{ color: color(s.open_trade) }}>{signedPct(s.open_trade)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

function History({ daily, history, onOpenStock }) {
  const [open, setOpen] = useState(null);
  const byDay = useMemo(() => {
    const m = {};
    for (const r of history) (m[r.as_of] ||= []).push(r);
    return m;
  }, [history]);

  if (!daily.length) return null;

  return (
    <TableContainer sx={{ bgcolor: C.paper, border: `1px solid ${C.line}`, borderRadius: 1, overflowX: "auto", mb: 3 }}>
      <Table size="small" sx={{ minWidth: 640 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 32 }} />
            <HeadCell label="List date" help="The session the stocks closed on the circuit. The result is from the session after." />
            <HeadCell label="Stocks" align="right" />
            <HeadCell label="Hit +4%" align="right" />
            <HeadCell label="Avg trade" align="right" />
            <HeadCell label="Best" align="right" />
            <HeadCell label="Worst" align="right" />
            <HeadCell label="Source" />
          </TableRow>
        </TableHead>
        <TableBody>
          {daily.map((d) => {
            const isOpen = open === d.as_of;
            return (
              <Fragment key={d.as_of}>
                <TableRow hover className="row-click" onClick={() => setOpen(isOpen ? null : d.as_of)} sx={{ cursor: "pointer" }}>
                  <TableCell sx={{ color: C.muted, pr: 0 }}>
                    {isOpen ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
                  </TableCell>
                  <TableCell>{fmtDate(d.as_of)}</TableCell>
                  <TableCell align="right" className="num">{d.n}</TableCell>
                  <TableCell align="right" className="num">{`${d.hits}/${d.n}`}</TableCell>
                  <TableCell align="right" className="num" sx={{ color: color(d.mean_btst) }}>{signedPct(d.mean_btst)}</TableCell>
                  <TableCell align="right" className="num" sx={{ color: color(d.best) }}>{signedPct(d.best)}</TableCell>
                  <TableCell align="right" className="num" sx={{ color: color(d.worst) }}>{signedPct(d.worst)}</TableCell>
                  <TableCell sx={{ fontSize: 12.5, color: C.muted }}>{d.source === "live" ? "Live" : "EOD"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={8} sx={{ p: 0, borderBottom: isOpen ? undefined : "none" }}>
                    <Collapse in={isOpen} unmountOnExit>
                      <Box sx={{ px: 2, py: 1.5, bgcolor: C.surface }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <HeadCell label="Symbol" />
                              <HeadCell label="Band" align="right" />
                              <HeadCell label="Entry close" align="right" />
                              <HeadCell label="Next open" align="right" />
                              <HeadCell label="Next high" align="right" />
                              <HeadCell label="Next close" align="right" />
                              <HeadCell label="Fill" />
                              <HeadCell label="Result" />
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(byDay[d.as_of] || []).map((r) => (
                              <TableRow key={r.symbol}>
                                <TableCell
                                  className="row-click linkish"
                                  onClick={() => onOpenStock?.(r.symbol)}
                                  sx={{ fontWeight: 500 }}
                                >
                                  {r.symbol}
                                </TableCell>
                                <TableCell align="right" className="num">{r.band == null ? "—" : `${Math.round(r.band * 100)}%`}</TableCell>
                                <TableCell align="right" className="num">{num(r.entry_close)}</TableCell>
                                <TableCell align="right" className="num" sx={{ color: color(r.gap) }}>
                                  {num(r.nx_open)} <Box component="span" sx={{ fontSize: 11.5 }}>({signedPct(r.gap)})</Box>
                                </TableCell>
                                <TableCell align="right" className="num" sx={{ color: color(r.reach) }}>
                                  {num(r.nx_high)} <Box component="span" sx={{ fontSize: 11.5 }}>({signedPct(r.reach)})</Box>
                                </TableCell>
                                <TableCell align="right" className="num">{num(r.nx_close)}</TableCell>
                                <TableCell><FillChip row={r} /></TableCell>
                                <TableCell><ResultChip row={r} /></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function CarryView({ onOpenStock }) {
  const [data, setData] = useState(null);
  const [intradayData, setIntradayData] = useState(null);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState(null);
  const [tab, setTab] = useState(0);

  const load = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      const [carryResult, intradayResult] = await Promise.all([
        getCarry(),
        getCarryIntraday(),
      ]);
      setData(carryResult);
      setIntradayData(intradayResult);
    } catch (e) {
      setErr(e?.message || "Could not load the carry list");
    } finally {
      setBusy(false);
    }
  }, []);

  // The list changes twice a day (15:22 snapshot, evening scoring), so a slow
  // poll is enough to pick either up without a manual reload. Intraday scans
  // happen every 30 min during market hours.
  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  if (busy && !data) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={28} sx={{ color: C.accent }} />
      </Box>
    );
  }
  if (err && !data) return <Note>{err}</Note>;

  return (
    <Box>
      <PageIntro
        title="Circuit carry"
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
        Stocks that closed on their upper price band. Over the last year a close
        on the band reached +4% above that close the next session about three
        times in four; closing at the high without being on the band did
        nothing. Whether a buy at the circuit actually fills is not yet known —
        that is what this page is tracking.
      </PageIntro>

      {!data?.as_of && !intradayData?.as_of ? (
        <Note>No data yet. The first scan runs during market hours (every 30 minutes).</Note>
      ) : (
        <>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: `1px solid ${C.line}` }}>
            <Tab label={<TabLabel name="Today's scan" count={intradayData?.latest?.length || 0} />} sx={{ textTransform: "none" }} />
            <Tab label={<TabLabel name="Track record" count={data.summary?.find((s) => s.bucket === "all")?.n} />} sx={{ textTransform: "none" }} />
          </Tabs>

          {tab === 0 && (
            <>
              {intradayData && <IntradayStrip data={intradayData} />}
              <Typography sx={{ fontSize: 13, color: C.muted, mb: 1.5 }}>
                Stocks approaching their upper circuit — scanned every 30 minutes during market hours.
                "Approaching" means within 1% of the limit; catch them before they lock.
              </Typography>
              <IntradayTable rows={intradayData?.latest || []} onOpenStock={onOpenStock} />
              {intradayData?.progression?.length > 0 && (
                <>
                  <Typography sx={{ fontSize: 14, fontWeight: 500, color: C.text, mt: 3, mb: 1.5 }}>
                    Progression through the day
                  </Typography>
                  <IntradayProgression progression={intradayData.progression} onOpenStock={onOpenStock} />
                </>
              )}
            </>
          )}

          {tab === 1 && (
            <>
              <Summary summary={data.summary || []} />
              <Typography sx={{ fontSize: 13, color: C.muted, mb: 1 }}>
                By session — click a date for the stocks behind it
                {data.pending ? ` · ${data.pending} awaiting their next session` : ""}
              </Typography>
              <History daily={data.daily || []} history={data.history || []} onOpenStock={onOpenStock} />
            </>
          )}
        </>
      )}

      <Note>
        Paper tracking, not a recommendation. The carry trade buys at the close
        and sells the next session at the open if it gaps past +4%, at +4% if
        the price touches it, otherwise at the close. About three in ten of
        these stocks close red the next day, and a 5% band name can fall the
        full 5%. Results before the live snapshots started are rebuilt from the
        end-of-day data and say nothing about fills.
      </Note>
    </Box>
  );
}
