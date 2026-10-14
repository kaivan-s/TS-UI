/**
 * The sector table. Every sector for the latest post-market scan, scored
 * against the other sectors that day, with a drill-down per sector.
 *
 *  - Cross-sectional heatmap of all sectors, filtered by state group
 *  - Expanding a row gives 20 days of that sector's history, the shape
 *    checks behind its verdict, and its constituents
 *  - Falls back to the live classification before the 20:30 IST job has run
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import SearchIcon from "@mui/icons-material/Search";
import TimelineIcon from "@mui/icons-material/Timeline";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import KlassChip from "./KlassChip.jsx";
import { HeadCell, useTableSort } from "./ui.jsx";
import { useAuth } from "../auth.jsx";
import { C } from "../theme.js";
import { num, signed } from "../format.js";
import { BUY_READY_HELP, FILTER_HELP, STATE_GROUP, STATE_GROUPS, STATES } from "../glossary.js";
import { getSectorLookouts, getSectorHistory, getSectorConstituents } from "../api.js";

const MONO = '"IBM Plex Mono", ui-monospace, monospace';
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

// Heatmap color scales — tuned to architectural dark desk palette
const HEATMAP_COLORS = {
  // For T_rel (turnover expansion): higher = hotter
  t_rel: (v) => {
    if (v == null) return "transparent";
    if (v >= 2.0) return "rgba(200,122,122,0.28)";
    if (v >= 1.5) return "rgba(196,164,106,0.26)";
    if (v >= 1.3) return "rgba(196,164,106,0.16)";
    if (v >= 1.0) return "rgba(255,255,255,0.025)";
    return "rgba(142,180,196,0.10)";
  },
  // For breadth (B): positive = green, negative = red
  b: (v) => {
    if (v == null) return "transparent";
    if (v >= 0.3) return "rgba(125,186,150,0.28)";
    if (v >= 0.15) return "rgba(125,186,150,0.18)";
    if (v >= 0) return "rgba(125,186,150,0.07)";
    if (v >= -0.15) return "rgba(200,122,122,0.08)";
    if (v >= -0.3) return "rgba(200,122,122,0.18)";
    return "rgba(200,122,122,0.28)";
  },
  // For CMF: accumulation vs distribution
  cmf: (v) => {
    if (v == null) return "transparent";
    if (v >= 0.2) return "rgba(125,186,150,0.26)";
    if (v >= 0.1) return "rgba(125,186,150,0.16)";
    if (v >= 0) return "rgba(125,186,150,0.06)";
    if (v >= -0.1) return "rgba(200,122,122,0.07)";
    if (v >= -0.2) return "rgba(200,122,122,0.16)";
    return "rgba(200,122,122,0.26)";
  },
  // For RS change: momentum
  rs_chg: (v) => {
    if (v == null) return "transparent";
    if (v >= 3) return "rgba(125,186,150,0.24)";
    if (v >= 1) return "rgba(125,186,150,0.12)";
    if (v >= 0) return "rgba(255,255,255,0.02)";
    if (v >= -1) return "rgba(200,122,122,0.08)";
    if (v >= -3) return "rgba(200,122,122,0.16)";
    return "rgba(200,122,122,0.24)";
  },
  // For delivery quality
  deliv: (v) => {
    if (v == null) return "transparent";
    if (v >= 1.2) return "rgba(125,186,150,0.22)";
    if (v >= 1.0) return "rgba(125,186,150,0.09)";
    if (v >= 0.8) return "rgba(255,255,255,0.02)";
    return "rgba(200,122,122,0.14)";
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
          width: 17,
          height: 17,
          borderRadius: 0.75,
          bgcolor: `${c.color}1e`,
          border: `1px solid ${c.color}40`,
          color: c.color,
          fontFamily: MONO,
          fontSize: 9.5,
          fontWeight: 700,
          ml: 0.75,
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
    orderly: { label: "Shape confirmed", color: C.good },
    sellers_won: { label: "Sellers Won", color: C.bad },
    waiting: { label: "Waiting", color: C.muted },
    no_crossing: { label: "No Crossing", color: C.muted },
    expand_not_quiet: { label: "Not From Quiet", color: C.warn },
  };
  const c = config[verdict] || { label: verdict, color: C.muted };
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 0.9,
        py: 0.25,
        borderRadius: 1,
        bgcolor: `${c.color}14`,
        border: `1px solid ${c.color}33`,
        color: c.color,
        fontFamily: MONO,
        fontWeight: 600,
        fontSize: 10.5,
      }}
    >
      {c.label}
    </Box>
  );
}

// Specific 7-state sub-badge
function SpecificStateBadge({ klass }) {
  const s = STATES[klass];
  if (!s) return null;
  return (
    <Tooltip title={`${s.short} — ${s.help}`} placement="top" arrow enterDelay={200}>
      <Typography
        component="span"
        sx={{
          fontFamily: MONO,
          fontSize: 10.5,
          color: C.muted,
          cursor: "help",
          borderBottom: "1px dotted rgba(238,234,227,0.2)",
        }}
      >
        {s.label}
      </Typography>
    </Tooltip>
  );
}

// Time-series row for a sector's history
function HistoryRow({ row }) {
  const date = row.scan_date?.slice(5) || ""; // MM-DD format
  const shape = row.shape_report || {};
  const crossing = shape.crossing || {};

  let mark = null;
  if (crossing.date && row.scan_date?.startsWith(crossing.date?.slice(0, 10))) {
    mark = "crossing";
  }

  return (
    <TableRow
      hover
      sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.02)" } }}
    >
      <TableCell sx={{ py: 0.7, fontFamily: MONO, fontSize: 11.5 }}>
        {date}
        <ShapeMark mark={mark} />
      </TableCell>
      <TableCell sx={{ py: 0.7 }}>
        <KlassChip klass={row.klass} size="small" />
      </TableCell>
      <TableCell
        align="right"
        className="num"
        sx={{ py: 0.7, fontFamily: MONO, fontSize: 11.5, bgcolor: HEATMAP_COLORS.t_rel(row.t_rel) }}
      >
        {num(row.t_rel)}
      </TableCell>
      <TableCell
        align="right"
        className="num"
        sx={{ py: 0.7, fontFamily: MONO, fontSize: 11.5, bgcolor: HEATMAP_COLORS.b(row.b) }}
      >
        {num(row.b)}
      </TableCell>
      <TableCell
        align="right"
        className="num"
        sx={{ py: 0.7, fontFamily: MONO, fontSize: 11.5, bgcolor: HEATMAP_COLORS.cmf(row.cmf_rel) }}
      >
        {num(row.cmf_rel)}
      </TableCell>
      <TableCell
        align="right"
        className="num"
        sx={{ py: 0.7, fontFamily: MONO, fontSize: 11.5, bgcolor: HEATMAP_COLORS.rs_chg(row.rs_chg_5) }}
      >
        {signed(row.rs_chg_5, 1)}
      </TableCell>
      <TableCell
        align="right"
        className="num"
        sx={{ py: 0.7, fontFamily: MONO, fontSize: 11.5, bgcolor: HEATMAP_COLORS.deliv(row.deliv_quality_rel) }}
      >
        {num(row.deliv_quality_rel)}
      </TableCell>
    </TableRow>
  );
}

// Sector history panel (time-series heatmap)
function SectorHistoryPanel({ sector, onClose, onOpenSector, onOpenStock }) {
  const [history, setHistory] = useState([]);
  const [constituents, setConstituents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isPremium } = useAuth();

  useEffect(() => {
    if (!sector) return;
    setLoading(true);

    Promise.all([
      getSectorHistory(sector, 30),
      getSectorConstituents(sector, 15),
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
    <Box
      sx={{
        p: 2.5,
        mx: 2,
        my: 1.5,
        bgcolor: "#111216",
        border: `1px solid ${C.line}`,
        borderRadius: 2,
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
          <TimelineIcon sx={{ color: C.accent, fontSize: 20 }} />
          <Typography sx={{ fontWeight: 600, fontSize: 15.5, color: C.text }}>{sector}</Typography>
          {latest.klass && <KlassChip klass={latest.klass} />}
          {latest.klass && <SpecificStateBadge klass={latest.klass} />}
          {shape.verdict && <VerdictBadge verdict={shape.verdict} />}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onOpenSector?.(sector)}
            endIcon={<OpenInNewRoundedIcon sx={{ fontSize: "14px !important" }} />}
            sx={{
              fontSize: 11.5,
              color: C.accent,
              borderColor: "rgba(142,180,196,0.28)",
              textTransform: "none",
              py: 0.4,
              "&:hover": { borderColor: C.accent, bgcolor: "rgba(142,180,196,0.08)" },
            }}
          >
            Full Sector Dossier
          </Button>
          <IconButton size="small" onClick={onClose} sx={{ color: C.muted }}>
            <ExpandLessIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={22} sx={{ color: C.accent }} />
        </Box>
      ) : (
        <Box>
          {/* Top row: Verdict + Shape Checks + History */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "280px 1fr" }, gap: 2.5, mb: 2 }}>
            {/* Left column: Verdict & Shape checks */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
              {shape.verdict_text && (
                <Box
                  sx={{
                    p: 1.75,
                    bgcolor: "#15161b",
                    border: `1px solid ${C.line}`,
                    borderRadius: 1.75,
                  }}
                >
                  <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", color: C.accent, mb: 0.5 }}>
                    VERDICT READOUT
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: C.text, lineHeight: 1.55 }}>
                    {shape.verdict_text}
                  </Typography>
                </Box>
              )}

              {shape.checks?.length > 0 && (
                <Box
                  sx={{
                    p: 1.75,
                    bgcolor: "#15161b",
                    border: `1px solid ${C.line}`,
                    borderRadius: 1.75,
                  }}
                >
                  <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", color: C.muted, mb: 1.25 }}>
                    SHAPE CHECKS
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.85 }}>
                    {shape.checks.map((c, i) => (
                      <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            mt: 0.15,
                            borderRadius: 0.75,
                            bgcolor:
                              c.ok === true
                                ? "rgba(125,186,150,0.18)"
                                : c.ok === false
                                ? "rgba(200,122,122,0.18)"
                                : "rgba(255,255,255,0.08)",
                            border: `1px solid ${
                              c.ok === true
                                ? "rgba(125,186,150,0.35)"
                                : c.ok === false
                                ? "rgba(200,122,122,0.35)"
                                : "rgba(255,255,255,0.15)"
                            }`,
                            color: c.ok === true ? C.good : c.ok === false ? C.bad : C.muted,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: MONO,
                            fontSize: 9.5,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {c.ok === true ? "✓" : c.ok === false ? "✗" : "?"}
                        </Box>
                        <Typography sx={{ fontSize: 11.75, color: C.text, lineHeight: 1.4 }}>
                          {c.text}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>

            {/* Right column: History table */}
            <Box
              sx={{
                bgcolor: "#15161b",
                border: `1px solid ${C.line}`,
                borderRadius: 1.75,
                overflow: "hidden",
              }}
            >
              <Box sx={{ px: 2, py: 1.25, bgcolor: "#0e0f12", borderBottom: `1px solid ${C.line}` }}>
                <Typography sx={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.12em", color: C.muted }}>
                  {hasHistory ? `LAST ${history.length} SESSIONS · CROSS-SECTIONAL HISTORY` : "SESSION HISTORY"}
                </Typography>
              </Box>
              {history.length === 0 ? (
                <Typography sx={{ p: 2.5, fontSize: 12.5, color: C.muted }}>
                  No history yet. Builds after daily 20:30 IST scans.
                </Typography>
              ) : (
                <TableContainer sx={{ maxHeight: 280 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ bgcolor: "#0e0f12", py: 0.75, px: 1.25, fontFamily: MONO, fontSize: 10, color: C.muted }}>Date</TableCell>
                        <TableCell sx={{ bgcolor: "#0e0f12", py: 0.75, px: 1.25, fontFamily: MONO, fontSize: 10, color: C.muted }}>State</TableCell>
                        <TableCell align="right" sx={{ bgcolor: "#0e0f12", py: 0.75, px: 1.25, fontFamily: MONO, fontSize: 10, color: C.muted }}>T_rel</TableCell>
                        <TableCell align="right" sx={{ bgcolor: "#0e0f12", py: 0.75, px: 1.25, fontFamily: MONO, fontSize: 10, color: C.muted }}>Breadth</TableCell>
                        <TableCell align="right" sx={{ bgcolor: "#0e0f12", py: 0.75, px: 1.25, fontFamily: MONO, fontSize: 10, color: C.muted }}>CMF rel</TableCell>
                        <TableCell align="right" sx={{ bgcolor: "#0e0f12", py: 0.75, px: 1.25, fontFamily: MONO, fontSize: 10, color: C.muted }}>RS Δ5</TableCell>
                        <TableCell align="right" sx={{ bgcolor: "#0e0f12", py: 0.75, px: 1.25, fontFamily: MONO, fontSize: 10, color: C.muted }}>Deliv</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[...history].reverse().map((row) => (
                        <HistoryRow key={row.scan_date} row={row} />
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Box>

          {/* Bottom: Top Stocks by Turnover */}
          {isPremium && constituents.length > 0 && (
            <Box sx={{ pt: 1.75, borderTop: `1px solid ${C.line}` }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", color: C.muted, mb: 1.1 }}>
                TOP CONSTITUENTS BY TURNOVER (CLICK SYMBOL FOR CHART & DOSSIER)
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.85 }}>
                {constituents.map((s) => (
                  <Box
                    key={s.symbol}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenStock?.(s.symbol)}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.75,
                      py: 0.45,
                      px: 1.1,
                      bgcolor: "#15161b",
                      border: `1px solid ${C.line}`,
                      borderRadius: 1.25,
                      cursor: onOpenStock ? "pointer" : "default",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        bgcolor: "rgba(255,255,255,0.04)",
                        borderColor: "rgba(142,180,196,0.35)",
                      },
                    }}
                  >
                    <Typography sx={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600, color: C.text }}>
                      {s.symbol}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: MONO,
                        fontSize: 11,
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
    </Box>
  );
}

// Main cross-sectional heatmap row
function SectorRow({ row, expanded, onToggle, onOpenSector, isPremium }) {
  const shape = row.shape_report || {};
  const handleClick = isPremium ? onToggle : undefined;

  return (
    <TableRow
      hover
      onClick={handleClick}
      sx={{
        cursor: isPremium ? "pointer" : "default",
        "&:hover": { bgcolor: isPremium ? "rgba(255,255,255,0.025) !important" : undefined },
        ...(expanded && { bgcolor: "rgba(142,180,196,0.05)" }),
      }}
    >
      <TableCell sx={{ py: 1.15, fontWeight: 600, fontSize: 13.25, color: C.text }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            {row.sector}
            {isPremium &&
              (expanded ? (
                <ExpandLessIcon sx={{ fontSize: 16, color: C.accent }} />
              ) : (
                <ExpandMoreIcon sx={{ fontSize: 16, color: C.muted }} />
              ))}
          </Box>
          {isPremium && onOpenSector && (
            <Tooltip title="Open Sector Drawer" placement="top" arrow>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSector(row.sector);
                }}
                sx={{
                  p: 0.35,
                  color: "rgba(238,234,227,0.35)",
                  "&:hover": { color: C.accent, bgcolor: "rgba(142,180,196,0.12)" },
                }}
              >
                <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </TableCell>
      <TableCell sx={{ py: 1.15 }}>
        {isPremium ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.85, flexWrap: "wrap" }}>
            <KlassChip klass={row.klass} />
            <SpecificStateBadge klass={row.klass} />
            {row.buy_ready && (
              <Tooltip title={BUY_READY_HELP} placement="top" arrow enterDelay={200}>
                <Box
                  component="span"
                  sx={{
                    px: 0.85,
                    py: 0.2,
                    borderRadius: 1,
                    bgcolor: "rgba(125,186,150,0.14)",
                    border: "1px solid rgba(125,186,150,0.32)",
                    color: C.good,
                    fontFamily: MONO,
                    fontSize: 10.5,
                    fontWeight: 600,
                    cursor: "help",
                  }}
                >
                  Confirmed
                </Box>
              </Tooltip>
            )}
            {shape.verdict && shape.verdict !== "orderly" && <VerdictBadge verdict={shape.verdict} />}
          </Box>
        ) : (
          <Box sx={{ filter: "blur(6px)", opacity: 0.4 }}>
            <KlassChip klass={row.klass} />
          </Box>
        )}
      </TableCell>
      <TableCell
        align="right"
        className="num"
        sx={{
          py: 1.15,
          fontFamily: MONO,
          fontSize: 12.5,
          bgcolor: HEATMAP_COLORS.t_rel(row.t_rel),
          ...(isPremium ? {} : { filter: "blur(4px)", opacity: 0.5 }),
        }}
      >
        {num(row.t_rel)}
      </TableCell>
      <TableCell
        align="right"
        className="num"
        sx={{
          py: 1.15,
          fontFamily: MONO,
          fontSize: 12.5,
          bgcolor: HEATMAP_COLORS.b(row.b),
          ...(isPremium ? {} : { filter: "blur(4px)", opacity: 0.5 }),
        }}
      >
        {num(row.b)}
      </TableCell>
      <TableCell
        align="right"
        className="num"
        sx={{
          py: 1.15,
          fontFamily: MONO,
          fontSize: 12.5,
          bgcolor: HEATMAP_COLORS.cmf(row.cmf_rel),
          ...(isPremium ? {} : { filter: "blur(4px)", opacity: 0.5 }),
        }}
      >
        {num(row.cmf_rel)}
      </TableCell>
      <TableCell
        align="right"
        className="num"
        sx={{
          py: 1.15,
          fontFamily: MONO,
          fontSize: 12.5,
          bgcolor: HEATMAP_COLORS.rs_chg(row.rs_chg_5),
          ...(isPremium ? {} : { filter: "blur(4px)", opacity: 0.5 }),
        }}
      >
        {signed(row.rs_chg_5, 1)}
      </TableCell>
      <TableCell
        align="right"
        className="num"
        sx={{
          py: 1.15,
          fontFamily: MONO,
          fontSize: 12.5,
          bgcolor: HEATMAP_COLORS.deliv(row.deliv_quality_rel),
          ...(isPremium ? {} : { filter: "blur(4px)", opacity: 0.5 }),
        }}
      >
        {num(row.deliv_quality_rel)}
      </TableCell>
      <TableCell
        align="right"
        className="num"
        sx={{ py: 1.15, fontFamily: MONO, fontSize: 12, color: C.muted }}
      >
        {row.n_adv ?? "—"}/{row.n_stocks ?? "—"}
      </TableCell>
    </TableRow>
  );
}

// Main component
export default function SectorLookoutsTab({ onOpenSector, onOpenStock, liveRows }) {
  const [data, setData] = useState({ rows: [], scan_date: null });
  const [loading, setLoading] = useState(true);
  const [expandedSector, setExpandedSector] = useState(null);
  const [filter, setFilter] = useState("acting");
  const [q, setQ] = useState("");
  const { isPremium } = useAuth();

  const sort = useTableSort({
    dirFor: (k) => (k === "sector" || k === "klass" ? "asc" : "desc"),
  });

  const fetchData = useCallback(() => {
    setLoading(true);
    getSectorLookouts()
      .then((res) => {
        setData({
          rows: res?.rows || [],
          scan_date: res?.scan_date || null,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fall back to live classification if saved post-market rows are not available yet.
  const rows = useMemo(() => {
    if ((data.rows || []).length) return data.rows;
    return (liveRows || []).map(fromLiveRow);
  }, [data.rows, liveRows]);

  const usingLive = (data.rows || []).length === 0 && rows.length > 0;

  const counts = useMemo(() => {
    const c = { all: rows.length, acting: 0, watching: 0, out: 0, confirmed: 0 };
    for (const r of rows) {
      c[STATE_GROUP[r.klass] || "out"] += 1;
      if (r.buy_ready) c.confirmed += 1;
    }
    return c;
  }, [rows]);

  const sorted = useMemo(() => {
    const order = {
      CROSSING: 0,
      PULLBACK: 1,
      CROSSING_UNVERIFIED: 2,
      BASE: 3,
      NEGLECT: 4,
      DISQUALIFIED: 5,
      NONE: 6,
    };
    const query = q.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (filter !== "all" && (STATE_GROUP[r.klass] || "out") !== filter) return false;
      if (query && !(r.sector || "").toLowerCase().includes(query)) return false;
      return true;
    });

    if (sort.key) {
      return sort.apply(filtered);
    }

    return filtered.sort((a, b) => {
      const oa = order[a.klass] ?? 99;
      const ob = order[b.klass] ?? 99;
      if (oa !== ob) return oa - ob;
      return (b.t_rel || 0) - (a.t_rel || 0);
    });
  }, [rows, filter, q, sort.key, sort.dir]);

  return (
    <Box>
      {/* Architectural Header Card */}
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
              <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: C.accent }} />
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: "0.16em",
                  color: C.accent,
                  textTransform: "uppercase",
                }}
              >
                CROSS-SECTIONAL ROTATION ENGINE{" "}
                {(usingLive || data.scan_date) ? `· ${usingLive ? "LIVE CLASSIFICATION" : data.scan_date}` : ""}
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
              Sector Heatmap &amp; State Classification
            </Typography>
            <Typography sx={{ fontSize: 13, color: C.muted, mt: 0.35 }}>
              Every industry scored against cross-sectional peers so{" "}
              <Box component="span" sx={{ fontFamily: MONO, color: C.text }}>1.0</Box> reads as normal.
              Click any row for 30-day history &amp; shape checks. Only{" "}
              <Box component="span" sx={{ color: C.good, fontWeight: 500 }}>Acting</Box> sectors feed Setups.
            </Typography>
          </Box>

          {/* Segmented Filter Bar + Search */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap", flexShrink: 0 }}>
            <Box
              sx={{
                display: "inline-flex",
                flexWrap: "wrap",
                gap: 0.5,
                p: 0.5,
                borderRadius: 1.75,
                bgcolor: "#0c0d10",
                border: `1px solid ${C.line}`,
              }}
            >
              {FILTERS.map((f) => {
                const active = filter === f;
                const label = f === "all" ? "All" : STATE_GROUPS[f].label;
                return (
                  <Tooltip key={f} title={FILTER_HELP[f]} placement="top" arrow enterDelay={300}>
                    <Box
                      role="button"
                      tabIndex={0}
                      onClick={() => setFilter(f)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.85,
                        px: 1.4,
                        py: 0.6,
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
                        {label}
                      </Typography>
                      <Box
                        component="span"
                        sx={{
                          px: 0.65,
                          py: 0.1,
                          borderRadius: 0.85,
                          bgcolor: active ? "rgba(142,180,196,0.16)" : "rgba(255,255,255,0.04)",
                          fontFamily: MONO,
                          fontSize: 10.5,
                          color: active ? C.accent : C.muted,
                        }}
                      >
                        {counts[f] || 0}
                      </Box>
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>

            <TextField
              size="small"
              placeholder="Filter sector…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              sx={{
                width: { xs: "100%", sm: 190 },
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
        </Box>

        {/* Compact Single-Line Telemetry & Heatmap Legend Bar */}
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
              <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>ACTING:</Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 600, color: counts.acting > 0 ? C.good : C.muted }}>
                {counts.acting}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: C.muted }}>
                ({counts.confirmed} shape confirmed)
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>WATCHING:</Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 600, color: C.accent }}>
                {counts.watching}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>UNIVERSE:</Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 600, color: C.text }}>
                {counts.all}
              </Typography>
            </Box>
          </Box>

          {/* Compact Heatmap Legend */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted, letterSpacing: "0.06em" }}>
              INTENSITY:
            </Typography>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
              <Box sx={{ width: 9, height: 9, borderRadius: 0.5, bgcolor: "rgba(125,186,150,0.28)", border: "1px solid rgba(125,186,150,0.5)" }} />
              <Typography sx={{ fontSize: 11, color: C.muted }}>Accumulation</Typography>
            </Box>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
              <Box sx={{ width: 9, height: 9, borderRadius: 0.5, bgcolor: "rgba(196,164,106,0.26)", border: "1px solid rgba(196,164,106,0.5)" }} />
              <Typography sx={{ fontSize: 11, color: C.muted }}>Surge (≥1.3×)</Typography>
            </Box>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
              <Box sx={{ width: 9, height: 9, borderRadius: 0.5, bgcolor: "rgba(200,122,122,0.28)", border: "1px solid rgba(200,122,122,0.5)" }} />
              <Typography sx={{ fontSize: 11, color: C.muted }}>Distribution</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={28} sx={{ color: C.accent }} />
        </Box>
      ) : rows.length === 0 ? (
        <Box
          sx={{
            p: 4.5,
            borderRadius: 2.5,
            bgcolor: "#15161b",
            border: `1px solid ${C.line}`,
            textAlign: "center",
          }}
        >
          <Typography sx={{ fontSize: 14, color: C.muted }}>
            No sector data yet. The post-market job writes it at 20:30 IST on trading days.
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
            <Table
              stickyHeader
              size="small"
              sx={{
                minWidth: 780,
                "& .MuiTableCell-stickyHeader, & .MuiTableCell-head": {
                  bgcolor: "#0e0f12",
                  fontFamily: MONO,
                  fontSize: 11,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  py: 1.4,
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <HeadCell label="Sector" sort={sort} sortKey="sector" />
                  <HeadCell
                    label="State & Verdict"
                    help="Acting, watching, or ruled out, alongside the specific 7-state classification and pullback shape check verdict."
                    sort={sort}
                    sortKey="klass"
                  />
                  <HeadCell k="T_rel" align="right" sort={sort} sortKey="t_rel" />
                  <HeadCell k="B" align="right" sort={sort} sortKey="b" />
                  <HeadCell
                    label="CMF rel"
                    align="right"
                    help="Chaikin Money Flow vs cross-sectional median"
                    sort={sort}
                    sortKey="cmf_rel"
                  />
                  <HeadCell k="rs_chg_5" align="right" sort={sort} sortKey="rs_chg_5" />
                  <HeadCell
                    label="Deliv"
                    align="right"
                    help="Delivery quality vs peers"
                    sort={sort}
                    sortKey="deliv_quality_rel"
                  />
                  <HeadCell
                    label="Adv"
                    align="right"
                    help="Advancing stocks / Total"
                    sort={sort}
                    sortKey="n_adv"
                  />
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
                      onOpenSector={onOpenSector}
                      isPremium={isPremium}
                    />
                    {expandedSector === row.sector && (
                      <TableRow>
                        <TableCell colSpan={8} sx={{ p: 0, borderBottom: `1px solid ${C.line}` }}>
                          <SectorHistoryPanel
                            sector={row.sector}
                            onClose={() => setExpandedSector(null)}
                            onOpenSector={onOpenSector}
                            onOpenStock={onOpenStock}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
                {sorted.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ color: C.muted, py: 5, textAlign: "center", fontSize: 13.5 }}>
                      {filter === "acting" && !q
                        ? "No sector woke up or pulled back today. An empty list is the scan working — markets do not rotate every session."
                        : "No sectors match the current filter."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}
