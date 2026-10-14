/**
 * Fundamentals — sortable, filterable screen of company fundamentals.
 *
 * Data comes from the company_fundamentals cache (populated by Yahoo Finance).
 * Market cap, PE, promoter %, TTM revenue/PAT, growth, OPM, earnings trend.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
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
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import { HeadCell, MultiSelect, TvCopyButton, useTableSort } from "./ui.jsx";
import { BookmarkButton } from "../watchlist.jsx";
import { C } from "../theme.js";
import { num } from "../format.js";
import { getFundamentalsScreen } from "../api.js";

const MONO = '"IBM Plex Mono", ui-monospace, monospace';

const TREND_STYLE = {
  "↑↑": { color: C.good, label: "Accelerating", short: "Accel", rank: 1 },
  "↑":  { color: C.good, label: "Growing",      short: "Grow",  rank: 2 },
  "→":  { color: C.warn, label: "Flat",         short: "Flat",  rank: 3 },
  "↓":  { color: C.bad,  label: "Declining",    short: "Decl",  rank: 4 },
  "?":  { color: C.muted, label: "No data",     short: "—",     rank: 5 },
};

const MCAP_PRESETS = [
  { label: "All Caps", value: null },
  { label: "Large (>20K Cr)", value: 20000 },
  { label: "Mid (5K–20K)", value: 5000, max: 20000 },
  { label: "Small (<5K Cr)", value: null, max: 5000 },
];

function fmtCr(v) {
  if (v == null || Number.isNaN(Number(v))) return "—";
  const n = Number(v);
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toFixed(0);
}

function growthCell(v) {
  if (v == null) return { text: "—", color: C.muted };
  const n = Number(v);
  const text = `${n >= 0 ? "+" : ""}${(n * 100).toFixed(1)}%`;
  const color = n > 0.05 ? C.good : n < -0.05 ? C.bad : C.warn;
  return { text, color };
}

function medianOf(arr) {
  if (!arr.length) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function downloadCsv(rows) {
  const headers = [
    "Symbol",
    "Name",
    "Industry",
    "Market Cap (Cr)",
    "PE TTM",
    "Promoter %",
    "TTM Revenue (Cr)",
    "TTM PAT (Cr)",
    "Rev Growth YoY",
    "PAT Growth YoY",
    "OPM %",
    "Earnings Trend",
  ];
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.symbol,
        `"${(r.name || "").replace(/"/g, '""')}"`,
        `"${(r.industry || "").replace(/"/g, '""')}"`,
        r.market_cap_cr ?? "",
        r.pe_ttm ?? "",
        r.promoter_pct ?? "",
        r.ttm_revenue_cr ?? "",
        r.ttm_pat_cr ?? "",
        r.latest_revenue_growth_yoy != null
          ? (r.latest_revenue_growth_yoy * 100).toFixed(1)
          : "",
        r.latest_pat_growth_yoy != null
          ? (r.latest_pat_growth_yoy * 100).toFixed(1)
          : "",
        r.latest_opm_pct ?? "",
        r.earnings_trend ?? "",
      ].join(",")
    );
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "fundamentals.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function FundamentalsView({ onOpenStock }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [mcapPreset, setMcapPreset] = useState(0);
  const [trendFilter, setTrendFilter] = useState(null);
  const [selectedIndustries, setSelectedIndustries] = useState([]);

  const sort = useTableSort({
    key: "market_cap_cr",
    dir: "desc",
    dirFor: (k) =>
      k === "symbol" || k === "name" || k === "industry" || k === "earnings_trend"
        ? "asc"
        : "desc",
  });

  useEffect(() => {
    setLoading(true);
    getFundamentalsScreen({ limit: 2000 })
      .then((d) => {
        setRows(d.rows || []);
        setError("");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const industries = useMemo(
    () => [...new Set(rows.map((r) => r.industry).filter(Boolean))].sort(),
    [rows]
  );

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    const preset = MCAP_PRESETS[mcapPreset];

    let filtered = rows.filter((r) => {
      if (
        query &&
        !(
          (r.symbol || "").toLowerCase().includes(query) ||
          (r.name || "").toLowerCase().includes(query) ||
          (r.industry || "").toLowerCase().includes(query)
        )
      )
        return false;

      if (selectedIndustries.length > 0 && !selectedIndustries.includes(r.industry)) {
        return false;
      }

      if (preset.value && (r.market_cap_cr ?? 0) < preset.value) return false;
      if (preset.max && (r.market_cap_cr ?? Infinity) > preset.max) return false;

      if (trendFilter && r.earnings_trend !== trendFilter) return false;

      return true;
    });

    if (sort.key === "earnings_trend") {
      filtered.sort((a, b) => {
        const ra = (TREND_STYLE[a.earnings_trend] || TREND_STYLE["?"]).rank;
        const rb = (TREND_STYLE[b.earnings_trend] || TREND_STYLE["?"]).rank;
        return sort.dir === "asc" ? ra - rb : rb - ra;
      });
    } else {
      filtered = sort.apply(filtered);
    }

    return filtered;
  }, [rows, q, mcapPreset, trendFilter, selectedIndustries, sort.key, sort.dir]);

  // Live telemetry for filtered view
  const stats = useMemo(() => {
    let accel = 0;
    const pes = [];
    const opms = [];
    for (const r of shown) {
      if (r.earnings_trend === "↑↑" || r.earnings_trend === "↑") accel++;
      if (r.pe_ttm != null && r.pe_ttm > 0 && r.pe_ttm < 250) pes.push(Number(r.pe_ttm));
      if (r.latest_opm_pct != null) opms.push(Number(r.latest_opm_pct));
    }
    return {
      accel,
      medPe: medianOf(pes),
      medOpm: medianOf(opms),
    };
  }, [shown]);

  const hasFilters = Boolean(q || mcapPreset !== 0 || trendFilter || selectedIndustries.length > 0);

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
          <Box sx={{ maxWidth: 620 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: C.accent }} />
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: 10.5,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: C.accent,
                }}
              >
                COMPANY FUNDAMENTALS · NSE UNIVERSE
              </Typography>
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
              Fundamental Screen
            </Typography>
            <Typography sx={{ fontSize: 13.75, color: C.muted, lineHeight: 1.6 }}>
              Market cap, trailing P/E, promoter holding, TTM revenue &amp; profit, YoY growth rates, and operating margins across {rows.length || "2,000+"} NSE companies.
            </Typography>
          </Box>

          {/* Search + Industry MultiSelect + CSV + TV Copy */}
          <Box
            sx={{
              display: "flex",
              gap: 1.25,
              alignItems: "center",
              flexWrap: "wrap",
              width: { xs: "100%", lg: "auto" },
            }}
          >
            <TextField
              size="small"
              placeholder="Symbol, name, or industry…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              sx={{
                width: { xs: "100%", sm: 220 },
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

            <MultiSelect
              label="Industry"
              options={industries}
              selected={selectedIndustries}
              onChange={setSelectedIndustries}
              width={260}
            />

            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadRoundedIcon sx={{ fontSize: 15 }} />}
              onClick={() => downloadCsv(shown)}
              disabled={shown.length === 0}
              sx={{
                fontSize: 12,
                color: C.text,
                borderColor: C.line,
                bgcolor: "#0e0f12",
                "&:hover": { borderColor: C.accent, color: C.accent },
              }}
            >
              CSV
            </Button>

            <TvCopyButton symbols={shown.map((r) => r.symbol)} />
          </Box>
        </Box>

        {/* Bottom Telemetry & Filter Bar */}
        <Box
          sx={{
            mt: 2.75,
            pt: 2.25,
            borderTop: `1px solid ${C.line}`,
            display: "flex",
            flexDirection: { xs: "column", xl: "row" },
            alignItems: { xs: "flex-start", xl: "center" },
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          {/* Live Telemetry Strip */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 2, sm: 3.5 }, alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Showing
              </Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 14, fontWeight: 600, color: C.text }}>
                {shown.length}
                {shown.length !== rows.length && (
                  <Box component="span" sx={{ fontSize: 11.5, color: C.muted, fontWeight: 400 }}>
                    {" "}/ {rows.length}
                  </Box>
                )}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Growing (↑↑ / ↑)
              </Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 14, fontWeight: 600, color: C.good }}>
                {stats.accel}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Median P/E
              </Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 14, fontWeight: 600, color: C.accent }}>
                {stats.medPe != null ? `${stats.medPe.toFixed(1)}x` : "—"}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Median OPM
              </Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 14, fontWeight: 600, color: C.text }}>
                {stats.medOpm != null ? `${stats.medOpm.toFixed(1)}%` : "—"}
              </Typography>
            </Box>

            {hasFilters && (
              <Box
                role="button"
                tabIndex={0}
                onClick={() => {
                  setQ("");
                  setMcapPreset(0);
                  setTrendFilter(null);
                  setSelectedIndustries([]);
                }}
                sx={{
                  fontFamily: MONO,
                  fontSize: 11,
                  color: C.accent,
                  cursor: "pointer",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Reset filters ×
              </Box>
            )}
          </Box>

          {/* Filter Pills: Market Cap Presets + Earnings Trend */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
            {/* Segmented Market Cap Switcher */}
            <Box
              sx={{
                display: "inline-flex",
                flexWrap: "wrap",
                p: 0.4,
                borderRadius: 1.5,
                bgcolor: "#0e0f12",
                border: `1px solid ${C.line}`,
              }}
            >
              {MCAP_PRESETS.map((p, i) => {
                const active = mcapPreset === i;
                return (
                  <Box
                    key={p.label}
                    role="button"
                    tabIndex={0}
                    onClick={() => setMcapPreset(i)}
                    onKeyDown={(e) => e.key === "Enter" && setMcapPreset(i)}
                    sx={{
                      px: 1.25,
                      py: 0.45,
                      borderRadius: 1.1,
                      cursor: "pointer",
                      fontFamily: MONO,
                      fontSize: 11,
                      fontWeight: active ? 600 : 500,
                      bgcolor: active ? "rgba(238,234,227,0.1)" : "transparent",
                      color: active ? C.text : C.muted,
                      transition: "all 0.15s ease",
                      "&:hover": { color: C.text },
                    }}
                  >
                    {p.label}
                  </Box>
                );
              })}
            </Box>

            {/* Trend Filter Pills */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, flexWrap: "wrap" }}>
              {["↑↑", "↑", "→", "↓"].map((t) => {
                const s = TREND_STYLE[t];
                const on = trendFilter === t;
                return (
                  <Box
                    key={t}
                    role="button"
                    tabIndex={0}
                    onClick={() => setTrendFilter(on ? null : t)}
                    onKeyDown={(e) => e.key === "Enter" && setTrendFilter(on ? null : t)}
                    sx={{
                      px: 1.15,
                      py: 0.5,
                      borderRadius: 1.25,
                      cursor: "pointer",
                      fontFamily: MONO,
                      fontSize: 11,
                      fontWeight: on ? 600 : 500,
                      bgcolor: on ? `${s.color}20` : "rgba(255,255,255,0.02)",
                      border: `1px solid ${on ? `${s.color}55` : C.line}`,
                      color: on ? s.color : C.muted,
                      transition: "all 0.15s ease",
                      "&:hover": { color: s.color, borderColor: `${s.color}44` },
                    }}
                  >
                    {t} {s.label}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box
          sx={{
            p: 5,
            borderRadius: 2.5,
            bgcolor: "#15161b",
            border: `1px solid ${C.line}`,
            textAlign: "center",
          }}
        >
          <Typography sx={{ fontFamily: MONO, fontSize: 13, color: C.muted }}>
            Loading company fundamentals…
          </Typography>
        </Box>
      )}

      {error && (
        <Typography sx={{ fontSize: 14, color: C.bad, py: 2 }}>
          {error}
        </Typography>
      )}

      {/* Empty Filter State */}
      {!loading && shown.length === 0 && !error && (
        <Box
          sx={{
            p: 5,
            borderRadius: 2.5,
            bgcolor: "#15161b",
            border: `1px solid ${C.line}`,
            textAlign: "center",
          }}
        >
          <Typography sx={{ fontSize: 14.5, color: C.muted }}>
            No companies match the active filters.{" "}
            <Box
              component="span"
              role="button"
              onClick={() => {
                setQ("");
                setMcapPreset(0);
                setTrendFilter(null);
                setSelectedIndustries([]);
              }}
              sx={{ color: C.accent, cursor: "pointer", fontWeight: 500, "&:hover": { textDecoration: "underline" } }}
            >
              Clear all filters
            </Box>
          </Typography>
        </Box>
      )}

      {/* Architectural Data Table */}
      {!loading && shown.length > 0 && (
        <Box
          sx={{
            borderRadius: 3,
            bgcolor: "#15161b",
            border: `1px solid ${C.line}`,
            overflow: "hidden",
          }}
        >
          <TableContainer sx={{ overflowX: "auto", maxHeight: "calc(100vh - 240px)" }}>
            <Table
              stickyHeader
              sx={{
                minWidth: 1120,
                "& .MuiTableCell-stickyHeader": {
                  bgcolor: "#0e0f12",
                  fontFamily: MONO,
                  fontSize: 11,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  py: 1.5,
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <HeadCell label="" sx={{ width: 36, p: 0 }} />
                  <HeadCell label="Company" sort={sort} sortKey="symbol" />
                  <HeadCell label="Industry" sort={sort} sortKey="industry" sx={{ minWidth: 160 }} />
                  <HeadCell
                    label="Mkt Cap (Cr)"
                    help="Market capitalisation in Crores"
                    align="right"
                    sort={sort}
                    sortKey="market_cap_cr"
                  />
                  <HeadCell
                    label="P/E"
                    help="Trailing twelve months P/E ratio (<25x green, >50x red)"
                    align="right"
                    sort={sort}
                    sortKey="pe_ttm"
                  />
                  <HeadCell
                    label="Trajectory"
                    help="Trajectory of YoY profit growth: ↑↑ accelerating, ↑ growing, → flat, ↓ declining"
                    align="center"
                    sort={sort}
                    sortKey="earnings_trend"
                  />
                  <HeadCell
                    label="Promoter"
                    help="Insider / promoter holding percentage (≥50% green, <30% red)"
                    align="right"
                    sort={sort}
                    sortKey="promoter_pct"
                  />
                  <HeadCell
                    label="TTM Rev"
                    help="Trailing twelve months revenue in Crores"
                    align="right"
                    sort={sort}
                    sortKey="ttm_revenue_cr"
                  />
                  <HeadCell
                    label="TTM PAT"
                    help="Trailing twelve months profit after tax in Crores"
                    align="right"
                    sort={sort}
                    sortKey="ttm_pat_cr"
                  />
                  <HeadCell
                    label="Rev YoY"
                    help="Latest quarter revenue growth year-on-year"
                    align="right"
                    sort={sort}
                    sortKey="latest_revenue_growth_yoy"
                  />
                  <HeadCell
                    label="PAT YoY"
                    help="Latest quarter PAT growth year-on-year"
                    align="right"
                    sort={sort}
                    sortKey="latest_pat_growth_yoy"
                  />
                  <HeadCell
                    label="OPM"
                    help="Latest quarter operating profit margin"
                    align="right"
                    sort={sort}
                    sortKey="latest_opm_pct"
                  />
                </TableRow>
              </TableHead>
              <TableBody>
                {shown.map((r) => {
                  const revGr = growthCell(r.latest_revenue_growth_yoy);
                  const patGr = growthCell(r.latest_pat_growth_yoy);
                  const t = r.earnings_trend || "?";
                  const ts = TREND_STYLE[t] || TREND_STYLE["?"];
                  const peColor =
                    r.pe_ttm > 0 && r.pe_ttm < 25
                      ? C.good
                      : r.pe_ttm > 50
                        ? C.bad
                        : C.text;
                  const promColor =
                    r.promoter_pct >= 50
                      ? C.good
                      : r.promoter_pct < 30
                        ? C.bad
                        : C.text;

                  return (
                    <TableRow
                      key={r.symbol}
                      hover
                      sx={{
                        "&:hover": { bgcolor: "rgba(255,255,255,0.025) !important" },
                      }}
                    >
                      <TableCell sx={{ py: 0, px: 0.75, width: 36 }}>
                        <BookmarkButton symbol={r.symbol} />
                      </TableCell>

                      {/* Symbol + Name */}
                      <TableCell
                        onClick={() => onOpenStock?.(r.symbol)}
                        sx={{
                          cursor: onOpenStock ? "pointer" : "default",
                          py: 1.25,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                          <Typography
                            sx={{
                              fontFamily: MONO,
                              fontSize: 13,
                              fontWeight: 600,
                              color: C.text,
                              "&:hover": onOpenStock ? { color: C.accent } : {},
                            }}
                          >
                            {r.symbol}
                          </Typography>
                          {r.name && (
                            <Typography
                              component="span"
                              sx={{
                                fontSize: 11.5,
                                color: C.muted,
                                maxWidth: 190,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {r.name}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>

                      {/* Industry */}
                      <TableCell sx={{ fontSize: 12, color: C.muted, maxWidth: 180 }}>
                        <Typography
                          sx={{
                            fontSize: 12,
                            color: C.muted,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {r.industry || "—"}
                        </Typography>
                      </TableCell>

                      {/* Market Cap */}
                      <TableCell
                        align="right"
                        className="num"
                        sx={{ fontFamily: MONO, fontSize: 12.75, fontWeight: 500, color: C.text }}
                      >
                        {fmtCr(r.market_cap_cr)}
                      </TableCell>

                      {/* PE */}
                      <TableCell
                        align="right"
                        className="num"
                        sx={{ fontFamily: MONO, fontSize: 12.75, color: peColor }}
                      >
                        {r.pe_ttm != null ? `${num(r.pe_ttm, 1)}x` : "—"}
                      </TableCell>

                      {/* Earnings Trajectory Badge */}
                      <TableCell align="center">
                        <Tooltip title={ts.label} placement="top" arrow>
                          <Box
                            component="span"
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.5,
                              px: 1,
                              py: 0.25,
                              borderRadius: 1,
                              bgcolor: t === "?" ? "transparent" : `${ts.color}18`,
                              border: t === "?" ? "none" : `1px solid ${ts.color}33`,
                              fontFamily: MONO,
                              fontSize: 11,
                              fontWeight: 600,
                              color: ts.color,
                              cursor: "help",
                            }}
                          >
                            <span>{t === "?" ? "—" : t}</span>
                            {t !== "?" && (
                              <span style={{ fontSize: 10, opacity: 0.9 }}>{ts.short}</span>
                            )}
                          </Box>
                        </Tooltip>
                      </TableCell>

                      {/* Promoter % */}
                      <TableCell
                        align="right"
                        className="num"
                        sx={{ fontFamily: MONO, fontSize: 12.75, color: promColor }}
                      >
                        {r.promoter_pct != null ? `${num(r.promoter_pct, 1)}%` : "—"}
                      </TableCell>

                      {/* TTM Revenue */}
                      <TableCell
                        align="right"
                        className="num"
                        sx={{ fontFamily: MONO, fontSize: 12.75, color: C.text }}
                      >
                        {fmtCr(r.ttm_revenue_cr)}
                      </TableCell>

                      {/* TTM PAT */}
                      <TableCell
                        align="right"
                        className="num"
                        sx={{ fontFamily: MONO, fontSize: 12.75, color: C.text }}
                      >
                        {fmtCr(r.ttm_pat_cr)}
                      </TableCell>

                      {/* Rev Growth YoY */}
                      <TableCell
                        align="right"
                        className="num"
                        sx={{ fontFamily: MONO, fontSize: 12.75, fontWeight: 500, color: revGr.color }}
                      >
                        {revGr.text}
                      </TableCell>

                      {/* PAT Growth YoY */}
                      <TableCell
                        align="right"
                        className="num"
                        sx={{ fontFamily: MONO, fontSize: 12.75, fontWeight: 500, color: patGr.color }}
                      >
                        {patGr.text}
                      </TableCell>

                      {/* OPM */}
                      <TableCell
                        align="right"
                        className="num"
                        sx={{
                          fontFamily: MONO,
                          fontSize: 12.75,
                          color:
                            r.latest_opm_pct != null && r.latest_opm_pct >= 20
                              ? C.good
                              : r.latest_opm_pct != null && r.latest_opm_pct < 5
                                ? C.bad
                                : C.text,
                        }}
                      >
                        {r.latest_opm_pct != null ? `${num(r.latest_opm_pct, 1)}%` : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}
