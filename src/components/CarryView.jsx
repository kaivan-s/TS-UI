/**
 * Circuit carry — stocks that closed on their upper price band, and what they
 * did the next session.
 *
 * The list is written by the 15:22 IST snapshot (with the order book behind
 * each name) or, if that was missed, rebuilt from end-of-day data by the
 * post-market run. Outcomes are filled in the evening after the next session.
 */

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { getCarry, getCarryIntraday } from "../api.js";
import { C } from "../theme.js";
import { fmtDate, num, pct } from "../format.js";
import { BookmarkButton } from "../watchlist.jsx";
import { HeadCell, PageIntro, useTableSort } from "./ui.jsx";

const MONO = '"IBM Plex Mono", ui-monospace, monospace';
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
    "At the circuit at 15:22 with shares on offer. These are the only observations where an order could actually have filled — the bucket that decides whether this list is usable.",
  "live: no sellers (queue)":
    "At the circuit with nothing on offer. An order would have joined the queue and most likely not filled.",
  "eod backfill (fill unknown)":
    "Sessions rebuilt from end-of-day data. The pattern is real here, but the order book is unknown.",
};

const STATUS_CONFIG = {
  approaching: {
    label: "Approaching",
    color: C.warn,
    bg: "rgba(196,164,106,0.14)",
    desc: "Within 1% of the circuit, with offers still showing on the book",
  },
  at_circuit: {
    label: "At circuit",
    color: C.good,
    bg: "rgba(125,186,150,0.14)",
    desc: "At the upper limit with offers still on the book",
  },
  heating: {
    label: "Heating up",
    color: C.accent,
    bg: "rgba(142,180,196,0.14)",
    desc: "Moving toward the circuit (2–4% away)",
  },
  locked: {
    label: "Locked",
    color: C.bad,
    bg: "rgba(200,122,122,0.14)",
    desc: "At the circuit with nothing on offer — the book is bid-only",
  },
};

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
const signedPct = (v, d = 1) =>
  v == null ? "—" : `${v > 0 ? "+" : ""}${(v * 100).toFixed(d)}%`;
const crore = (lakh) => (lakh == null ? "—" : `₹${(lakh / 100).toFixed(1)} cr`);
const fmtVolRatio = (v) => {
  if (v == null || Number.isNaN(v)) return "—";
  const n = Number(v);
  return n >= 10 ? `${n.toFixed(0)}×` : `${n.toFixed(1)}×`;
};
const volColor = (v) => {
  if (v == null) return C.muted;
  return v >= 3 ? C.good : v >= 1.5 ? C.text : C.muted;
};
const qty = (v) => {
  if (v == null) return "—";
  const n = Number(v);
  if (n >= 1e7) return `${(n / 1e7).toFixed(1)} cr`;
  if (n >= 1e5) return `${(n / 1e5).toFixed(1)} L`;
  return n.toLocaleString("en-IN");
};

function FillChip({ row }) {
  if (row.source !== "live" || row.fillable == null) {
    return (
      <Tooltip title="Rebuilt from end-of-day data — the order book at the close is not known." arrow>
        <Box
          component="span"
          sx={{
            px: 1,
            py: 0.25,
            borderRadius: 1,
            bgcolor: "rgba(255,255,255,0.04)",
            fontFamily: MONO,
            fontSize: 10.5,
            color: C.muted,
          }}
        >
          Unknown
        </Box>
      </Tooltip>
    );
  }
  const ok = row.fillable === true;
  return (
    <Tooltip
      title={
        ok
          ? "Shares were on offer at the circuit at 15:22 — an order could have filled."
          : "Nothing on offer at the circuit — an order would have queued."
      }
      arrow
    >
      <Box
        component="span"
        sx={{
          px: 1,
          py: 0.25,
          borderRadius: 1,
          bgcolor: ok ? "rgba(125,186,150,0.14)" : "rgba(196,164,106,0.12)",
          border: `1px solid ${ok ? "rgba(125,186,150,0.28)" : "rgba(196,164,106,0.25)"}`,
          fontFamily: MONO,
          fontSize: 10.5,
          fontWeight: 600,
          color: ok ? C.good : C.warn,
        }}
      >
        {ok ? "Sellers present" : "Queue only"}
      </Box>
    </Tooltip>
  );
}

function ResultChip({ row }) {
  if (row.btst == null) {
    return (
      <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: C.muted }}>
        Pending
      </Typography>
    );
  }
  const hit = row.hit4 === true;
  return (
    <Box
      component="span"
      sx={{
        px: 1,
        py: 0.25,
        borderRadius: 1,
        bgcolor: hit ? "rgba(125,186,150,0.14)" : "rgba(200,122,122,0.14)",
        border: `1px solid ${hit ? "rgba(125,186,150,0.28)" : "rgba(200,122,122,0.28)"}`,
        fontFamily: MONO,
        fontSize: 10.5,
        fontWeight: 600,
        color: hit ? C.good : C.bad,
        whiteSpace: "nowrap",
      }}
    >
      {hit ? `Reached +4% · ${signedPct(row.btst)}` : `Missed · ${signedPct(row.btst)}`}
    </Box>
  );
}

function StatusChip({ status }) {
  const cfg = STATUS_CONFIG[status] || {
    label: status,
    color: C.muted,
    bg: "rgba(255,255,255,0.04)",
    desc: "",
  };
  return (
    <Tooltip title={cfg.desc} arrow>
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          px: 1,
          py: 0.25,
          borderRadius: 1,
          bgcolor: cfg.bg,
          border: `1px solid ${cfg.color}33`,
          fontFamily: MONO,
          fontSize: 10.5,
          fontWeight: 600,
          color: cfg.color,
          whiteSpace: "nowrap",
        }}
      >
        {cfg.label}
      </Box>
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
        gap: { xs: 2, sm: 3.5 },
        px: 2.5,
        py: 1.75,
        mb: 2.5,
        bgcolor: "#15161b",
        border: `1px solid ${C.line}`,
        borderRadius: 2.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: C.good }} />
        <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.accent, letterSpacing: "0.14em" }}>
          INTRADAY CIRCUIT SCAN {data.as_of ? `· ${data.as_of}` : ""}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
        <Typography sx={{ fontFamily: MONO, fontSize: 16, color: C.warn, fontWeight: 600 }}>
          {summary?.approaching || 0}
        </Typography>
        <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: C.muted }}>approaching</Typography>
      </Box>

      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
        <Typography sx={{ fontFamily: MONO, fontSize: 16, color: C.good, fontWeight: 600 }}>
          {summary?.at_circuit || 0}
        </Typography>
        <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: C.muted }}>at circuit</Typography>
      </Box>

      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
        <Typography sx={{ fontFamily: MONO, fontSize: 16, color: C.accent, fontWeight: 600 }}>
          {summary?.heating || 0}
        </Typography>
        <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: C.muted }}>heating</Typography>
      </Box>

      <Box sx={{ flex: 1 }} />

      <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: C.muted }}>
        {latest_scan ? `Last scan: ${latest_scan} IST` : "No scans yet"} · {scans?.length || 0} snapshots today
      </Typography>
    </Box>
  );
}

function IntradayTable({ rows, onOpenStock }) {
  const sort = useTableSort({
    key: "distance_to_circuit",
    dir: "asc",
    dirFor: (k) =>
      k === "symbol" || k === "sector" || k === "status"
        ? "asc"
        : k === "distance_to_circuit"
          ? "asc"
          : "desc",
  });
  const shown = useMemo(() => sort.apply(rows), [rows, sort.key, sort.dir]);

  if (!shown.length) {
    return (
      <Box
        sx={{
          p: 4,
          mb: 3,
          borderRadius: 2.5,
          bgcolor: "#15161b",
          border: `1px solid ${C.line}`,
          textAlign: "center",
        }}
      >
        <Typography sx={{ fontSize: 14, color: C.muted }}>
          No stocks approaching the upper circuit right now. Intraday scans run every 30 minutes between 10:00 and 15:00 IST.
        </Typography>
      </Box>
    );
  }

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
        <Table size="small" sx={{ minWidth: 920, ...TABLE_SX }}>
          <TableHead>
            <TableRow>
              <HeadCell label="" sx={{ width: 36, p: 0 }} />
              <HeadCell label="Symbol" help="Click to open the stock." sort={sort} sortKey="symbol" />
              <HeadCell label="Status" help="heating (2-4%), approaching (within 1%), at_circuit, locked." sort={sort} sortKey="status" />
              <HeadCell label="Distance" help="Distance from upper circuit (0% = at circuit)." align="right" sort={sort} sortKey="distance_to_circuit" />
              <HeadCell label="Band" help="Price band (5%, 10%, or 20%)." align="right" sort={sort} sortKey="band" />
              <HeadCell label="Change" help="Change from previous close." align="right" sort={sort} sortKey="pchange" />
              <HeadCell label="Price" help="Last traded price." align="right" sort={sort} sortKey="ltp" />
              <HeadCell label="Circuit" help="Upper circuit limit." align="right" sort={sort} sortKey="upper_circuit" />
              <HeadCell label="Sellers" help="Shares on offer. Zero means nothing is on offer." align="right" sort={sort} sortKey="total_sell_qty" />
              <HeadCell label="Vol Ratio" help="Estimated turnover divided by 20-day median." align="right" sort={sort} sortKey="vol_ratio" />
              <HeadCell label="20d Turn" help="20-day median daily turnover." align="right" sort={sort} sortKey="med_turn20" />
              <HeadCell label="Sector" sort={sort} sortKey="sector" />
            </TableRow>
          </TableHead>
          <TableBody>
            {shown.map((r) => (
              <TableRow
                key={`${r.as_of}-${r.scan_time}-${r.symbol}`}
                hover
                sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.025) !important" } }}
              >
                <TableCell sx={{ py: 0, px: 0.75, width: 36 }}>
                  <BookmarkButton symbol={r.symbol} />
                </TableCell>
                <TableCell
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenStock?.(r.symbol)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onOpenStock?.(r.symbol);
                  }}
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
                <TableCell>
                  <StatusChip status={r.status} />
                </TableCell>
                <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                  {r.distance_to_circuit == null ? "—" : `${(r.distance_to_circuit * 100).toFixed(2)}%`}
                </TableCell>
                <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5, color: C.muted }}>
                  {r.band == null ? "—" : `${Math.round(r.band * 100)}%`}
                </TableCell>
                <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 500, color: C.good }}>
                  {r.pchange == null ? "—" : `+${Number(r.pchange).toFixed(2)}%`}
                </TableCell>
                <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                  {num(r.ltp)}
                </TableCell>
                <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5, color: C.muted }}>
                  {num(r.upper_circuit)}
                </TableCell>
                <TableCell
                  align="right"
                  className="num"
                  sx={{
                    fontFamily: MONO,
                    fontSize: 12.5,
                    color: (r.total_sell_qty || 0) > 0 ? C.good : C.bad,
                  }}
                >
                  {qty(r.total_sell_qty)}
                </TableCell>
                <TableCell
                  align="right"
                  className="num"
                  sx={{ fontFamily: MONO, fontSize: 12.5, color: volColor(r.vol_ratio) }}
                >
                  {fmtVolRatio(r.vol_ratio)}
                </TableCell>
                <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                  {crore(r.med_turn20)}
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

function IntradayProgression({ progression, onOpenStock }) {
  const [open, setOpen] = useState(null);

  if (!progression?.length) return null;

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
              <TableCell sx={{ width: 32 }} />
              <HeadCell label="Symbol" help="Click to open the stock." />
              <HeadCell label="Current" help="Current status." />
              <HeadCell label="Change" align="right" />
              <HeadCell label="Distance" help="Distance to upper circuit." align="right" />
              <HeadCell label="Vol Ratio" align="right" />
              <HeadCell label="20d Turn" align="right" />
              <HeadCell label="First Seen" />
              <HeadCell label="Scans" align="right" />
              <HeadCell label="Fillable" help="Whether sellers are present." />
              <HeadCell label="Sector" />
            </TableRow>
          </TableHead>
          <TableBody>
            {progression.map((p) => {
              const isOpen = open === p.symbol;
              return (
                <Fragment key={p.symbol}>
                  <TableRow
                    hover
                    onClick={() => setOpen(isOpen ? null : p.symbol)}
                    sx={{
                      cursor: "pointer",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.025) !important" },
                    }}
                  >
                    <TableCell sx={{ color: C.muted, pr: 0 }}>
                      {isOpen ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
                    </TableCell>
                    <TableCell
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenStock?.(p.symbol);
                      }}
                      sx={{
                        fontFamily: MONO,
                        fontSize: 13,
                        fontWeight: 600,
                        color: C.text,
                        "&:hover": { color: C.accent },
                      }}
                    >
                      {p.symbol}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={p.current_status} />
                    </TableCell>
                    <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5, color: C.good }}>
                      {p.pchange == null ? "—" : `+${Number(p.pchange).toFixed(2)}%`}
                    </TableCell>
                    <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                      {p.distance_to_circuit == null ? "—" : `${(p.distance_to_circuit * 100).toFixed(2)}%`}
                    </TableCell>
                    <TableCell
                      align="right"
                      className="num"
                      sx={{ fontFamily: MONO, fontSize: 12.5, color: volColor(p.vol_ratio) }}
                    >
                      {fmtVolRatio(p.vol_ratio)}
                    </TableCell>
                    <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                      {crore(p.med_turn20)}
                    </TableCell>
                    <TableCell sx={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>
                      {p.first_seen}
                    </TableCell>
                    <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                      {p.times_seen}×
                    </TableCell>
                    <TableCell>
                      {p.fillable === true ? (
                        <Box component="span" sx={{ fontFamily: MONO, fontSize: 11, color: C.good, fontWeight: 600 }}>
                          Yes
                        </Box>
                      ) : p.fillable === false ? (
                        <Box component="span" sx={{ fontFamily: MONO, fontSize: 11, color: C.bad, fontWeight: 600 }}>
                          No
                        </Box>
                      ) : (
                        <Typography sx={{ fontSize: 12, color: C.muted }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: C.muted }}>{p.sector || "—"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={11} sx={{ p: 0, borderBottom: isOpen ? undefined : "none" }}>
                      <Collapse in={isOpen} unmountOnExit>
                        <Box sx={{ px: 2.5, py: 2, bgcolor: "#0c0d10", borderTop: `1px solid ${C.line}` }}>
                          <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.muted, mb: 1.25 }}>
                            INTRADAY SNAPSHOT TIMELINE
                          </Typography>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                            {(p.history || []).map((h, i) => (
                              <Box
                                key={i}
                                sx={{
                                  px: 1.5,
                                  py: 1,
                                  bgcolor: STATUS_CONFIG[h.status]?.bg || "rgba(255,255,255,0.04)",
                                  border: `1px solid ${C.line}`,
                                  borderRadius: 1.5,
                                }}
                              >
                                <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>
                                  {h.time}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontFamily: MONO,
                                    fontSize: 11.5,
                                    color: STATUS_CONFIG[h.status]?.color || C.text,
                                    fontWeight: 600,
                                    my: 0.25,
                                  }}
                                >
                                  {STATUS_CONFIG[h.status]?.label || h.status}
                                </Typography>
                                <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>
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
    </Box>
  );
}

function StatCard({ label, value, sub, tone }) {
  return (
    <Box
      sx={{
        p: 2.5,
        bgcolor: "#15161b",
        border: `1px solid ${C.line}`,
        borderRadius: 2.5,
      }}
    >
      <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted, letterSpacing: "0.12em", mb: 0.75 }}>
        {label}
      </Typography>
      <Typography sx={{ fontFamily: MONO, fontSize: 26, fontWeight: 600, color: tone || C.text, lineHeight: 1.1 }}>
        {value}
      </Typography>
      {sub && (
        <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: C.muted, mt: 0.5 }}>
          {sub}
        </Typography>
      )}
    </Box>
  );
}

function Summary({ summary }) {
  const all = summary.find((s) => s.bucket === "all");
  if (!all) {
    return (
      <Box
        sx={{
          p: 4,
          mb: 3,
          borderRadius: 2.5,
          bgcolor: "#15161b",
          border: `1px solid ${C.line}`,
          textAlign: "center",
        }}
      >
        <Typography sx={{ fontSize: 14, color: C.muted }}>
          Nothing scored yet. The first results arrive the evening after the first list.
        </Typography>
      </Box>
    );
  }
  const order = [
    "live: sellers present",
    "live: no sellers (queue)",
    "all live",
    "eod backfill (fill unknown)",
    "band 5%",
    "band 10%",
    "band 20%",
  ];
  const rows = order.map((b) => summary.find((s) => s.bucket === b)).filter(Boolean);

  const fillable = summary.find((s) => s.bucket === "live: sellers present");
  const allLive = summary.find((s) => s.bucket === "all live");
  const primary = fillable || allLive || all;
  const basis = fillable
    ? "Live snapshots with sellers on offer — the only observations where an order could have filled"
    : allLive
      ? "Live snapshots (fill mixed) — no sellers-present history yet"
      : "Rebuilt from end-of-day data — fill unknown";

  return (
    <>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
          gap: 2,
          mb: 2,
        }}
      >
        <StatCard label="BUYABLE OBSERVED" value={primary.n} sub={`${primary.sessions} sessions`} />
        <StatCard
          label="REACHED +4% NEXT SESSION"
          value={pct(primary.hit4, 0)}
          tone={C.good}
          sub={`${pct(primary.gap4, 0)} opened above it`}
        />
        <StatCard
          label="MEAN NEXT-SESSION MOVE"
          value={signedPct(primary.mean_btst)}
          tone={color(primary.mean_btst)}
          sub={`${signedPct(primary.net_mean)} less costs`}
        />
        <StatCard
          label="SHARE CLOSING POSITIVE"
          value={pct(primary.win_rate, 0)}
          sub={`lowest ${signedPct(primary.worst)}`}
        />
      </Box>

      <Typography sx={{ fontSize: 12.75, color: C.muted, mb: 2.5, lineHeight: 1.6 }}>
        {basis}. Raw pattern across all {all.n} observations (including queue-only and EOD-rebuilt names): reached +4%{" "}
        <Box component="span" sx={{ color: C.text, fontFamily: MONO }}>
          {pct(all.hit4, 0)}
        </Box>{" "}
        of the time, mean{" "}
        <Box component="span" sx={{ color: C.text, fontFamily: MONO }}>
          {signedPct(all.mean_btst)}
        </Box>
        .
      </Typography>

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
          <Table size="small" sx={{ minWidth: 780, ...TABLE_SX }}>
            <TableHead>
              <TableRow>
                <HeadCell label="Bucket" />
                <HeadCell label="Stocks" align="right" />
                <HeadCell
                  label="Reached +4%"
                  help="Share whose next-session high was at least 4% above the reference close."
                  align="right"
                />
                <HeadCell
                  label="Gap ≥4%"
                  help="Share that opened at least 4% above the reference close."
                  align="right"
                />
                <HeadCell
                  label="Mean Move"
                  help="Measured from the reference close to the next session's open where it gapped past +4%, to +4% where that level was touched, otherwise to the next close."
                  align="right"
                />
                <HeadCell label="Median" align="right" />
                <HeadCell label="Less Costs" help="Mean move minus 0.25% delivery round trip." align="right" />
                <HeadCell label="Share Positive" align="right" />
                <HeadCell
                  label="Open-Ref Variant"
                  help="Measured from next session's open instead of the close."
                  align="right"
                />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((s) => (
                <TableRow
                  key={s.bucket}
                  hover
                  sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.025) !important" } }}
                >
                  <TableCell sx={{ fontWeight: 500, color: C.text }}>
                    {BUCKET_HELP[s.bucket] ? (
                      <Tooltip title={BUCKET_HELP[s.bucket]} arrow>
                        <Box component="span" sx={{ borderBottom: `1px dotted ${C.muted}`, cursor: "help" }}>
                          {BUCKET_LABEL[s.bucket] || s.bucket}
                        </Box>
                      </Tooltip>
                    ) : (
                      BUCKET_LABEL[s.bucket] || s.bucket
                    )}
                  </TableCell>
                  <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                    {s.n}
                  </TableCell>
                  <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                    {pct(s.hit4, 0)}
                  </TableCell>
                  <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                    {pct(s.gap4, 0)}
                  </TableCell>
                  <TableCell
                    align="right"
                    className="num"
                    sx={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 500, color: color(s.mean_btst) }}
                  >
                    {signedPct(s.mean_btst)}
                  </TableCell>
                  <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                    {signedPct(s.median_btst)}
                  </TableCell>
                  <TableCell
                    align="right"
                    className="num"
                    sx={{ fontFamily: MONO, fontSize: 12.5, color: color(s.net_mean) }}
                  >
                    {signedPct(s.net_mean)}
                  </TableCell>
                  <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                    {pct(s.win_rate, 0)}
                  </TableCell>
                  <TableCell
                    align="right"
                    className="num"
                    sx={{ fontFamily: MONO, fontSize: 12.5, color: color(s.open_trade) }}
                  >
                    {signedPct(s.open_trade)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
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
              <TableCell sx={{ width: 32 }} />
              <HeadCell label="Session Date" help="Session the stocks closed on the circuit." />
              <HeadCell label="Stocks" align="right" />
              <HeadCell label="Reached +4%" align="right" />
              <HeadCell label="Mean Move" align="right" />
              <HeadCell label="Highest" align="right" />
              <HeadCell label="Lowest" align="right" />
              <HeadCell label="Source" />
            </TableRow>
          </TableHead>
          <TableBody>
            {daily.map((d) => {
              const isOpen = open === d.as_of;
              return (
                <Fragment key={d.as_of}>
                  <TableRow
                    hover
                    onClick={() => setOpen(isOpen ? null : d.as_of)}
                    sx={{
                      cursor: "pointer",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.025) !important" },
                    }}
                  >
                    <TableCell sx={{ color: C.muted, pr: 0 }}>
                      {isOpen ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
                    </TableCell>
                    <TableCell sx={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 500 }}>
                      {fmtDate(d.as_of)}
                    </TableCell>
                    <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                      {d.n}
                    </TableCell>
                    <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                      {`${d.hits}/${d.n}`}
                    </TableCell>
                    <TableCell
                      align="right"
                      className="num"
                      sx={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 500, color: color(d.mean_btst) }}
                    >
                      {signedPct(d.mean_btst)}
                    </TableCell>
                    <TableCell
                      align="right"
                      className="num"
                      sx={{ fontFamily: MONO, fontSize: 12.5, color: color(d.best) }}
                    >
                      {signedPct(d.best)}
                    </TableCell>
                    <TableCell
                      align="right"
                      className="num"
                      sx={{ fontFamily: MONO, fontSize: 12.5, color: color(d.worst) }}
                    >
                      {signedPct(d.worst)}
                    </TableCell>
                    <TableCell sx={{ fontFamily: MONO, fontSize: 11.5, color: C.muted }}>
                      {d.source === "live" ? "Live" : "EOD"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={8} sx={{ p: 0, borderBottom: isOpen ? undefined : "none" }}>
                      <Collapse in={isOpen} unmountOnExit>
                        <Box sx={{ px: 2.5, py: 2, bgcolor: "#0c0d10", borderTop: `1px solid ${C.line}` }}>
                          <Table size="small" sx={TABLE_SX}>
                            <TableHead>
                              <TableRow>
                                <HeadCell label="Symbol" />
                                <HeadCell label="Band" align="right" />
                                <HeadCell label="Entry Close" align="right" />
                                <HeadCell label="Next Open" align="right" />
                                <HeadCell label="Next High" align="right" />
                                <HeadCell label="Next Close" align="right" />
                                <HeadCell label="Fill" />
                                <HeadCell label="Result" />
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {(byDay[d.as_of] || []).map((r) => (
                                <TableRow key={r.symbol}>
                                  <TableCell
                                    onClick={() => onOpenStock?.(r.symbol)}
                                    sx={{
                                      fontFamily: MONO,
                                      fontSize: 12.5,
                                      fontWeight: 600,
                                      color: C.text,
                                      cursor: onOpenStock ? "pointer" : "default",
                                      "&:hover": onOpenStock ? { color: C.accent } : {},
                                    }}
                                  >
                                    {r.symbol}
                                  </TableCell>
                                  <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12 }}>
                                    {r.band == null ? "—" : `${Math.round(r.band * 100)}%`}
                                  </TableCell>
                                  <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12 }}>
                                    {num(r.entry_close)}
                                  </TableCell>
                                  <TableCell
                                    align="right"
                                    className="num"
                                    sx={{ fontFamily: MONO, fontSize: 12, color: color(r.gap) }}
                                  >
                                    {num(r.nx_open)} ({signedPct(r.gap)})
                                  </TableCell>
                                  <TableCell
                                    align="right"
                                    className="num"
                                    sx={{ fontFamily: MONO, fontSize: 12, color: color(r.reach) }}
                                  >
                                    {num(r.nx_high)} ({signedPct(r.reach)})
                                  </TableCell>
                                  <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12 }}>
                                    {num(r.nx_close)}
                                  </TableCell>
                                  <TableCell>
                                    <FillChip row={r} />
                                  </TableCell>
                                  <TableCell>
                                    <ResultChip row={r} />
                                  </TableCell>
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
    </Box>
  );
}

export default function CarryView({ onOpenStock, externalData, externalIntraday, embedded }) {
  const [data, setData] = useState(null);
  const [intradayData, setIntradayData] = useState(null);
  const [busy, setBusy] = useState(!embedded);
  const [err, setErr] = useState(null);
  const [tab, setTab] = useState(0);

  const load = useCallback(async () => {
    if (embedded) return;
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
  }, [embedded]);

  useEffect(() => {
    if (embedded) return;
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load, embedded]);

  const d = embedded ? externalData : data;
  const intra = embedded ? externalIntraday : intradayData;

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

  const todayCount = intra?.latest?.length || 0;
  const pastCount = d?.summary?.find((s) => s.bucket === "all")?.n || 0;

  return (
    <Box>
      {!embedded && (
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
          Stocks that closed on their upper price band, and what the tape did next.
        </PageIntro>
      )}

      {!d?.as_of && !intra?.as_of ? (
        <Box
          sx={{
            p: 4,
            borderRadius: 2.5,
            bgcolor: "#15161b",
            border: `1px solid ${C.line}`,
            textAlign: "center",
          }}
        >
          <Typography sx={{ fontSize: 14, color: C.muted }}>
            No circuit carry data yet. Intraday snapshots run every 30 minutes during market hours.
          </Typography>
        </Box>
      ) : (
        <>
          {/* Sub-navigation bar */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
              mb: 2.5,
            }}
          >
            <Box
              sx={{
                display: "inline-flex",
                p: 0.45,
                borderRadius: 1.75,
                bgcolor: "#15161b",
                border: `1px solid ${C.line}`,
              }}
            >
              {[
                { id: 0, label: "Today's Intraday Scan", count: todayCount },
                { id: 1, label: "Past Observations & Base Rates", count: pastCount },
              ].map((item) => {
                const active = tab === item.id;
                return (
                  <Box
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setTab(item.id)}
                    onKeyDown={(e) => e.key === "Enter" && setTab(item.id)}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 1,
                      px: 1.5,
                      py: 0.65,
                      borderRadius: 1.25,
                      cursor: "pointer",
                      bgcolor: active ? "rgba(238,234,227,0.1)" : "transparent",
                      color: active ? C.text : C.muted,
                      transition: "all 0.15s ease",
                      "&:hover": { color: C.text },
                    }}
                  >
                    <Typography sx={{ fontSize: 12.5, fontWeight: active ? 600 : 500 }}>
                      {item.label}
                    </Typography>
                    <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: active ? C.accent : C.muted }}>
                      {item.count}
                    </Typography>
                  </Box>
                );
              })}
            </Box>

            <Typography sx={{ fontSize: 12.5, color: C.muted }}>
              {tab === 0
                ? "Approaching = within 1% of upper limit with sell offers still on the book"
                : d?.pending
                  ? `${d.pending} stocks awaiting next-session resolution`
                  : "Historical upper-band carries & order-book fill breakdown"}
            </Typography>
          </Box>

          {tab === 0 && (
            <>
              {intra && <IntradayStrip data={intra} />}
              <IntradayTable rows={intra?.latest || []} onOpenStock={onOpenStock} />
              {intra?.progression?.length > 0 && (
                <>
                  <Typography sx={{ fontSize: 14.5, fontWeight: 600, color: C.text, mt: 3, mb: 1.5 }}>
                    Intraday Progression Timeline
                  </Typography>
                  <IntradayProgression progression={intra.progression} onOpenStock={onOpenStock} />
                </>
              )}
            </>
          )}

          {tab === 1 && (
            <>
              <Summary summary={d?.summary || []} />
              <Typography sx={{ fontSize: 14.5, fontWeight: 600, color: C.text, mb: 1.5 }}>
                Session-by-Session Breakdown
              </Typography>
              <History daily={d?.daily || []} history={d?.history || []} onOpenStock={onOpenStock} />
            </>
          )}
        </>
      )}

      {/* Disclaimer Footer Box */}
      <Box
        sx={{
          p: 2.5,
          borderRadius: 2.5,
          bgcolor: "#15161b",
          border: `1px solid ${C.line}`,
        }}
      >
        <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: C.muted, mb: 0.5 }}>
          OBSERVATIONAL METHODOLOGY NOTE
        </Typography>
        <Typography sx={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6 }}>
          Historical observations of past price data, not a recommendation. Figures are measured from the reference close to the next session&apos;s open where it gapped past +4%, to +4% where that level was touched, otherwise to the next close. Rows rebuilt from end-of-day data do not capture order-book queue depth.
        </Typography>
      </Box>
    </Box>
  );
}
