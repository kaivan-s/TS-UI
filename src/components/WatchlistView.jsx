/**
 * Watchlist — user's saved stocks with enriched data.
 *
 * Shows fundamentals + coil data for bookmarked stocks.
 * Coiled stocks are highlighted. Click to open StockDrawer.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import BookmarkRemoveRoundedIcon from "@mui/icons-material/BookmarkRemoveRounded";
import { CoilBar, HeadCell, PageIntro, TvCopyButton, useTableSort } from "./ui.jsx";
import { BookmarkButton, useWatchlist } from "../watchlist.jsx";
import { C } from "../theme.js";
import { num, pct } from "../format.js";
import { getWatchlist } from "../api.js";

const TREND_STYLE = {
  "↑↑": { color: C.good,  label: "Accelerating" },
  "↑":  { color: C.good,  label: "Growing" },
  "→":  { color: "#c4a46a", label: "Flat" },
  "↓":  { color: C.bad,   label: "Declining" },
  "?":  { color: C.muted, label: "No data" },
};

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
      .then((d) => { setRows(d.rows || []); setError(""); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [watchSet.size]);

  const shown = useMemo(() => {
    if (sort.key === "earnings_trend") {
      const RANK = { "↑↑": 1, "↑": 2, "→": 3, "↓": 4, "?": 5 };
      const sign = sort.dir === "asc" ? 1 : -1;
      return [...rows].sort((a, b) => {
        const ra = RANK[a.earnings_trend] ?? 5;
        const rb = RANK[b.earnings_trend] ?? 5;
        return (ra - rb) * sign;
      });
    }
    return sort.apply(rows);
  }, [rows, sort.key, sort.dir]);

  // Split: coiled stocks first
  const coiledCount = rows.filter((r) => r.is_coiled).length;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
        <PageIntro title="Watchlist">
          Your saved stocks — {rows.length} bookmarked
          {coiledCount > 0 && `, ${coiledCount} currently coiled`}.
          Click any row to open the stock drawer. Bookmark from any table
          or the stock drawer header.
        </PageIntro>
        {rows.length > 0 && (
          <TvCopyButton symbols={rows.map((r) => r.symbol)} sx={{ mt: 1, flexShrink: 0 }} />
        )}
      </Box>

      {loading && (
        <Typography sx={{ fontSize: 14, color: C.muted, py: 4 }}>Loading watchlist…</Typography>
      )}

      {error && (
        <Typography sx={{ fontSize: 14, color: C.bad, py: 2 }}>{error}</Typography>
      )}

      {!loading && rows.length === 0 && !error && (
        <Box sx={{
          py: 6, textAlign: "center",
          border: `1px dashed ${C.line}`, borderRadius: 2, mt: 2,
        }}>
          <BookmarkRemoveRoundedIcon sx={{ fontSize: 40, color: C.muted, mb: 2 }} />
          <Typography sx={{ fontSize: 15, color: C.muted, mb: 1 }}>
            Your watchlist is empty
          </Typography>
          <Typography sx={{ fontSize: 13, color: C.muted }}>
            Open any stock and tap the bookmark icon to save it here.
          </Typography>
        </Box>
      )}

      {!loading && shown.length > 0 && (
        <TableContainer sx={{ mb: 4, overflowX: "auto" }}>
          <Table stickyHeader sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <HeadCell label="" sx={{ width: 40 }} />
                <HeadCell label="Symbol" sort={sort} sortKey="symbol" />
                <HeadCell label="Industry" sort={sort} sortKey="industry" sx={{ minWidth: 140 }} />
                <HeadCell label="Price" align="right" sort={sort} sortKey="adj" />
                <HeadCell label="Earnings" align="center" sort={sort} sortKey="earnings_trend" />
                <HeadCell label="MCap" align="right" sort={sort} sortKey="market_cap_cr" />
                <HeadCell label="PE" align="right" sort={sort} sortKey="pe_ttm" />
                <HeadCell label="Coil" sort={sort} sortKey="coil" sx={{ minWidth: 100 }} />
                <HeadCell label="Pos Hi" align="right" sort={sort} sortKey="pos_hi" />
                <HeadCell label="To Break" align="right" sort={sort} sortKey="to_trigger" />
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
                    sx={r.is_coiled ? {
                      "& td:first-of-type": { boxShadow: `inset 2px 0 0 ${C.accent}` },
                    } : undefined}
                  >
                    <TableCell sx={{ py: 0.5, px: 0.5 }}>
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
                          {r.name.length > 25 ? r.name.slice(0, 23) + "…" : r.name}
                        </Typography>
                      )}
                      {r.is_coiled && (
                        <Chip
                          size="small"
                          label="Coiled"
                          sx={{ ml: 1, bgcolor: "rgba(142,180,196,0.12)", color: C.accent, fontSize: 10 }}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: C.muted }}>{r.industry || "—"}</TableCell>
                    <TableCell align="right" className="num" sx={{ fontWeight: 500 }}>
                      {r.adj != null ? num(r.adj, 2) : "—"}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={ts.label} placement="top" arrow>
                        <Typography component="span" sx={{ fontSize: 16, color: ts.color, fontWeight: 600, cursor: "help" }}>
                          {t}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right" className="num">{fmtCr(r.market_cap_cr)}</TableCell>
                    <TableCell align="right" className="num"
                      sx={{ color: r.pe_ttm > 0 && r.pe_ttm < 25 ? C.good : r.pe_ttm > 50 ? C.bad : undefined }}>
                      {r.pe_ttm != null ? num(r.pe_ttm, 1) : "—"}
                    </TableCell>
                    <TableCell>
                      {r.coil != null ? <CoilBar value={r.coil} /> : <Typography sx={{ fontSize: 12, color: C.muted }}>—</Typography>}
                    </TableCell>
                    <TableCell align="right" className="num">{r.pos_hi != null ? pct(r.pos_hi, 1) : "—"}</TableCell>
                    <TableCell align="right" className="num">{r.to_trigger != null ? pct(r.to_trigger, 1) : "—"}</TableCell>
                    <TableCell align="right" className="num"
                      sx={{ color: r.cmf > 0 ? C.good : r.cmf < 0 ? C.bad : undefined }}>
                      {r.cmf != null ? num(r.cmf) : "—"}
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
