/**
 * Watchlist — user's saved stocks with enriched data.
 *
 * Shows fundamentals + coil data for bookmarked stocks.
 * Coiled stocks are highlighted. Click to open the stock page.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Box,
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
import BookmarkRemoveRoundedIcon from "@mui/icons-material/BookmarkRemoveRounded";
import SearchIcon from "@mui/icons-material/Search";
import { CoilBar, HeadCell, TvCopyButton, useTableSort } from "./ui.jsx";
import { BookmarkButton, useWatchlist } from "../watchlist.jsx";
import { C } from "../theme.js";
import { num, pct } from "../format.js";
import { getWatchlist } from "../api.js";

const MONO = '"IBM Plex Mono", ui-monospace, monospace';

const TABLE_SX = {
  "& .MuiTableCell-stickyHeader, & .MuiTableCell-head": {
    bgcolor: "#0e0f12",
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    py: 1.35,
  },
};

const TREND_STYLE = {
  "↑↑": { color: C.good, label: "Accelerating" },
  "↑":  { color: C.good, label: "Growing" },
  "→":  { color: "#c4a46a", label: "Flat" },
  "↓":  { color: C.bad, label: "Declining" },
  "?":  { color: C.muted, label: "No data" },
};

const FILTERS = [
  { id: "all", label: "All Saved" },
  { id: "coiled", label: "Coiled Only" },
  { id: "near", label: "Near Breakout (≤3%)" },
];

function fmtCr(v) {
  if (v == null || Number.isNaN(Number(v))) return "—";
  const n = Number(v);
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toFixed(0);
}

export default function WatchlistView({ onOpenStock }) {
  const { symbols: watchSet } = useWatchlist();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const sort = useTableSort({
    key: "added_at",
    dir: "desc",
    dirFor: (k) =>
      k === "symbol" || k === "name" || k === "industry" || k === "added_at"
        ? "asc"
        : "desc",
  });

  useEffect(() => {
    setLoading(true);
    getWatchlist()
      .then((d) => {
        setRows(d.rows || []);
        setError("");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [watchSet.size]);

  const counts = useMemo(() => {
    const coiled = rows.filter((r) => r.is_coiled).length;
    const near = rows.filter((r) => r.to_trigger != null && r.to_trigger <= 3).length;
    const growing = rows.filter(
      (r) => r.earnings_trend === "↑↑" || r.earnings_trend === "↑",
    ).length;
    return {
      all: rows.length,
      coiled,
      near,
      growing,
    };
  }, [rows]);

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (filter === "coiled" && !r.is_coiled) return false;
      if (filter === "near" && !(r.to_trigger != null && r.to_trigger <= 3)) return false;
      if (!query) return true;
      return (
        (r.symbol || "").toLowerCase().includes(query) ||
        (r.name || "").toLowerCase().includes(query) ||
        (r.industry || "").toLowerCase().includes(query)
      );
    });

    if (sort.key === "earnings_trend") {
      const RANK = { "↑↑": 1, "↑": 2, "→": 3, "↓": 4, "?": 5 };
      const sign = sort.dir === "asc" ? 1 : -1;
      return [...filtered].sort((a, b) => {
        const ra = RANK[a.earnings_trend] ?? 5;
        const rb = RANK[b.earnings_trend] ?? 5;
        return (ra - rb) * sign;
      });
    }
    return sort.apply(filtered);
  }, [rows, q, filter, sort.key, sort.dir]);

  return (
    <Box sx={{ pb: 6 }}>
      {/* Top Architectural Header Card */}
      <Box
        sx={{
          bgcolor: "#15161b",
          border: `1px solid ${C.line}`,
          borderRadius: 2.5,
          p: { xs: 2, sm: 2.5 },
          mb: 2.5,
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
                PERSONAL DESK BOOKMARKS · ENRICHED COIL &amp; FUNDAMENTAL TELEMETRY
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
              Saved Watchlist
            </Typography>
            <Typography sx={{ fontSize: 13, color: C.muted, mt: 0.35 }}>
              Your bookmarked equities enriched with live coil tightness, distance to 20-day breakout, and quarterly earnings trajectories.
            </Typography>
          </Box>

          {/* Filter Pills + Search + TV Copy */}
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
                const active = filter === f.id;
                return (
                  <Box
                    key={f.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setFilter(f.id)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      px: 1.35,
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
                        fontSize: 12.25,
                        fontWeight: active ? 600 : 400,
                        color: active ? C.text : C.muted,
                      }}
                    >
                      {f.label}
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
                      {counts[f.id] || 0}
                    </Box>
                  </Box>
                );
              })}
            </Box>

            <TextField
              size="small"
              placeholder="Search symbol or industry…"
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

            {shown.length > 0 && <TvCopyButton symbols={shown.map((r) => r.symbol)} />}
          </Box>
        </Box>

        {/* Compact Single-Line Telemetry Bar */}
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
          <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: { xs: 2, sm: 3.5 } }}>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>SAVED EQUITIES:</Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 600, color: C.text }}>
                {counts.all}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>CURRENTLY COILED:</Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 600, color: counts.coiled > 0 ? C.accent : C.muted }}>
                {counts.coiled}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>NEAR BREAKOUT (≤3%):</Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 600, color: counts.near > 0 ? C.good : C.muted }}>
                {counts.near}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>GROWING EARNINGS (↑↑/↑):</Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 600, color: counts.growing > 0 ? C.good : C.muted }}>
                {counts.growing}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={26} sx={{ color: C.accent }} />
        </Box>
      )}

      {error && (
        <Box sx={{ p: 2.5, mb: 2.5, borderRadius: 2, bgcolor: "#15161b", border: `1px solid ${C.line}`, color: C.bad }}>
          {error}
        </Box>
      )}

      {!loading && rows.length === 0 && !error && (
        <Box
          sx={{
            py: 7,
            px: 3,
            textAlign: "center",
            bgcolor: "#15161b",
            border: `1px solid ${C.line}`,
            borderRadius: 2.5,
          }}
        >
          <Box
            sx={{
              width: 52,
              height: 52,
              mx: "auto",
              mb: 2,
              borderRadius: 2,
              bgcolor: "rgba(142,180,196,0.08)",
              border: "1px solid rgba(142,180,196,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookmarkRemoveRoundedIcon sx={{ fontSize: 26, color: C.accent }} />
          </Box>
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: C.text, mb: 0.75 }}>
            Your watchlist is empty
          </Typography>
          <Typography sx={{ fontSize: 13.25, color: C.muted, maxWidth: 420, mx: "auto" }}>
            Bookmark any stock from Setups, Tracking, Fundamentals, Markets, or the Equity Dossier drawer to track its coil tightness and breakout proximity here.
          </Typography>
        </Box>
      )}

      {!loading && rows.length > 0 && shown.length === 0 && (
        <Box
          sx={{
            p: 4,
            textAlign: "center",
            bgcolor: "#15161b",
            border: `1px solid ${C.line}`,
            borderRadius: 2.5,
          }}
        >
          <Typography sx={{ fontSize: 13.75, color: C.muted }}>
            No saved stocks match the current filter.
          </Typography>
        </Box>
      )}

      {!loading && shown.length > 0 && (
        <Box
          sx={{
            bgcolor: "#15161b",
            border: `1px solid ${C.line}`,
            borderRadius: 2.5,
            overflow: "hidden",
          }}
        >
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table stickyHeader size="small" sx={{ minWidth: 920, ...TABLE_SX }}>
              <TableHead>
                <TableRow>
                  <HeadCell label="" sx={{ width: 36, p: 0 }} />
                  <HeadCell label="Symbol" sort={sort} sortKey="symbol" />
                  <HeadCell label="Industry" sort={sort} sortKey="industry" sx={{ minWidth: 150 }} />
                  <HeadCell label="Price" align="right" sort={sort} sortKey="adj" />
                  <HeadCell
                    label="Earnings"
                    help="Trajectory of year-on-year profit growth across recent quarters. ↑↑ accelerating, ↑ growing, → flat, ↓ declining."
                    align="center"
                    sort={sort}
                    sortKey="earnings_trend"
                  />
                  <HeadCell label="MCap (Cr)" align="right" sort={sort} sortKey="market_cap_cr" />
                  <HeadCell label="P/E" align="right" sort={sort} sortKey="pe_ttm" />
                  <HeadCell label="Tightness" sort={sort} sortKey="coil" sx={{ minWidth: 120 }} />
                  <HeadCell label="Near High" align="right" sort={sort} sortKey="pos_hi" />
                  <HeadCell label="To Breakout" align="right" sort={sort} sortKey="to_trigger" />
                  <HeadCell label="CMF" align="right" sort={sort} sortKey="cmf" />
                </TableRow>
              </TableHead>
              <TableBody>
                {shown.map((r) => {
                  const t = r.earnings_trend || "?";
                  const ts = TREND_STYLE[t] || TREND_STYLE["?"];
                  return (
                    <TableRow
                      key={r.symbol}
                      hover
                      sx={{
                        ...(r.is_coiled
                          ? { "& td:first-of-type": { boxShadow: `inset 2px 0 0 ${C.accent}` } }
                          : {}),
                        "&:hover": { bgcolor: "rgba(255,255,255,0.025) !important" },
                      }}
                    >
                      <TableCell sx={{ py: 0, px: 0.75, width: 36 }}>
                        <BookmarkButton symbol={r.symbol} />
                      </TableCell>
                      <TableCell
                        onClick={() => onOpenStock?.(r.symbol)}
                        sx={{
                          py: 1.1,
                          fontFamily: MONO,
                          fontSize: 13,
                          fontWeight: 600,
                          color: C.text,
                          cursor: onOpenStock ? "pointer" : "default",
                          "&:hover": onOpenStock ? { color: C.accent } : {},
                        }}
                      >
                        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.85, flexWrap: "wrap" }}>
                          <span>{r.symbol}</span>
                          {r.name && (
                            <Typography
                              component="span"
                              sx={{ fontSize: 11.5, color: C.muted, fontWeight: 400 }}
                            >
                              {r.name.length > 26 ? `${r.name.slice(0, 24)}…` : r.name}
                            </Typography>
                          )}
                          {r.is_coiled && (
                            <Box
                              component="span"
                              sx={{
                                px: 0.75,
                                py: 0.15,
                                borderRadius: 1,
                                bgcolor: "rgba(142,180,196,0.14)",
                                border: "1px solid rgba(142,180,196,0.32)",
                                color: C.accent,
                                fontFamily: MONO,
                                fontSize: 10,
                                fontWeight: 600,
                              }}
                            >
                              Coiled
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1.1, fontSize: 12.25, color: C.muted }}>
                        {r.industry || "—"}
                      </TableCell>
                      <TableCell align="right" className="num" sx={{ py: 1.1, fontFamily: MONO, fontSize: 12.5, fontWeight: 500 }}>
                        {r.adj != null ? num(r.adj, 2) : "—"}
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1.1 }}>
                        <Tooltip title={ts.label} placement="top" arrow>
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
                              bgcolor: `${ts.color}14`,
                              border: `1px solid ${ts.color}33`,
                              fontFamily: MONO,
                              fontSize: 12,
                              color: ts.color,
                              fontWeight: 600,
                              cursor: "help",
                            }}
                          >
                            {t}
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right" className="num" sx={{ py: 1.1, fontFamily: MONO, fontSize: 12.5 }}>
                        ₹{fmtCr(r.market_cap_cr)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="num"
                        sx={{
                          py: 1.1,
                          fontFamily: MONO,
                          fontSize: 12.5,
                          color: r.pe_ttm > 0 && r.pe_ttm < 25 ? C.good : r.pe_ttm > 50 ? C.bad : C.text,
                        }}
                      >
                        {r.pe_ttm != null ? num(r.pe_ttm, 1) : "—"}
                      </TableCell>
                      <TableCell sx={{ py: 1.1 }}>
                        {r.coil != null ? (
                          <CoilBar value={r.coil} />
                        ) : (
                          <Typography sx={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>—</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right" className="num" sx={{ py: 1.1, fontFamily: MONO, fontSize: 12.5 }}>
                        {r.pos_hi != null ? pct(r.pos_hi, 1) : "—"}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="num"
                        sx={{
                          py: 1.1,
                          fontFamily: MONO,
                          fontSize: 12.5,
                          color: r.to_trigger != null && r.to_trigger <= 3 ? C.good : C.text,
                          fontWeight: r.to_trigger != null && r.to_trigger <= 3 ? 600 : 400,
                        }}
                      >
                        {r.to_trigger != null ? pct(r.to_trigger, 1) : "—"}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="num"
                        sx={{
                          py: 1.1,
                          fontFamily: MONO,
                          fontSize: 12.5,
                          color: r.cmf > 0 ? C.good : r.cmf < 0 ? C.bad : C.muted,
                        }}
                      >
                        {r.cmf != null ? num(r.cmf) : "—"}
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
