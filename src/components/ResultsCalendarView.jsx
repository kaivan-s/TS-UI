/**
 * Results Calendar — upcoming quarterly earnings dates.
 *
 * Grouped by date, showing which companies are reporting when,
 * alongside their earnings trend, market cap, and consensus estimates.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import { C } from "../theme.js";
import { num } from "../format.js";
import { getResultsCalendar } from "../api.js";

const TREND_STYLE = {
  "↑↑": { color: C.good,  label: "Accelerating", icon: "↑↑" },
  "↑":  { color: C.good,  label: "Growing",      icon: "↑" },
  "→":  { color: "#c4a46a", label: "Flat",        icon: "→" },
  "↓":  { color: C.bad,   label: "Declining",     icon: "↓" },
  "?":  { color: C.muted, label: "No data",       icon: "?" },
};

function fmtCr(v) {
  if (v == null || Number.isNaN(Number(v))) return "";
  const n = Number(v);
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L Cr`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K Cr`;
  return `₹${n.toFixed(0)} Cr`;
}

function fmtDateLabel(iso) {
  if (!iso) return "Unknown";
  const d = new Date(iso + "T00:00:00");
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function isToday(iso) {
  if (!iso) return false;
  return iso === new Date().toISOString().slice(0, 10);
}

function isTomorrow(iso) {
  if (!iso) return false;
  const tom = new Date();
  tom.setDate(tom.getDate() + 1);
  return iso === tom.toISOString().slice(0, 10);
}

function isThisWeek(iso) {
  if (!iso) return false;
  const d = new Date(iso + "T00:00:00");
  const now = new Date();
  const diff = (d - now) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff < 7;
}

function RelativeBadge({ dateStr }) {
  if (isToday(dateStr)) {
    return (
      <Chip size="small" label="Today"
        sx={{ bgcolor: "rgba(200,122,122,0.15)", color: C.bad, fontWeight: 600, fontSize: 11 }} />
    );
  }
  if (isTomorrow(dateStr)) {
    return (
      <Chip size="small" label="Tomorrow"
        sx={{ bgcolor: "rgba(196,164,106,0.12)", color: C.warn, fontWeight: 600, fontSize: 11 }} />
    );
  }
  if (isThisWeek(dateStr)) {
    return (
      <Chip size="small" label="This week"
        sx={{ bgcolor: "rgba(142,180,196,0.12)", color: C.accent, fontWeight: 600, fontSize: 11 }} />
    );
  }
  return null;
}

export default function ResultsCalendarView({ onOpenStock }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    setLoading(true);
    getResultsCalendar(60)
      .then((d) => { setRows(d.rows || []); setError(""); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Group by date
  const grouped = useMemo(() => {
    const query = q.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (!query) return true;
      return (
        (r.symbol || "").toLowerCase().includes(query) ||
        (r.name || "").toLowerCase().includes(query) ||
        (r.industry || "").toLowerCase().includes(query)
      );
    });

    const byDate = {};
    for (const r of filtered) {
      const d = r.earnings_date || "Unknown";
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(r);
    }

    // Sort each group by market cap desc
    for (const d of Object.keys(byDate)) {
      byDate[d].sort((a, b) => (b.market_cap_cr ?? 0) - (a.market_cap_cr ?? 0));
    }

    return Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b));
  }, [rows, q]);

  const totalStocks = grouped.reduce((acc, [, items]) => acc + items.length, 0);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 3, gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
            <CalendarMonthRoundedIcon sx={{ fontSize: 22, color: C.accent }} />
            <Typography sx={{ fontSize: 18, fontWeight: 600, color: C.text, letterSpacing: "-0.02em" }}>
              Results Calendar
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6, maxWidth: 600 }}>
            Upcoming quarterly earnings dates for NSE stocks. Results season
            is when fundamentals data gets fresh — stocks often gap on earnings
            surprises.
          </Typography>
        </Box>
        <TextField
          size="small"
          placeholder="Search symbol or industry"
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
      </Box>

      {loading && (
        <Typography sx={{ fontSize: 14, color: C.muted, py: 4 }}>
          Loading results calendar…
        </Typography>
      )}

      {error && (
        <Typography sx={{ fontSize: 14, color: C.bad, py: 2 }}>{error}</Typography>
      )}

      {!loading && rows.length === 0 && !error && (
        <Box sx={{ py: 4, textAlign: "center" }}>
          <Typography sx={{ fontSize: 15, color: C.muted, mb: 1 }}>
            No upcoming results dates found.
          </Typography>
          <Typography sx={{ fontSize: 13, color: C.muted }}>
            Run the calendar refresh to populate — POST /api/cron/results-calendar
          </Typography>
        </Box>
      )}

      {!loading && totalStocks > 0 && (
        <Typography sx={{ fontSize: 13, color: C.muted, mb: 2 }}>
          {totalStocks} stocks reporting across {grouped.length} dates
        </Typography>
      )}

      {/* Calendar groups */}
      {grouped.map(([dateStr, items]) => (
        <Box key={dateStr} sx={{ mb: 3 }}>
          {/* Date header */}
          <Box sx={{
            display: "flex", alignItems: "center", gap: 1.5,
            px: 2, py: 1.25,
            borderRadius: 1.5,
            bgcolor: isToday(dateStr) ? "rgba(200,122,122,0.06)" :
                     isTomorrow(dateStr) ? "rgba(196,164,106,0.06)" :
                     "rgba(238,234,227,0.03)",
            border: `1px solid ${isToday(dateStr) ? "rgba(200,122,122,0.15)" :
                                  isTomorrow(dateStr) ? "rgba(196,164,106,0.12)" :
                                  C.line}`,
            mb: 1,
          }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: C.text }}>
              {fmtDateLabel(dateStr)}
            </Typography>
            <Typography sx={{ fontSize: 12, color: C.muted }}>
              {items.length} {items.length === 1 ? "stock" : "stocks"}
            </Typography>
            <RelativeBadge dateStr={dateStr} />
          </Box>

          {/* Stocks reporting on this date */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, pl: 1 }}>
            {items.map((r) => {
              const t = r.earnings_trend || "?";
              const ts = TREND_STYLE[t] || TREND_STYLE["?"];
              return (
                <Box
                  key={r.symbol}
                  onClick={() => onOpenStock?.(r.symbol)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    px: 2,
                    py: 1,
                    borderRadius: 1,
                    cursor: onOpenStock ? "pointer" : "default",
                    "&:hover": { bgcolor: "rgba(238,234,227,0.04)" },
                    transition: "background 0.1s",
                  }}
                >
                  {/* Symbol + name */}
                  <Box sx={{ minWidth: 180 }}>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>
                      {r.symbol}
                    </Typography>
                    {r.name && (
                      <Typography sx={{ fontSize: 11, color: C.muted, lineHeight: 1.3 }}>
                        {r.name.length > 35 ? r.name.slice(0, 33) + "…" : r.name}
                      </Typography>
                    )}
                  </Box>

                  {/* Earnings trend */}
                  <Tooltip title={ts.label} placement="top" arrow>
                    <Typography sx={{ fontSize: 16, color: ts.color, fontWeight: 600, minWidth: 28, textAlign: "center", cursor: "help" }}>
                      {ts.icon}
                    </Typography>
                  </Tooltip>

                  {/* Market cap */}
                  <Typography className="num" sx={{ fontSize: 12, color: C.muted, minWidth: 80, textAlign: "right" }}>
                    {fmtCr(r.market_cap_cr)}
                  </Typography>

                  {/* PE */}
                  <Typography className="num" sx={{
                    fontSize: 12, minWidth: 50, textAlign: "right",
                    color: r.pe_ttm > 0 && r.pe_ttm < 25 ? C.good : r.pe_ttm > 50 ? C.bad : C.muted,
                  }}>
                    {r.pe_ttm != null ? `${num(r.pe_ttm, 1)}x` : "—"}
                  </Typography>

                  {/* EPS estimate */}
                  {r.eps_estimate != null && (
                    <Tooltip title={`EPS estimate: ₹${num(r.eps_estimate, 2)} (range: ${num(r.eps_low, 2)}–${num(r.eps_high, 2)})`} arrow>
                      <Typography className="num" sx={{ fontSize: 12, color: C.accent, minWidth: 90, cursor: "help" }}>
                        EPS est ₹{num(r.eps_estimate, 1)}
                      </Typography>
                    </Tooltip>
                  )}

                  {/* Revenue estimate */}
                  {r.revenue_estimate_cr != null && (
                    <Typography className="num" sx={{ fontSize: 12, color: C.muted, minWidth: 90 }}>
                      Rev est {fmtCr(r.revenue_estimate_cr)}
                    </Typography>
                  )}

                  {/* Industry */}
                  <Typography sx={{ fontSize: 11, color: "rgba(238,234,227,0.35)", flex: 1, textAlign: "right" }}>
                    {r.industry || ""}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
