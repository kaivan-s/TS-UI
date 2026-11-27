/**
 * Gap-ups in downtrends — the 09:00–09:30 screen.
 *
 * Non-F&O stocks opening 2–9% above yesterday's close while yesterday's close
 * sat below the 50-day average. Prices come from NSE's pre-open session.
 */

import { useMemo } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { C } from "../theme.js";
import { num } from "../format.js";
import { BookmarkButton } from "../watchlist.jsx";
import { HeadCell, useTableSort } from "./ui.jsx";

const MONO = '"IBM Plex Mono", ui-monospace, monospace';

const TABLE_SX = {
  "& .MuiTableCell-head": {
    bgcolor: "#0e0f12",
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    py: 1.4,
  },
};

const PHASE = {
  closed: { label: "MARKET CLOSED", tone: C.muted, text: "Pre-open runs 9:00–9:08 AM IST on trading days. Showing the most recent pre-open session." },
  before: { label: "BEFORE PRE-OPEN", tone: C.muted, text: "Pre-open order entry starts at 9:00 AM IST. Showing the most recent pre-open session until then." },
  preopen: { label: "PRE-OPEN · INDICATIVE", tone: C.warn, text: "Order entry is open (9:00–9:08). Opening prices are indicative and can still change." },
  open_set: { label: "OPEN PRICE SET", tone: C.accent, text: "Opening prices are final. Continuous trading starts at 9:15." },
  window: { label: "LIVE · 9:15–9:30", tone: C.good, text: "Trading is live. \"Since open\" is the move from the opening price; refreshes every 30 seconds." },
  after: { label: "WINDOW CLOSED", tone: C.muted, text: "The 9:00–9:30 window has passed. Today's list is kept for review." },
};

const pct = (v, digits = 2) => (v == null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(digits)}%`);

function Pill({ children, tone }) {
  return (
    <Box
      component="span"
      sx={{
        px: 0.75,
        py: "1px",
        borderRadius: 0.75,
        fontFamily: MONO,
        fontSize: 9.5,
        fontWeight: 600,
        letterSpacing: "0.08em",
        color: tone,
        border: `1px solid ${tone}`,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Box>
  );
}

const fmtDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/** Shown when most of the market opened higher; the tested top five did not fade on such mornings. */
function BroadOpenNote({ open, stats }) {
  if (!open?.broad || !stats) return null;
  return (
    <Box sx={{ p: { xs: 2, sm: 2.5 }, mb: 2, borderRadius: 2.5, bgcolor: "rgba(196,164,106,0.07)", border: `1px solid ${C.warn}55` }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap", mb: 0.75 }}>
        <Pill tone={C.warn}>BROAD GAP-UP OPEN</Pill>
        <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>
          Median stock opened {pct(open.median_gap_pct)}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6 }}>
        Most of the market opened higher this morning. On the {stats.sessions} sessions since Dec 2023 when the
        median liquid stock opened {stats.threshold_pct}% or more above its close, the top five on this list
        did not fade: median {pct(stats.median_pct)} from 09:20 to 15:15 after costs, and {stats.win_pct}% fell
        more than costs. On other mornings the same top five came to a median of {pct(stats.other_median_pct)}.
        A negative figure means the stock rose.
      </Typography>
    </Box>
  );
}

/** Picks logged at ~09:20 and priced again at ~15:15; positive = the stock fell (short gained). */
function LiveRecord({ rec, topN }) {
  const s = rec?.top;
  return (
    <Box sx={{ p: { xs: 2, sm: 2.5 }, mb: 2, borderRadius: 2.5, bgcolor: "#15161b", border: `1px solid ${C.line}` }}>
      <Typography sx={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.14em", color: C.accent, mb: 1 }}>
        LIVE RECORD{rec?.since ? ` · SINCE ${fmtDate(rec.since).toUpperCase()}` : ""}
      </Typography>
      {!s ? (
        <Typography sx={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6 }}>
          Each trading day the list is logged at 09:20 and priced again at 15:15. Results appear here after the
          first full session.
        </Typography>
      ) : (
        <>
          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", mb: 1.5 }}>
            {[
              [`Top ${topN} instances · ${rec.sessions} sessions`, s.trades],
              ["Avg fall 09:20 → 15:15, after costs", pct(s.avg_pct)],
              ["Median instance", pct(s.median_pct)],
              ["Fell more than costs", `${s.win_pct}%`],
            ].map(([k, v]) => (
              <Box key={k}>
                <Typography sx={{ fontFamily: MONO, fontSize: 16, fontWeight: 600, color: C.text }}>{v}</Typography>
                <Typography sx={{ fontSize: 11.5, color: C.muted }}>{k}</Typography>
              </Box>
            ))}
          </Box>
          {rec.all && rec.all.trades !== s.trades && (
            <Typography sx={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6, mb: 1 }}>
              All listed stocks: {rec.all.trades} instances, average {pct(rec.all.avg_pct)}, median{" "}
              {pct(rec.all.median_pct)}.
            </Typography>
          )}
          {rec.recent.map((d) => (
            <Box key={d.date} sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", py: 0.5, borderTop: `1px solid ${C.line}` }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: C.muted, minWidth: 56 }}>{fmtDate(d.date)}</Typography>
              {d.picks.filter((p) => p.top).map((p) => (
                <Typography key={p.symbol} sx={{ fontFamily: MONO, fontSize: 11.5, color: C.text }}>
                  {p.symbol}{" "}
                  <Box component="span" sx={{ color: p.net_pct > 0 ? C.good : C.bad }}>{pct(p.net_pct)}</Box>
                </Typography>
              ))}
            </Box>
          ))}
          <Typography sx={{ fontSize: 11.5, color: C.muted, lineHeight: 1.6, mt: 1 }}>
            A positive figure means the stock fell after 09:20, net of {(rec.cost_bps / 100).toFixed(2)}% round-trip
            costs. Logged automatically; no picks are removed afterwards.
          </Typography>
        </>
      )}
    </Box>
  );
}

export default function GapFadeView({ data, error, onOpenStock }) {
  const sort = useTableSort({
    key: "rank",
    dir: "asc",
    dirFor: (k) => (k === "rank" || k === "symbol" ? "asc" : "desc"),
  });
  const rows = data?.rows || [];
  const shown = useMemo(() => sort.apply(rows), [rows, sort.key, sort.dir]);
  const phase = PHASE[data?.phase] || PHASE.closed;
  const rules = data?.rules || {};
  const bt = data?.backtest;
  const showLive = data?.phase === "window" || data?.phase === "after";

  return (
    <Box>
      {/* Status strip */}
      <Box
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 2,
          borderRadius: 2.5,
          bgcolor: "#15161b",
          border: `1px solid ${C.line}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap", mb: 0.75 }}>
          <Pill tone={phase.tone}>{phase.label}</Pill>
          {data?.preopen_time && (
            <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>
              Pre-open data · {data.preopen_time}
            </Typography>
          )}
          {data?.stale && <Pill tone={C.warn}>STALE — NSE UNREACHABLE</Pill>}
        </Box>
        <Typography sx={{ fontSize: 13, color: C.muted, lineHeight: 1.55 }}>{phase.text}</Typography>
        <Typography sx={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6, mt: 1 }}>
          Non-F&amp;O stocks opening{" "}
          <Box component="span" sx={{ color: C.text }}>
            {rules.gap_min_pct ?? 2}–{rules.gap_max_pct ?? 9}% above yesterday&apos;s close
          </Box>{" "}
          whose previous close was{" "}
          <Box component="span" sx={{ color: C.text }}>below the 50-day average</Box>, priced above ₹
          {rules.min_price ?? 50} with a 20-day median turnover of at least ₹{rules.min_turnover_cr ?? 10} cr.
          Stocks on a 5% price band are left out. The {rules.top_n ?? 5} largest gaps are marked, matching the
          tested rule. {data?.universe != null && `${data.universe} stocks met the trend and liquidity conditions today.`}
        </Typography>
        {data?.market_open && (
          <Typography sx={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6, mt: 0.5 }}>
            Market open: the median of {data.market_open.stocks} liquid stocks opened{" "}
            <Box component="span" sx={{ color: C.text }}>{pct(data.market_open.median_gap_pct)}</Box>.
          </Typography>
        )}
      </Box>

      <BroadOpenNote open={data?.market_open} stats={bt?.broad_open} />

      {error && !data && (
        <Box
          sx={{
            p: 3,
            mb: 2,
            borderRadius: 2.5,
            bgcolor: "rgba(200,122,122,0.08)",
            border: "1px solid rgba(200,122,122,0.22)",
            color: C.bad,
            fontSize: 14,
          }}
        >
          {error}
        </Box>
      )}

      {data && !rows.length && (
        <Box
          sx={{
            p: 4.5,
            mb: 2,
            borderRadius: 2.5,
            bgcolor: "#15161b",
            border: `1px solid ${C.line}`,
            textAlign: "center",
          }}
        >
          <Typography sx={{ fontSize: 14, color: C.muted }}>
            No stock matches the conditions in this pre-open session.
          </Typography>
        </Box>
      )}

      {rows.length > 0 && (
        <Box
          sx={{
            bgcolor: "#15161b",
            border: `1px solid ${C.line}`,
            borderRadius: 2.5,
            overflow: "hidden",
            mb: 2,
          }}
        >
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 860, ...TABLE_SX }}>
              <TableHead>
                <TableRow>
                  <HeadCell label="" sx={{ width: 36, p: 0 }} />
                  <HeadCell label="#" sort={sort} sortKey="rank" help="Order by gap size, largest first." />
                  <HeadCell label="Symbol" sort={sort} sortKey="symbol" />
                  <HeadCell label="Gap" align="right" sort={sort} sortKey="gap_pct"
                    help="Opening (or indicative) price versus yesterday's close." />
                  <HeadCell label="Open" align="right" sort={sort} sortKey="open"
                    help="Pre-open equilibrium price. Indicative before ~9:08, final after." />
                  <HeadCell label="Prev close" align="right" />
                  {showLive && (
                    <HeadCell label="Now" align="right" sort={sort} sortKey="ltp"
                      help="Latest traded price. May lag by up to a minute." />
                  )}
                  {showLive && (
                    <HeadCell label="Since open" align="right" sort={sort} sortKey="from_open_pct"
                      help="Move from the opening price to the latest price." />
                  )}
                  <HeadCell label="vs 50-day avg" align="right" sort={sort} sortKey="below_sma50_pct"
                    help="Yesterday's close relative to its 50-day average close." />
                  <HeadCell label="Turnover" align="right" sort={sort} sortKey="med_turnover_cr"
                    help="20-day median daily turnover." />
                  <HeadCell label="Band" align="right" sort={sort} sortKey="to_band_pct"
                    help="Price band, and the distance from the open to the upper circuit." />
                </TableRow>
              </TableHead>
              <TableBody>
                {shown.map((r) => (
                  <TableRow
                    key={r.symbol}
                    hover
                    sx={{
                      "&:hover": { bgcolor: "rgba(255,255,255,0.025) !important" },
                      boxShadow: r.top ? `inset 3px 0 0 ${C.accent}` : "none",
                    }}
                  >
                    <TableCell sx={{ py: 0, px: 0.75, width: 36 }}>
                      <BookmarkButton symbol={r.symbol} />
                    </TableCell>
                    <TableCell sx={{ fontFamily: MONO, fontSize: 12, color: r.top ? C.accent : C.muted }}>
                      {r.rank}
                    </TableCell>
                    <TableCell
                      onClick={() => onOpenStock?.(r.symbol)}
                      sx={{
                        fontFamily: MONO,
                        fontSize: 13,
                        fontWeight: 600,
                        color: C.text,
                        cursor: onOpenStock ? "pointer" : "default",
                        "&:hover": onOpenStock ? { color: C.accent } : {},
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.symbol}
                      {r.top && (
                        <Box component="span" sx={{ ml: 1 }}>
                          <Pill tone={C.accent}>TOP {rules.top_n ?? 5}</Pill>
                        </Box>
                      )}
                      {r.filing && (
                        <Tooltip
                          arrow
                          title={`${r.filing.category}: ${r.filing.title} · filed ${fmtDate(r.filing.date)} ${r.filing.time}. A company filing can keep a gap moving in either direction.`}
                        >
                          <Box component="span" sx={{ ml: 1 }} onClick={(e) => e.stopPropagation()}>
                            <Pill tone={C.warn}>OVERNIGHT FILING</Pill>
                          </Box>
                        </Tooltip>
                      )}
                      {r.global_move && (
                        <Tooltip
                          arrow
                          title={`${r.global_move.driver} is ${pct(r.global_move.move_pct, 1)} since the previous Indian close (${r.global_move.industry}).${
                            bt?.global_driver
                              ? ` Since Dec 2023, downtrend gap-ups whose global driver rose ${bt.global_driver.threshold_pct}% or more overnight came to a median of ${pct(bt.global_driver.median_pct)} from 09:20 to 15:15 after costs (${bt.global_driver.win_pct}% fell more than costs, ${bt.global_driver.trades} instances), against ${pct(bt.global_driver.other_median_pct)} when the driver was flat or lower. A negative figure means the stock rose.`
                              : ""
                          }`}
                        >
                          <Box component="span" sx={{ ml: 1 }} onClick={(e) => e.stopPropagation()}>
                            <Pill tone={C.warn}>{r.global_move.driver.toUpperCase()} {pct(r.global_move.move_pct, 1)}</Pill>
                          </Box>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell align="right" className="num"
                      sx={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: C.good }}>
                      {pct(r.gap_pct)}
                    </TableCell>
                    <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                      {num(r.open)}
                    </TableCell>
                    <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5, color: C.muted }}>
                      {num(r.prev_close)}
                    </TableCell>
                    {showLive && (
                      <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                        {r.ltp == null ? "—" : num(r.ltp)}
                      </TableCell>
                    )}
                    {showLive && (
                      <TableCell align="right" className="num"
                        sx={{
                          fontFamily: MONO,
                          fontSize: 12.5,
                          color: r.from_open_pct == null ? C.muted : r.from_open_pct >= 0 ? C.good : C.bad,
                        }}>
                        {pct(r.from_open_pct)}
                      </TableCell>
                    )}
                    <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5, color: C.bad }}>
                      {pct(r.below_sma50_pct, 1)}
                    </TableCell>
                    <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                      ₹{r.med_turnover_cr} cr
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: MONO, fontSize: 12, whiteSpace: "nowrap" }}>
                      <Box component="span" sx={{ color: C.muted }}>
                        {r.band ? `${r.band}%` : "—"}
                        {r.to_band_pct != null && ` · ${r.to_band_pct.toFixed(1)}% away`}
                      </Box>
                      {r.near_band && (
                        <Box component="span" sx={{ ml: 1 }}>
                          <Pill tone={C.warn}>NEAR BAND</Pill>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {data && !error && <LiveRecord rec={data.live_record} topN={rules.top_n ?? 5} />}

      {/* How it was tested */}
      {bt && (
        <Box
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderRadius: 2.5,
            bgcolor: "#15161b",
            border: `1px solid ${C.line}`,
          }}
        >
          <Typography
            sx={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.14em", color: C.accent, mb: 1 }}
          >
            HOW THIS PATTERN BEHAVED · {bt.window}
          </Typography>
          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", mb: 1.5 }}>
            {[
              ["Instances measured (every qualifying stock)", bt.trades.toLocaleString("en-IN")],
              ["Median fall 09:20 → 15:15, after costs", pct(bt.median_pct)],
              ["Fell more than costs", `${bt.win_pct}%`],
              ["Move from the open to 09:20", pct(bt.open_to_0920_pct)],
            ].map(([k, v]) => (
              <Box key={k}>
                <Typography sx={{ fontFamily: MONO, fontSize: 16, fontWeight: 600, color: C.text }}>{v}</Typography>
                <Typography sx={{ fontSize: 11.5, color: C.muted }}>{k}</Typography>
              </Box>
            ))}
          </Box>
          {bt.notes.map((n) => (
            <Typography key={n} sx={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6 }}>
              · {n}
            </Typography>
          ))}
          <Typography sx={{ fontSize: 11.5, color: C.muted, lineHeight: 1.6, mt: 1.25, opacity: 0.85 }}>
            This list describes a price pattern and how it behaved in the past. It is not a
            recommendation to buy or sell any security, and past behaviour does not indicate future results.
            Short selling in the cash segment must be squared off the same day, and a stock that locks at its
            upper circuit may not be possible to buy back.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
