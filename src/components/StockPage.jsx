import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  IconButton,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
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
import KlassChip from "./KlassChip.jsx";
import TvChart from "./TvChart.jsx";
import { HeadCell } from "./ui.jsx";
import { BookmarkButton } from "../watchlist.jsx";
import { C } from "../theme.js";
import { fmtDate, num, pct } from "../format.js";
import { M } from "../glossary.js";
import { getStock } from "../api.js";

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

function Check({ ok }) {
  if (ok) return <CheckCircleRoundedIcon sx={{ fontSize: 17, color: C.good, mt: 0.15 }} />;
  return <CancelRoundedIcon sx={{ fontSize: 17, color: C.bad, mt: 0.15 }} />;
}

function Metric({ label, k, value, hint, color, size = "normal" }) {
  const entry = (k && M[k]) || {};
  const text = label ?? entry.label ?? k;
  const help = hint ?? entry.help;
  const fontSize = size === "large" ? 19 : 14.5;

  return (
    <Box
      sx={{
        p: 1.5,
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
            fontSize: 10,
            fontWeight: 500,
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            mb: 0.5,
            cursor: help ? "help" : "inherit",
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

function SectionTitle({ icon: Icon, children }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.75 }}>
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

const TONE = {
  good: { fg: C.good, bg: "rgba(125,186,150,0.12)", border: "rgba(125,186,150,0.3)" },
  bad: { fg: C.bad, bg: "rgba(200,122,122,0.12)", border: "rgba(200,122,122,0.3)" },
  warn: { fg: C.warn, bg: "rgba(196,164,106,0.12)", border: "rgba(196,164,106,0.3)" },
  muted: { fg: C.muted, bg: "rgba(238,234,227,0.05)", border: C.line },
};

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
        fontSize: 11,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Box>
  );
}

function Bullets({ items, color = C.text }) {
  return (
    <Box component="ul" sx={{ m: 0, pl: 2.25, display: "flex", flexDirection: "column", gap: 0.9 }}>
      {items.map((s, i) => (
        <Typography component="li" key={i} sx={{ fontSize: 13.5, lineHeight: 1.6, color }}>
          {s}
        </Typography>
      ))}
    </Box>
  );
}

function RangeBar({ levels }) {
  const pos = Math.min(1, Math.max(0, levels.range_pos ?? 0));
  return (
    <Box>
      <Box sx={{ position: "relative", height: 8, borderRadius: 4, bgcolor: "rgba(238,234,227,0.08)", my: 1.25 }}>
        <Box
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${pos * 100}%`,
            borderRadius: 4,
            background: "linear-gradient(90deg, rgba(200,122,122,0.5), rgba(196,164,106,0.5), rgba(125,186,150,0.6))",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            left: `calc(${pos * 100}% - 6px)`,
            top: -3,
            width: 12,
            height: 14,
            borderRadius: 1,
            bgcolor: C.text,
          }}
        />
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: C.muted }}>
          Low {rupee(levels.low_52w)} · {fmtDate(levels.low_52w_date)}
        </Typography>
        <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: C.muted }}>
          High {rupee(levels.high_52w)} · {fmtDate(levels.high_52w_date)}
        </Typography>
      </Box>
    </Box>
  );
}

function LevelList({ title, rows, color }) {
  return (
    <Box sx={{ flex: 1, minWidth: 180 }}>
      <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", color: C.muted, mb: 0.75, textTransform: "uppercase" }}>
        {title}
      </Typography>
      {rows.length === 0 && (
        <Typography sx={{ fontSize: 12.5, color: C.muted }}>None in the last year</Typography>
      )}
      {rows.map((r) => (
        <Box key={`${r.price}-${r.date}`} sx={{ display: "flex", justifyContent: "space-between", gap: 1, py: 0.4 }}>
          <Typography sx={{ fontFamily: MONO, fontSize: 13, color }}>{rupee(r.price)}</Typography>
          <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: C.muted }}>
            {fp(r.pct)} · {fmtDate(r.date)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function TechnicalCard({ t }) {
  const a = t.activity || {};
  const r = t.returns || {};
  const tone = TONE[t.trend.tone] || TONE.muted;
  return (
    <Card>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.75, gap: 1 }}>
        <SectionTitle icon={InsightsRoundedIcon}>Technical Analysis</SectionTitle>
        <TonePill tone={t.trend.tone}>{t.trend.label}</TonePill>
      </Box>

      <Typography sx={{ fontSize: 13.25, color: C.muted, lineHeight: 1.6, mb: 1.5 }}>{t.trend.text}</Typography>
      {t.trend.checks?.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8, mb: 2.5 }}>
          {t.trend.checks.map((c) => (
            <Box key={c.label} sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
              <Check ok={c.ok} />
              <Typography sx={{ fontSize: 12.75, lineHeight: 1.5, color: c.ok ? C.text : C.muted, flex: 1 }}>
                {c.label}
              </Typography>
              {c.value != null && (
                <Typography sx={{ fontFamily: MONO, fontSize: 12, color: signColor(c.value) || tone.fg }}>
                  {fp(c.value)}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}

      <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", color: C.muted, textTransform: "uppercase" }}>
        52-week range · {fp(t.levels.from_high)} from high
      </Typography>
      <RangeBar levels={t.levels} />

      <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", mt: 2.25, mb: 2.5 }}>
        <LevelList title="Prior swing highs above" rows={t.levels.resistance || []} color={C.bad} />
        <LevelList title="Prior swing lows below" rows={t.levels.support || []} color={C.good} />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1, mb: 1.5 }}>
        {[["1W", r["1w"]], ["1M", r["1m"]], ["3M", r["3m"]], ["6M", r["6m"]], ["1Y", r["1y"]]].map(([k, v]) => (
          <Metric key={k} label={k} value={fp(v)} color={signColor(v)} />
        ))}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" }, gap: 1.5 }}>
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

function ChartReadCard({ t }) {
  const events = t.events || [];
  return (
    <Card>
      <SectionTitle icon={TimelineRoundedIcon}>What the chart shows</SectionTitle>
      {t.story?.length > 0 && <Bullets items={t.story} />}
      {events.length > 0 && (
        <>
          <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", color: C.muted, mt: 2.25, mb: 1, textTransform: "uppercase" }}>
            Notable sessions · numbered on the chart
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            {[...events].reverse().map((e) => (
              <Box key={e.time} sx={{ display: "flex", gap: 1.25, alignItems: "baseline" }}>
                <Box
                  component="span"
                  sx={{
                    minWidth: 20,
                    textAlign: "center",
                    fontFamily: MONO,
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: e.up ? C.good : C.bad,
                    border: `1px solid ${e.up ? "rgba(125,186,150,0.4)" : "rgba(200,122,122,0.4)"}`,
                    borderRadius: 0.75,
                    px: 0.5,
                  }}
                >
                  {e.n}
                </Box>
                <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: C.muted, minWidth: 92 }}>
                  {fmtDate(e.time)}
                </Typography>
                <Typography sx={{ fontSize: 12.75, color: C.text, lineHeight: 1.5 }}>{e.text}</Typography>
              </Box>
            ))}
          </Box>
        </>
      )}
      <Typography sx={{ fontSize: 11.5, color: C.muted, mt: 2, lineHeight: 1.55 }}>
        Describes past price and volume only. Swing highs and lows are prior turning points, not forecasts.
      </Typography>
    </Card>
  );
}

function LimitCard({ denial }) {
  const used = denial?.used || [];
  const limit = denial?.limit ?? 1;
  return (
    <Card sx={{ textAlign: "center", py: 5, px: 3 }}>
      <LockRoundedIcon sx={{ fontSize: 30, color: C.accent, mb: 1.5 }} />
      <Typography sx={{ fontSize: 17, fontWeight: 600, color: C.text, mb: 1 }}>
        You&apos;ve used today&apos;s free stock lookup
      </Typography>
      <Typography sx={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6, maxWidth: 460, mx: "auto", mb: 2.5 }}>
        Free accounts can open {limit === 1 ? "one stock" : `${limit} stocks`} a day, and reopening it
        is free. The count resets at midnight IST. Pro has no limit.
      </Typography>
      <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", flexWrap: "wrap" }}>
        <Button component={Link} to="/pricing" variant="contained" disableElevation>
          See Pro
        </Button>
        {used.map((s) => (
          <Button key={s} component={Link} to={`/stock/${encodeURIComponent(s)}`} variant="outlined">
            Open {s} again
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

  useEffect(() => {
    // Already showing this symbol: we just swapped a typed name for the
    // canonical symbol in the URL, so there is nothing new to fetch.
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
          // A cold server answers 202 with its loading status, not a stock.
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
    return () => { stop = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, entry]);

  useEffect(() => {
    const prev = document.title;
    document.title = `${data?.symbol || query} · Morrow Desk`;
    return () => { document.title = prev; };
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

  const tech = useMemo(() => {
    const t = data?.technicals;
    if (!t) return null;
    return { ...t, events: (t.events || []).map((e, i) => ({ ...e, n: i + 1 })) };
  }, [data?.technicals]);

  const chartMarkers = useMemo(
    () => (tech?.events || []).map((e) => ({
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
    if (lv.resistance?.[0]) out.push({ price: lv.resistance[0].price, label: "Swing high", color: "rgba(229,115,115,0.6)" });
    if (lv.support?.[0]) out.push({ price: lv.support[0].price, label: "Swing low", color: "rgba(125,186,150,0.6)" });
    return out;
  }, [tech]);

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          mb: 2.5,
          borderRadius: 2.5,
          border: `1px solid ${C.line}`,
          bgcolor: "#131419",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
          <IconButton onClick={goBack} size="small" sx={{ color: C.muted, mt: 0.25 }} aria-label="Back">
            <ArrowBackRoundedIcon />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", color: C.accent, mb: 0.5 }}>
              EQUITY DOSSIER
            </Typography>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mb: 1 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>
                {data?.symbol || query.toUpperCase()}
              </Typography>
              {m.adj && (
                <Typography sx={{ fontFamily: MONO, fontSize: 18, fontWeight: 500, color: C.muted }}>
                  ₹{num(m.adj, 2)}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              {data?.found && <PhaseChip phase={data.phase} label={data.phase_label} />}
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
                    py: 0.25,
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
              {data?.as_of && (
                <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>
                  As of {fmtDate(data.as_of)}
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
            {data?.symbol && <BookmarkButton symbol={data.symbol} size="medium" />}
          </Box>
        </Box>
      </Box>

      <Box>
        {loading && (
          <Typography color="text.secondary">
            {warming ? "The server is still loading market data — this page will fill in shortly…" : "Reading the name…"}
          </Typography>
        )}

        {!loading && denial && <LimitCard denial={denial} />}

        {!loading && error && (
          <Card>
            <Typography sx={{ fontSize: 14, color: C.bad }}>{error}</Typography>
          </Card>
        )}

        {!loading && lookups && !lookups.unlimited && (
          <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: C.muted, mb: 2 }}>
            Free plan: {lookups.used.length} of {lookups.limit} stock lookup{lookups.limit === 1 ? "" : "s"} used today.
            Reopening {data.symbol} today won&apos;t count again.{" "}
            <Link to="/pricing" style={{ color: C.accent, textDecoration: "none" }}>Pro is unlimited</Link>
          </Typography>
        )}

        {!loading && data?.found === false && (
          <Box sx={{ p: 3, borderRadius: 2.5, bgcolor: "#15161b", border: `1px solid ${C.line}` }}>
            <Typography sx={{ fontSize: 15, mb: 1.25 }}>
              No match for &ldquo;{data.query}&rdquo;.
            </Typography>
            {data.near?.length > 0 && (
              <>
                <Typography color="text.secondary" sx={{ fontSize: 13.5, mb: 1 }}>
                  Did you mean:
                </Typography>
                {data.near.map((n) => (
                  <Typography
                    key={n.symbol}
                    className="linkish"
                    role="button"
                    tabIndex={0}
                    onClick={() => onLookup?.(n.symbol)}
                    sx={{ fontFamily: MONO, fontSize: 13.5, mb: 0.6 }}
                  >
                    {n.symbol}
                    {n.sector ? ` · ${n.sector}` : ""}
                  </Typography>
                ))}
              </>
            )}
          </Box>
        )}

        {!loading && data?.found && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {/* Summary description */}
            {data.why && (
              <Card sx={{ py: 1.75, px: 2.25 }}>
                <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", color: C.muted, mb: 0.4 }}>
                  SCAN DIAGNOSTIC
                </Typography>
                <Typography sx={{ fontSize: 13.5, lineHeight: 1.65, color: C.text }}>
                  {data.why}
                </Typography>
              </Card>
            )}

            {tech?.summary?.length > 0 && (
              <Card>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, gap: 1 }}>
                  <SectionTitle icon={InsightsRoundedIcon}>Technical snapshot</SectionTitle>
                  <TonePill tone={tech.trend.tone}>{tech.trend.label}</TonePill>
                </Box>
                <Bullets items={tech.summary} />
              </Card>
            )}

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: tech ? "minmax(0, 2fr) minmax(0, 1fr)" : "1fr" },
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
              {tech && <ChartReadCard t={tech} />}
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
                gap: 2.5,
                alignItems: "start",
              }}
            >
            {tech && <TechnicalCard t={tech} />}

            {/* Fundamentals Card */}
            {data.fundamentals && data.fundamentals.market_cap_cr != null && (() => {
              const f = data.fundamentals;
              const t = TREND[f.earnings_trend] || TREND["?"];
              return (
                <Card>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.75 }}>
                    <SectionTitle icon={AccountBalanceRoundedIcon}>Fundamentals</SectionTitle>
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

                  {/* Row 1: Headline numbers */}
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: 1.5, mb: 1.5 }}>
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

                  {/* Row 2: TTM + growth */}
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: 1.5, mb: 2 }}>
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

                  {/* Quarterly breakdown mini-table */}
                  {f.quarters?.length > 0 && (
                    <Box
                      sx={{
                        borderRadius: 1.75,
                        border: `1px solid ${C.line}`,
                        overflow: "hidden",
                      }}
                    >
                      <Box sx={{ overflowX: "auto" }}>
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
                              <TableRow key={q.quarter} sx={{ "&:last-child td": { border: 0 } }}>
                                <TableCell sx={{ fontFamily: MONO, fontSize: 12, py: 0.85, fontWeight: 500 }}>{q.quarter}</TableCell>
                                <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, py: 0.85 }}>{fmtCr(q.revenue_cr)}</TableCell>
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
                      </Box>
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
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
                gap: 2.5,
                alignItems: "start",
              }}
            >
            {/* Coil Status Card */}
            {filters.length > 0 && (
              <Card>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.75 }}>
                  <SectionTitle>Coil Gate Diagnostics</SectionTitle>
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
                      fontSize: 11,
                    }}
                  >
                    {passedFilters}/{totalFilters} GATES
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={coilProgress}
                  sx={{
                    mb: 2.25,
                    height: 4,
                    borderRadius: 2,
                    bgcolor: "rgba(238,234,227,0.08)",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: passedFilters === totalFilters ? C.good : C.accent,
                      borderRadius: 2,
                    },
                  }}
                />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.1 }}>
                  {filters.map((f) => (
                    <Box key={f.id} sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
                      <Check ok={f.ok} />
                      <Typography sx={{ fontSize: 12.75, lineHeight: 1.5, color: f.ok ? C.text : C.muted }}>
                        {f.text}
                      </Typography>
                    </Box>
                  ))}
                  {m.liquid === false && (
                    <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
                      <Check ok={false} />
                      <Typography sx={{ fontSize: 12.75, lineHeight: 1.5, color: C.muted }}>
                        Median turnover below liquidity floor — excluded from scan
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Card>
            )}

            {/* Key Metrics */}
            <Card>
              <SectionTitle icon={ShowChartRoundedIcon}>Scan metrics · Price & Position</SectionTitle>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" }, gap: 1.5, mb: 2.75 }}>
                <Metric k="adj" value={num(m.adj, 2)} />
                <Metric k="trigger" value={num(m.trigger, 2)} />
                <Metric k="to_trigger" value={pct(m.to_trigger, 1)} color={m.to_trigger <= 3 ? C.good : undefined} />
                <Metric k="pos_hi" value={pct(m.pos_hi, 1)} color={m.pos_hi >= 90 ? C.good : undefined} />
                <Metric k="range20" value={pct(m.range20, 1)} color={m.range20 <= 14 ? C.good : undefined} />
                <Metric label="50 / 200 EMA" value={`${num(m.ema50, 1)} / ${num(m.ema200, 1)}`} />
              </Box>

              <SectionTitle icon={BarChartRoundedIcon}>Volume & Flow</SectionTitle>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" }, gap: 1.5 }}>
                <Metric k="vol_ratio" value={num(m.vol_ratio)} color={m.vol_ratio <= 1 ? C.good : undefined} />
                <Metric k="vol_expand" value={m.vol_expand != null ? `${num(m.vol_expand, 2)}×` : "—"} />
                <Metric k="deliv_pct" value={m.deliv_pct != null ? `${num(m.deliv_pct, 1)}%` : "—"} />
                <Metric k="cmf" value={num(m.cmf)} color={m.cmf > 0 ? C.good : m.cmf < 0 ? C.bad : undefined} />
                <Metric k="coil" value={num(m.coil, 1)} color={m.coil >= 70 ? C.good : undefined} />
                <Metric k="rsi" value={num(m.rsi, 1)} color={m.rsi >= 45 && m.rsi <= 68 ? C.good : undefined} />
              </Box>
            </Card>
            </Box>

            {/* Sector info */}
            {data.shape?.verdict_text && (
              <Card>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                  <SectionTitle icon={TrendingUpRoundedIcon}>Sector Context</SectionTitle>
                  {data.sector && (
                    <Box
                      role="button"
                      tabIndex={0}
                      onClick={() => onOpenSector?.(data.sector)}
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.5,
                        px: 1.1,
                        py: 0.3,
                        borderRadius: 1,
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
                <Typography sx={{ fontSize: 13.25, lineHeight: 1.65, color: C.muted }}>
                  {data.shape.verdict_text}
                  {data.sector_note ? ` ${data.sector_note}` : ""}
                </Typography>
              </Card>
            )}

            {/* Flagged dates */}
            {data.flags?.length > 0 && (
              <Typography sx={{ fontFamily: MONO, fontSize: 12, color: C.muted, px: 0.5 }}>
                Flagged as a setup on {data.flags.map((f) => fmtDate(f.as_of)).join(", ")}.
              </Typography>
            )}

            {/* History table */}
            {data.history?.length > 0 && (
              <Card sx={{ p: 0, overflow: "hidden" }}>
                <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${C.line}` }}>
                  <Typography sx={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: C.text, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Last {data.history.length} Sessions
                  </Typography>
                </Box>
                <Box sx={{ overflowX: "auto" }}>
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
                        <TableRow key={r.date} sx={{ "&:last-child td": { border: 0 } }}>
                          <TableCell sx={{ fontFamily: MONO, fontSize: 12, py: 1 }}>{fmtDate(r.date)}</TableCell>
                          <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, py: 1 }}>{num(r.adj ?? r.close, 2)}</TableCell>
                          <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, py: 1 }}>{pct(r.pos_hi, 1)}</TableCell>
                          <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, py: 1 }}>{num(r.vol_ratio)}</TableCell>
                          <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, py: 1 }}>{num(r.cmf)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Card>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
