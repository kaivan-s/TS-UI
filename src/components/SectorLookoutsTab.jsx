/**
 * Sector Lookouts Tab - Post-market sector analysis with heatmaps.
 * 
 * Features:
 * - Cross-sectional heatmap: all sectors for a given date
 * - Time-series heatmap: drill-down into one sector's history
 * - Shape annotations: crossing, pullback, heavy_red marks
 * - Constituent stocks for actionable sectors
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
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
import RefreshIcon from "@mui/icons-material/Refresh";
import KlassChip from "./KlassChip.jsx";
import { HeadCell, Note } from "./ui.jsx";
import { useAuth } from "../auth.jsx";
import { C } from "../theme.js";
import { num, signed, pct } from "../format.js";
import { getSectorLookouts, getSectorHistory, getSectorConstituents } from "../api.js";

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
  
  return (
    <TableRow
      hover
      onClick={onToggle}
      sx={{
        cursor: "pointer",
        "&:hover": { bgcolor: "rgba(255,255,255,0.02)" },
        ...(expanded && { bgcolor: "rgba(142,180,196,0.05)" }),
      }}
    >
      <TableCell sx={{ py: 1, fontWeight: 500 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {row.sector}
          {expanded ? (
            <ExpandLessIcon sx={{ fontSize: 16, color: C.muted }} />
          ) : (
            <ExpandMoreIcon sx={{ fontSize: 16, color: C.muted }} />
          )}
        </Box>
      </TableCell>
      <TableCell sx={{ py: 1 }}>
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
export default function SectorLookoutsTab({ onOpenSector }) {
  const [data, setData] = useState({ rows: [], scan_date: null, dates: [] });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [expandedSector, setExpandedSector] = useState(null);
  const { isPremium } = useAuth();

  const fetchData = useCallback((date = null) => {
    setLoading(true);
    
    getSectorLookouts(date)
      .then((res) => {
        // Ensure rows is always an array
        const safeData = {
          rows: res?.rows || [],
          scan_date: res?.scan_date || null,
          dates: res?.dates || [],
        };
        setData(safeData);
        if (!selectedDate && safeData.scan_date) {
          setSelectedDate(safeData.scan_date);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleDateChange = (e) => {
    const d = e.target.value;
    setSelectedDate(d);
    fetchData(d);
  };

  // Sort: CROSSING first, then PULLBACK, then by T_rel (show ALL sectors)
  const sorted = useMemo(() => {
    const rows = data.rows || [];
    const order = { CROSSING: 0, PULLBACK: 1, CROSSING_UNVERIFIED: 2, BASE: 3, NEGLECT: 4, DISQUALIFIED: 5, NONE: 6 };
    return [...rows].sort((a, b) => {
      const oa = order[a.klass] ?? 99;
      const ob = order[b.klass] ?? 99;
      if (oa !== ob) return oa - ob;
      return (b.t_rel || 0) - (a.t_rel || 0);
    });
  }, [data.rows]);

  const sectorCount = (data.rows || []).length;

  return (
    <Box>
      {/* Header with date selector */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography sx={{ fontSize: 13, color: C.muted }}>
          {sectorCount} sectors
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FormControl size="small">
            <Select
              value={selectedDate}
              onChange={handleDateChange}
              disabled={loading}
              displayEmpty
              sx={{ minWidth: 130, fontSize: 12 }}
            >
              {(data.dates || []).map((d) => (
                <MenuItem key={d} value={d} sx={{ fontSize: 12 }}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Refresh data">
            <IconButton
              size="small"
              onClick={() => fetchData(selectedDate)}
              disabled={loading}
              sx={{ color: C.muted }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Note>
        Post-market sector analysis. Colors show intensity — red/orange for high turnover expansion,
        green for positive breadth/money flow. Click any sector to see its 20-day history and shape checks.
      </Note>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (data.rows || []).length === 0 ? (
        <Note>
          No sector lookout data for this date. Data is saved automatically at 7:30 PM IST after market close.
        </Note>
      ) : (
        <>
          {/* Cross-sectional heatmap table */}
          <TableContainer>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <HeadCell label="Sector" />
                  <HeadCell label="State" help="Current classification and shape verdict" />
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
                      No sector data available.
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
