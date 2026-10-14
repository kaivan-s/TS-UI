/**
 * Results Calendar — upcoming quarterly earnings dates.
 *
 * Architectural dark month-grid & timeline desk with live summary telemetry,
 * earnings-trend filtering, quick month jumpers, and detailed stock cards.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { TvCopyButton } from "./ui.jsx";
import { C } from "../theme.js";
import { num } from "../format.js";
import { getResultsCalendar } from "../api.js";

const MONO = '"IBM Plex Mono", ui-monospace, monospace';

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const TREND_STYLE = {
  "↑↑": { color: C.good, label: "Accelerating", icon: "↑↑" },
  "↑":  { color: C.good, label: "Growing",      icon: "↑" },
  "→":  { color: C.warn, label: "Flat",         icon: "→" },
  "↓":  { color: C.bad,  label: "Declining",    icon: "↓" },
  "?":  { color: C.muted, label: "Unrated",     icon: "·" },
};

const TREND_FILTERS = [
  { id: "all", label: "All trends" },
  { id: "up", label: "↑↑ / ↑ Growing", color: C.good },
  { id: "flat", label: "→ Flat", color: C.warn },
  { id: "down", label: "↓ Declining", color: C.bad },
];

function fmtCr(v) {
  if (v == null || Number.isNaN(Number(v))) return "";
  const n = Number(v);
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L Cr`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K Cr`;
  return `₹${n.toFixed(0)} Cr`;
}

/** YYYY-MM-DD for a Date in local time (avoids UTC off-by-one). */
function isoOf(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtDateLabel(iso) {
  if (!iso || iso === "Unknown") return "Date TBA";
  const d = new Date(iso + "T00:00:00");
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const TODAY_ISO = isoOf(new Date());
const isToday = (iso) => iso === TODAY_ISO;

function RelativeBadge({ dateStr }) {
  if (!dateStr || dateStr === "Unknown") return null;
  const tom = new Date();
  tom.setDate(tom.getDate() + 1);
  const d = new Date(dateStr + "T00:00:00");
  const diff = Math.round((d - new Date(TODAY_ISO + "T00:00:00")) / (1000 * 60 * 60 * 24));

  if (isToday(dateStr)) {
    return (
      <Chip
        size="small"
        label="Today"
        sx={{
          fontFamily: MONO,
          bgcolor: "rgba(200,122,122,0.16)",
          color: C.bad,
          fontWeight: 600,
          fontSize: 10.5,
        }}
      />
    );
  }
  if (dateStr === isoOf(tom)) {
    return (
      <Chip
        size="small"
        label="Tomorrow"
        sx={{
          fontFamily: MONO,
          bgcolor: "rgba(196,164,106,0.14)",
          color: C.warn,
          fontWeight: 600,
          fontSize: 10.5,
        }}
      />
    );
  }
  if (diff > 1 && diff <= 7) {
    return (
      <Chip
        size="small"
        label={`In ${diff}d`}
        sx={{
          fontFamily: MONO,
          bgcolor: "rgba(142,180,196,0.14)",
          color: C.accent,
          fontWeight: 600,
          fontSize: 10.5,
        }}
      />
    );
  }
  return null;
}

/** A compact labelled statistic used inside the detail card. */
function Stat({ label, value, color = C.text, tip }) {
  const body = (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          fontFamily: MONO,
          fontSize: 9.5,
          color: C.muted,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          lineHeight: 1.35,
        }}
      >
        {label}
      </Typography>
      <Typography
        className="num"
        sx={{
          fontFamily: MONO,
          fontSize: 12.5,
          fontWeight: 600,
          color,
          mt: 0.25,
          lineHeight: 1.3,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
  return tip ? (
    <Tooltip title={tip} arrow placement="top">
      {body}
    </Tooltip>
  ) : (
    body
  );
}

/** One stock card in the day-detail panel. */
function DetailCard({ r, onOpenStock }) {
  const t = r.earnings_trend || "?";
  const ts = TREND_STYLE[t] || TREND_STYLE["?"];
  const peColor = r.pe_ttm > 0 && r.pe_ttm < 25 ? C.good : r.pe_ttm > 50 ? C.bad : C.text;

  return (
    <Box
      onClick={() => onOpenStock?.(r.symbol)}
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${C.line}`,
        bgcolor: "#111216",
        cursor: onOpenStock ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "border-color 0.15s ease, background-color 0.15s ease",
        "&:hover": onOpenStock
          ? {
              borderColor: "rgba(142,180,196,0.45)",
              bgcolor: "#16181e",
            }
          : {},
      }}
    >
      <Box>
        {/* Top: symbol + name, trend badge on the right */}
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: 14,
                fontWeight: 600,
                color: C.text,
                letterSpacing: "-0.01em",
              }}
            >
              {r.symbol}
            </Typography>
            {r.name && (
              <Typography
                sx={{
                  fontSize: 11.5,
                  color: C.muted,
                  mt: 0.2,
                  lineHeight: 1.35,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {r.name}
              </Typography>
            )}
          </Box>

          <Tooltip title={`Earnings trajectory: ${ts.label}`} placement="top" arrow>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                flexShrink: 0,
                px: 1,
                py: 0.3,
                borderRadius: 1,
                bgcolor: `${ts.color}18`,
                border: `1px solid ${ts.color}33`,
              }}
            >
              <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: ts.color, fontWeight: 700, lineHeight: 1 }}>
                {ts.icon}
              </Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 10, color: ts.color, fontWeight: 600 }}>
                {ts.label}
              </Typography>
            </Box>
          </Tooltip>
        </Box>

        {/* Recessed 2x2 Stats Box */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 1.25,
            p: 1.25,
            borderRadius: 1.5,
            bgcolor: "#0c0d10",
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <Stat label="Mkt Cap" value={fmtCr(r.market_cap_cr) || "—"} color={C.text} />
          <Stat label="P/E (TTM)" value={r.pe_ttm != null ? `${num(r.pe_ttm, 1)}x` : "—"} color={peColor} />
          <Stat
            label="EPS Est"
            value={r.eps_estimate != null ? `₹${num(r.eps_estimate, 1)}` : "—"}
            color={r.eps_estimate != null ? C.accent : C.muted}
            tip={
              r.eps_estimate != null
                ? `EPS estimate ₹${num(r.eps_estimate, 2)} (range ${num(r.eps_low, 2)}–${num(r.eps_high, 2)})`
                : undefined
            }
          />
          <Stat
            label="Rev Est"
            value={r.revenue_estimate_cr != null ? fmtCr(r.revenue_estimate_cr) : "—"}
            color={r.revenue_estimate_cr != null ? C.text : C.muted}
          />
        </Box>
      </Box>

      {/* Industry footer */}
      {r.industry && (
        <Box sx={{ mt: 1.25, pt: 1, borderTop: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: 10.5,
              color: C.muted,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {r.industry}
          </Typography>
          <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.accent, ml: 1, flexShrink: 0 }}>
            Inspect →
          </Typography>
        </Box>
      )}
    </Box>
  );
}

const MAX_CHIPS = 4;

export default function ResultsCalendarView({ onOpenStock }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [trendFilter, setTrendFilter] = useState("all");
  const [mode, setMode] = useState("calendar"); // "calendar" | "list"
  const [selected, setSelected] = useState(null);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  useEffect(() => {
    setLoading(true);
    getResultsCalendar(120)
      .then((d) => {
        setRows(d.rows || []);
        setError("");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Filtered rows + date map + summary telemetry
  const { byDate, totalStocks, dateCount, todayCount, weekCount, growingCount, activeMonths } = useMemo(() => {
    const query = q.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (trendFilter === "up" && r.earnings_trend !== "↑↑" && r.earnings_trend !== "↑") return false;
      if (trendFilter === "flat" && r.earnings_trend !== "→") return false;
      if (trendFilter === "down" && r.earnings_trend !== "↓") return false;
      if (!query) return true;
      return (
        (r.symbol || "").toLowerCase().includes(query) ||
        (r.name || "").toLowerCase().includes(query) ||
        (r.industry || "").toLowerCase().includes(query)
      );
    });

    const map = {};
    const monthSet = new Map();
    let tCount = 0;
    let wCount = 0;
    let gCount = 0;
    const todayDate = new Date(TODAY_ISO + "T00:00:00");

    for (const r of filtered) {
      const d = r.earnings_date || "Unknown";
      if (!map[d]) map[d] = [];
      map[d].push(r);

      if (r.earnings_trend === "↑↑" || r.earnings_trend === "↑") gCount++;

      if (d !== "Unknown") {
        const dt = new Date(d + "T00:00:00");
        const diff = (dt - todayDate) / (1000 * 60 * 60 * 24);
        if (d === TODAY_ISO) tCount++;
        if (diff >= 0 && diff <= 7) wCount++;

        const mKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
        if (!monthSet.has(mKey)) {
          monthSet.set(mKey, {
            key: mKey,
            year: dt.getFullYear(),
            month: dt.getMonth(),
            label: `${MONTHS[dt.getMonth()]} ${String(dt.getFullYear()).slice(-2)}`,
            count: 0,
          });
        }
        monthSet.get(mKey).count++;
      }
    }

    for (const d of Object.keys(map)) {
      map[d].sort((a, b) => (b.market_cap_cr ?? 0) - (a.market_cap_cr ?? 0));
    }

    return {
      byDate: map,
      totalStocks: filtered.length,
      dateCount: Object.keys(map).filter((d) => d !== "Unknown").length,
      todayCount: tCount,
      weekCount: wCount,
      growingCount: gCount,
      activeMonths: Array.from(monthSet.values()).sort((a, b) => a.key.localeCompare(b.key)),
    };
  }, [rows, q, trendFilter]);

  // Jump to first month with results if current month is empty, and auto-select a date with results
  useEffect(() => {
    const dates = Object.keys(byDate)
      .filter((d) => d !== "Unknown")
      .sort();
    if (!dates.length) return;

    const monthKey = (d) => `${d.getFullYear()}-${d.getMonth()}`;
    const inCursorMonth = dates.filter(
      (iso) => monthKey(new Date(iso + "T00:00:00")) === monthKey(cursor)
    );

    if (!inCursorMonth.length) {
      const first = new Date(dates[0] + "T00:00:00");
      setCursor(new Date(first.getFullYear(), first.getMonth(), 1));
      return;
    }

    if (!selected || !byDate[selected]) {
      const upcomingInMonth = inCursorMonth.find((iso) => iso >= TODAY_ISO) || inCursorMonth[0];
      setSelected(upcomingInMonth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byDate, cursor]);

  // Build the 6-week grid
  const weeks = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const gridStart = new Date(year, month, 1 - firstWeekday);
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      cells.push({
        date: d,
        iso: isoOf(d),
        inMonth: d.getMonth() === month,
        weekend: d.getDay() === 0 || d.getDay() === 6,
      });
    }
    const out = [];
    for (let w = 0; w < 6; w++) out.push(cells.slice(w * 7, w * 7 + 7));
    while (out.length > 4 && out[out.length - 1].every((c) => !c.inMonth)) out.pop();
    return out;
  }, [cursor]);

  const monthStocks = useMemo(() => {
    let n = 0;
    for (const iso of Object.keys(byDate)) {
      if (iso === "Unknown") continue;
      const d = new Date(iso + "T00:00:00");
      if (d.getFullYear() === cursor.getFullYear() && d.getMonth() === cursor.getMonth()) {
        n += byDate[iso].length;
      }
    }
    return n;
  }, [byDate, cursor]);

  const gotoMonth = (delta) => {
    setSelected(null);
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  };

  const gotoToday = () => {
    const d = new Date();
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
    if (byDate[TODAY_ISO]) setSelected(TODAY_ISO);
  };

  const grouped = useMemo(
    () => Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)),
    [byDate]
  );

  const selectedRows = selected ? byDate[selected] || [] : [];

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
                EARNINGS SCHEDULE · 120D WINDOW
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
              Quarterly Results Calendar
            </Typography>
            <Typography sx={{ fontSize: 13.75, color: C.muted, lineHeight: 1.6 }}>
              Track upcoming NSE quarterly earnings announcements. Check when a coiled setup reports before taking a breakout into an event gap.
            </Typography>
          </Box>

          {/* Search, View Switcher, TV Copy */}
          <Box sx={{ display: "flex", gap: 1.25, alignItems: "center", flexWrap: "wrap", width: { xs: "100%", lg: "auto" } }}>
            <TextField
              size="small"
              placeholder="Search symbol or industry…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              sx={{
                width: { xs: "100%", sm: 230 },
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

            {/* Custom Segmented View Switcher */}
            <Box
              sx={{
                display: "inline-flex",
                p: 0.4,
                borderRadius: 1.75,
                bgcolor: "#0e0f12",
                border: `1px solid ${C.line}`,
              }}
            >
              {[
                { id: "calendar", label: "Calendar" },
                { id: "list", label: "Timeline" },
              ].map((item) => {
                const active = mode === item.id;
                return (
                  <Box
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setMode(item.id)}
                    onKeyDown={(e) => e.key === "Enter" && setMode(item.id)}
                    sx={{
                      px: 1.5,
                      py: 0.6,
                      borderRadius: 1.25,
                      cursor: "pointer",
                      fontFamily: MONO,
                      fontSize: 12,
                      fontWeight: active ? 600 : 500,
                      bgcolor: active ? "rgba(238,234,227,0.1)" : "transparent",
                      color: active ? C.text : C.muted,
                      transition: "all 0.15s ease",
                      "&:hover": { color: C.text },
                    }}
                  >
                    {item.label}
                  </Box>
                );
              })}
            </Box>

            <TvCopyButton symbols={Object.values(byDate).flat().map((r) => r.symbol)} />
          </Box>
        </Box>

        {/* Bottom Telemetry & Trend Filter Bar */}
        <Box
          sx={{
            mt: 2.75,
            pt: 2.25,
            borderTop: `1px solid ${C.line}`,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          {/* 4-Metric Readout Strip */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: { xs: 2, sm: 3.5 },
            }}
          >
            {[
              { label: "Reporting Today", value: todayCount, color: todayCount > 0 ? C.bad : C.text },
              { label: "Next 7 Days", value: weekCount, color: C.accent },
              { label: "In View", value: `${totalStocks} across ${dateCount}d`, color: C.text },
              { label: "Growing (↑↑ / ↑)", value: growingCount, color: C.good },
            ].map((stat) => (
              <Box key={stat.label} sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {stat.label}
                </Typography>
                <Typography sx={{ fontFamily: MONO, fontSize: 14, fontWeight: 600, color: stat.color }}>
                  {stat.value}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Earnings Trend Filter Chips */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
            {TREND_FILTERS.map((tf) => {
              const active = trendFilter === tf.id;
              return (
                <Box
                  key={tf.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setTrendFilter(tf.id)}
                  onKeyDown={(e) => e.key === "Enter" && setTrendFilter(tf.id)}
                  sx={{
                    px: 1.25,
                    py: 0.45,
                    borderRadius: 1.25,
                    cursor: "pointer",
                    fontFamily: MONO,
                    fontSize: 11,
                    fontWeight: active ? 600 : 500,
                    bgcolor: active ? "rgba(238,234,227,0.1)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${active ? "rgba(238,234,227,0.22)" : C.line}`,
                    color: active ? (tf.color || C.text) : C.muted,
                    transition: "all 0.15s ease",
                    "&:hover": { color: C.text, borderColor: "rgba(238,234,227,0.2)" },
                  }}
                >
                  {tf.label}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

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
            Loading upcoming NSE earnings schedule…
          </Typography>
        </Box>
      )}

      {error && (
        <Typography sx={{ fontSize: 14, color: C.bad, py: 2 }}>
          {error}
        </Typography>
      )}

      {!loading && rows.length === 0 && !error && (
        <Box
          sx={{
            p: 6,
            borderRadius: 2.5,
            bgcolor: "#15161b",
            border: `1px solid ${C.line}`,
            textAlign: "center",
          }}
        >
          <Typography sx={{ fontSize: 15, fontWeight: 500, color: C.text, mb: 0.75 }}>
            No upcoming results dates found
          </Typography>
          <Typography sx={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>
            Run POST /api/cron/results-calendar to refresh the forward schedule.
          </Typography>
        </Box>
      )}

      {/* ════════════════════════════════════════════════
          CALENDAR GRID MODE
         ════════════════════════════════════════════════ */}
      {!loading && rows.length > 0 && mode === "calendar" && (
        <Box>
          {/* Main Calendar Container */}
          <Box
            sx={{
              p: { xs: 2, sm: 2.75 },
              borderRadius: 3,
              bgcolor: "#15161b",
              border: `1px solid ${C.line}`,
            }}
          >
            {/* Month Navigation Toolbar */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                mb: 2.5,
                flexWrap: "wrap",
              }}
            >
              {/* Left: Prev / Month Label / Next / Today */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <IconButton
                  size="small"
                  onClick={() => gotoMonth(-1)}
                  sx={{
                    color: C.text,
                    bgcolor: "#0e0f12",
                    border: `1px solid ${C.line}`,
                    borderRadius: 1.5,
                    "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                  }}
                >
                  <ChevronLeftRoundedIcon fontSize="small" />
                </IconButton>

                <Typography
                  sx={{
                    fontSize: 17,
                    fontWeight: 600,
                    color: C.text,
                    minWidth: 165,
                    textAlign: "center",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {MONTHS_LONG[cursor.getMonth()]} {cursor.getFullYear()}
                </Typography>

                <IconButton
                  size="small"
                  onClick={() => gotoMonth(1)}
                  sx={{
                    color: C.text,
                    bgcolor: "#0e0f12",
                    border: `1px solid ${C.line}`,
                    borderRadius: 1.5,
                    "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                  }}
                >
                  <ChevronRightRoundedIcon fontSize="small" />
                </IconButton>

                <Box
                  role="button"
                  tabIndex={0}
                  onClick={gotoToday}
                  onKeyDown={(e) => e.key === "Enter" && gotoToday()}
                  sx={{
                    ml: 0.5,
                    px: 1.25,
                    py: 0.5,
                    borderRadius: 1.25,
                    cursor: "pointer",
                    fontFamily: MONO,
                    fontSize: 11.5,
                    color: C.text,
                    bgcolor: "#0e0f12",
                    border: `1px solid ${C.line}`,
                    "&:hover": { borderColor: C.accent },
                  }}
                >
                  Today
                </Box>

                {/* Quick Month Jumpers for months with data */}
                {activeMonths.length > 1 && (
                  <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 0.6, ml: 1 }}>
                    {activeMonths.slice(0, 4).map((m) => {
                      const isCur =
                        m.year === cursor.getFullYear() && m.month === cursor.getMonth();
                      return (
                        <Box
                          key={m.key}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setSelected(null);
                            setCursor(new Date(m.year, m.month, 1));
                          }}
                          sx={{
                            px: 1.1,
                            py: 0.4,
                            borderRadius: 1.25,
                            cursor: "pointer",
                            fontFamily: MONO,
                            fontSize: 11,
                            bgcolor: isCur ? "rgba(142,180,196,0.14)" : "transparent",
                            border: `1px solid ${isCur ? "rgba(142,180,196,0.3)" : "transparent"}`,
                            color: isCur ? C.accent : C.muted,
                            "&:hover": { color: C.text },
                          }}
                        >
                          {m.label} ({m.count})
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>

              {/* Right: Month count */}
              <Typography sx={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>
                <Box component="span" sx={{ color: C.text, fontWeight: 600 }}>
                  {monthStocks}
                </Box>{" "}
                {monthStocks === 1 ? "company" : "companies"} in {MONTHS[cursor.getMonth()]}
              </Typography>
            </Box>

            {/* 7-Column Month Grid */}
            <Box sx={{ overflowX: "auto" }}>
              <Box sx={{ minWidth: 720 }}>
                {/* Weekday Header */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: "6px",
                    mb: "6px",
                  }}
                >
                  {DAYS.map((d, idx) => (
                    <Box
                      key={d}
                      sx={{
                        py: 0.75,
                        borderRadius: 1,
                        bgcolor: "#0e0f12",
                        border: `1px solid ${C.line}`,
                        textAlign: "center",
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: MONO,
                          fontSize: 10.5,
                          fontWeight: 600,
                          color: idx === 0 || idx === 6 ? "rgba(142,138,131,0.55)" : C.muted,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                        }}
                      >
                        {d}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Weeks */}
                {weeks.map((week, wi) => (
                  <Box
                    key={wi}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(7, 1fr)",
                      gap: "6px",
                      mb: wi < weeks.length - 1 ? "6px" : 0,
                    }}
                  >
                    {week.map((cell) => {
                      const items = byDate[cell.iso] || [];
                      const today = isToday(cell.iso);
                      const isSel = selected === cell.iso;

                      return (
                        <Box
                          key={cell.iso}
                          onClick={() => items.length && setSelected(isSel ? null : cell.iso)}
                          sx={{
                            minHeight: 114,
                            p: 1,
                            borderRadius: 1.75,
                            border: `1px solid ${
                              isSel
                                ? C.accent
                                : today
                                  ? "rgba(200,122,122,0.45)"
                                  : items.length > 0
                                    ? "rgba(238,234,227,0.09)"
                                    : "rgba(238,234,227,0.04)"
                            }`,
                            bgcolor: !cell.inMonth
                              ? "rgba(10,11,14,0.45)"
                              : isSel
                                ? "rgba(142,180,196,0.07)"
                                : today
                                  ? "rgba(200,122,122,0.05)"
                                  : items.length > 0
                                    ? "#111216"
                                    : "#0d0e12",
                            opacity: cell.inMonth ? 1 : 0.4,
                            cursor: items.length ? "pointer" : "default",
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.5,
                            transition: "border-color 0.12s ease, background-color 0.12s ease",
                            "&:hover": items.length
                              ? {
                                  borderColor: C.accent,
                                  bgcolor: "rgba(142,180,196,0.05)",
                                }
                              : {},
                          }}
                        >
                          {/* Day number + count badge */}
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.25 }}>
                            <Typography
                              sx={{
                                fontFamily: MONO,
                                fontSize: 11.5,
                                fontWeight: today || isSel ? 700 : 500,
                                color: today
                                  ? C.bad
                                  : isSel
                                    ? C.accent
                                    : cell.inMonth
                                      ? C.text
                                      : C.muted,
                              }}
                            >
                              {String(cell.date.getDate()).padStart(2, "0")}
                            </Typography>

                            {items.length > 0 && (
                              <Box
                                sx={{
                                  px: 0.65,
                                  py: "1px",
                                  borderRadius: 0.75,
                                  bgcolor: isSel ? "rgba(142,180,196,0.2)" : "rgba(255,255,255,0.05)",
                                  fontFamily: MONO,
                                  fontSize: 9.5,
                                  fontWeight: 600,
                                  color: isSel ? C.accent : C.muted,
                                }}
                              >
                                {items.length}
                              </Box>
                            )}
                          </Box>

                          {/* Company Ticker Chips */}
                          {items.slice(0, MAX_CHIPS).map((r) => {
                            const ts = TREND_STYLE[r.earnings_trend || "?"] || TREND_STYLE["?"];
                            return (
                              <Tooltip
                                key={r.symbol}
                                title={`${r.name || r.symbol}${r.market_cap_cr ? ` · ${fmtCr(r.market_cap_cr)}` : ""}`}
                                placement="top"
                                arrow
                              >
                                <Box
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenStock?.(r.symbol);
                                  }}
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.6,
                                    px: 0.7,
                                    py: "2.5px",
                                    borderRadius: 0.85,
                                    bgcolor: "rgba(238,234,227,0.045)",
                                    border: "1px solid rgba(238,234,227,0.05)",
                                    cursor: onOpenStock ? "pointer" : "default",
                                    "&:hover": {
                                      bgcolor: "rgba(142,180,196,0.16)",
                                      borderColor: "rgba(142,180,196,0.3)",
                                    },
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 4.5,
                                      height: 4.5,
                                      borderRadius: "50%",
                                      bgcolor: ts.color,
                                      flexShrink: 0,
                                    }}
                                  />
                                  <Typography
                                    sx={{
                                      fontFamily: MONO,
                                      fontSize: 10,
                                      fontWeight: 600,
                                      color: C.text,
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {r.symbol}
                                  </Typography>
                                </Box>
                              </Tooltip>
                            );
                          })}

                          {items.length > MAX_CHIPS && (
                            <Typography
                              sx={{
                                fontFamily: MONO,
                                fontSize: 9.5,
                                color: C.accent,
                                pl: 0.5,
                                mt: "auto",
                              }}
                            >
                              +{items.length - MAX_CHIPS} more
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

          {/* Selected-Day Detail Panel */}
          {selected && selectedRows.length > 0 && (
            <Box
              sx={{
                mt: 3,
                p: { xs: 2, sm: 2.75 },
                borderRadius: 3,
                bgcolor: "#15161b",
                border: `1px solid ${C.line}`,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 1.5,
                  pb: 2,
                  mb: 2.25,
                  borderBottom: `1px solid ${C.line}`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                  <Typography sx={{ fontSize: 16, fontWeight: 600, color: C.text, letterSpacing: "-0.015em" }}>
                    {fmtDateLabel(selected)}
                  </Typography>
                  <RelativeBadge dateStr={selected} />
                  <Typography sx={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>
                    · {selectedRows.length} {selectedRows.length === 1 ? "company" : "companies"} reporting
                  </Typography>
                </Box>

                <TvCopyButton symbols={selectedRows.map((r) => r.symbol)} />
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: 1.5,
                }}
              >
                {selectedRows.map((r) => (
                  <DetailCard key={r.symbol} r={r} onOpenStock={onOpenStock} />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* ════════════════════════════════════════════════
          TIMELINE LIST MODE
         ════════════════════════════════════════════════ */}
      {!loading && rows.length > 0 && mode === "list" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {grouped.map(([dateStr, items]) => (
            <Box
              key={dateStr}
              sx={{
                p: { xs: 2, sm: 2.75 },
                borderRadius: 3,
                bgcolor: "#15161b",
                border: `1px solid ${isToday(dateStr) ? "rgba(200,122,122,0.3)" : C.line}`,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 1.5,
                  pb: 1.75,
                  mb: 2,
                  borderBottom: `1px solid ${C.line}`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                  <Typography sx={{ fontSize: 15.5, fontWeight: 600, color: C.text }}>
                    {fmtDateLabel(dateStr)}
                  </Typography>
                  <RelativeBadge dateStr={dateStr} />
                  <Typography sx={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>
                    · {items.length} {items.length === 1 ? "company" : "companies"}
                  </Typography>
                </Box>

                <TvCopyButton symbols={items.map((r) => r.symbol)} />
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: 1.5,
                }}
              >
                {items.map((r) => (
                  <DetailCard key={r.symbol} r={r} onOpenStock={onOpenStock} />
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
