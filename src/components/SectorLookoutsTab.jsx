/**
 * The sector table. Every sector for the latest post-market scan, scored
 * against the other sectors that day, with a drill-down per sector.
 *
 *  - Cross-sectional heatmap of all sectors, filtered by state group
 *  - Expanding a row gives 20 days of that sector's history, the shape
 *    checks behind its verdict, and its constituents
 *  - Falls back to the live classification before the 7:30 PM job has run
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import TimelineIcon from "@mui/icons-material/Timeline";
import KlassChip from "./KlassChip.jsx";
import { HeadCell, Note } from "./ui.jsx";
import { useAuth } from "../auth.jsx";
import { C } from "../theme.js";
import { num, signed } from "../format.js";
import { FILTER_HELP, STATE_GROUP, STATE_GROUPS } from "../glossary.js";
import { getSectorLookouts, getSectorHistory, getSectorConstituents } from "../api.js";

const FILTERS = ["acting", "watching", "out", "all"];

/**
 * The saved scan and the live scan carry the same fields under different
 * cases, so the live rows are reshaped to match rather than teaching every
 * cell to read both.
 */
function fromLiveRow(r) {
  return {
    sector: r.sector,
    klass: r.klass,
    buy_ready: r.buy_ready,
    t_rel: r.T_rel,
    b: r.B,
    cmf_rel: r.cmf_rel,
    cmf: r.cmf,
    rs: r.rs,
    rs_chg_5: r.rs_chg_5,
    deliv_quality_rel: r.deliv_quality_rel,
    n_adv: r.n_adv,
    n_stocks: r.n_stocks,
    top_share: r.top_share,
    note: r.note,
  };
}

// Heatmap color scales
const HEATMAP_COLORS = {
  // For T_rel (turnover expansion): higher = hotter
  t_rel: (v) => {
    if (v == null) return "transparent";
    if (v >= 2.0) return "rgba(239,83,80,0.35)";   // Very hot
    if (v >= 1.5) return "rgba(255,167,38,0.30)";  // Hot
    if (v >= 1.2) return "rgba(255,213,79,0.25)";  // Warm
    if (v >= 1.0) return "rgba(255,255,255,0.05)"; // Normal
    return "rgba(100,181,246,0.15)";               // Cool
  },
  // For breadth (B): positive = green, negative = red
  b: (v) => {
    if (v == null) return "transparent";
    if (v >= 0.3) return "rgba(125,186,150,0.35)";   // Strong green
    if (v >= 0.15) return "rgba(125,186,150,0.25)";  // Green
    if (v >= 0) return "rgba(125,186,150,0.10)";     // Slight green
    if (v >= -0.15) return "rgba(239,83,80,0.10)";   // Slight red
    if (v >= -0.3) return "rgba(239,83,80,0.25)";    // Red
    return "rgba(239,83,80,0.35)";                   // Strong red
  },
  // For CMF: accumulation vs distribution
  cmf: (v) => {
    if (v == null) return "transparent";
    if (v >= 0.2) return "rgba(125,186,150,0.30)";
    if (v >= 0.1) return "rgba(125,186,150,0.20)";
    if (v >= 0) return "rgba(125,186,150,0.08)";
    if (v >= -0.1) return "rgba(239,83,80,0.08)";
    if (v >= -0.2) return "rgba(239,83,80,0.20)";
    return "rgba(239,83,80,0.30)";
  },
  // For RS change: momentum
  rs_chg: (v) => {
    if (v == null) return "transparent";
    if (v >= 3) return "rgba(125,186,150,0.30)";
    if (v >= 1) return "rgba(125,186,150,0.15)";
    if (v >= 0) return "rgba(255,255,255,0.03)";
    if (v >= -1) return "rgba(239,83,80,0.10)";
    if (v >= -3) return "rgba(239,83,80,0.20)";
    return "rgba(239,83,80,0.30)";
  },
  // For delivery quality
  deliv: (v) => {
    if (v == null) return "transparent";
    if (v >= 1.2) return "rgba(125,186,150,0.25)";
    if (v >= 1.0) return "rgba(125,186,150,0.10)";
    if (v >= 0.8) return "rgba(255,255,255,0.03)";
    return "rgba(239,83,80,0.15)";
  },
};

// Shape mark badges
function ShapeMark({ mark }) {
  if (!mark) return null;
  const config = {
    crossing: { label: "C", color: C.accent, tip: "Crossing day: volume expansion with green breadth" },
    pullback: { label: "P", color: C.good, tip: "Orderly pullback: red day on lighter volume" },
    heavy_red: { label: "H", color: C.bad, tip: "Heavy red: sellers won (red day traded more than crossing)" },
  };
  const c = config[mark];
  if (!c) return null;
  return (
    <Tooltip title={c.tip} placement="top" arrow>
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 18,
          height: 18,
          borderRadius: "50%",
          bgcolor: `${c.color}22`,
          color: c.color,
          fontSize: 10,
          fontWeight: 700,
          ml: 0.5,
        }}
      >
        {c.label}
      </Box>
    </Tooltip>
  );
}

// Verdict badge
function VerdictBadge({ verdict }) {
  if (!verdict) return null;
  const config = {
    crossing: { label: "Crossing", color: C.accent },
    orderly: { label: "Buy Ready", color: C.good },
    sellers_won: { label: "Sellers Won", color: C.bad },
    waiting: { label: "Waiting", color: C.muted },
    no_crossing: { label: "No Crossing", color: C.muted },
    expand_not_quiet: { label: "Not From Quiet", color: C.warn },
  };
  const c = config[verdict] || { label: verdict, color: C.muted };
  return (
    <Chip
      size="small"
      label={c.label}
      sx={{
        bgcolor: `${c.color}15`,
        color: c.color,
        fontWeight: 500,
        fontSize: 11,
      }}
    />
  );
}

// Time-series row for a sector's history
function HistoryRow({ row, onClick }) {
  const date = row.scan_date?.slice(5) || ""; // MM-DD format
  const shape = row.shape_report || {};
  const checks = shape.checks || [];
  const crossing = shape.crossing || {};
  
  // Determine mark for this date
  let mark = null;
  if (crossing.date && row.scan_date?.startsWith(crossing.date?.slice(0, 10))) {
    mark = "crossing";
  }
  
  return (
    <TableRow
      hover
      onClick={onClick}
      sx={{ cursor: "pointer", "&:hover": { bgcolor: "rgba(255,255,255,0.02)" } }}
    >
      <TableCell sx={{ py: 0.75, fontSize: 12 }}>
        {date}
        <ShapeMark mark={mark} />
      </TableCell>
      <TableCell sx={{ py: 0.75 }}>
        <KlassChip klass={row.klass} small />
      </TableCell>
      <TableCell
        align="right"
        sx={{ py: 0.75, bgcolor: HEATMAP_COLORS.t_rel(row.t_rel) }}
      >
        {num(row.t_rel)}
      </TableCell>
      <TableCell
        align="right"
        sx={{ py: 0.75, bgcolor: HEATMAP_COLORS.b(row.b) }}
      >
        {num(row.b)}
      </TableCell>
      <TableCell
        align="right"
        sx={{ py: 0.75, bgcolor: HEATMAP_COLORS.cmf(row.cmf_rel) }}
      >
        {num(row.cmf_rel)}
      </TableCell>
      <TableCell
        align="right"
        sx={{ py: 0.75, bgcolor: HEATMAP_COLORS.rs_chg(row.rs_chg_5) }}
      >
        {signed(row.rs_chg_5, 1)}
      </TableCell>
      <TableCell
        align="right"
        sx={{ py: 0.75, bgcolor: HEATMAP_COLORS.deliv(row.deliv_quality_rel) }}
      >
        {num(row.deliv_quality_rel)}
      </TableCell>
    </TableRow>
  );
}

// Sector history panel (time-series heatmap)
function SectorHistoryPanel({ sector, onClose, onOpenSector }) {
  const [history, setHistory] = useState([]);
  const [constituents, setConstituents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isPremium } = useAuth();

  useEffect(() => {
    if (!sector) return;
    setLoading(true);
    
    Promise.all([
      getSectorHistory(sector, 30),  // Fetch 30 days
      getSectorConstituents(sector, 15),  // Fetch 15 stocks
    ])
      .then(([histRes, constRes]) => {
        setHistory(histRes.rows || []);
        setConstituents(constRes.rows || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sector]);

  if (!sector) return null;

  const latest = history[history.length - 1] || {};
  const shape = latest.shape_report || {};
  const hasHistory = history.length > 1;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        mb: 2,
        bgcolor: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(238,234,227,0.08)",
        borderRadius: 2,
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <TimelineIcon sx={{ color: C.accent, fontSize: 22 }} />
          <Typography sx={{ fontWeight: 600, fontSize: 16 }}>{sector}</Typography>
          {latest.klass && <KlassChip klass={latest.klass} />}
          {shape.verdict && <VerdictBadge verdict={shape.verdict} />}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            size="small"
            onClick={() => onOpenSector?.(sector)}
            sx={{ fontSize: 12, color: C.accent }}
          >
            Full Details →
          </Button>
          <IconButton size="small" onClick={onClose}>
            <ExpandLessIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Box>
          {/* Top row: Verdict + Shape Checks + History - all horizontal */}
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            {/* Verdict summary */}
            {shape.verdict_text && (
              <Box sx={{ flex: "0 0 auto", maxWidth: 280, p: 1.5, bgcolor: "rgba(142,180,196,0.06)", borderRadius: 1.5 }}>
                <Typography sx={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>
                  {shape.verdict_text}
                </Typography>
              </Box>
            )}

            {/* Shape checks - compact horizontal */}
            {shape.checks?.length > 0 && (
              <Box sx={{ flex: "0 0 auto" }}>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: C.muted, mb: 1, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Shape Checks
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  {shape.checks.map((c, i) => (
                    <Box
                      key={i}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                      }}
                    >
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          bgcolor:
                            c.ok === true
                              ? "rgba(125,186,150,0.25)"
                              : c.ok === false
                              ? "rgba(239,83,80,0.25)"
                              : "rgba(255,255,255,0.1)",
                          color:
                            c.ok === true ? C.good : c.ok === false ? C.bad : C.muted,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {c.ok === true ? "✓" : c.ok === false ? "✗" : "?"}
                      </Box>
                      <Typography sx={{ fontSize: 11, color: C.text, lineHeight: 1.3 }}>
                        {c.text}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* History table - takes remaining space */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: C.muted, mb: 1, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {hasHistory ? `Last ${history.length} Sessions` : "History"}
              </Typography>
              {history.length === 0 ? (
                <Typography sx={{ fontSize: 12, color: C.muted }}>
                  No history yet. Builds after daily 7:30 PM scans.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ py: 0.5, px: 1, fontSize: 10, fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ py: 0.5, px: 1, fontSize: 10, fontWeight: 600 }}>State</TableCell>
                      <TableCell align="right" sx={{ py: 0.5, px: 1, fontSize: 10, fontWeight: 600 }}>T_rel</TableCell>
                      <TableCell align="right" sx={{ py: 0.5, px: 1, fontSize: 10, fontWeight: 600 }}>B</TableCell>
                      <TableCell align="right" sx={{ py: 0.5, px: 1, fontSize: 10, fontWeight: 600 }}>CMF</TableCell>
                      <TableCell align="right" sx={{ py: 0.5, px: 1, fontSize: 10, fontWeight: 600 }}>RS Δ5</TableCell>
                      <TableCell align="right" sx={{ py: 0.5, px: 1, fontSize: 10, fontWeight: 600 }}>Deliv</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...history].reverse().map((row) => (
                      <HistoryRow
                        key={row.scan_date}
                        row={row}
                        onClick={() => {}}
                      />
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Box>

          {/* Bottom: Top Stocks - full width horizontal */}
          {isPremium && constituents.length > 0 && (
            <Box sx={{ pt: 1.5, borderTop: "1px solid rgba(238,234,227,0.06)" }}>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: C.muted, mb: 1, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Top Stocks by Turnover
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {constituents.map((s) => (
                  <Box
                    key={s.symbol}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.5,
                      py: 0.35,
                      px: 1,
                      bgcolor: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(238,234,227,0.06)",
                      borderRadius: 0.75,
                      "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                    }}
                  >
                    <Typography sx={{ fontSize: 11, fontWeight: 600, color: C.text }}>{s.symbol}</Typography>
                    <Typography
                      sx={{
                        fontSize: 10,
                        color: s.ret > 0 ? C.good : s.ret < 0 ? C.bad : C.muted,
                        fontWeight: 600,
                      }}
                    >
                      {s.ret != null ? `${s.ret > 0 ? "+" : ""}${(s.ret * 100).toFixed(1)}%` : "—"}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
}

// Main cross-sectional heatmap row
function SectorRow({ row, expanded, onToggle, isPremium }) {
  const shape = row.shape_report || {};

  // Non-premium users can't expand rows
  const handleClick = isPremium ? onToggle : undefined;
  
  return (
    <TableRow
      hover
      onClick={handleClick}
      sx={{
        cursor: isPremium ? "pointer" : "default",
        "&:hover": { bgcolor: isPremium ? "rgba(255,255,255,0.02)" : undefined },
        ...(expanded && { bgcolor: "rgba(142,180,196,0.05)" }),
      }}
    >
      <TableCell sx={{ py: 1, fontWeight: 500 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {row.sector}
          {isPremium && (expanded ? (
            <ExpandLessIcon sx={{ fontSize: 16, color: C.muted }} />
          ) : (
            <ExpandMoreIcon sx={{ fontSize: 16, color: C.muted }} />
          ))}
        </Box>
      </TableCell>
      <TableCell sx={{ py: 1 }}>
        {isPremium ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <KlassChip klass={row.klass} />
            {row.buy_ready && (
              <Chip
                size="small"
                label="Buy"
                sx={{ bgcolor: "rgba(125,186,150,0.12)", color: C.good, fontSize: 10 }}
              />
            )}
            {shape.verdict && <VerdictBadge verdict={shape.verdict} />}
          </Box>
        ) : (
          <Box sx={{ filter: "blur(6px)", opacity: 0.4 }}>
            <KlassChip klass={row.klass} />
          </Box>
        )}
      </TableCell>
      <TableCell
        align="right"
        sx={{
          py: 1,
          bgcolor: HEATMAP_COLORS.t_rel(row.t_rel),
          ...(isPremium ? {} : { filter: "blur(4px)", opacity: 0.5 }),
        }}
      >
        {num(row.t_rel)}
      </TableCell>
      <TableCell
        align="right"
        sx={{
          py: 1,
          bgcolor: HEATMAP_COLORS.b(row.b),
          ...(isPremium ? {} : { filter: "blur(4px)", opacity: 0.5 }),
        }}
      >
        {num(row.b)}
      </TableCell>
      <TableCell
        align="right"
        sx={{
          py: 1,
          bgcolor: HEATMAP_COLORS.cmf(row.cmf_rel),
          ...(isPremium ? {} : { filter: "blur(4px)", opacity: 0.5 }),
        }}
      >
        {num(row.cmf_rel)}
      </TableCell>
      <TableCell
        align="right"
        sx={{
          py: 1,
          bgcolor: HEATMAP_COLORS.rs_chg(row.rs_chg_5),
          ...(isPremium ? {} : { filter: "blur(4px)", opacity: 0.5 }),
        }}
      >
        {signed(row.rs_chg_5, 1)}
      </TableCell>
      <TableCell
        align="right"
        sx={{
          py: 1,
          bgcolor: HEATMAP_COLORS.deliv(row.deliv_quality_rel),
          ...(isPremium ? {} : { filter: "blur(4px)", opacity: 0.5 }),
        }}
      >
        {num(row.deliv_quality_rel)}
      </TableCell>
      <TableCell align="right" sx={{ py: 1, fontSize: 12 }}>
        {row.n_adv ?? "—"}/{row.n_stocks ?? "—"}
      </TableCell>
    </TableRow>
  );
}

// Main component
export default function SectorLookoutsTab({ onOpenSector, liveRows }) {
  const [data, setData] = useState({ rows: [], scan_date: null });
  const [loading, setLoading] = useState(true);
  const [expandedSector, setExpandedSector] = useState(null);
  const [filter, setFilter] = useState("acting");
  const { isPremium } = useAuth();

  const fetchData = useCallback(() => {
    setLoading(true);

    getSectorLookouts()
      .then((res) => {
        // Ensure rows is always an array
        const safeData = {
          rows: res?.rows || [],
          scan_date: res?.scan_date || null,
        };
        setData(safeData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // The saved scan is richer (it carries shape reports and history), but it
  // only exists once the post-market job has run, so fall back to the live
  // classification rather than showing an empty page.
  const rows = useMemo(() => {
    if ((data.rows || []).length) return data.rows;
    return (liveRows || []).map(fromLiveRow);
  }, [data.rows, liveRows]);

  const usingLive = (data.rows || []).length === 0 && rows.length > 0;

  const counts = useMemo(() => {
    const c = { all: rows.length, acting: 0, watching: 0, out: 0 };
    for (const r of rows) c[STATE_GROUP[r.klass] || "out"] += 1;
    return c;
  }, [rows]);

  // Acting first, then by turnover expansion within a group.
  const sorted = useMemo(() => {
    const order = { CROSSING: 0, PULLBACK: 1, CROSSING_UNVERIFIED: 2, BASE: 3, NEGLECT: 4, DISQUALIFIED: 5, NONE: 6 };
    return rows
      .filter((r) => filter === "all" || (STATE_GROUP[r.klass] || "out") === filter)
      .sort((a, b) => {
        const oa = order[a.klass] ?? 99;
        const ob = order[b.klass] ?? 99;
        if (oa !== ob) return oa - ob;
        return (b.t_rel || 0) - (a.t_rel || 0);
      });
  }, [rows, filter]);

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center", mb: 2 }}>
        {FILTERS.map((f) => {
          const on = filter === f;
          const label = f === "all" ? "All" : STATE_GROUPS[f].label;
          return (
            <Tooltip key={f} title={FILTER_HELP[f]} placement="top" arrow enterDelay={300}>
              <Chip
                label={`${label}  ${counts[f] || 0}`}
                onClick={() => setFilter(f)}
                variant={on ? "filled" : "outlined"}
                sx={{
                  borderColor: on ? "transparent" : "rgba(238,234,227,0.10)",
                  bgcolor: on ? C.text : "transparent",
                  color: on ? C.bg : C.muted,
                  "&:hover": { bgcolor: on ? "#d8d4cd" : "rgba(238,234,227,0.04)" },
                }}
              />
            </Tooltip>
          );
        })}
        <Typography sx={{ fontSize: 12, color: C.muted, ml: "auto", display: { xs: "none", sm: "block" } }}>
          {usingLive ? "live scan" : data.scan_date}
        </Typography>
      </Box>

      <Note>
        Every sector, scored against the other sectors that day rather than against itself,
        so 1.0 always reads as normal. Colour marks intensity. Click a sector for its 20-day
        history and shape checks. Only <b>Acting</b> sectors feed Setups.
      </Note>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : rows.length === 0 ? (
        <Note>
          No sector data yet. The post-market job writes it at 7:30 PM IST on trading days.
        </Note>
      ) : (
        <>
          {/* Cross-sectional heatmap table */}
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table stickyHeader size="small" sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <HeadCell label="Sector" />
                  <HeadCell label="State" help="Acting, watching, or ruled out. Hover any chip for the specific state and the grounds for it." />
                  <HeadCell k="T_rel" align="right" />
                  <HeadCell k="B" align="right" />
                  <HeadCell label="CMF rel" align="right" help="Chaikin Money Flow vs cross-sectional median" />
                  <HeadCell k="rs_chg_5" align="right" />
                  <HeadCell label="Deliv" align="right" help="Delivery quality vs peers" />
                  <HeadCell label="Adv" align="right" help="Advancing stocks / Total" />
                </TableRow>
              </TableHead>
              <TableBody>
                {sorted.map((row) => (
                  <React.Fragment key={row.sector}>
                    <SectorRow
                      row={row}
                      expanded={expandedSector === row.sector}
                      onToggle={() =>
                        setExpandedSector(expandedSector === row.sector ? null : row.sector)
                      }
                      isPremium={isPremium}
                    />
                    {/* Inline expanded panel below the row */}
                    {expandedSector === row.sector && (
                      <TableRow>
                        <TableCell colSpan={8} sx={{ p: 0, border: 0 }}>
                          <SectorHistoryPanel
                            sector={row.sector}
                            onClose={() => setExpandedSector(null)}
                            onOpenSector={onOpenSector}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
                {sorted.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ color: C.muted, py: 4, textAlign: "center" }}>
                      {filter === "acting"
                        ? "No sector woke up or pulled back today. An empty list is the scan working — markets do not rotate every session."
                        : "Nothing in this filter."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
