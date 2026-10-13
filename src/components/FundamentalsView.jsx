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
  Chip,
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
import { HeadCell, PageIntro, TvCopyButton, useTableSort } from "./ui.jsx";
import { BookmarkButton } from "../watchlist.jsx";
import { C } from "../theme.js";
import { num, pct } from "../format.js";
import { getFundamentalsScreen } from "../api.js";

const TREND_STYLE = {
  "↑↑": { color: C.good,  label: "Accelerating", rank: 1 },
  "↑":  { color: C.good,  label: "Growing",      rank: 2 },
  "→":  { color: "#c4a46a", label: "Flat",        rank: 3 },
  "↓":  { color: C.bad,   label: "Declining",     rank: 4 },
  "?":  { color: C.muted, label: "No data",       rank: 5 },
};

const MCAP_PRESETS = [
  { label: "All", value: null },
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
  if (v == null) return { text: "—", color: undefined };
  const n = Number(v);
  const text = `${n >= 0 ? "+" : ""}${(n * 100).toFixed(1)}%`;
  const color = n > 0.05 ? C.good : n < -0.05 ? C.bad : "#c4a46a";
  return { text, color };
}

function downloadCsv(rows) {
  const headers = [
    "Symbol", "Name", "Industry", "Market Cap (Cr)", "PE TTM",
    "Promoter %", "TTM Revenue (Cr)", "TTM PAT (Cr)",
    "Rev Growth YoY", "PAT Growth YoY", "OPM %", "Earnings Trend",
  ];
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push([
      r.symbol, `"${(r.name || "").replace(/"/g, '""')}"`,
      `"${(r.industry || "").replace(/"/g, '""')}"`,
      r.market_cap_cr ?? "", r.pe_ttm ?? "",
      r.promoter_pct ?? "", r.ttm_revenue_cr ?? "", r.ttm_pat_cr ?? "",
      r.latest_revenue_growth_yoy != null ? (r.latest_revenue_growth_yoy * 100).toFixed(1) : "",
      r.latest_pat_growth_yoy != null ? (r.latest_pat_growth_yoy * 100).toFixed(1) : "",
      r.latest_opm_pct ?? "", r.earnings_trend ?? "",
    ].join(","));
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

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    const preset = MCAP_PRESETS[mcapPreset];

    let filtered = rows.filter((r) => {
      // Text search
      if (query && !(
        (r.symbol || "").toLowerCase().includes(query) ||
        (r.name || "").toLowerCase().includes(query) ||
        (r.industry || "").toLowerCase().includes(query)
      )) return false;

      // Market cap preset
      if (preset.value && (r.market_cap_cr ?? 0) < preset.value) return false;
      if (preset.max && (r.market_cap_cr ?? Infinity) > preset.max) return false;

      // Trend filter
      if (trendFilter && r.earnings_trend !== trendFilter) return false;

      return true;
    });

    // Custom sort for earnings_trend
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
  }, [rows, q, mcapPreset, trendFilter, sort.key, sort.dir]);

  const industries = useMemo(
    () => [...new Set(rows.map((r) => r.industry).filter(Boolean))].sort(),
    [rows],
  );

  return (
    <Box>
      <PageIntro
        title="Fundamentals"
        action={
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              size="small"
              placeholder="Symbol, name, or industry"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              sx={{ width: { xs: "100%", sm: 240 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: C.muted }} />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              size="small"
              startIcon={<DownloadRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={() => downloadCsv(shown)}
              disabled={shown.length === 0}
              sx={{ color: C.accent, textTransform: "none", fontWeight: 500 }}
            >
              CSV
            </Button>
            <TvCopyButton symbols={shown.map((r) => r.symbol)} />
          </Box>
        }
      >
        Fundamental data for {rows.length} NSE stocks — market cap, PE, quarterly
        earnings, promoter holding. Click a row to open the stock drawer.
      </PageIntro>

      {/* Filter chips */}
      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 2 }}>
        {/* Market cap presets */}
        {MCAP_PRESETS.map((p, i) => (
          <Chip
            key={p.label}
            label={p.label}
            size="small"
            onClick={() => setMcapPreset(i)}
            variant={mcapPreset === i ? "filled" : "outlined"}
            sx={{
              borderColor: mcapPreset === i ? "transparent" : "rgba(238,234,227,0.10)",
              bgcolor: mcapPreset === i ? C.text : "transparent",
              color: mcapPreset === i ? C.bg : C.muted,
              "&:hover": { bgcolor: mcapPreset === i ? "#d8d4cd" : "rgba(238,234,227,0.04)" },
            }}
          />
        ))}

        <Box sx={{ width: 1, borderLeft: `1px solid ${C.line}`, mx: 0.5 }} />

        {/* Trend filter chips */}
        {["↑↑", "↑", "→", "↓"].map((t) => {
          const s = TREND_STYLE[t];
          const on = trendFilter === t;
          return (
            <Chip
              key={t}
              label={`${t} ${s.label}`}
              size="small"
              onClick={() => setTrendFilter(on ? null : t)}
              variant={on ? "filled" : "outlined"}
              sx={{
                borderColor: on ? "transparent" : "rgba(238,234,227,0.10)",
                bgcolor: on ? `${s.color}22` : "transparent",
                color: on ? s.color : C.muted,
                "&:hover": { bgcolor: on ? `${s.color}22` : "rgba(238,234,227,0.04)" },
              }}
            />
          );
        })}
      </Box>

      {/* Count */}
      {!loading && (
        <Typography sx={{ fontSize: 13, color: C.muted, mb: 1.5 }}>
          {shown.length === rows.length
            ? `${rows.length} stocks`
            : `${shown.length} of ${rows.length} stocks`}
        </Typography>
      )}

      {loading && (
        <Typography sx={{ fontSize: 14, color: C.muted, py: 4 }}>
          Loading fundamentals…
        </Typography>
      )}

      {error && (
        <Typography sx={{ fontSize: 14, color: C.bad, py: 2 }}>
          {error}
        </Typography>
      )}

      {!loading && shown.length === 0 && !error && (
        <Typography sx={{ fontSize: 14, color: C.muted, py: 4 }}>
          No stocks match those filters.{" "}
          <Typography
            component="span"
            role="button"
            className="linkish"
            onClick={() => { setQ(""); setMcapPreset(0); setTrendFilter(null); }}
          >
            Clear filters
          </Typography>
        </Typography>
      )}

      {!loading && shown.length > 0 && (
        <TableContainer sx={{ mb: 4, overflowX: "auto" }}>
          <Table stickyHeader sx={{ minWidth: 1100 }}>
            <TableHead>
              <TableRow>
                <HeadCell label="" sx={{ width: 32, p: 0 }} />
                <HeadCell label="Symbol" sort={sort} sortKey="symbol" />
                <HeadCell label="Industry" sort={sort} sortKey="industry" sx={{ minWidth: 160 }} />
                <HeadCell label="MCap" help="Market capitalisation in Crores" align="right" sort={sort} sortKey="market_cap_cr" />
                <HeadCell label="PE" help="Trailing twelve months PE ratio" align="right" sort={sort} sortKey="pe_ttm" />
                <HeadCell label="Earnings" help="Trajectory of YoY profit growth: ↑↑ accelerating, ↑ growing, → flat, ↓ declining" align="center" sort={sort} sortKey="earnings_trend" />
                <HeadCell label="Promoter %" help="Insider / promoter holding percentage" align="right" sort={sort} sortKey="promoter_pct" />
                <HeadCell label="Revenue" help="Trailing twelve months revenue in Crores" align="right" sort={sort} sortKey="ttm_revenue_cr" />
                <HeadCell label="PAT" help="Trailing twelve months profit after tax in Crores" align="right" sort={sort} sortKey="ttm_pat_cr" />
                <HeadCell label="Rev Gr" help="Latest quarter revenue growth year-on-year" align="right" sort={sort} sortKey="latest_revenue_growth_yoy" />
                <HeadCell label="PAT Gr" help="Latest quarter PAT growth year-on-year" align="right" sort={sort} sortKey="latest_pat_growth_yoy" />
                <HeadCell label="OPM" help="Latest quarter operating profit margin" align="right" sort={sort} sortKey="latest_opm_pct" />
              </TableRow>
            </TableHead>
            <TableBody>
              {shown.map((r) => {
                const revGr = growthCell(r.latest_revenue_growth_yoy);
                const patGr = growthCell(r.latest_pat_growth_yoy);
                const t = r.earnings_trend || "?";
                const ts = TREND_STYLE[t] || TREND_STYLE["?"];
                return (
                  <TableRow key={r.symbol} hover>
                    <TableCell sx={{ py: 0, px: 0.5, width: 32 }}>
                      <BookmarkButton symbol={r.symbol} />
                    </TableCell>
                    <TableCell
                      className={onOpenStock ? "linkish" : undefined}
                      sx={{ fontWeight: 500 }}
                      onClick={() => onOpenStock?.(r.symbol)}
                    >
                      {r.symbol}
                      {r.name && (
                        <Typography component="span" sx={{ fontSize: 11, color: C.muted, ml: 1 }}>
                          {r.name.length > 30 ? r.name.slice(0, 28) + "…" : r.name}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: C.muted, maxWidth: 180 }}>
                      {r.industry || "—"}
                    </TableCell>
                    <TableCell align="right" className="num" sx={{ fontWeight: 500 }}>
                      {fmtCr(r.market_cap_cr)}
                    </TableCell>
                    <TableCell align="right" className="num"
                      sx={{ color: r.pe_ttm > 0 && r.pe_ttm < 25 ? C.good : r.pe_ttm > 50 ? C.bad : undefined }}>
                      {r.pe_ttm != null ? num(r.pe_ttm, 1) : "—"}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={ts.label} placement="top" arrow>
                        <Typography component="span" sx={{ fontSize: 16, color: ts.color, fontWeight: 600, cursor: "help" }}>
                          {t}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right" className="num"
                      sx={{ color: r.promoter_pct >= 50 ? C.good : r.promoter_pct < 30 ? C.bad : undefined }}>
                      {r.promoter_pct != null ? num(r.promoter_pct, 1) : "—"}
                    </TableCell>
                    <TableCell align="right" className="num">{fmtCr(r.ttm_revenue_cr)}</TableCell>
                    <TableCell align="right" className="num">{fmtCr(r.ttm_pat_cr)}</TableCell>
                    <TableCell align="right" className="num" sx={{ color: revGr.color }}>{revGr.text}</TableCell>
                    <TableCell align="right" className="num" sx={{ color: patGr.color }}>{patGr.text}</TableCell>
                    <TableCell align="right" className="num">
                      {r.latest_opm_pct != null ? `${num(r.latest_opm_pct, 1)}%` : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
