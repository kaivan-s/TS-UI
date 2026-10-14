/**
 * Insights — why stocks moved 5%+ in a session.
 *
 * Every gainer and loser past the threshold, each with the facts that
 * coincided with the move: market vs sector vs stock-specific share, the
 * shape of the day, volume and delivery against normal, circuit closes,
 * exchange filings and bulk/block deals. Facts, not causes.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import { getInsightsMovers } from "../api.js";
import { C } from "../theme.js";
import { fmtDate } from "../format.js";
import { PageIntro } from "./ui.jsx";
import { PremiumOverlay } from "./Premium.jsx";

const MONO = '"IBM Plex Mono", ui-monospace, monospace';
const FREE_PREVIEW = 5;

const FILTERS = [
  { id: "all", label: "All" },
  { id: "filing", label: "With a filing", test: (x) => x.filings?.length > 0 },
  { id: "sector", label: "Sector-wide", test: (x) => x.tags?.includes("Sector-wide move") },
  { id: "circuit", label: "Circuit close", test: (x) => x.band != null },
  { id: "deal", label: "Bulk/block deal", test: (x) => x.deals?.length > 0 },
  {
    id: "solo",
    label: "Nothing on record",
    test: (x) => !x.filings?.length && !x.deals?.length && !x.tags?.includes("Sector-wide move"),
  },
];

function fp(v, nd = 1) {
  if (v == null) return "—";
  const n = v * 100;
  return `${n > 0 ? "+" : ""}${n.toFixed(nd)}%`;
}

function Stat({ label, value, color }) {
  return (
    <Box sx={{ px: 2, py: 1.5, borderRadius: 2, bgcolor: "#15161b", border: `1px solid ${C.line}`, minWidth: 120 }}>
      <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", color: C.muted, textTransform: "uppercase", mb: 0.4 }}>
        {label}
      </Typography>
      <Typography sx={{ fontFamily: MONO, fontSize: 17, fontWeight: 600, color: color || C.text }}>{value}</Typography>
    </Box>
  );
}

function Tag({ children, tone }) {
  const t = {
    filing: { fg: C.warn, bg: "rgba(196,164,106,0.12)", bd: "rgba(196,164,106,0.32)" },
    good: { fg: C.good, bg: "rgba(125,186,150,0.12)", bd: "rgba(125,186,150,0.3)" },
    bad: { fg: C.bad, bg: "rgba(200,122,122,0.12)", bd: "rgba(200,122,122,0.3)" },
    plain: { fg: C.accent, bg: "rgba(142,180,196,0.10)", bd: "rgba(142,180,196,0.28)" },
  }[tone || "plain"];
  return (
    <Box
      component="span"
      sx={{
        px: 0.9,
        py: 0.2,
        borderRadius: 1,
        bgcolor: t.bg,
        border: `1px solid ${t.bd}`,
        color: t.fg,
        fontFamily: MONO,
        fontSize: 10.5,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Box>
  );
}

function tagTone(tag, mover) {
  if (mover.filings?.some((f) => f.category === tag)) return "filing";
  if (/circuit|52W/.test(tag)) return mover.ret > 0 ? "good" : "bad";
  return "plain";
}

// Market / sector / stock-specific shares of the move, as a stacked bar.
function Decomposition({ parts, ret }) {
  const segs = [
    { k: "Market", v: parts?.market, color: "rgba(238,234,227,0.35)" },
    { k: "Sector", v: parts?.sector, color: "rgba(142,180,196,0.75)" },
    { k: "Stock-specific", v: parts?.stock, color: ret > 0 ? "rgba(125,186,150,0.85)" : "rgba(229,115,115,0.85)" },
  ];
  const total = segs.reduce((a, s) => a + Math.abs(s.v || 0), 0) || 1;
  return (
    <Box>
      <Box sx={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", bgcolor: "rgba(238,234,227,0.06)" }}>
        {segs.map((s) => (
          <Box key={s.k} sx={{ width: `${(Math.abs(s.v || 0) / total) * 100}%`, bgcolor: s.color }} />
        ))}
      </Box>
      <Box sx={{ display: "flex", gap: 2, mt: 0.75, flexWrap: "wrap" }}>
        {segs.map((s) => (
          <Box key={s.k} sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: s.color }} />
            <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>
              {s.k} {fp(s.v)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function MoverCard({ m, onOpenStock }) {
  const [open, setOpen] = useState(false);
  const up = m.ret > 0;
  return (
    <Box
      sx={{
        p: 2.25,
        borderRadius: 2.5,
        bgcolor: "#15161b",
        border: `1px solid ${C.line}`,
        borderLeft: `3px solid ${up ? "rgba(125,186,150,0.7)" : "rgba(229,115,115,0.7)"}`,
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, flexWrap: "wrap" }}>
        <Typography
          role="button"
          tabIndex={0}
          onClick={() => onOpenStock?.(m.symbol)}
          sx={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: C.text, cursor: "pointer", "&:hover": { color: C.accent } }}
        >
          {m.symbol}
        </Typography>
        <Typography sx={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: up ? C.good : C.bad }}>
          {fp(m.ret)}
        </Typography>
        <Typography sx={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>
          ₹{m.close?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
        </Typography>
        <Typography sx={{ fontSize: 12, color: C.muted, flex: 1, textAlign: "right", minWidth: 120 }}>
          {m.sector}
        </Typography>
      </Box>

      {m.tags?.length > 0 && (
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
          {m.tags.map((t) => <Tag key={t} tone={tagTone(t, m)}>{t}</Tag>)}
        </Box>
      )}

      <Typography sx={{ fontSize: 13.5, fontWeight: 500, color: C.text, lineHeight: 1.55 }}>{m.headline}</Typography>

      <Decomposition parts={m.parts} ret={m.ret} />

      <Box>
        <Button
          size="small"
          onClick={() => setOpen((v) => !v)}
          endIcon={open ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
          sx={{ px: 0, fontSize: 12, color: C.accent, textTransform: "none" }}
        >
          {open ? "Hide details" : "What happened that day"}
        </Button>
        {open && (
          <Box sx={{ mt: 0.75, display: "flex", flexDirection: "column", gap: 0.75 }}>
            {m.detail?.map((d, i) => (
              <Typography key={i} sx={{ fontSize: 12.75, color: C.muted, lineHeight: 1.6 }}>
                · {d}
              </Typography>
            ))}
            {m.filings?.filter((f) => f.url).map((f, i) => (
              <a
                key={`${f.url}-${i}`}
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: C.accent, fontSize: 12, textDecoration: "none" }}
              >
                Open filing: {f.category} ({fmtDate(f.date)} {f.time}) ↗
              </a>
            ))}
            <Typography
              role="button"
              tabIndex={0}
              onClick={() => onOpenStock?.(m.symbol)}
              sx={{ fontSize: 12, color: C.accent, cursor: "pointer", mt: 0.5 }}
            >
              Open {m.symbol} chart & analysis ↗
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function InsightsView({ onOpenStock }) {
  const [date, setDate] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [side, setSide] = useState("gainers");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let stop = false;
    let timer = null;
    const load = () => {
      setError("");
      getInsightsMovers(date || null)
        .then((d) => {
          if (stop) return;
          if (!d.session_date && d.status && d.status !== "ready") {
            timer = setTimeout(load, 5000);
            return;
          }
          setData(d);
          setLoading(false);
        })
        .catch((e) => {
          if (stop) return;
          setError(e.message);
          setLoading(false);
        });
    };
    setLoading(true);
    load();
    return () => { stop = true; clearTimeout(timer); };
  }, [date]);

  const rows = useMemo(() => {
    const list = data?.[side] || [];
    const f = FILTERS.find((x) => x.id === filter);
    return f?.test ? list.filter(f.test) : list;
  }, [data, side, filter]);

  const locked = data?.[`locked_${side}`] || 0;
  const dates = data?.dates || [];
  const c = data?.counts || {};
  const mk = data?.market || {};

  return (
    <Box>
      <PageIntro
        title="Insights · Why stocks moved"
        action={
          dates.length > 1 && (
            <TextField
              select
              size="small"
              label="Session"
              value={date || data?.session_date || ""}
              onChange={(e) => setDate(e.target.value)}
              sx={{ minWidth: 170 }}
            >
              {dates.map((d) => (
                <MenuItem key={d} value={d}>{fmtDate(d)}</MenuItem>
              ))}
            </TextField>
          )
        }
      >
        Every stock that rose or fell {((data?.threshold ?? 0.05) * 100).toFixed(0)}% or more in the session, with the facts
        that lined up with the move: how much was the market, the sector or the stock itself, how the day traded,
        volume and delivery against normal, circuit closes, the company&apos;s exchange filings, and bulk or block deals.
      </PageIntro>

      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 4 }}>
          <CircularProgress size={20} sx={{ color: C.accent }} />
          <Typography sx={{ fontSize: 13.5, color: C.muted }}>Reading the session&apos;s movers, filings and deals…</Typography>
        </Box>
      )}
      {!loading && error && <Typography sx={{ color: C.bad, fontSize: 14 }}>{error}</Typography>}

      {!loading && data?.session_date && (
        <>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2.5 }}>
            <Stat label="Session" value={fmtDate(data.session_date)} />
            <Stat label="Market median" value={fp(mk.median, 2)} color={mk.median > 0 ? C.good : mk.median < 0 ? C.bad : undefined} />
            <Stat label="Advancing / declining" value={`${mk.advancing ?? "—"} / ${mk.declining ?? "—"}`} />
            <Stat label={`Up ${((data.threshold ?? 0.05) * 100).toFixed(0)}%+`} value={c.gainers ?? 0} color={C.good} />
            <Stat label={`Down ${((data.threshold ?? 0.05) * 100).toFixed(0)}%+`} value={c.losers ?? 0} color={C.bad} />
            <Stat label="With a filing" value={c.with_filing ?? 0} color={C.warn} />
            <Stat label="Nothing on record" value={c.unexplained ?? 0} />
          </Box>

          {(!data.filings_available || !data.deals_available) && (
            <Typography sx={{ fontSize: 12.5, color: C.warn, mb: 2 }}>
              {!data.filings_available
                ? "NSE filings couldn't be read for this session, so filing matches are missing."
                : "Bulk/block deal data isn't available for this session (NSE only publishes the latest day's deals)."}
            </Typography>
          )}

          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap", mb: 2.5 }}>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={side}
              onChange={(_, v) => v && setSide(v)}
              sx={{ "& .MuiToggleButton-root": { textTransform: "none", fontSize: 12.5, px: 1.75 } }}
            >
              <ToggleButton value="gainers">Gainers ({c.gainers ?? 0})</ToggleButton>
              <ToggleButton value="losers">Losers ({c.losers ?? 0})</ToggleButton>
            </ToggleButtonGroup>
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
              {FILTERS.map((f) => (
                <Box
                  key={f.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setFilter(f.id)}
                  sx={{
                    px: 1.25,
                    py: 0.4,
                    borderRadius: 1.5,
                    fontSize: 12,
                    cursor: "pointer",
                    color: filter === f.id ? C.text : C.muted,
                    bgcolor: filter === f.id ? "rgba(142,180,196,0.14)" : "transparent",
                    border: `1px solid ${filter === f.id ? "rgba(142,180,196,0.4)" : C.line}`,
                  }}
                >
                  {f.label}
                </Box>
              ))}
            </Box>
          </Box>

          <PremiumOverlay
            previewCount={FREE_PREVIEW}
            totalCount={(data[side]?.length || 0) + locked}
            feature={`All ${side}`}
          >
            {rows.length === 0 ? (
              <Typography sx={{ fontSize: 13.5, color: C.muted, py: 3 }}>No stocks match this filter for the session.</Typography>
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
                {rows.map((m) => <MoverCard key={m.symbol} m={m} onOpenStock={onOpenStock} />)}
              </Box>
            )}
          </PremiumOverlay>

          <Typography sx={{ fontSize: 11.5, color: C.muted, mt: 3, lineHeight: 1.6 }}>
            These are facts that coincided with each move, taken from NSE end-of-day data, NSE corporate
            announcements and NSE bulk/block deal reports. A filing or deal on the same day is not proof of
            cause. Nothing here is a recommendation to buy or sell.
          </Typography>
        </>
      )}
    </Box>
  );
}
