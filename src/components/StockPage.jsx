import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  LinearProgress,
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
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import SearchIcon from "@mui/icons-material/Search";
import KlassChip from "./KlassChip.jsx";
import TvChart from "./TvChart.jsx";
import { HeadCell, TvCopyButton } from "./ui.jsx";
import { BookmarkButton } from "../watchlist.jsx";
import { C } from "../theme.js";
import { fmtDate, num, pct } from "../format.js";
import { M } from "../glossary.js";
import { getStock, getStockNews } from "../api.js";
import { DriverPanel } from "./Driver.jsx";
import DriversCard from "./DriversCard.jsx";

const MONO = '"IBM Plex Mono", ui-monospace, monospace';

const TABLE_SX = {
  "& .MuiTableCell-stickyHeader, & .MuiTableCell-head": {
    bgcolor: "#0e0f12",
    fontFamily: MONO,
    fontSize: 10.5,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    py: 1.25,
  },
};

const PHASE = {
  broke_out: { fg: C.warn, label: "Broke out" },
  potential: { fg: C.good, label: "Potential" },
  coiled: { fg: C.accent, label: "Coiled" },
  near_miss: { fg: C.warn, label: "Near miss" },
  at_high: { fg: C.warn, label: "At the high" },
  momentum: { fg: C.warn, label: "Volume break" },
  watching: { fg: C.muted, label: "Watching" },
};

const TREND = {
  "↑↑": { label: "Accelerating", fg: C.good, bg: "rgba(125,186,150,0.14)", border: "rgba(125,186,150,0.32)" },
  "↑":  { label: "Growing",      fg: C.good, bg: "rgba(125,186,150,0.10)", border: "rgba(125,186,150,0.28)" },
  "→":  { label: "Flat",         fg: C.warn, bg: "rgba(196,164,106,0.10)", border: "rgba(196,164,106,0.28)" },
  "↓":  { label: "Declining",    fg: C.bad,  bg: "rgba(200,122,122,0.10)", border: "rgba(200,122,122,0.28)" },
  "?":  { label: "No data",      fg: C.muted, bg: "rgba(238,234,227,0.04)", border: "rgba(238,234,227,0.12)" },
};

const TONE = {
  good: { fg: C.good, bg: "rgba(125,186,150,0.12)", border: "rgba(125,186,150,0.3)" },
  bad: { fg: C.bad, bg: "rgba(200,122,122,0.12)", border: "rgba(200,122,122,0.3)" },
  warn: { fg: C.warn, bg: "rgba(196,164,106,0.12)", border: "rgba(196,164,106,0.3)" },
  muted: { fg: C.muted, bg: "rgba(238,234,227,0.05)", border: C.line },
};

const IMPORTANCE = {
  high: { fg: C.warn, bg: "rgba(196,164,106,0.12)", border: "rgba(196,164,106,0.32)", label: "KEY" },
  normal: { fg: C.accent, bg: "rgba(142,180,196,0.10)", border: "rgba(142,180,196,0.28)", label: "FILING" },
  low: { fg: C.muted, bg: "rgba(238,234,227,0.04)", border: C.line, label: "ROUTINE" },
};

const SECTIONS = [
  { id: "all", label: "Full Dossier" },
  { id: "chart", label: "Chart & Technicals" },
  { id: "coil", label: "Coil & Sector Gates" },
  { id: "fundamentals", label: "Fundamentals" },
  { id: "drivers", label: "Market Drivers" },
  { id: "filings", label: "Exchange Filings" },
];

function fmtCr(v) {
  if (v == null || Number.isNaN(Number(v))) return "—";
  const n = Number(v);
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L Cr`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K Cr`;
  return `₹${n.toFixed(0)} Cr`;
}

function growthColor(v) {
  if (v == null) return undefined;
  return v > 0.05 ? C.good : v < -0.05 ? C.bad : C.warn;
}

function fp(v, nd = 1, sign = true) {
  if (v == null || Number.isNaN(Number(v))) return "—";
  const n = Number(v) * 100;
  return `${sign && n > 0 ? "+" : ""}${n.toFixed(nd)}%`;
}

function rupee(v) {
  if (v == null) return "—";
  return `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: v < 1000 ? 2 : 0 })}`;
}

function signColor(v) {
  if (v == null) return undefined;
  return v > 0 ? C.good : v < 0 ? C.bad : undefined;
}

function daysBetween(a, b) {
  return Math.round((new Date(a) - new Date(b)) / 86400000);
}

function filingsNear(filings, date) {
  return (filings || []).filter(
    (f) => f.importance !== "low" && daysBetween(date, f.date) >= 0 && daysBetween(date, f.date) <= 1,
  );
}

function PhaseChip({ phase, label }) {
  const p = PHASE[phase] || PHASE.watching;
  return (
    <Box
      component="span"
      sx={{
        px: 0.9,
        py: 0.25,
        borderRadius: 1,
        bgcolor: `${p.fg}16`,
        border: `1px solid ${p.fg}36`,
        color: p.fg,
        fontFamily: MONO,
        fontWeight: 600,
        fontSize: 10.5,
      }}
    >
      {label || p.label}
    </Box>
  );
}

function TonePill({ tone = "muted", children }) {
  const t = TONE[tone] || TONE.muted;
  return (
    <Box
      component="span"
      sx={{
        px: 1,
        py: 0.25,
        borderRadius: 1,
        bgcolor: t.bg,
        border: `1px solid ${t.border}`,
        color: t.fg,
        fontFamily: MONO,
        fontWeight: 600,
        fontSize: 10.5,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Box>
  );
}

function Check({ ok }) {
  if (ok === true) return <CheckCircleRoundedIcon sx={{ fontSize: 16, color: C.good, mt: 0.15, flexShrink: 0 }} />;
  if (ok === null || ok === undefined) {
    return (
      <Box
        component="span"
        sx={{
          width: 14,
          height: 14,
          mt: 0.3,
          borderRadius: "50%",
          border: `1.5px solid ${C.warn}`,
          bgcolor: "rgba(196,164,106,0.12)",
          flexShrink: 0,
        }}
      />
    );
  }
  return <CancelRoundedIcon sx={{ fontSize: 16, color: C.bad, mt: 0.15, flexShrink: 0 }} />;
}

function Metric({ label, k, value, hint, color, size = "normal" }) {
  const entry = (k && M[k]) || {};
  const text = label ?? entry.label ?? k;
  const help = hint ?? entry.help;
  const fontSize = size === "large" ? 18 : 14;

  return (
    <Box
      sx={{
        p: 1.35,
        borderRadius: 1.75,
        bgcolor: "#111216",
        border: `1px solid ${C.line}`,
        minWidth: 0,
      }}
    >
      <Tooltip title={help || ""} placement="top" arrow enterDelay={300}>
        <Typography
          sx={{
            fontFamily: MONO,
            fontSize: 9.75,
            fontWeight: 500,
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            mb: 0.4,
            cursor: help ? "help" : "inherit",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {text}
        </Typography>
      </Tooltip>
      <Typography
        className="num"
        sx={{
          fontFamily: MONO,
          fontSize,
          fontWeight: 600,
          color: color || C.text,
          lineHeight: 1.2,
        }}
      >
        {value ?? "—"}
      </Typography>
    </Box>
  );
}

function Card({ children, highlight, sx }) {
  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2.5,
        bgcolor: highlight ? "rgba(125,186,150,0.05)" : "#15161b",
        border: `1px solid ${highlight ? "rgba(125,186,150,0.22)" : C.line}`,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

function SectionTitle({ icon: Icon, children, sx }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.75, ...sx }}>
      {Icon && <Icon sx={{ fontSize: 17, color: C.accent }} />}
      <Typography
        sx={{
          fontFamily: MONO,
          fontSize: 11,
          fontWeight: 600,
          color: C.text,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}

function StructuredList({ items, color = C.text }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {items.map((s, i) => (
        <Box
          key={i}
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1.25,
          }}
        >
          <Box
            component="span"
            sx={{
              mt: 0.35,
              px: 0.55,
              py: 0.05,
              borderRadius: 0.75,
              bgcolor: "rgba(142,180,196,0.1)",
              border: "1px solid rgba(142,180,196,0.22)",
              fontFamily: MONO,
              fontSize: 9.5,
              fontWeight: 600,
              color: C.accent,
              flexShrink: 0,
            }}
          >
            {String(i + 1).padStart(2, "0")}
          </Box>
          <Typography sx={{ fontSize: 13, lineHeight: 1.55, color }}>
            {s}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function RangeBar({ levels }) {
  const pos = Math.min(1, Math.max(0, levels.range_pos ?? 0));
  return (
    <Box
      sx={{
        p: 1.75,
        borderRadius: 2,
        bgcolor: "#111216",
        border: `1px solid ${C.line}`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", color: C.muted, textTransform: "uppercase" }}>
          52-Week Price Position ({Math.round(pos * 100)}th percentile)
        </Typography>
        <Typography sx={{ fontFamily: MONO, fontSize: 11, color: levels.from_high >= -0.05 ? C.good : C.muted, fontWeight: 600 }}>
          {fp(levels.from_high)} from high
        </Typography>
      </Box>
      <Box sx={{ position: "relative", height: 7, borderRadius: 4, bgcolor: "rgba(238,234,227,0.08)", my: 1.25 }}>
        <Box
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${pos * 100}%`,
            borderRadius: 4,
            background: "linear-gradient(90deg, rgba(200,122,122,0.5), rgba(196,164,106,0.55), rgba(125,186,150,0.7))",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            left: `calc(${pos * 100}% - 5px)`,
            top: -3.5,
            width: 10,
            height: 14,
            borderRadius: 0.75,
            bgcolor: C.text,
            boxShadow: "0 0 0 2px #111216",
          }}
        />
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
        <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>
          Low <Box component="span" sx={{ color: C.text }}>{rupee(levels.low_52w)}</Box> · {fmtDate(levels.low_52w_date)}
        </Typography>
        <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>
          High <Box component="span" sx={{ color: C.text }}>{rupee(levels.high_52w)}</Box> · {fmtDate(levels.high_52w_date)}
        </Typography>
      </Box>
    </Box>
  );
}

function LevelList({ title, rows, color }) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 180,
        p: 1.5,
        borderRadius: 1.75,
        bgcolor: "#111216",
        border: `1px solid ${C.line}`,
      }}
    >
      <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", color: C.muted, mb: 0.85, textTransform: "uppercase" }}>
        {title}
      </Typography>
      {rows.length === 0 ? (
        <Typography sx={{ fontSize: 12, color: C.muted }}>None in the last year</Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.6 }}>
          {rows.map((r) => (
            <Box key={`${r.price}-${r.date}`} sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 1 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 12.75, fontWeight: 600, color }}>{rupee(r.price)}</Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>
                {fp(r.pct)} · {fmtDate(r.date)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

function ChartReadCard({ t, filings, drivers }) {
  const events = t.events || [];
  return (
    <Card sx={{ display: "flex", flexDirection: "column", height: { lg: 520 }, overflow: "hidden" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
        <SectionTitle icon={TimelineRoundedIcon} sx={{ mb: 0 }}>
          Chart Structure &amp; Tape Readout
        </SectionTitle>
        {events.length > 0 && (
          <Box
            component="span"
            sx={{
              px: 0.85,
              py: 0.15,
              borderRadius: 1,
              bgcolor: "#0e0f12",
              border: `1px solid ${C.line}`,
              fontFamily: MONO,
              fontSize: 10,
              color: C.muted,
            }}
          >
            {events.length} MARKED SESSIONS
          </Box>
        )}
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", pr: 0.5, display: "flex", flexDirection: "column", gap: 2 }}>
        {t.story?.length > 0 && (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1.75,
              bgcolor: "#111216",
              border: `1px solid ${C.line}`,
            }}
          >
            <Typography sx={{ fontFamily: MONO, fontSize: 9.75, letterSpacing: "0.1em", color: C.muted, mb: 1, textTransform: "uppercase" }}>
              Structural Observations
            </Typography>
            <StructuredList items={t.story} />
          </Box>
        )}

        {events.length > 0 && (
          <Box>
            <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", color: C.muted, mb: 1, textTransform: "uppercase" }}>
              Notable Sessions · Numbered on Chart
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
              {[...events].reverse().map((e) => {
                const near = filingsNear(filings, e.time);
                return (
                  <Box
                    key={e.time}
                    sx={{
                      p: 1.15,
                      borderRadius: 1.5,
                      bgcolor: "#111216",
                      border: `1px solid ${C.line}`,
                    }}
                  >
                    <Box sx={{ display: "flex", gap: 1, alignItems: "baseline" }}>
                      <Box
                        component="span"
                        sx={{
                          minWidth: 20,
                          textAlign: "center",
                          fontFamily: MONO,
                          fontSize: 10,
                          fontWeight: 700,
                          color: e.up ? C.good : C.bad,
                          bgcolor: e.up ? "rgba(125,186,150,0.12)" : "rgba(200,122,122,0.12)",
                          border: `1px solid ${e.up ? "rgba(125,186,150,0.35)" : "rgba(200,122,122,0.35)"}`,
                          borderRadius: 0.75,
                          px: 0.5,
                          flexShrink: 0,
                        }}
                      >
                        {e.n}
                      </Box>
                      <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.muted, minWidth: 84, flexShrink: 0 }}>
                        {fmtDate(e.time)}
                      </Typography>
                      <Typography sx={{ fontSize: 12.25, color: C.text, lineHeight: 1.45 }}>
                        {e.text}
                      </Typography>
                    </Box>
                    {near.length > 0 && (
                      <Box sx={{ mt: 0.65, pl: 3.5, display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                        <Box
                          component="span"
                          sx={{
                            px: 0.65,
                            py: 0.1,
                            borderRadius: 0.75,
                            bgcolor: "rgba(196,164,106,0.12)",
                            border: "1px solid rgba(196,164,106,0.3)",
                            fontFamily: MONO,
                            fontSize: 9.5,
                            color: C.warn,
                            fontWeight: 600,
                          }}
                        >
                          NSE FILING
                        </Box>
                        <Typography sx={{ fontSize: 11.25, color: C.warn }}>
                          {[...new Set(near.map((f) => f.category))].join(", ")}
                        </Typography>
                      </Box>
                    )}
                    {drivers?.[e.time]?.filings
                      ?.filter((f) => f.fact)
                      .map((f, i) => (
                        <Typography key={i} sx={{ mt: 0.5, pl: 3.5, fontSize: 11.5, color: C.text, lineHeight: 1.45 }}>
                          {f.fact}
                        </Typography>
                      ))}
                    {drivers?.[e.time] && (
                      <Box sx={{ mt: 0.85, pl: 3.5 }}>
                        <DriverPanel driver={drivers[e.time]} compact />
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Box>

      <Typography sx={{ fontSize: 11, color: C.muted, pt: 1.25, mt: 1.25, borderTop: `1px solid ${C.line}`, lineHeight: 1.45 }}>
        Describes historical price and volume only. Swing highs and lows are prior turning points, not forecasts. A likely
        driver is the move type that best fits the price, volume, delivery, peer and filing data on record — a reading,
        not an established cause or a recommendation.
      </Typography>
    </Card>
  );
}

function TechnicalCard({ t }) {
  const a = t.activity || {};
  const r = t.returns || {};
  const tone = TONE[t.trend.tone] || TONE.muted;

  return (
    <Card>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, gap: 1 }}>
        <SectionTitle icon={InsightsRoundedIcon} sx={{ mb: 0 }}>
          Technical Structure &amp; Returns
        </SectionTitle>
        <TonePill tone={t.trend.tone}>{t.trend.label}</TonePill>
      </Box>

      <Typography sx={{ fontSize: 13, color: C.muted, lineHeight: 1.55, mb: 1.75 }}>
        {t.trend.text}
      </Typography>

      {/* Multi-Horizon Return Strip */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1, mb: 2 }}>
        {[
          ["1W", r["1w"]],
          ["1M", r["1m"]],
          ["3M", r["3m"]],
          ["6M", r["6m"]],
          ["1Y", r["1y"]],
        ].map(([k, v]) => (
          <Metric key={k} label={`${k} Return`} value={fp(v)} color={signColor(v)} />
        ))}
      </Box>

      {/* 52-Week Range Bar */}
      <RangeBar levels={t.levels} />

      {/* Support & Resistance Swing Levels */}
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mt: 1.5, mb: 2 }}>
        <LevelList title="Prior swing highs above" rows={t.levels.resistance || []} color={C.bad} />
        <LevelList title="Prior swing lows below" rows={t.levels.support || []} color={C.good} />
      </Box>

      {/* Moving Average Alignment Checks */}
      {t.trend.checks?.length > 0 && (
        <Box
          sx={{
            p: 1.5,
            mb: 2,
            borderRadius: 1.75,
            bgcolor: "#111216",
            border: `1px solid ${C.line}`,
          }}
        >
          <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", color: C.muted, mb: 1, textTransform: "uppercase" }}>
            Moving Average Alignment
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 1 }}>
            {t.trend.checks.map((c) => (
              <Box key={c.label} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Check ok={c.ok} />
                <Typography sx={{ fontSize: 12.25, color: c.ok ? C.text : C.muted, flex: 1 }}>
                  {c.label}
                </Typography>
                {c.value != null && (
                  <Typography sx={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 600, color: signColor(c.value) || tone.fg }}>
                    {fp(c.value)}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Activity & Volatility */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" }, gap: 1.25 }}>
        <Metric
          label="Volume 20d / 50d"
          value={a.vol_20_vs_50 != null ? `${num(a.vol_20_vs_50, 2)}×` : "—"}
          hint="Average volume over the last 20 sessions compared with the last 50."
        />
        <Metric
          label="Up / down volume"
          value={a.up_down_volume != null ? `${num(a.up_down_volume, 2)}×` : "—"}
          color={a.up_down_volume > 1.2 ? C.good : a.up_down_volume < 0.8 ? C.bad : undefined}
          hint="Volume traded on up days divided by volume on down days, last 20 sessions."
        />
        <Metric
          label="Delivery 20d vs 60d"
          value={a.deliv_20 != null ? `${num(a.deliv_20, 0)}% / ${num(a.deliv_60, 0)}%` : "—"}
          hint="Average delivery percentage over the last 20 sessions vs the last 60."
        />
        <Metric
          label="Daily range (ATR)"
          value={a.atr_pct != null ? fp(a.atr_pct, 1, false) : "—"}
          hint="Average true range as a share of price — how much it typically moves in a day."
        />
        <Metric
          label="Volatility"
          value={a.volatility_state || "—"}
          hint="Today's average daily range compared with its own one-year median."
        />
        <Metric label="RSI (14)" value={a.rsi != null ? num(a.rsi, 1) : "—"} hint={a.rsi_text || undefined} />
      </Box>
    </Card>
  );
}

function CoilAndScanCard({ m, filters, passedFilters, totalFilters, coilProgress }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, height: "100%" }}>
      {/* Scan Metrics Card */}
      <Card>
        <SectionTitle icon={ShowChartRoundedIcon}>Scan Metrics · Price &amp; Position</SectionTitle>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" }, gap: 1.25, mb: 2.25 }}>
          <Metric k="adj" value={num(m.adj, 2)} />
          <Metric k="trigger" value={num(m.trigger, 2)} />
          <Metric k="to_trigger" value={pct(m.to_trigger, 1)} color={m.to_trigger <= 3 ? C.good : undefined} />
          <Metric k="pos_hi" value={pct(m.pos_hi, 1)} color={m.pos_hi >= 90 ? C.good : undefined} />
          <Metric k="range20" value={pct(m.range20, 1)} color={m.range20 <= 14 ? C.good : undefined} />
          <Metric label="50 / 200 EMA" value={`${num(m.ema50, 1)} / ${num(m.ema200, 1)}`} />
        </Box>

        <SectionTitle icon={BarChartRoundedIcon}>Volume &amp; Flow</SectionTitle>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" }, gap: 1.25 }}>
          <Metric k="vol_ratio" value={num(m.vol_ratio)} color={m.vol_ratio <= 1 ? C.good : undefined} />
          <Metric k="vol_expand" value={m.vol_expand != null ? `${num(m.vol_expand, 2)}×` : "—"} />
          <Metric k="deliv_pct" value={m.deliv_pct != null ? `${num(m.deliv_pct, 1)}%` : "—"} />
          <Metric k="cmf" value={num(m.cmf)} color={m.cmf > 0 ? C.good : m.cmf < 0 ? C.bad : undefined} />
          <Metric k="coil" value={num(m.coil, 1)} color={m.coil >= 70 ? C.good : undefined} />
          <Metric k="rsi" value={num(m.rsi, 1)} color={m.rsi >= 45 && m.rsi <= 68 ? C.good : undefined} />
        </Box>
      </Card>

      {/* Coil Gate Diagnostics */}
      {filters.length > 0 && (
        <Card sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
            <SectionTitle sx={{ mb: 0 }}>Coil Gate Diagnostics</SectionTitle>
            <Box
              component="span"
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 1,
                bgcolor: passedFilters === totalFilters ? "rgba(125,186,150,0.14)" : "rgba(238,234,227,0.06)",
                border: `1px solid ${passedFilters === totalFilters ? "rgba(125,186,150,0.32)" : C.line}`,
                color: passedFilters === totalFilters ? C.good : C.muted,
                fontFamily: MONO,
                fontWeight: 600,
                fontSize: 10.5,
              }}
            >
              {passedFilters}/{totalFilters} GATES PASSED
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={coilProgress}
            sx={{
              mb: 2,
              height: 4,
              borderRadius: 2,
              bgcolor: "rgba(238,234,227,0.08)",
              "& .MuiLinearProgress-bar": {
                bgcolor: passedFilters === totalFilters ? C.good : C.accent,
                borderRadius: 2,
              },
            }}
          />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, justifyContent: "space-between", flex: 1 }}>
            {filters.map((f) => (
              <Box key={f.id} sx={{ display: "flex", gap: 1.15, alignItems: "flex-start" }}>
                <Check ok={f.ok} />
                <Typography sx={{ fontSize: 12.5, lineHeight: 1.45, color: f.ok ? C.text : C.muted }}>
                  {f.text}
                </Typography>
              </Box>
            ))}
            {m.liquid === false && (
              <Box sx={{ display: "flex", gap: 1.15, alignItems: "flex-start" }}>
                <Check ok={false} />
                <Typography sx={{ fontSize: 12.5, lineHeight: 1.45, color: C.muted }}>
                  Median turnover below liquidity floor — excluded from scan
                </Typography>
              </Box>
            )}
          </Box>
        </Card>
      )}
    </Box>
  );
}

const SECTOR_VERDICT = {
  orderly: { label: "Orderly Pullback", tone: "good" },
  crossing: { label: "Crossing Day", tone: "warn" },
  waiting: { label: "Waiting for Rest", tone: "warn" },
  sellers_won: { label: "Sellers Won", tone: "bad" },
  expand_not_quiet: { label: "Not From Quiet", tone: "bad" },
  no_crossing: { label: "No Recent Crossing", tone: "muted" },
};

function SectorRotationCard({ data, onOpenSector }) {
  const shape = data?.shape;
  if (!shape?.verdict_text && !data?.sector) return null;

  const cross = shape?.crossing;
  const checks = shape?.checks || [];
  const vMeta = SECTOR_VERDICT[shape?.verdict] || SECTOR_VERDICT.no_crossing;

  return (
    <Card>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: checks.length > 0 ? "minmax(0, 1.15fr) minmax(0, 1fr)" : "1fr",
          },
          gap: 2.5,
          alignItems: "stretch",
        }}
      >
        {/* Left: Sector Header + Verdict + Crossing Telemetry */}
        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 1.75 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 1.25 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <SectionTitle icon={TrendingUpRoundedIcon} sx={{ mb: 0 }}>
                  Sector Rotation Context
                </SectionTitle>
                {data.sector_klass && <KlassChip klass={data.sector_klass} />}
                {shape?.verdict && <TonePill tone={vMeta.tone}>{vMeta.label}</TonePill>}
              </Box>

              {data.sector && (
                <Box
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenSector?.(data.sector)}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.6,
                    px: 1.2,
                    py: 0.35,
                    borderRadius: 1.25,
                    bgcolor: "rgba(142,180,196,0.12)",
                    border: "1px solid rgba(142,180,196,0.28)",
                    color: C.accent,
                    fontFamily: MONO,
                    fontWeight: 600,
                    fontSize: 11,
                    cursor: "pointer",
                    "&:hover": { bgcolor: "rgba(142,180,196,0.18)" },
                  }}
                >
                  <span>{data.sector}</span>
                  <OpenInNewRoundedIcon sx={{ fontSize: 12 }} />
                </Box>
              )}
            </Box>

            <Typography sx={{ fontSize: 13.5, lineHeight: 1.6, color: C.text }}>
              {shape?.verdict_text}
            </Typography>

            {data.sector_note && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 1 }}>
                <Typography sx={{ fontFamily: MONO, fontSize: 10, color: C.muted, letterSpacing: "0.08em" }}>
                  SCAN SUMMARY:
                </Typography>
                <Box
                  component="span"
                  sx={{
                    px: 0.85,
                    py: 0.15,
                    borderRadius: 0.75,
                    bgcolor: "#111216",
                    border: `1px solid ${C.line}`,
                    fontFamily: MONO,
                    fontSize: 11,
                    color: C.muted,
                  }}
                >
                  {data.sector_note}
                </Box>
              </Box>
            )}
          </Box>

          {cross && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: 1 }}>
              <Metric
                label="Crossing Date"
                value={fmtDate(cross.date)}
                hint="Most recent session where sector turnover expanded from a quiet base on positive breadth."
              />
              <Metric
                label="Crossing T_rel"
                value={cross.T_rel != null ? `${num(cross.T_rel, 2)}×` : "—"}
                color={cross.T_rel >= 1.3 ? C.good : undefined}
                hint="Sector turnover expansion vs cross-sector median on the crossing day."
              />
              <Metric
                label="Crossing Breadth"
                value={cross.B != null ? `${cross.B > 0 ? "+" : ""}${num(cross.B, 2)}` : "—"}
                color={cross.B >= 0.15 ? C.good : undefined}
                hint="Net advancing minus declining share on the crossing session."
              />
              <Metric
                label="Prior Quiet Base"
                value={cross.quiet_days_prior != null ? `${cross.quiet_days_prior}/5 days` : "—"}
                color={cross.quiet_days_prior >= 3 ? C.good : C.warn}
                hint="Quiet sessions (<1.2× own average turnover) in the 5 days before the crossing."
              />
            </Box>
          )}
        </Box>

        {/* Right: Sector Shape Gate Checks */}
        {checks.length > 0 && (
          <Box
            sx={{
              p: 1.75,
              borderRadius: 1.75,
              bgcolor: "#111216",
              border: `1px solid ${C.line}`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 1.25,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", color: C.muted, textTransform: "uppercase" }}>
                Sector Pullback Verification Gates
              </Typography>
              <Box
                component="span"
                sx={{
                  px: 0.8,
                  py: 0.15,
                  borderRadius: 0.75,
                  bgcolor: shape?.buy_ready ? "rgba(125,186,150,0.12)" : "rgba(238,234,227,0.05)",
                  border: `1px solid ${shape?.buy_ready ? "rgba(125,186,150,0.3)" : C.line}`,
                  fontFamily: MONO,
                  fontSize: 10,
                  fontWeight: 600,
                  color: shape?.buy_ready ? C.good : C.muted,
                }}
              >
                {shape?.buy_ready ? "SECTOR AGREES" : "NOT READY"}
              </Box>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, my: "auto" }}>
              {checks.map((c) => (
                <Box key={c.id} sx={{ display: "flex", gap: 1.15, alignItems: "flex-start" }}>
                  <Check ok={c.ok} />
                  <Typography sx={{ fontSize: 12.5, lineHeight: 1.45, color: c.ok ? C.text : C.muted }}>
                    {c.text}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Card>
  );
}

function NewsCard({ news, loading }) {
  const [showAll, setShowAll] = useState(false);
  const [q, setQ] = useState("");
  const all = news?.filings || [];
  const important = all.filter((f) => f.importance !== "low");
  const hidden = all.length - important.length;

  const filtered = useMemo(() => {
    const base = showAll ? all : important;
    const query = q.trim().toLowerCase();
    if (!query) return base.slice(0, showAll ? 60 : 15);
    return base
      .filter(
        (f) =>
          (f.category || "").toLowerCase().includes(query) ||
          (f.text || f.title || "").toLowerCase().includes(query),
      )
      .slice(0, 60);
  }, [all, important, showAll, q]);

  return (
    <Card sx={{ p: 0, overflow: "hidden" }}>
      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderBottom: `1px solid ${C.line}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Box>
          <SectionTitle icon={ArticleRoundedIcon} sx={{ mb: 0.25 }}>
            Company Disclosures &amp; Exchange Filings
          </SectionTitle>
          <Typography sx={{ fontSize: 12, color: C.muted }}>
            Direct corporate announcements filed with NSE over the last {news?.lookback_days ?? 120} days.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
          {all.length > 0 && (
            <TextField
              size="small"
              placeholder="Filter filings…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              sx={{
                width: { xs: "100%", sm: 180 },
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
          )}

          {all.length > 0 && hidden > 0 && (
            <Box
              sx={{
                display: "inline-flex",
                p: 0.4,
                borderRadius: 1.5,
                bgcolor: "#0c0d10",
                border: `1px solid ${C.line}`,
              }}
            >
              {[
                { id: false, label: `Key Filings (${important.length})` },
                { id: true, label: `All (${all.length})` },
              ].map((opt) => {
                const active = showAll === opt.id;
                return (
                  <Box
                    key={String(opt.id)}
                    role="button"
                    tabIndex={0}
                    onClick={() => setShowAll(opt.id)}
                    sx={{
                      px: 1.25,
                      py: 0.5,
                      borderRadius: 1.1,
                      cursor: "pointer",
                      bgcolor: active ? "#1b1d24" : "transparent",
                      border: active ? "1px solid rgba(238,234,227,0.14)" : "1px solid transparent",
                      fontFamily: MONO,
                      fontSize: 11,
                      fontWeight: active ? 600 : 400,
                      color: active ? C.text : C.muted,
                    }}
                  >
                    {opt.label}
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={{ px: 2.5, py: 2 }}>
        {loading && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 2 }}>
            <CircularProgress size={16} sx={{ color: C.accent }} />
            <Typography sx={{ fontSize: 13, color: C.muted }}>Loading filings from NSE…</Typography>
          </Box>
        )}
        {!loading && news?.error && (
          <Typography sx={{ fontSize: 13, color: C.muted }}>
            NSE filings couldn&apos;t be loaded right now. Try again in a minute.
          </Typography>
        )}
        {!loading && !news?.error && all.length === 0 && (
          <Typography sx={{ fontSize: 13, color: C.muted }}>
            No filings in the last {news?.lookback_days ?? 120} days.
          </Typography>
        )}
        {!loading && !news?.error && all.length > 0 && filtered.length === 0 && (
          <Typography sx={{ fontSize: 13, color: C.muted }}>
            {q
              ? "No filings match your search."
              : `Only routine notices in the last ${news.lookback_days} days. Switch to "All (${all.length})" to view them.`}
          </Typography>
        )}

        <Box sx={{ display: "flex", flexDirection: "column" }}>
          {filtered.map((f, i) => {
            const tone = IMPORTANCE[f.importance] || IMPORTANCE.normal;
            return (
              <Box
                key={`${f.date}-${f.time}-${i}`}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "96px 190px minmax(0, 1fr) auto" },
                  gap: { xs: 0.5, sm: 1.5 },
                  alignItems: "baseline",
                  py: 1.15,
                  borderTop: i === 0 ? "none" : `1px solid ${C.line}`,
                }}
              >
                <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: C.muted }}>
                  {fmtDate(f.date)}
                </Typography>
                <Box>
                  <Box
                    component="span"
                    sx={{
                      px: 0.9,
                      py: 0.2,
                      borderRadius: 1,
                      bgcolor: tone.bg,
                      border: `1px solid ${tone.border}`,
                      color: tone.fg,
                      fontFamily: MONO,
                      fontSize: 10.5,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {f.category}
                  </Box>
                </Box>
                <Typography sx={{ fontSize: 13, color: f.importance === "low" ? C.muted : C.text, lineHeight: 1.55 }}>
                  {f.text || f.title}
                </Typography>
                {f.url ? (
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: C.accent,
                      fontFamily: MONO,
                      fontSize: 11.5,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Filing ↗
                  </a>
                ) : (
                  <span />
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Card>
  );
}

function LimitCard({ denial }) {
  const used = denial?.used || [];
  const limit = denial?.limit ?? 1;
  return (
    <Card sx={{ textAlign: "center", py: 6, px: 3 }}>
      <Box
        sx={{
          width: 52,
          height: 52,
          mx: "auto",
          mb: 2,
          borderRadius: 2,
          bgcolor: "rgba(142,180,196,0.1)",
          border: "1px solid rgba(142,180,196,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LockRoundedIcon sx={{ fontSize: 24, color: C.accent }} />
      </Box>
      <Typography sx={{ fontSize: 17, fontWeight: 600, color: C.text, mb: 1 }}>
        You&apos;ve used today&apos;s free stock lookup
      </Typography>
      <Typography sx={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6, maxWidth: 460, mx: "auto", mb: 2.5 }}>
        Free accounts can open {limit === 1 ? "one stock" : `${limit} stocks`} a day, and reopening it
        is free. The count resets at midnight IST. Pro Desk has unlimited lookups.
      </Typography>
      <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", flexWrap: "wrap" }}>
        <Button
          component={Link}
          to="/pricing"
          variant="contained"
          disableElevation
          sx={{
            bgcolor: C.accent,
            color: C.bg,
            fontWeight: 600,
            textTransform: "none",
            "&:hover": { bgcolor: "#7aa4b4" },
          }}
        >
          See Pro Desk
        </Button>
        {used.map((s) => (
          <Button
            key={s}
            component={Link}
            to={`/stock/${encodeURIComponent(s)}`}
            variant="outlined"
            sx={{
              fontFamily: MONO,
              color: C.text,
              borderColor: C.line,
              textTransform: "none",
            }}
          >
            Reopen {s}
          </Button>
        ))}
      </Box>
    </Card>
  );
}

export default function StockPage({ onOpenSector }) {
  const { symbol: param = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const query = param.trim();
  const entry = new URLSearchParams(location.search).get("entry");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [warming, setWarming] = useState(false);
  const [error, setError] = useState("");
  const [denial, setDenial] = useState(null);
  const [section, setSection] = useState("all");

  useEffect(() => {
    if (data?.symbol && data.symbol === query) return undefined;
    if (!query) return undefined;
    let stop = false;
    let timer = null;
    setLoading(true);
    setError("");
    setDenial(null);
    setData(null);
    const load = () => {
      getStock(query, entry)
        .then((d) => {
          if (stop) return;
          if (d.found === undefined && d.status && d.status !== "ready") {
            setWarming(true);
            timer = setTimeout(load, 4000);
            return;
          }
          setWarming(false);
          setData(d);
          setLoading(false);
          if (d.found && d.symbol && d.symbol !== query) {
            navigate(`/stock/${encodeURIComponent(d.symbol)}${location.search}`, { replace: true });
          }
        })
        .catch((e) => {
          if (stop) return;
          if (e.data?.limit_reached) setDenial(e.data);
          else setError(e.message);
          setWarming(false);
          setLoading(false);
        });
    };
    load();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, entry]);

  const [news, setNews] = useState(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const foundSymbol = data?.found ? data.symbol : null;
  useEffect(() => {
    if (!foundSymbol) return undefined;
    let stop = false;
    setNews(null);
    setNewsLoading(true);
    getStockNews(foundSymbol)
      .then((d) => {
        if (!stop) setNews(d);
      })
      .catch((e) => {
        if (!stop) setNews({ filings: [], error: e.message });
      })
      .finally(() => {
        if (!stop) setNewsLoading(false);
      });
    return () => {
      stop = true;
    };
  }, [foundSymbol]);

  useEffect(() => {
    const prev = document.title;
    document.title = `${data?.symbol || query} · Morrow Desk`;
    return () => {
      document.title = prev;
    };
  }, [data?.symbol, query]);

  const goBack = () => {
    if (location.key !== "default") navigate(-1);
    else navigate("/setups");
  };
  const onLookup = (sym) => navigate(`/stock/${encodeURIComponent(sym)}`);

  const m = data?.metrics || {};
  const filters = data?.filters || [];
  const passedFilters = filters.filter((f) => f.ok).length;
  const totalFilters = filters.length;
  const coilProgress = totalFilters > 0 ? (passedFilters / totalFilters) * 100 : 0;
  const lookups = data?.lookups;
  const f = data?.fundamentals;

  const tech = useMemo(() => {
    const t = data?.technicals;
    if (!t) return null;
    return { ...t, events: (t.events || []).map((e, i) => ({ ...e, n: i + 1 })) };
  }, [data?.technicals]);

  const chartMarkers = useMemo(
    () =>
      (tech?.events || []).map((e) => ({
        time: e.time,
        position: e.up ? "belowBar" : "aboveBar",
        color: e.up ? "#7dba96" : "#e57373",
        shape: e.up ? "arrowUp" : "arrowDown",
        text: String(e.n),
      })),
    [tech],
  );

  const chartLevels = useMemo(() => {
    const lv = tech?.levels;
    if (!lv) return [];
    const out = [
      { price: lv.high_52w, label: "52W high", color: "rgba(238,234,227,0.35)" },
      { price: lv.low_52w, label: "52W low", color: "rgba(238,234,227,0.35)" },
    ];
    if (lv.resistance?.[0]) {
      out.push({ price: lv.resistance[0].price, label: "Swing high", color: "rgba(229,115,115,0.6)" });
    }
    if (lv.support?.[0]) {
      out.push({ price: lv.support[0].price, label: "Swing low", color: "rgba(125,186,150,0.6)" });
    }
    return out;
  }, [tech]);

  return (
    <Box sx={{ pb: 6 }}>
      {/* Architectural Top Dossier Header Card */}
      <Box
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 2.5,
          borderRadius: 2.5,
          border: `1px solid ${C.line}`,
          bgcolor: "#15161b",
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
          {/* Left: Back button + Symbol + Price + Status Badges */}
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.75, minWidth: 0 }}>
            <IconButton
              onClick={goBack}
              size="small"
              aria-label="Back"
              sx={{
                mt: 0.4,
                color: C.muted,
                bgcolor: "#0e0f12",
                border: `1px solid ${C.line}`,
                borderRadius: 1.5,
                p: 0.75,
                "&:hover": { color: C.text, borderColor: C.accent },
              }}
            >
              <ArrowBackRoundedIcon fontSize="small" />
            </IconButton>

            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.4 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: C.accent }} />
                <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", color: C.accent }}>
                  EQUITY DOSSIER · NSE:{data?.symbol || query.toUpperCase()}
                </Typography>
                {data?.as_of && (
                  <Typography sx={{ fontFamily: MONO, fontSize: 10, color: C.muted }}>
                    · AS OF {fmtDate(data.as_of)}
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, flexWrap: "wrap" }}>
                <Typography
                  variant="h1"
                  sx={{
                    fontFamily: MONO,
                    fontSize: { xs: 22, sm: 26 },
                    fontWeight: 700,
                    color: C.text,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.15,
                  }}
                >
                  {data?.symbol || query.toUpperCase()}
                </Typography>
                {m.adj != null && (
                  <Typography sx={{ fontFamily: MONO, fontSize: { xs: 18, sm: 21 }, fontWeight: 600, color: C.text }}>
                    ₹{num(m.adj, 2)}
                  </Typography>
                )}
                {tech?.returns?.["1w"] != null && (
                  <Typography
                    sx={{
                      fontFamily: MONO,
                      fontSize: 12,
                      fontWeight: 600,
                      color: signColor(tech.returns["1w"]) || C.muted,
                    }}
                  >
                    1W {fp(tech.returns["1w"])}
                  </Typography>
                )}
                {tech?.returns?.["1y"] != null && (
                  <Typography
                    sx={{
                      fontFamily: MONO,
                      fontSize: 12,
                      fontWeight: 600,
                      color: signColor(tech.returns["1y"]) || C.muted,
                    }}
                  >
                    1Y {fp(tech.returns["1y"])}
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 0.85, flexWrap: "wrap", mt: 0.85 }}>
                {data?.found && <PhaseChip phase={data.phase} label={data.phase_label} />}
                {tech?.trend?.label && <TonePill tone={tech.trend.tone}>{tech.trend.label}</TonePill>}
                {data?.sector_klass && <KlassChip klass={data.sector_klass} />}
                {data?.sector && (
                  <Box
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenSector?.(data.sector)}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.5,
                      px: 1,
                      py: 0.2,
                      borderRadius: 1,
                      bgcolor: "rgba(255,255,255,0.03)",
                      border: `1px solid ${C.line}`,
                      color: C.text,
                      fontSize: 11.5,
                      fontWeight: 500,
                      cursor: "pointer",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.06)", borderColor: C.accent },
                    }}
                  >
                    <span>{data.sector}</span>
                    <OpenInNewRoundedIcon sx={{ fontSize: 12, color: C.muted }} />
                  </Box>
                )}
                {f?.industry && f.industry !== data?.sector && (
                  <Typography sx={{ fontSize: 11.5, color: C.muted }}>
                    · {f.industry}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          {/* Right: Section Switcher + TV Copy + Bookmark */}
          {data?.found && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", flexShrink: 0 }}>
              <Box
                sx={{
                  display: "inline-flex",
                  flexWrap: "wrap",
                  gap: 0.4,
                  p: 0.45,
                  borderRadius: 1.75,
                  bgcolor: "#0c0d10",
                  border: `1px solid ${C.line}`,
                }}
              >
                {SECTIONS.map((s) => {
                  const active = section === s.id;
                  return (
                    <Box
                      key={s.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSection(s.id)}
                      sx={{
                        px: 1.25,
                        py: 0.55,
                        borderRadius: 1.25,
                        cursor: "pointer",
                        bgcolor: active ? "#1b1d24" : "transparent",
                        border: active ? "1px solid rgba(238,234,227,0.14)" : "1px solid transparent",
                        fontSize: 12,
                        fontWeight: active ? 600 : 400,
                        color: active ? C.text : C.muted,
                        transition: "all 0.15s ease",
                        "&:hover": {
                          bgcolor: active ? "#1b1d24" : "rgba(255,255,255,0.03)",
                        },
                      }}
                    >
                      {s.label}
                    </Box>
                  );
                })}
              </Box>

              {data?.symbol && <TvCopyButton symbols={[data.symbol]} label="Copy TV" />}
              {data?.symbol && <BookmarkButton symbol={data.symbol} size="medium" />}
            </Box>
          )}
        </Box>

        {/* Compact Single-Line Telemetry Strip */}
        {data?.found && (
          <Box
            sx={{
              mt: 1.75,
              pt: 1.4,
              borderTop: `1px solid ${C.line}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.65 }}>
                <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>BREAKOUT TRIGGER:</Typography>
                <Typography sx={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: C.text }}>
                  {m.trigger != null ? `₹${num(m.trigger, 2)}` : "—"}
                </Typography>
                {m.to_trigger != null && (
                  <Typography
                    sx={{
                      fontFamily: MONO,
                      fontSize: 11.5,
                      color: m.to_trigger <= 3 ? C.good : C.muted,
                      fontWeight: m.to_trigger <= 3 ? 600 : 400,
                    }}
                  >
                    ({pct(m.to_trigger, 1)} away)
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.65 }}>
                <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>COIL GATES:</Typography>
                <Typography
                  sx={{
                    fontFamily: MONO,
                    fontSize: 13,
                    fontWeight: 600,
                    color: passedFilters === totalFilters && totalFilters > 0 ? C.good : C.text,
                  }}
                >
                  {passedFilters}/{totalFilters}
                </Typography>
                {m.coil != null && (
                  <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: C.muted }}>
                    (score {num(m.coil, 1)})
                  </Typography>
                )}
              </Box>

              {tech?.levels?.from_high != null && (
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.65 }}>
                  <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>52W HIGH:</Typography>
                  <Typography sx={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: C.text }}>
                    {rupee(tech.levels.high_52w)}
                  </Typography>
                  <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: C.muted }}>
                    ({fp(tech.levels.from_high)})
                  </Typography>
                </Box>
              )}

              {f?.market_cap_cr != null && (
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.65 }}>
                  <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>MCAP / PE:</Typography>
                  <Typography sx={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: C.text }}>
                    {fmtCr(f.market_cap_cr)}
                  </Typography>
                  <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: C.muted }}>
                    · {f.pe_ttm != null ? `${num(f.pe_ttm, 1)}×` : "—"}
                  </Typography>
                </Box>
              )}
            </Box>

            {lookups && !lookups.unlimited && (
              <Box
                sx={{
                  px: 1.1,
                  py: 0.3,
                  borderRadius: 1,
                  bgcolor: "#0e0f12",
                  border: `1px solid ${C.line}`,
                  fontFamily: MONO,
                  fontSize: 10.5,
                  color: C.muted,
                }}
              >
                FREE LOOKUPS: {lookups.used.length}/{lookups.limit} TODAY ·{" "}
                <Link to="/pricing" style={{ color: C.accent, textDecoration: "none" }}>
                  PRO UNLIMITED ↗
                </Link>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Main Content */}
      <Box>
        {loading && (
          <Card sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, py: 6 }}>
            <CircularProgress size={22} sx={{ color: C.accent }} />
            <Typography sx={{ fontSize: 13.75, color: C.muted }}>
              {warming
                ? "The server is still loading market data — this page will fill in shortly…"
                : "Reading equity dossier…"}
            </Typography>
          </Card>
        )}

        {!loading && denial && <LimitCard denial={denial} />}

        {!loading && error && (
          <Card>
            <Typography sx={{ fontSize: 14, color: C.bad }}>{error}</Typography>
          </Card>
        )}

        {!loading && data?.found === false && (
          <Card>
            <Typography sx={{ fontSize: 15, mb: 1.25 }}>
              No match for &ldquo;{data.query}&rdquo;.
            </Typography>
            {data.near?.length > 0 && (
              <>
                <Typography color="text.secondary" sx={{ fontSize: 13.5, mb: 1 }}>
                  Did you mean:
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {data.near.map((n) => (
                    <Box
                      key={n.symbol}
                      role="button"
                      tabIndex={0}
                      onClick={() => onLookup?.(n.symbol)}
                      sx={{
                        px: 1.25,
                        py: 0.6,
                        borderRadius: 1.25,
                        bgcolor: "#111216",
                        border: `1px solid ${C.line}`,
                        fontFamily: MONO,
                        fontSize: 12.5,
                        color: C.text,
                        cursor: "pointer",
                        "&:hover": { borderColor: C.accent, color: C.accent },
                      }}
                    >
                      {n.symbol}
                      {n.sector ? ` · ${n.sector}` : ""}
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Card>
        )}

        {!loading && data?.found && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {/* Unified Executive Diagnostic Strip (Scan Verdict + Technical Snapshot) */}
            {(data.why || tech?.summary?.length > 0) && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    lg: data.why && tech?.summary?.length > 0 ? "minmax(0, 1fr) minmax(0, 1.2fr)" : "1fr",
                  },
                  gap: 2,
                }}
              >
                {data.why && (
                  <Card sx={{ py: 2, px: 2.25, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <Box>
                      <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: C.accent, mb: 0.6 }}>
                        SCAN PIPELINE DIAGNOSTIC
                      </Typography>
                      <Typography sx={{ fontSize: 13.5, lineHeight: 1.6, color: C.text }}>
                        {data.why}
                      </Typography>
                    </Box>
                    {data.flags?.length > 0 && (
                      <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.good, mt: 1.25 }}>
                        Flagged as setup on: {data.flags.map((fl) => fmtDate(fl.as_of)).join(", ")}
                      </Typography>
                    )}
                  </Card>
                )}

                {tech?.summary?.length > 0 && (
                  <Card sx={{ py: 2, px: 2.25 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1, gap: 1 }}>
                      <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: C.muted }}>
                        TECHNICAL SNAPSHOT
                      </Typography>
                      <TonePill tone={tech.trend.tone}>{tech.trend.label}</TonePill>
                    </Box>
                    <StructuredList items={tech.summary} />
                  </Card>
                )}
              </Box>
            )}

            {/* Row 1: Candlestick Chart + Annotated Tape Readout */}
            {(section === "all" || section === "chart") && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", lg: tech ? "minmax(0, 1.85fr) minmax(0, 1fr)" : "1fr" },
                  gap: 2.5,
                  alignItems: "start",
                }}
              >
                <TvChart
                  symbol={data.symbol}
                  height={520}
                  markers={chartMarkers}
                  levels={chartLevels}
                  showLegend
                />
                {tech && <ChartReadCard t={tech} filings={news?.filings} drivers={news?.event_drivers} />}
              </Box>
            )}

            {/* Row 2: Technical Structure & Coil / Scan Diagnostics */}
            {(section === "all" || section === "chart" || section === "coil") && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    lg: section === "all" && tech ? "repeat(2, minmax(0, 1fr))" : "1fr",
                  },
                  gap: 2.5,
                  alignItems: "stretch",
                }}
              >
                {(section === "all" || section === "chart") && tech && <TechnicalCard t={tech} />}
                {(section === "all" || section === "coil") && (
                  <CoilAndScanCard
                    m={m}
                    filters={filters}
                    passedFilters={passedFilters}
                    totalFilters={totalFilters}
                    coilProgress={coilProgress}
                  />
                )}
              </Box>
            )}

            {/* Row 2.5: Dedicated Full-Width Sector Rotation Context */}
            {(section === "all" || section === "coil") && data.shape?.verdict_text && (
              <SectorRotationCard data={data} onOpenSector={onOpenSector} />
            )}

            {/* Row 3: Fundamentals & Recent Session History */}
            {(section === "all" || section === "fundamentals" || section === "coil") && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    lg:
                      section === "all" && f?.market_cap_cr != null && data.history?.length > 0
                        ? "minmax(0, 1.3fr) minmax(0, 1fr)"
                        : "1fr",
                  },
                  gap: 2.5,
                  alignItems: "start",
                }}
              >
                {/* Fundamentals Card */}
                {(section === "all" || section === "fundamentals") &&
                  f &&
                  f.market_cap_cr != null &&
                  (() => {
                    const t = TREND[f.earnings_trend] || TREND["?"];
                    return (
                      <Card>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.75 }}>
                          <SectionTitle icon={AccountBalanceRoundedIcon} sx={{ mb: 0 }}>
                            Company Fundamentals &amp; Quarterly Trajectory
                          </SectionTitle>
                          <Box
                            component="span"
                            sx={{
                              px: 1,
                              py: 0.25,
                              borderRadius: 1,
                              bgcolor: t.bg,
                              border: `1px solid ${t.border}`,
                              color: t.fg,
                              fontFamily: MONO,
                              fontWeight: 600,
                              fontSize: 11,
                            }}
                          >
                            {f.earnings_trend || "?"} · {t.label}
                          </Box>
                        </Box>

                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: 1.25, mb: 1.25 }}>
                          <Metric label="Market Cap" value={fmtCr(f.market_cap_cr)} />
                          <Metric
                            label="PE (TTM)"
                            value={f.pe_ttm != null ? num(f.pe_ttm, 1) : "—"}
                            color={f.pe_ttm > 0 && f.pe_ttm < 25 ? C.good : f.pe_ttm > 50 ? C.bad : undefined}
                          />
                          <Metric
                            label="Promoter %"
                            value={f.promoter_pct != null ? `${num(f.promoter_pct, 1)}%` : "—"}
                            color={f.promoter_pct >= 50 ? C.good : f.promoter_pct < 30 ? C.bad : undefined}
                          />
                          <Metric
                            label="OPM"
                            value={f.latest_opm_pct != null ? `${num(f.latest_opm_pct, 1)}%` : "—"}
                            color={f.latest_opm_pct > 15 ? C.good : f.latest_opm_pct < 5 ? C.bad : undefined}
                          />
                        </Box>

                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: 1.25, mb: 2 }}>
                          <Metric label="TTM Revenue" value={fmtCr(f.ttm_revenue_cr)} />
                          <Metric label="TTM PAT" value={fmtCr(f.ttm_pat_cr)} />
                          <Metric
                            label="Rev Growth YoY"
                            value={f.latest_revenue_growth_yoy != null ? pct(f.latest_revenue_growth_yoy) : "—"}
                            color={growthColor(f.latest_revenue_growth_yoy)}
                          />
                          <Metric
                            label="PAT Growth YoY"
                            value={f.latest_pat_growth_yoy != null ? pct(f.latest_pat_growth_yoy) : "—"}
                            color={growthColor(f.latest_pat_growth_yoy)}
                          />
                        </Box>

                        {f.quarters?.length > 0 && (
                          <Box
                            sx={{
                              borderRadius: 1.75,
                              border: `1px solid ${C.line}`,
                              overflow: "hidden",
                            }}
                          >
                            <TableContainer sx={{ overflowX: "auto" }}>
                              <Table size="small" sx={{ minWidth: 380, ...TABLE_SX }}>
                                <TableHead>
                                  <TableRow>
                                    <HeadCell label="Quarter" />
                                    <HeadCell label="Revenue" align="right" />
                                    <HeadCell label="PAT" align="right" />
                                    <HeadCell label="OPM %" align="right" />
                                    <HeadCell label="EPS" align="right" />
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {f.quarters.slice(0, 6).map((q) => (
                                    <TableRow key={q.quarter} hover sx={{ "&:last-child td": { border: 0 } }}>
                                      <TableCell sx={{ fontFamily: MONO, fontSize: 12, py: 0.85, fontWeight: 500 }}>
                                        {q.quarter}
                                      </TableCell>
                                      <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, py: 0.85 }}>
                                        {fmtCr(q.revenue_cr)}
                                      </TableCell>
                                      <TableCell
                                        align="right"
                                        className="num"
                                        sx={{
                                          fontFamily: MONO,
                                          fontSize: 12,
                                          py: 0.85,
                                          color: q.pat_cr > 0 ? C.good : q.pat_cr < 0 ? C.bad : undefined,
                                        }}
                                      >
                                        {fmtCr(q.pat_cr)}
                                      </TableCell>
                                      <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, py: 0.85 }}>
                                        {q.opm_pct != null ? `${num(q.opm_pct, 1)}%` : "—"}
                                      </TableCell>
                                      <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, py: 0.85 }}>
                                        {q.eps_basic != null ? num(q.eps_basic, 2) : "—"}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        )}

                        {f.industry && (
                          <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.muted, mt: 1.5 }}>
                            {f.industry}
                            {f.updated_at ? ` · Updated ${fmtDate(f.updated_at?.slice(0, 10))}` : ""}
                          </Typography>
                        )}
                      </Card>
                    );
                  })()}

                {/* Last 10 Sessions Table */}
                {(section === "all" || section === "coil") && data.history?.length > 0 && (
                  <Card sx={{ p: 0, overflow: "hidden" }}>
                    <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${C.line}` }}>
                      <Typography
                        sx={{
                          fontFamily: MONO,
                          fontSize: 11,
                          fontWeight: 600,
                          color: C.text,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}
                      >
                        Last {Math.min(10, data.history.length)} Sessions · EOD Tape
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: C.muted, mt: 0.35 }}>
                        Recent closing prices, distance to 4-month high, dry-up volume ratio, and money flow.
                      </Typography>
                    </Box>
                    <TableContainer sx={{ overflowX: "auto" }}>
                      <Table size="small" sx={{ minWidth: 420, ...TABLE_SX }}>
                        <TableHead>
                          <TableRow>
                            <HeadCell label="Date" />
                            <HeadCell k="close" align="right" />
                            <HeadCell k="pos_hi" align="right" />
                            <HeadCell k="vol_ratio" align="right" />
                            <HeadCell k="cmf" align="right" />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {[...(data.history || [])].reverse().slice(0, 10).map((r) => (
                            <TableRow key={r.date} hover sx={{ "&:last-child td": { border: 0 } }}>
                              <TableCell sx={{ fontFamily: MONO, fontSize: 12, py: 1 }}>{fmtDate(r.date)}</TableCell>
                              <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, py: 1 }}>
                                {num(r.adj ?? r.close, 2)}
                              </TableCell>
                              <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, py: 1 }}>
                                {pct(r.pos_hi, 1)}
                              </TableCell>
                              <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, py: 1 }}>
                                {num(r.vol_ratio)}
                              </TableCell>
                              <TableCell
                                align="right"
                                className="num"
                                sx={{
                                  fontFamily: MONO,
                                  fontSize: 12,
                                  py: 1,
                                  color: r.cmf > 0 ? C.good : r.cmf < 0 ? C.bad : C.muted,
                                }}
                              >
                                {num(r.cmf)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Card>
                )}
              </Box>
            )}

            {(section === "all" || section === "drivers") && foundSymbol && (
              <DriversCard symbol={foundSymbol} hideEmpty={section === "all"} />
            )}

            {/* Row 4: NSE Corporate Filings & Disclosures */}
            {(section === "all" || section === "filings") && (
              <NewsCard news={news} loading={newsLoading} />
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
