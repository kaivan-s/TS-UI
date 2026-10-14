/**
 * Leaders at rest — coiled market leaders, ordered by risk-adjusted
 * 12-month momentum, cut to 20.
 *
 * A name qualifies on the coil gates (quiet, tight, near its highs), must sit
 * in the top 30% of the market on twelve-month return, and must not be in a
 * disqualified sector. Order is the backend's `rest_rank`: momentum divided by
 * volatility, so steady trends rank above erratic ones.
 *
 * Carries no BaseRate strip on purpose. The +1.7% figure in evidence.js was
 * measured on the UNRANKED 63-name pool and does not describe this list, and
 * the ranked construction's own numbers come from 67 sessions -- too thin to
 * advertise. Reusing the coil strip here would be misattribution.
 */

import { useMemo, useState } from "react";
import {
  Box,
  Button,
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
import SearchIcon from "@mui/icons-material/Search";
import { CoilBar, HeadCell, MultiSelect, TvCopyButton, useTableSort } from "./ui.jsx";
import { BookmarkButton } from "../watchlist.jsx";
import { C } from "../theme.js";
import { num, pct } from "../format.js";

const MONO = '"IBM Plex Mono", ui-monospace, monospace';

const TABLE_SX = {
  "& .MuiTableCell-stickyHeader, & .MuiTableCell-head": {
    bgcolor: "#0e0f12",
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    py: 1.4,
  },
};

const TREND_STYLE = {
  "↑↑": { color: C.good, label: "Accelerating" },
  "↑":  { color: C.good, label: "Growing" },
  "→":  { color: "#c4a46a", label: "Flat" },
  "↓":  { color: C.bad, label: "Declining" },
  "?":  { color: C.muted, label: "No data" },
};

export default function LeadersAtRestTab({ rows, coilReady, onOpenSector, onOpenStock }) {
  const [q, setQ] = useState("");
  const [sectorPick, setSectorPick] = useState([]);

  const sort = useTableSort({
    key: "rank",
    dir: "asc",
    dirFor: (k) => (k === "rank" || k === "symbol" || k === "sector" ? "asc" : "desc"),
  });

  const ranked = useMemo(
    () => (rows || []).map((r, i) => ({ ...r, rank: i + 1 })),
    [rows],
  );

  const sectorOptions = useMemo(
    () => [...new Set(ranked.map((r) => r.sector).filter(Boolean))],
    [ranked],
  );

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    const filtered = ranked.filter((r) => {
      if (sectorPick.length && !sectorPick.includes(r.sector)) return false;
      if (!query) return true;
      return (
        (r.symbol || "").toLowerCase().includes(query) ||
        (r.sector || "").toLowerCase().includes(query)
      );
    });
    return sort.apply(filtered);
  }, [ranked, q, sectorPick, sort.key, sort.dir]);

  if (!coilReady) {
    return (
      <Box
        sx={{
          p: 4,
          borderRadius: 2.5,
          bgcolor: "#15161b",
          border: `1px solid ${C.line}`,
          textAlign: "center",
        }}
      >
        <Typography sx={{ fontSize: 14, color: C.muted, lineHeight: 1.6, maxWidth: 560, mx: "auto" }}>
          This list measures each stock against its 200-day trend and its last twelve months, which needs about 290 sessions of history. The data is still loading — it will fill in once the panel is deep enough.
        </Typography>
      </Box>
    );
  }

  const sectorsCount = new Set(ranked.map((r) => r.sector)).size;
  const filtering = shown.length !== ranked.length;

  return (
    <Box>
      {/* Contextual Sub-header & Filter Bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          px: 2.5,
          py: 1.75,
          mb: 2.5,
          borderRadius: 2.5,
          bgcolor: "#15161b",
          border: `1px solid ${C.line}`,
        }}
      >
        <Box>
          <Typography sx={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.14em", color: C.accent }}>
            TOP 30% 12M RETURN · RISK-ADJUSTED RANKING ({ranked.length} NAMES ACROSS {sectorsCount} SECTORS)
          </Typography>
          <Typography sx={{ fontSize: 13.25, color: C.muted, mt: 0.25 }}>
            Steady twelve-month trends ranked above erratic ones, outside any Disqualified sector. Wait for a close above the breakout level.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", width: { xs: "100%", sm: "auto" } }}>
          <MultiSelect
            label="Sector"
            options={sectorOptions}
            selected={sectorPick}
            onChange={setSectorPick}
            width={260}
          />
          <TextField
            size="small"
            placeholder="Symbol or sector…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            sx={{
              width: { xs: "100%", sm: 200 },
              flex: { xs: 1, sm: "none" },
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
          {filtering && <TvCopyButton symbols={shown.map((r) => r.symbol)} />}
        </Box>
      </Box>

      {filtering && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
          <Typography sx={{ fontFamily: MONO, fontSize: 12.5, color: C.muted }}>
            Showing {shown.length} of {ranked.length}
          </Typography>
          <Button
            size="small"
            onClick={() => {
              setQ("");
              setSectorPick([]);
            }}
            sx={{ textTransform: "none", color: C.accent, fontWeight: 500, fontSize: 12.5 }}
          >
            Clear filters
          </Button>
        </Box>
      )}

      {ranked.length === 0 ? (
        <Box
          sx={{
            p: 4.5,
            borderRadius: 2.5,
            bgcolor: "#15161b",
            border: `1px solid ${C.line}`,
            textAlign: "center",
          }}
        >
          <Typography sx={{ fontSize: 14, color: C.muted, lineHeight: 1.6, maxWidth: 560, mx: "auto" }}>
            No market leader is in a coil today. A name needs the coil filters and a top-30% twelve-month return at once, outside any disqualified sector, which many sessions do not offer.
          </Typography>
        </Box>
      ) : shown.length === 0 ? (
        <Box
          sx={{
            p: 4,
            borderRadius: 2.5,
            bgcolor: "#15161b",
            border: `1px solid ${C.line}`,
            textAlign: "center",
          }}
        >
          <Typography sx={{ fontSize: 14, color: C.muted }}>
            Nothing matches those filters. Clear them to see all {ranked.length} names.
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            bgcolor: "#15161b",
            border: `1px solid ${C.line}`,
            borderRadius: 2.5,
            overflow: "hidden",
            mb: 4,
          }}
        >
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table stickyHeader sx={{ minWidth: 1020, ...TABLE_SX }}>
              <TableHead>
                <TableRow>
                  <HeadCell
                    label="#"
                    help="Rank by twelve-month momentum divided by volatility, fixed when the scan ran. A steady 40% year ranks above an erratic 60% one. Re-sorting the table does not change it."
                    align="right"
                    sort={sort}
                    sortKey="rank"
                  />
                  <HeadCell label="" sx={{ width: 34, p: 0 }} />
                  <HeadCell label="Symbol" sort={sort} sortKey="symbol" />
                  <HeadCell
                    label="12m momentum"
                    help="Return over the twelve months ending one month ago. Every name here is in the top 30% of the market on this number. The recent month is excluded because short-term gains tend to reverse, which would contaminate the ranking."
                    align="right"
                    sort={sort}
                    sortKey="mom12_1"
                  />
                  <HeadCell
                    label="Coiled"
                    help="Sessions since this base first cleared all seven filters. Gaps of up to three sessions do not restart the count, so a base that wobbles for a day keeps its real age. 'New' means it genuinely started today."
                    align="right"
                    sort={sort}
                    sortKey="episode_days"
                  />
                  <HeadCell
                    label="Sector"
                    help="Click a row's sector to open its full history. Use the Sector button above to narrow the list."
                    sort={sort}
                    sortKey="sector"
                  />
                  <HeadCell
                    label="Earnings"
                    help="Trajectory of year-on-year profit growth across recent quarters. ↑↑ accelerating, ↑ growing, → flat, ↓ declining."
                    align="center"
                    sort={sort}
                    sortKey="earnings_trend"
                  />
                  <HeadCell k="adj" align="right" sort={sort} />
                  <HeadCell k="to_trigger" align="right" sort={sort} />
                  <HeadCell k="coil" sx={{ minWidth: 120 }} sort={sort} />
                  <HeadCell k="pos_hi" align="right" sort={sort} />
                  <HeadCell k="rsi" align="right" sort={sort} />
                  <HeadCell k="vol_ratio" align="right" sort={sort} />
                  <HeadCell k="range20" align="right" sort={sort} />
                  <HeadCell k="cmf" align="right" sort={sort} />
                </TableRow>
              </TableHead>
              <TableBody>
                {shown.map((r) => (
                  <TableRow
                    key={r.symbol}
                    hover
                    sx={{
                      ...(r.shape_confirmed
                        ? { "& td:first-of-type": { boxShadow: `inset 2px 0 0 ${C.good}` } }
                        : {}),
                      "&:hover": { bgcolor: "rgba(255,255,255,0.025) !important" },
                    }}
                  >
                    <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>
                      {r.rank}
                    </TableCell>
                    <TableCell sx={{ py: 0, px: 0.5, width: 34 }}>
                      <BookmarkButton symbol={r.symbol} />
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
                      }}
                    >
                      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                        <span>{r.symbol}</span>
                        {r.shape_confirmed && (
                          <Tooltip
                            title="This stock's sector is also waking up or resting after waking up, so it appears under Sector agrees too."
                            placement="top"
                            arrow
                          >
                            <Box
                              component="span"
                              sx={{
                                px: 0.75,
                                py: 0.15,
                                borderRadius: 1,
                                bgcolor: "rgba(125,186,150,0.14)",
                                border: "1px solid rgba(125,186,150,0.32)",
                                color: C.good,
                                fontFamily: MONO,
                                fontSize: 10,
                                fontWeight: 600,
                                cursor: "help",
                              }}
                            >
                              Sector agrees
                            </Box>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell
                      align="right"
                      className="num"
                      sx={{ fontFamily: MONO, fontSize: 12.5, color: C.good, fontWeight: 600 }}
                    >
                      {r.mom12_1 == null ? "—" : pct(r.mom12_1, 0)}
                    </TableCell>
                    <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                      {r.episode_new ? (
                        <Box
                          component="span"
                          sx={{
                            px: 0.75,
                            py: 0.15,
                            borderRadius: 1,
                            bgcolor: "rgba(142,180,196,0.15)",
                            border: "1px solid rgba(142,180,196,0.32)",
                            fontFamily: MONO,
                            fontSize: 10,
                            fontWeight: 600,
                            color: C.accent,
                          }}
                        >
                          NEW
                        </Box>
                      ) : (
                        `${r.episode_days ?? r.coil_days ?? "—"}d`
                      )}
                    </TableCell>
                    <TableCell
                      role="button"
                      tabIndex={0}
                      onClick={() => onOpenSector?.(r.sector)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") onOpenSector?.(r.sector);
                      }}
                      sx={{
                        maxWidth: 220,
                        fontSize: 12.5,
                        color: C.muted,
                        cursor: onOpenSector ? "pointer" : "default",
                        "&:hover": onOpenSector ? { color: C.accent } : {},
                      }}
                    >
                      {r.sector}
                    </TableCell>
                    <TableCell align="center">
                      {(() => {
                        const t = r.earnings_trend || "?";
                        const s = TREND_STYLE[t] || TREND_STYLE["?"];
                        return (
                          <Tooltip title={s.label} placement="top" arrow>
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
                                bgcolor: `${s.color}14`,
                                border: `1px solid ${s.color}33`,
                                fontFamily: MONO,
                                fontSize: 12,
                                color: s.color,
                                fontWeight: 600,
                                cursor: "help",
                              }}
                            >
                              {t}
                            </Box>
                          </Tooltip>
                        );
                      })()}
                    </TableCell>
                    <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                      {num(r.adj, 2)}
                    </TableCell>
                    <TableCell
                      align="right"
                      className="num"
                      sx={{
                        fontFamily: MONO,
                        fontSize: 12.5,
                        color: r.to_trigger <= 3 ? C.good : C.text,
                        fontWeight: r.to_trigger <= 3 ? 600 : 400,
                      }}
                    >
                      {pct(r.to_trigger, 1)}
                    </TableCell>
                    <TableCell>
                      <CoilBar value={r.coil} />
                    </TableCell>
                    <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                      {pct(r.pos_hi, 1)}
                    </TableCell>
                    <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                      {num(r.rsi, 1)}
                    </TableCell>
                    <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                      {num(r.vol_ratio)}
                    </TableCell>
                    <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                      {pct(r.range20, 1)}
                    </TableCell>
                    <TableCell
                      align="right"
                      className="num"
                      sx={{
                        fontFamily: MONO,
                        fontSize: 12.5,
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
        </Box>
      )}
    </Box>
  );
}
