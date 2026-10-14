/**
 * Insights — why stocks moved 5%+ in a session.
 *
 * Every gainer and loser past the threshold, each with the facts that
 * coincided with the move: market vs sector vs stock-specific share, the
 * shape of the day, volume and delivery against normal, circuit closes,
 * exchange filings and bulk/block deals. Facts, not causes.
 */

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Box,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import SearchIcon from "@mui/icons-material/Search";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import TableRowsRoundedIcon from "@mui/icons-material/TableRowsRounded";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import { getInsightsMovers } from "../api.js";
import { C } from "../theme.js";
import { fmtDate, num } from "../format.js";
import { HeadCell, TvCopyButton, useTableSort } from "./ui.jsx";
import { BookmarkButton } from "../watchlist.jsx";
import { PremiumOverlay } from "./Premium.jsx";

const MONO = '"IBM Plex Mono", ui-monospace, monospace';
const FREE_PREVIEW = 5;

const TABLE_SX = {
  "& .MuiTableCell-stickyHeader, & .MuiTableCell-head": {
    bgcolor: "#0e0f12",
    fontFamily: MONO,
    fontSize: 10.5,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    py: 1.35,
  },
};

const FILTERS = [
  { id: "all", label: "All Movers" },
  { id: "filing", label: "With Filing", test: (x) => x.filings?.length > 0 },
  { id: "sector", label: "Sector-Wide", test: (x) => x.tags?.includes("Sector-wide move") },
  { id: "circuit", label: "Circuit Close", test: (x) => x.band != null },
  { id: "deal", label: "Bulk / Block Deal", test: (x) => x.deals?.length > 0 },
  {
    id: "solo",
    label: "No Record",
    test: (x) => !x.filings?.length && !x.deals?.length && !x.tags?.includes("Sector-wide move"),
  },
];

function fp(v, nd = 1) {
  if (v == null || Number.isNaN(Number(v))) return "—";
  const n = Number(v) * 100;
  return `${n > 0 ? "+" : ""}${n.toFixed(nd)}%`;
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
        px: 0.85,
        py: 0.2,
        borderRadius: 1,
        bgcolor: t.bg,
        border: `1px solid ${t.bd}`,
        color: t.fg,
        fontFamily: MONO,
        fontSize: 10,
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
    { k: "Market", v: parts?.market, color: "rgba(238,234,227,0.38)" },
    { k: "Sector", v: parts?.sector, color: "rgba(142,180,196,0.8)" },
    {
      k: "Idiosyncratic",
      v: parts?.stock,
      color: ret > 0 ? "rgba(125,186,150,0.88)" : "rgba(200,122,122,0.88)",
    },
  ];
  const total = segs.reduce((a, s) => a + Math.abs(s.v || 0), 0) || 1;
  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 1.5,
        bgcolor: "#111216",
        border: `1px solid ${C.line}`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.75 }}>
        <Typography sx={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.08em", color: C.muted, textTransform: "uppercase" }}>
          Return Attribution Decomposition
        </Typography>
        <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>
          Total {fp(ret)}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", bgcolor: "rgba(238,234,227,0.06)", gap: "2px" }}>
        {segs.map((s) => (
          <Box
            key={s.k}
            sx={{
              width: `${(Math.abs(s.v || 0) / total) * 100}%`,
              bgcolor: s.color,
              minWidth: Math.abs(s.v || 0) > 0.001 ? 4 : 0,
            }}
          />
        ))}
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5, mt: 0.85, flexWrap: "wrap" }}>
        {segs.map((s) => (
          <Box key={s.k} sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
            <Box sx={{ width: 7, height: 7, borderRadius: 0.5, bgcolor: s.color }} />
            <Typography sx={{ fontFamily: MONO, fontSize: 10.75, color: C.muted }}>
              {s.k}:{" "}
              <Box component="span" sx={{ color: C.text, fontWeight: 600 }}>
                {fp(s.v)}
              </Box>
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function MiniCell({ label, value, sub, color }) {
  return (
    <Box
      sx={{
        px: 1.15,
        py: 0.85,
        borderRadius: 1.25,
        bgcolor: "#111216",
        border: `1px solid ${C.line}`,
        minWidth: 0,
      }}
    >
      <Typography sx={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.08em", color: C.muted, textTransform: "uppercase", mb: 0.25 }}>
        {label}
      </Typography>
      <Typography sx={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: color || C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {value}
      </Typography>
      {sub && (
        <Typography sx={{ fontFamily: MONO, fontSize: 10, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {sub}
        </Typography>
      )}
    </Box>
  );
}

function MoverCard({ m, onOpenStock, onOpenSector }) {
  const [open, setOpen] = useState(false);
  const up = m.ret > 0;
  const accentColor = up ? C.good : C.bad;
  const closePct = m.close_loc != null ? Math.round(m.close_loc * 100) : null;

  return (
    <Box
      sx={{
        p: 2.25,
        borderRadius: 2.5,
        bgcolor: "#15161b",
        border: `1px solid ${C.line}`,
        borderLeft: `3px solid ${up ? "rgba(125,186,150,0.75)" : "rgba(200,122,122,0.75)"}`,
        display: "flex",
        flexDirection: "column",
        gap: 1.4,
        transition: "border-color 0.15s ease",
        "&:hover": {
          borderColor: "rgba(238,234,227,0.16)",
          borderLeftColor: accentColor,
        },
      }}
    >
      {/* Top Header: Symbol + Price + Return + Sector + Bookmark */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.25, flexWrap: "wrap" }}>
            <Typography
              role="button"
              tabIndex={0}
              onClick={() => onOpenStock?.(m.symbol)}
              sx={{
                fontFamily: MONO,
                fontSize: 16.5,
                fontWeight: 700,
                color: C.text,
                cursor: "pointer",
                "&:hover": { color: C.accent },
              }}
            >
              {m.symbol}
            </Typography>
            <Box
              component="span"
              sx={{
                px: 0.9,
                py: 0.15,
                borderRadius: 1,
                bgcolor: up ? "rgba(125,186,150,0.14)" : "rgba(200,122,122,0.14)",
                border: `1px solid ${up ? "rgba(125,186,150,0.32)" : "rgba(200,122,122,0.32)"}`,
                fontFamily: MONO,
                fontSize: 13.5,
                fontWeight: 700,
                color: accentColor,
              }}
            >
              {fp(m.ret)}
            </Box>
            <Typography sx={{ fontFamily: MONO, fontSize: 12.5, color: C.muted }}>
              ₹{m.close?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </Typography>
          </Box>

          {/* Tags row */}
          {m.tags?.length > 0 && (
            <Box sx={{ display: "flex", gap: 0.65, flexWrap: "wrap", mt: 0.85 }}>
              {m.tags.map((t) => (
                <Tag key={t} tone={tagTone(t, m)}>
                  {t}
                </Tag>
              ))}
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
          {m.sector && (
            <Box
              role={onOpenSector ? "button" : undefined}
              tabIndex={onOpenSector ? 0 : undefined}
              onClick={() => onOpenSector?.(m.sector)}
              sx={{
                px: 0.95,
                py: 0.25,
                borderRadius: 1,
                bgcolor: "#0e0f12",
                border: `1px solid ${C.line}`,
                fontSize: 11,
                color: C.muted,
                cursor: onOpenSector ? "pointer" : "default",
                whiteSpace: "nowrap",
                "&:hover": onOpenSector ? { color: C.text, borderColor: C.accent } : undefined,
              }}
            >
              {m.sector}
            </Box>
          )}
          <BookmarkButton symbol={m.symbol} />
        </Box>
      </Box>

      {/* Headline */}
      <Typography sx={{ fontSize: 13.25, fontWeight: 500, color: C.text, lineHeight: 1.5 }}>
        {m.headline}
      </Typography>

      {/* 4-Cell Tape Telemetry Strip */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 1 }}>
        <MiniCell
          label="Open Gap"
          value={fp(m.gap)}
          sub={m.band ? `${up ? "Upper" : "Lower"} band ${Math.round(m.band * 100)}%` : "Session open"}
          color={m.gap != null && Math.abs(m.gap) >= 0.02 ? (m.gap > 0 ? C.good : C.bad) : C.text}
        />
        <MiniCell
          label="Range Close"
          value={closePct != null ? `${closePct}% of range` : "—"}
          sub={m.low != null && m.high != null ? `₹${num(m.low, 0)}–₹${num(m.high, 0)}` : undefined}
          color={closePct != null ? (closePct >= 80 ? C.good : closePct <= 20 ? C.bad : C.text) : C.muted}
        />
        <MiniCell
          label="Vol vs 50D"
          value={m.vol_x != null ? `${num(m.vol_x, 1)}×` : "—"}
          sub={m.turnover_cr != null ? `₹${num(m.turnover_cr, 1)} Cr` : undefined}
          color={m.vol_x >= 3 ? C.warn : C.text}
        />
        <MiniCell
          label="Delivery"
          value={m.deliv_pct != null ? `${num(m.deliv_pct, 0)}%` : "—"}
          sub={m.deliv_base != null ? `vs ${num(m.deliv_base, 0)}% norm` : undefined}
        />
      </Box>

      {/* Return Decomposition */}
      <Decomposition parts={m.parts} ret={m.ret} />

      {/* Direct Coinciding Filings / Deals Strip */}
      {(m.filings?.length > 0 || m.deals?.length > 0) && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
          {m.filings?.slice(0, 2).map((f, idx) => (
            <Box
              key={`${f.date}-${f.time}-${idx}`}
              sx={{
                px: 1.25,
                py: 0.85,
                borderRadius: 1.5,
                bgcolor: "rgba(196,164,106,0.06)",
                border: "1px solid rgba(196,164,106,0.22)",
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 1.25,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.85, minWidth: 0 }}>
                <ArticleRoundedIcon sx={{ fontSize: 13, color: C.warn, position: "relative", top: 2, flexShrink: 0 }} />
                <Typography sx={{ fontSize: 12, color: C.text, lineHeight: 1.45 }}>
                  <Box component="span" sx={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 600, color: C.warn, mr: 0.75 }}>
                    {f.category}:
                  </Box>
                  {f.text || f.title}
                </Typography>
              </Box>
              {f.url && (
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: C.accent,
                    fontFamily: MONO,
                    fontSize: 11,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  PDF ↗
                </a>
              )}
            </Box>
          ))}

          {m.deals?.slice(0, 2).map((d, idx) => (
            <Box
              key={`${d.client}-${idx}`}
              sx={{
                px: 1.25,
                py: 0.85,
                borderRadius: 1.5,
                bgcolor: "rgba(142,180,196,0.06)",
                border: "1px solid rgba(142,180,196,0.22)",
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 1.25,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.85, minWidth: 0 }}>
                <SwapHorizRoundedIcon sx={{ fontSize: 14, color: C.accent, position: "relative", top: 2, flexShrink: 0 }} />
                <Typography sx={{ fontSize: 12, color: C.text, lineHeight: 1.45 }}>
                  <Box
                    component="span"
                    sx={{
                      fontFamily: MONO,
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: d.side === "BUY" ? C.good : C.bad,
                      mr: 0.75,
                    }}
                  >
                    {d.kind.toUpperCase()} {d.side}:
                  </Box>
                  {d.client}
                </Typography>
              </Box>
              <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.muted, whiteSpace: "nowrap", flexShrink: 0 }}>
                {d.value_cr != null ? `₹${num(d.value_cr, 1)} Cr` : `₹${num(d.price, 2)}`}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Footer Actions: Expand Details + Open Stock Dossier */}
      <Box
        sx={{
          pt: 1,
          mt: "auto",
          borderTop: `1px solid ${C.line}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box
          role="button"
          tabIndex={0}
          onClick={() => setOpen((v) => !v)}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            fontFamily: MONO,
            fontSize: 11,
            color: C.accent,
            cursor: "pointer",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          <span>{open ? "HIDE SESSION BREAKDOWN" : "SESSION TAPE BREAKDOWN"}</span>
          {open ? <ExpandLessRoundedIcon sx={{ fontSize: 15 }} /> : <ExpandMoreRoundedIcon sx={{ fontSize: 15 }} />}
        </Box>

        <Box
          role="button"
          tabIndex={0}
          onClick={() => onOpenStock?.(m.symbol)}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            fontFamily: MONO,
            fontSize: 11,
            color: C.muted,
            cursor: "pointer",
            "&:hover": { color: C.text },
          }}
        >
          <span>EQUITY DOSSIER</span>
          <OpenInNewRoundedIcon sx={{ fontSize: 12 }} />
        </Box>
      </Box>

      {open && (
        <Box
          sx={{
            p: 1.5,
            borderRadius: 1.5,
            bgcolor: "#0e0f12",
            border: `1px solid ${C.line}`,
            display: "flex",
            flexDirection: "column",
            gap: 0.85,
          }}
        >
          {m.detail?.map((d, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
              <Box
                component="span"
                sx={{
                  mt: 0.25,
                  px: 0.5,
                  borderRadius: 0.5,
                  bgcolor: "rgba(142,180,196,0.1)",
                  fontFamily: MONO,
                  fontSize: 9.5,
                  color: C.accent,
                  flexShrink: 0,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </Box>
              <Typography sx={{ fontSize: 12.25, color: C.muted, lineHeight: 1.55 }}>
                {d}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

function MoversTable({ rows, sort, onOpenStock, onOpenSector }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: `1px solid ${C.line}`,
        bgcolor: "#15161b",
        overflow: "hidden",
      }}
    >
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size="small" stickyHeader sx={{ minWidth: 980, ...TABLE_SX }}>
          <TableHead>
            <TableRow>
              <HeadCell label="" sx={{ width: 36, pr: 0 }} />
              <HeadCell label="Symbol" k="symbol" sort={sort} />
              <HeadCell label="Sector" k="sector" sort={sort} />
              <HeadCell label="Close" k="close" align="right" sort={sort} />
              <HeadCell label="Session Return" k="ret" align="right" sort={sort} />
              <HeadCell label="Open Gap" k="gap" align="right" sort={sort} />
              <HeadCell label="Idiosyncratic" k="stock_share" align="right" sort={sort} />
              <HeadCell label="Sector Share" k="sector_share" align="right" sort={sort} />
              <HeadCell label="Vol vs 50D" k="vol_x" align="right" sort={sort} />
              <HeadCell label="Deliv %" k="deliv_pct" align="right" sort={sort} />
              <HeadCell label="Coinciding Fact / Catalyst" />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((m) => {
              const up = m.ret > 0;
              const isOpen = expanded === m.symbol;
              return (
                <Fragment key={m.symbol}>
                  <TableRow
                    hover
                    onClick={() => setExpanded(isOpen ? null : m.symbol)}
                    sx={{
                      cursor: "pointer",
                      bgcolor: isOpen ? "rgba(142,180,196,0.04)" : "transparent",
                    }}
                  >
                    <TableCell sx={{ pr: 0, py: 1 }} onClick={(e) => e.stopPropagation()}>
                      <BookmarkButton symbol={m.symbol} />
                    </TableCell>
                    <TableCell
                      sx={{ fontFamily: MONO, fontWeight: 600, fontSize: 13, py: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenStock?.(m.symbol);
                      }}
                    >
                      <Box component="span" sx={{ color: C.text, "&:hover": { color: C.accent } }}>
                        {m.symbol}
                      </Box>
                    </TableCell>
                    <TableCell
                      sx={{ fontSize: 12, color: C.muted, py: 1, maxWidth: 160, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                      onClick={(e) => {
                        if (onOpenSector && m.sector) {
                          e.stopPropagation();
                          onOpenSector(m.sector);
                        }
                      }}
                    >
                      {m.sector || "—"}
                    </TableCell>
                    <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5, py: 1 }}>
                      ₹{num(m.close, 2)}
                    </TableCell>
                    <TableCell
                      align="right"
                      className="num"
                      sx={{
                        fontFamily: MONO,
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: up ? C.good : C.bad,
                        py: 1,
                      }}
                    >
                      {fp(m.ret)}
                    </TableCell>
                    <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, color: C.muted, py: 1 }}>
                      {fp(m.gap)}
                    </TableCell>
                    <TableCell
                      align="right"
                      className="num"
                      sx={{
                        fontFamily: MONO,
                        fontSize: 12,
                        fontWeight: 600,
                        color: (m.parts?.stock ?? 0) > 0 ? C.good : (m.parts?.stock ?? 0) < 0 ? C.bad : C.muted,
                        py: 1,
                      }}
                    >
                      {fp(m.parts?.stock)}
                    </TableCell>
                    <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, color: C.muted, py: 1 }}>
                      {fp(m.parts?.sector)}
                    </TableCell>
                    <TableCell
                      align="right"
                      className="num"
                      sx={{
                        fontFamily: MONO,
                        fontSize: 12,
                        color: m.vol_x >= 3 ? C.warn : C.text,
                        fontWeight: m.vol_x >= 3 ? 600 : 400,
                        py: 1,
                      }}
                    >
                      {m.vol_x != null ? `${num(m.vol_x, 1)}×` : "—"}
                    </TableCell>
                    <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, color: C.muted, py: 1 }}>
                      {m.deliv_pct != null ? `${num(m.deliv_pct, 0)}%` : "—"}
                    </TableCell>
                    <TableCell sx={{ py: 1, maxWidth: 340 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                        {m.tags?.slice(0, 2).map((t) => (
                          <Tag key={t} tone={tagTone(t, m)}>
                            {t}
                          </Tag>
                        ))}
                        <Typography
                          sx={{
                            fontSize: 12,
                            color: C.muted,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: 220,
                          }}
                        >
                          {m.headline}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>

                  {isOpen && (
                    <TableRow sx={{ bgcolor: "#0e0f12" }}>
                      <TableCell colSpan={11} sx={{ py: 2, px: 3 }}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                            {m.headline}
                          </Typography>
                          {m.detail?.map((d, i) => (
                            <Typography key={i} sx={{ fontSize: 12.25, color: C.muted }}>
                              · {d}
                            </Typography>
                          ))}
                          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 0.5 }}>
                            {m.filings?.filter((f) => f.url).map((f, i) => (
                              <a
                                key={`${f.url}-${i}`}
                                href={f.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: C.accent, fontFamily: MONO, fontSize: 11.5, textDecoration: "none" }}
                              >
                                Filing: {f.category} ({fmtDate(f.date)}) ↗
                              </a>
                            ))}
                            <Typography
                              role="button"
                              tabIndex={0}
                              onClick={() => onOpenStock?.(m.symbol)}
                              sx={{ fontFamily: MONO, fontSize: 11.5, color: C.accent, cursor: "pointer" }}
                            >
                              Open {m.symbol} Dossier ↗
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default function InsightsView({ onOpenStock, onOpenSector }) {
  const [date, setDate] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [side, setSide] = useState("gainers");
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [layout, setLayout] = useState("cards");

  const sort = useTableSort({
    key: "ret",
    dir: "desc",
    dirFor: (k) => (k === "symbol" || k === "sector" ? "asc" : "desc"),
  });

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
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [date]);

  const sideList = useMemo(() => {
    const raw = data?.[side] || [];
    return raw.map((r) => ({
      ...r,
      stock_share: r.parts?.stock ?? null,
      sector_share: r.parts?.sector ?? null,
    }));
  }, [data, side]);

  const filterCounts = useMemo(() => {
    const out = {};
    FILTERS.forEach((f) => {
      out[f.id] = f.test ? sideList.filter(f.test).length : sideList.length;
    });
    return out;
  }, [sideList]);

  const rows = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter);
    const byCat = f?.test ? sideList.filter(f.test) : sideList;
    const query = q.trim().toLowerCase();
    const searched = !query
      ? byCat
      : byCat.filter(
          (m) =>
            (m.symbol || "").toLowerCase().includes(query) ||
            (m.sector || "").toLowerCase().includes(query) ||
            (m.headline || "").toLowerCase().includes(query) ||
            (m.tags || []).some((t) => t.toLowerCase().includes(query)) ||
            (m.deals || []).some((d) => (d.client || "").toLowerCase().includes(query)),
        );
    return layout === "table" ? sort.apply(searched) : searched;
  }, [sideList, filter, q, layout, sort]);

  const locked = data?.[`locked_${side}`] || 0;
  const dates = data?.dates || [];
  const c = data?.counts || {};
  const mk = data?.market || {};
  const threshPct = ((data?.threshold ?? 0.05) * 100).toFixed(0);

  return (
    <Box sx={{ pb: 6 }}>
      {/* Architectural Header Card */}
      <Box
        sx={{
          bgcolor: "#15161b",
          border: `1px solid ${C.line}`,
          borderRadius: 2.5,
          p: { xs: 2, sm: 2.5 },
          mb: 2.5,
        }}
      >
        {/* Row 1: Title + Side Switcher + Layout Toggle + Session Picker */}
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
              <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", color: C.accent }}>
                POST-MARKET ATTRIBUTION · ≥{threshPct}% SESSION MOVERS
              </Typography>
            </Box>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: 20, sm: 22 },
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                color: C.text,
              }}
            >
              Session Movers &amp; Catalyst Attribution
            </Typography>
            <Typography sx={{ color: C.muted, fontSize: 12.75, lineHeight: 1.5, mt: 0.35 }}>
              Decomposes every {threshPct}%+ mover into market, sector, and idiosyncratic shares alongside NSE corporate filings and bulk/block deals.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap", flexShrink: 0 }}>
            {/* Gainers / Losers Segmented Switcher */}
            <Box
              sx={{
                display: "inline-flex",
                p: 0.45,
                borderRadius: 1.75,
                bgcolor: "#0c0d10",
                border: `1px solid ${C.line}`,
                gap: 0.4,
              }}
            >
              {[
                { id: "gainers", label: `Gainers +${threshPct}%+`, count: c.gainers ?? 0, dot: C.good },
                { id: "losers", label: `Losers -${threshPct}%+`, count: c.losers ?? 0, dot: C.bad },
              ].map((t) => {
                const active = side === t.id;
                return (
                  <Box
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSide(t.id)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.85,
                      px: 1.4,
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
                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: t.dot, opacity: active ? 1 : 0.6 }} />
                    <Typography sx={{ fontSize: 12.25, fontWeight: active ? 600 : 400, color: active ? C.text : C.muted }}>
                      {t.label}
                    </Typography>
                    <Box
                      component="span"
                      sx={{
                        px: 0.65,
                        py: 0.05,
                        borderRadius: 0.75,
                        bgcolor: active ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                        fontFamily: MONO,
                        fontSize: 11,
                        fontWeight: 600,
                        color: active ? t.dot : C.muted,
                      }}
                    >
                      {t.count}
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Cards / Table View Toggle */}
            <Box
              sx={{
                display: "inline-flex",
                p: 0.45,
                borderRadius: 1.75,
                bgcolor: "#0c0d10",
                border: `1px solid ${C.line}`,
                gap: 0.35,
              }}
            >
              {[
                { id: "cards", label: "Cards", icon: GridViewRoundedIcon },
                { id: "table", label: "Table", icon: TableRowsRoundedIcon },
              ].map((v) => {
                const Icon = v.icon;
                const active = layout === v.id;
                return (
                  <Box
                    key={v.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setLayout(v.id)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.6,
                      px: 1.15,
                      py: 0.55,
                      borderRadius: 1.25,
                      cursor: "pointer",
                      bgcolor: active ? "#1b1d24" : "transparent",
                      border: active ? "1px solid rgba(238,234,227,0.14)" : "1px solid transparent",
                      color: active ? C.text : C.muted,
                      fontSize: 12,
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    <Icon sx={{ fontSize: 14 }} />
                    <span>{v.label}</span>
                  </Box>
                );
              })}
            </Box>

            {dates.length > 1 && (
              <TextField
                select
                size="small"
                value={date || data?.session_date || ""}
                onChange={(e) => setDate(e.target.value)}
                sx={{
                  minWidth: 148,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#0c0d10",
                    borderRadius: 1.5,
                    fontFamily: MONO,
                    fontSize: 12,
                  },
                }}
              >
                {dates.map((d) => (
                  <MenuItem key={d} value={d} sx={{ fontFamily: MONO, fontSize: 12 }}>
                    {fmtDate(d)}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <TvCopyButton symbols={rows.map((r) => r.symbol)} />
          </Box>
        </Box>

        {/* Row 2: Catalyst Filter Bar + Search Input */}
        <Box
          sx={{
            mt: 2,
            pt: 1.5,
            borderTop: `1px solid ${C.line}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
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
                    gap: 0.65,
                    px: 1.25,
                    py: 0.5,
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
                  <Typography sx={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? C.text : C.muted }}>
                    {f.label}
                  </Typography>
                  <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: active ? C.accent : C.muted }}>
                    {filterCounts[f.id] ?? 0}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          <TextField
            size="small"
            placeholder="Filter symbol, sector, filing or deal client…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            sx={{
              width: { xs: "100%", sm: 290 },
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
        </Box>

        {/* Row 3: Single-Line Session Telemetry & Attribution Legend */}
        {!loading && data?.session_date && (
          <Box
            sx={{
              mt: 1.5,
              pt: 1.35,
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
                <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>SESSION:</Typography>
                <Typography sx={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: C.text }}>
                  {fmtDate(data.session_date)}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.65 }}>
                <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>MKT MEDIAN:</Typography>
                <Typography
                  sx={{
                    fontFamily: MONO,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: mk.median > 0 ? C.good : mk.median < 0 ? C.bad : C.text,
                  }}
                >
                  {fp(mk.median, 2)}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.65 }}>
                <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>ADV / DEC:</Typography>
                <Typography sx={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: C.good }}>
                  {mk.advancing ?? "—"}
                </Typography>
                <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>/</Typography>
                <Typography sx={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: C.bad }}>
                  {mk.declining ?? "—"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.65 }}>
                <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>WITH FILING:</Typography>
                <Typography sx={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: C.warn }}>
                  {c.with_filing ?? 0}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.65 }}>
                <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>SECTOR-LED:</Typography>
                <Typography sx={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: C.accent }}>
                  {c.sector_wide ?? 0}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.65 }}>
                <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>NO RECORD:</Typography>
                <Typography sx={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: C.text }}>
                  {c.unexplained ?? 0}
                </Typography>
              </Box>
            </Box>

            <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>
              SHOWING {rows.length} OF {sideList.length} {side.toUpperCase()}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Loading & Error States */}
      {loading && (
        <Box
          sx={{
            p: 5,
            borderRadius: 2.5,
            border: `1px solid ${C.line}`,
            bgcolor: "#15161b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
          }}
        >
          <CircularProgress size={20} sx={{ color: C.accent }} />
          <Typography sx={{ fontSize: 13.5, color: C.muted }}>
            Reading session movers, corporate filings, and bulk/block deals…
          </Typography>
        </Box>
      )}

      {!loading && error && (
        <Box
          sx={{
            p: 3,
            borderRadius: 2.5,
            border: "1px solid rgba(200,122,122,0.3)",
            bgcolor: "rgba(200,122,122,0.06)",
          }}
        >
          <Typography sx={{ color: C.bad, fontSize: 14 }}>{error}</Typography>
        </Box>
      )}

      {!loading && data?.session_date && (
        <>
          {(!data.filings_available || !data.deals_available) && (
            <Box
              sx={{
                mb: 2,
                px: 2,
                py: 1.25,
                borderRadius: 2,
                bgcolor: "rgba(196,164,106,0.08)",
                border: "1px solid rgba(196,164,106,0.28)",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Typography sx={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 600, color: C.warn }}>
                DATA NOTICE:
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: C.warn }}>
                {!data.filings_available
                  ? "NSE corporate announcements couldn't be read for this session, so filing matches are omitted."
                  : "NSE bulk/block deal feed only covers the latest trading session; historical deal matches are omitted."}
              </Typography>
            </Box>
          )}

          <PremiumOverlay
            previewCount={FREE_PREVIEW}
            totalCount={(data[side]?.length || 0) + locked}
            feature={`All ${side}`}
          >
            {rows.length === 0 ? (
              <Box
                sx={{
                  p: 5,
                  borderRadius: 2.5,
                  border: `1px solid ${C.line}`,
                  bgcolor: "#15161b",
                  textAlign: "center",
                }}
              >
                <Typography sx={{ fontSize: 14, color: C.muted }}>
                  No stocks match this filter for the selected session.
                </Typography>
              </Box>
            ) : layout === "table" ? (
              <MoversTable
                rows={rows}
                sort={sort}
                onOpenStock={onOpenStock}
                onOpenSector={onOpenSector}
              />
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
                  gap: 2,
                }}
              >
                {rows.map((m) => (
                  <MoverCard
                    key={m.symbol}
                    m={m}
                    onOpenStock={onOpenStock}
                    onOpenSector={onOpenSector}
                  />
                ))}
              </Box>
            )}
          </PremiumOverlay>

          <Box
            sx={{
              mt: 3,
              px: 2.25,
              py: 1.5,
              borderRadius: 2,
              bgcolor: "#15161b",
              border: `1px solid ${C.line}`,
            }}
          >
            <Typography sx={{ fontSize: 11.5, color: C.muted, lineHeight: 1.6 }}>
              <Box component="span" sx={{ fontFamily: MONO, color: C.text, fontWeight: 600, mr: 0.75 }}>
                ATTRIBUTION METHODOLOGY:
              </Box>
              Market share is the broad universe median return; Sector share is the peer-group median minus market; Idiosyncratic share is the residual stock move. Corporate announcements (filed between the prior session&apos;s 15:30 IST close and this session&apos;s close) and NSE bulk/block deals are coinciding facts on record, not proof of causation.
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
}
