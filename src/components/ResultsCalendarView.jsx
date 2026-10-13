/**
 * Results Calendar — upcoming quarterly earnings dates.
 *
 * A true month-grid calendar: each day is a box, and the companies reporting
 * on that day sit inside the box as little name chips. Click a day to see the
 * full detail list below, or click a name to open the stock. A List toggle
 * keeps the older date-grouped layout available.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  IconButton,
  InputAdornment,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { C } from "../theme.js";
import { num } from "../format.js";
import { getResultsCalendar } from "../api.js";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June",
                     "July", "August", "September", "October", "November", "December"];

const TREND_STYLE = {
  "↑↑": { color: C.good,   label: "Accelerating", icon: "↑↑" },
  "↑":  { color: C.good,   label: "Growing",      icon: "↑" },
  "→":  { color: "#c4a46a", label: "Flat",         icon: "→" },
  "↓":  { color: C.bad,    label: "Declining",     icon: "↓" },
  "?":  { color: C.muted,  label: "No data",       icon: "?" },
};

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
  if (!iso) return "Unknown";
  const d = new Date(iso + "T00:00:00");
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const TODAY_ISO = isoOf(new Date());
const isToday = (iso) => iso === TODAY_ISO;

function RelativeBadge({ dateStr }) {
  const tom = new Date();
  tom.setDate(tom.getDate() + 1);
  const d = new Date(dateStr + "T00:00:00");
  const diff = (d - new Date(TODAY_ISO + "T00:00:00")) / (1000 * 60 * 60 * 24);
  if (isToday(dateStr)) {
    return <Chip size="small" label="Today"
      sx={{ bgcolor: "rgba(200,122,122,0.15)", color: C.bad, fontWeight: 600, fontSize: 11 }} />;
  }
  if (dateStr === isoOf(tom)) {
    return <Chip size="small" label="Tomorrow"
      sx={{ bgcolor: "rgba(196,164,106,0.12)", color: C.warn, fontWeight: 600, fontSize: 11 }} />;
  }
  if (diff >= 0 && diff < 7) {
    return <Chip size="small" label="This week"
      sx={{ bgcolor: "rgba(142,180,196,0.12)", color: C.accent, fontWeight: 600, fontSize: 11 }} />;
  }
  return null;
}

/** A compact labelled statistic used inside the detail card. */
function Stat({ label, value, color = C.text, tip }) {
  const body = (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 9.5, color: C.muted, letterSpacing: "0.05em", textTransform: "uppercase", lineHeight: 1.4 }}>
        {label}
      </Typography>
      <Typography className="num" sx={{ fontSize: 12.5, fontWeight: 600, color, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {value}
      </Typography>
    </Box>
  );
  return tip ? <Tooltip title={tip} arrow placement="top">{body}</Tooltip> : body;
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
        p: 1.5,
        borderRadius: 1.5,
        border: `1px solid ${C.line}`,
        bgcolor: "rgba(238,234,227,0.025)",
        cursor: onOpenStock ? "pointer" : "default",
        transition: "border-color 0.1s, background 0.1s, transform 0.1s",
        "&:hover": onOpenStock ? {
          borderColor: C.accent,
          bgcolor: "rgba(142,180,196,0.06)",
        } : {},
      }}
    >
      {/* Top: symbol + name, trend badge on the right */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, mb: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>
            {r.symbol}
          </Typography>
          {r.name && (
            <Typography sx={{ fontSize: 11, color: C.muted, lineHeight: 1.35, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {r.name}
            </Typography>
          )}
        </Box>
        <Tooltip title={ts.label} placement="top" arrow>
          <Box sx={{
            display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0,
            px: 0.75, py: "2px", borderRadius: 999,
            bgcolor: `${ts.color}1f`,
          }}>
            <Typography sx={{ fontSize: 13, color: ts.color, fontWeight: 700, lineHeight: 1 }}>{ts.icon}</Typography>
            <Typography sx={{ fontSize: 10, color: ts.color, fontWeight: 600 }}>{ts.label}</Typography>
          </Box>
        </Tooltip>
      </Box>

      {/* Stats grid */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1, mb: r.industry ? 1 : 0 }}>
        <Stat label="Mkt cap" value={fmtCr(r.market_cap_cr) || "—"} color={C.text} />
        <Stat label="P/E" value={r.pe_ttm != null ? `${num(r.pe_ttm, 1)}x` : "—"} color={peColor} />
        <Stat
          label="EPS est"
          value={r.eps_estimate != null ? `₹${num(r.eps_estimate, 1)}` : "—"}
          color={r.eps_estimate != null ? C.accent : C.muted}
          tip={r.eps_estimate != null ? `EPS estimate ₹${num(r.eps_estimate, 2)} (range ${num(r.eps_low, 2)}–${num(r.eps_high, 2)})` : undefined}
        />
        <Stat
          label="Rev est"
          value={r.revenue_estimate_cr != null ? fmtCr(r.revenue_estimate_cr) : "—"}
          color={r.revenue_estimate_cr != null ? C.text : C.muted}
        />
      </Box>

      {/* Industry footer */}
      {r.industry && (
        <Box sx={{ pt: 1, borderTop: `1px solid ${C.line}` }}>
          <Typography sx={{ fontSize: 10.5, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {r.industry}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

const MAX_CHIPS = 4; // names shown inside a day box before "+N more"

export default function ResultsCalendarView({ onOpenStock }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [mode, setMode] = useState("calendar"); // "calendar" | "list"
  const [selected, setSelected] = useState(null); // ISO date selected in grid
  // Month currently shown in the grid: a Date pinned to the 1st at local midnight.
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  useEffect(() => {
    setLoading(true);
    getResultsCalendar(120)
      .then((d) => { setRows(d.rows || []); setError(""); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Filtered rows + a date → rows map.
  const { byDate, totalStocks, dateCount } = useMemo(() => {
    const query = q.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (!query) return true;
      return (
        (r.symbol || "").toLowerCase().includes(query) ||
        (r.name || "").toLowerCase().includes(query) ||
        (r.industry || "").toLowerCase().includes(query)
      );
    });
    const map = {};
    for (const r of filtered) {
      const d = r.earnings_date || "Unknown";
      if (!map[d]) map[d] = [];
      map[d].push(r);
    }
    for (const d of Object.keys(map)) {
      map[d].sort((a, b) => (b.market_cap_cr ?? 0) - (a.market_cap_cr ?? 0));
    }
    return {
      byDate: map,
      totalStocks: filtered.length,
      dateCount: Object.keys(map).filter((d) => d !== "Unknown").length,
    };
  }, [rows, q]);

  // When the data loads (or a search narrows it), jump the grid to the first
  // month that actually has results, so the user isn't staring at an empty grid.
  useEffect(() => {
    const dates = Object.keys(byDate).filter((d) => d !== "Unknown").sort();
    if (!dates.length) return;
    const monthKey = (d) => `${d.getFullYear()}-${d.getMonth()}`;
    const hasCurrentMonth = dates.some(
      (iso) => monthKey(new Date(iso + "T00:00:00")) === monthKey(cursor)
    );
    if (!hasCurrentMonth) {
      const first = new Date(dates[0] + "T00:00:00");
      setCursor(new Date(first.getFullYear(), first.getMonth(), 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byDate]);

  // Build the 6-week grid (always 42 cells for a stable layout).
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
    // Drop a trailing all-out-of-month week if present (keeps it tidy).
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
  };

  // List-mode grouping (the legacy layout).
  const grouped = useMemo(
    () => Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)),
    [byDate]
  );

  const selectedRows = selected ? byDate[selected] || [] : [];

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
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
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
          <ToggleButtonGroup
            size="small"
            exclusive
            value={mode}
            onChange={(_, v) => v && setMode(v)}
            sx={{
              "& .MuiToggleButton-root": {
                px: 1.5, py: 0.5, fontSize: 12.5, color: C.muted,
                borderColor: C.line, textTransform: "none",
                "&.Mui-selected": { color: C.text, bgcolor: "rgba(238,234,227,0.06)" },
              },
            }}
          >
            <ToggleButton value="calendar">Calendar</ToggleButton>
            <ToggleButton value="list">List</ToggleButton>
          </ToggleButtonGroup>
        </Box>
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

      {/* ---------- CALENDAR MODE ---------- */}
      {!loading && rows.length > 0 && mode === "calendar" && (
        <Box>
          {/* Month toolbar */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
            <IconButton size="small" onClick={() => gotoMonth(-1)} sx={{ color: C.muted, border: `1px solid ${C.line}` }}>
              <ChevronLeftRoundedIcon fontSize="small" />
            </IconButton>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: C.text, minWidth: 170, textAlign: "center" }}>
              {MONTHS_LONG[cursor.getMonth()]} {cursor.getFullYear()}
            </Typography>
            <IconButton size="small" onClick={() => gotoMonth(1)} sx={{ color: C.muted, border: `1px solid ${C.line}` }}>
              <ChevronRightRoundedIcon fontSize="small" />
            </IconButton>
            <Chip
              size="small"
              label="Today"
              onClick={gotoToday}
              sx={{ cursor: "pointer", bgcolor: "rgba(238,234,227,0.05)", color: C.text, border: `1px solid ${C.line}` }}
            />
            <Typography sx={{ fontSize: 12.5, color: C.muted, ml: "auto" }}>
              {monthStocks} {monthStocks === 1 ? "stock" : "stocks"} this month
              {q ? ` · ${totalStocks} match search` : ""}
            </Typography>
          </Box>

          {/* Grid wrapper (scrolls horizontally on tiny screens) */}
          <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ minWidth: 680 }}>
              {/* Weekday header */}
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px", mb: "6px" }}>
                {DAYS.map((d) => (
                  <Typography key={d} sx={{
                    fontSize: 11, fontWeight: 600, color: C.muted,
                    textAlign: "center", letterSpacing: "0.04em", textTransform: "uppercase",
                  }}>
                    {d}
                  </Typography>
                ))}
              </Box>

              {/* Weeks */}
              {weeks.map((week, wi) => (
                <Box key={wi} sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px", mb: "6px" }}>
                  {week.map((cell) => {
                    const items = byDate[cell.iso] || [];
                    const today = isToday(cell.iso);
                    const isSel = selected === cell.iso;
                    return (
                      <Box
                        key={cell.iso}
                        onClick={() => items.length && setSelected(isSel ? null : cell.iso)}
                        sx={{
                          minHeight: 104,
                          p: 0.75,
                          borderRadius: 1.5,
                          border: `1px solid ${
                            isSel ? C.accent
                            : today ? "rgba(200,122,122,0.4)"
                            : C.line
                          }`,
                          bgcolor: !cell.inMonth ? "rgba(255,255,255,0.012)"
                            : today ? "rgba(200,122,122,0.06)"
                            : cell.weekend ? "rgba(255,255,255,0.015)"
                            : "rgba(238,234,227,0.025)",
                          opacity: cell.inMonth ? 1 : 0.45,
                          cursor: items.length ? "pointer" : "default",
                          display: "flex", flexDirection: "column", gap: 0.4,
                          transition: "border-color 0.1s, background 0.1s",
                          "&:hover": items.length ? { borderColor: C.accent } : {},
                        }}
                      >
                        {/* Day number */}
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <Typography sx={{
                            fontSize: 12,
                            fontWeight: today ? 700 : 500,
                            color: today ? C.bad : cell.inMonth ? C.text : C.muted,
                          }}>
                            {cell.date.getDate()}
                          </Typography>
                          {items.length > 0 && (
                            <Typography sx={{ fontSize: 10, color: C.muted }}>
                              {items.length}
                            </Typography>
                          )}
                        </Box>

                        {/* Name chips */}
                        {items.slice(0, MAX_CHIPS).map((r) => {
                          const ts = TREND_STYLE[r.earnings_trend || "?"] || TREND_STYLE["?"];
                          return (
                            <Tooltip key={r.symbol} title={r.name || r.symbol} placement="top" arrow>
                              <Box
                                onClick={(e) => { e.stopPropagation(); onOpenStock?.(r.symbol); }}
                                sx={{
                                  display: "flex", alignItems: "center", gap: 0.5,
                                  px: 0.6, py: "2px", borderRadius: 0.75,
                                  bgcolor: "rgba(238,234,227,0.05)",
                                  cursor: onOpenStock ? "pointer" : "default",
                                  "&:hover": { bgcolor: "rgba(142,180,196,0.14)" },
                                }}
                              >
                                <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: ts.color, flexShrink: 0 }} />
                                <Typography sx={{
                                  fontSize: 10.5, fontWeight: 600, color: C.text,
                                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                }}>
                                  {r.symbol}
                                </Typography>
                              </Box>
                            </Tooltip>
                          );
                        })}
                        {items.length > MAX_CHIPS && (
                          <Typography sx={{ fontSize: 10, color: C.accent, pl: 0.6 }}>
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

          {/* Selected-day detail panel */}
          {selected && selectedRows.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Box sx={{
                display: "flex", alignItems: "center", gap: 1.5,
                px: 2, py: 1.25, borderRadius: 1.5, mb: 1,
                bgcolor: "rgba(238,234,227,0.03)", border: `1px solid ${C.line}`,
              }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                  {fmtDateLabel(selected)}
                </Typography>
                <Typography sx={{ fontSize: 12, color: C.muted }}>
                  {selectedRows.length} {selectedRows.length === 1 ? "stock" : "stocks"}
                </Typography>
                <RelativeBadge dateStr={selected} />
              </Box>
              <Box sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 1.25,
              }}>
                {selectedRows.map((r) => (
                  <DetailCard key={r.symbol} r={r} onOpenStock={onOpenStock} />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* ---------- LIST MODE (legacy) ---------- */}
      {!loading && rows.length > 0 && mode === "list" && (
        <Box>
          {totalStocks > 0 && (
            <Typography sx={{ fontSize: 13, color: C.muted, mb: 2 }}>
              {totalStocks} stocks reporting across {dateCount} dates
            </Typography>
          )}
          {grouped.map(([dateStr, items]) => (
            <Box key={dateStr} sx={{ mb: 3 }}>
              <Box sx={{
                display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.25,
                borderRadius: 1.5, mb: 1,
                bgcolor: isToday(dateStr) ? "rgba(200,122,122,0.06)" : "rgba(238,234,227,0.03)",
                border: `1px solid ${isToday(dateStr) ? "rgba(200,122,122,0.15)" : C.line}`,
              }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                  {fmtDateLabel(dateStr)}
                </Typography>
                <Typography sx={{ fontSize: 12, color: C.muted }}>
                  {items.length} {items.length === 1 ? "stock" : "stocks"}
                </Typography>
                <RelativeBadge dateStr={dateStr} />
              </Box>
              <Box sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 1.25,
              }}>
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
