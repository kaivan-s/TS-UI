/**
 * Tracking — what became of the bases that appeared on the other lists.
 *
 * Every other screen is a snapshot: a name is on tonight's list or it is not.
 * That leaves the reader's actual question unanswered a week later, because a
 * row can vanish for four different reasons and the table looked identical in
 * all four. This gives each base a persistent identity and reports what it
 * did — broke out, broke down, went quiet, or nothing at all.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
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
import { getEpisodes } from "../api.js";
import { EPISODE_ORDER, EPISODE_STATE } from "../glossary.js";
import { C, EPISODE_COLOR } from "../theme.js";
import { num, pct } from "../format.js";
import { STAT_STRIPS } from "../evidence.js";
import { BookmarkButton } from "../watchlist.jsx";
import { HeadCell, MultiSelect, TvCopyButton, useTableSort } from "./ui.jsx";

const MONO = '"IBM Plex Mono", ui-monospace, monospace';
const ROW_CAP = 200;

/** Close-to-close change, or null when either end is missing. */
const gain = (from, to) => (from && to ? to / from - 1 : null);

/** The digest line: transitions that happened on the latest session. */
const NEWS = [
  { key: "triggered", label: "broke out", color: C.good },
  { key: "broke_down", label: "broke down", color: C.bad },
  { key: "failed", label: "failed after breakout", color: C.bad },
  { key: "new", label: "new bases", color: C.accent },
  { key: "dropped", label: "left the list", color: C.muted },
];

function StateChip({ state }) {
  const meta = EPISODE_STATE[state] || { label: state, help: "" };
  const col = EPISODE_COLOR[state] || { bg: "rgba(255,255,255,0.04)", fg: C.muted };
  return (
    <Tooltip title={meta.help} arrow placement="top">
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          px: 1,
          py: 0.3,
          borderRadius: 1,
          bgcolor: col.bg,
          border: `1px solid ${col.fg}33`,
          fontFamily: MONO,
          fontSize: 11,
          fontWeight: 600,
          color: col.fg,
          cursor: "help",
          whiteSpace: "nowrap",
        }}
      >
        {meta.label}
      </Box>
    </Tooltip>
  );
}

/**
 * The one-line summary of the session + empirical base rates.
 */
function SessionTelemetry({ digest, asOf }) {
  const episodeStrip = STAT_STRIPS.episodes;
  const items = digest ? NEWS.filter((n) => (digest[n.key] || 0) > 0) : [];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "7fr 5fr" },
        gap: 2,
        mb: 3,
      }}
    >
      {/* Left: Last Session Digest */}
      <Box
        sx={{
          p: 2.25,
          borderRadius: 2.5,
          bgcolor: "#15161b",
          border: `1px solid ${C.line}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: C.good }} />
            <Typography sx={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.14em", color: C.accent }}>
              LAST SESSION TRANSITIONS {asOf ? `· ${asOf}` : ""}
            </Typography>
          </Box>
          {digest && (
            <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: C.text, fontWeight: 600 }}>
              {digest.live ?? 0} <span style={{ color: C.muted, fontWeight: 400 }}>open bases</span>
            </Typography>
          )}
        </Box>

        {!digest || items.length === 0 ? (
          <Typography sx={{ fontSize: 13.5, color: C.muted }}>
            Nothing resolved in the latest session — every open base remained where it was.
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 2, sm: 3 }, alignItems: "baseline" }}>
            {items.map((n) => (
              <Box key={n.key} sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
                <Typography sx={{ fontFamily: MONO, fontSize: 20, fontWeight: 600, color: n.color, lineHeight: 1 }}>
                  {digest[n.key]}
                </Typography>
                <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: C.muted }}>
                  {n.label}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Right: Empirical Base Rates */}
      {episodeStrip && (
        <Tooltip title={episodeStrip.tip} placement="top" arrow enterDelay={200}>
          <Box
            sx={{
              p: 2.25,
              borderRadius: 2.5,
              bgcolor: "#15161b",
              border: `1px solid ${C.line}`,
              cursor: "help",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.14em", color: C.muted }}>
                HISTORICAL BASE RATES
              </Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>
                {episodeStrip.window}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2.5, alignItems: "baseline" }}>
              {episodeStrip.stats.map((s) => (
                <Box key={s.label} sx={{ display: "flex", alignItems: "baseline", gap: 0.6 }}>
                  <Typography sx={{ fontFamily: MONO, fontSize: 18, fontWeight: 600, color: C.text, lineHeight: 1 }}>
                    {s.value}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: C.muted }}>
                    {s.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Tooltip>
      )}
    </Box>
  );
}

export default function TrackingView({ onOpenSector, onOpenStock }) {
  const [rows, setRows] = useState([]);
  const [digest, setDigest] = useState(null);
  const [asOf, setAsOf] = useState(null);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState(null);
  const [note, setNote] = useState(null);
  const [pick, setPick] = useState([]);
  const [selectedSectors, setSelectedSectors] = useState([]);
  const [q, setQ] = useState("");

  const sort = useTableSort({
    key: "state_since",
    dir: "desc",
    dirFor: (k) => (k === "symbol" || k === "sector" || k === "state" ? "asc" : "desc"),
  });

  const load = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await getEpisodes();
      setRows(res?.rows || []);
      setDigest(res?.digest || null);
      setAsOf(res?.as_of || null);
      setNote(res?.message || null);
    } catch (e) {
      setErr(e?.message || "Could not load tracking data");
      setRows([]);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c = {};
    for (const r of rows) c[r.state] = (c[r.state] || 0) + 1;
    return c;
  }, [rows]);

  const sectors = useMemo(
    () => [...new Set(rows.map((r) => r.sector).filter(Boolean))].sort(),
    [rows]
  );

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (pick.length && !pick.includes(r.state)) return false;
      if (selectedSectors.length && !selectedSectors.includes(r.sector)) return false;
      if (!query) return true;
      return (
        (r.symbol || "").toLowerCase().includes(query) ||
        (r.sector || "").toLowerCase().includes(query) ||
        (r.reason || "").toLowerCase().includes(query)
      );
    });
    const priced = filtered.map((r) => ({
      ...r,
      move: gain(r.entry_price, r.last_close),
      peak: gain(r.entry_price, r.peak_high),
    }));
    return sort.apply(priced);
  }, [rows, pick, selectedSectors, q, sort.key, sort.dir]);

  const capped = shown.slice(0, ROW_CAP);

  const toggle = (s) =>
    setPick((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  if (busy && !rows.length) {
    return (
      <Box
        sx={{
          p: 6,
          borderRadius: 3,
          bgcolor: "#15161b",
          border: `1px solid ${C.line}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <CircularProgress size={24} sx={{ color: C.accent }} />
        <Typography sx={{ fontFamily: MONO, fontSize: 12.5, color: C.muted }}>
          Loading 365-day episode audit log…
        </Typography>
      </Box>
    );
  }

  if (err) {
    return (
      <Box
        sx={{
          p: 3,
          borderRadius: 2.5,
          bgcolor: "rgba(200,122,122,0.08)",
          border: "1px solid rgba(200,122,122,0.22)",
          color: C.bad,
          fontSize: 14,
        }}
      >
        {err}
      </Box>
    );
  }

  if (!rows.length) {
    return (
      <Box
        sx={{
          p: 5,
          borderRadius: 3,
          bgcolor: "#15161b",
          border: `1px solid ${C.line}`,
          textAlign: "center",
        }}
      >
        <Typography sx={{ fontSize: 14.5, color: C.muted }}>
          {note ||
            "No episodes tracked yet. This fills in after the first post-market run, which also reconstructs the recent history."}
        </Typography>
      </Box>
    );
  }

  const hasFilters = Boolean(q || pick.length > 0 || selectedSectors.length > 0);

  return (
    <Box sx={{ pb: 6 }}>
      {/* Top Architectural Header Card */}
      <Box
        sx={{
          p: { xs: 2.5, sm: 3.25 },
          mb: 2.5,
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
          <Box sx={{ maxWidth: 640 }}>
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
                EPISODE AUDIT TRAIL · PERSISTENT BASE LOG
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
              Outcome Tracking
            </Typography>
            <Typography sx={{ fontSize: 13.75, color: C.muted, lineHeight: 1.6 }}>
              Each base keeps its identity from the session it first cleared the coil filters until it resolves — so a name that disappears from Setups is accounted for here instead of vanishing silently.
            </Typography>
          </Box>

          {/* Search + Sector Filter + TV Copy */}
          <Box
            sx={{
              display: "flex",
              gap: 1.25,
              alignItems: "center",
              flexWrap: "wrap",
              width: { xs: "100%", lg: "auto" },
            }}
          >
            <TextField
              size="small"
              placeholder="Symbol, sector, or reason…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              sx={{
                width: { xs: "100%", sm: 220 },
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

            <MultiSelect
              label="Sector"
              options={sectors}
              selected={selectedSectors}
              onChange={setSelectedSectors}
              width={240}
            />

            <TvCopyButton symbols={[...new Set(capped.map((r) => r.symbol))]} />
          </Box>
        </Box>

        {/* Bottom Filter Bar: State Pills + Row Count */}
        <Box
          sx={{
            mt: 2.75,
            pt: 2.25,
            borderTop: `1px solid ${C.line}`,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            gap: 1.5,
          }}
        >
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, alignItems: "center" }}>
            {EPISODE_ORDER.filter((s) => counts[s]).map((s) => {
              const on = pick.includes(s);
              const col = EPISODE_COLOR[s] || { bg: "rgba(255,255,255,0.04)", fg: C.muted };
              return (
                <Tooltip key={s} title={EPISODE_STATE[s]?.help || ""} arrow placement="top">
                  <Box
                    role="button"
                    tabIndex={0}
                    onClick={() => toggle(s)}
                    onKeyDown={(e) => e.key === "Enter" && toggle(s)}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.75,
                      px: 1.25,
                      py: 0.5,
                      borderRadius: 1.25,
                      cursor: "pointer",
                      fontFamily: MONO,
                      fontSize: 11.5,
                      fontWeight: on ? 600 : 500,
                      bgcolor: on ? `${col.fg}24` : col.bg,
                      border: `1px solid ${on ? col.fg : "rgba(255,255,255,0.06)"}`,
                      color: col.fg,
                      transition: "all 0.15s ease",
                      "&:hover": { borderColor: col.fg },
                    }}
                  >
                    <span>{EPISODE_STATE[s]?.label || s}</span>
                    <Box
                      component="span"
                      sx={{
                        px: 0.6,
                        py: "1px",
                        borderRadius: 0.75,
                        bgcolor: "rgba(0,0,0,0.25)",
                        fontSize: 10.5,
                      }}
                    >
                      {counts[s]}
                    </Box>
                  </Box>
                </Tooltip>
              );
            })}

            {hasFilters && (
              <Box
                role="button"
                tabIndex={0}
                onClick={() => {
                  setPick([]);
                  setSelectedSectors([]);
                  setQ("");
                }}
                sx={{
                  ml: 0.5,
                  fontFamily: MONO,
                  fontSize: 11,
                  color: C.accent,
                  cursor: "pointer",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Reset ×
              </Box>
            )}
          </Box>

          <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: C.muted }}>
            {capped.length < shown.length
              ? `Showing newest ${capped.length} of ${shown.length}`
              : `${shown.length} ${shown.length === 1 ? "episode" : "episodes"}`}
          </Typography>
        </Box>
      </Box>

      {/* Session Transitions + Historical Base Rates */}
      <SessionTelemetry digest={digest} asOf={asOf} />

      {/* Architectural Episodes Table */}
      <Box
        sx={{
          borderRadius: 3,
          bgcolor: "#15161b",
          border: `1px solid ${C.line}`,
          overflow: "hidden",
          mb: 3,
        }}
      >
        <TableContainer sx={{ overflowX: "auto", maxHeight: "calc(100vh - 240px)" }}>
          <Table
            stickyHeader
            size="small"
            sx={{
              minWidth: 980,
              "& .MuiTableCell-stickyHeader": {
                bgcolor: "#0e0f12",
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                py: 1.5,
              },
            }}
          >
            <TableHead>
              <TableRow>
                <HeadCell label="" sx={{ width: 36, p: 0 }} />
                <HeadCell
                  label="Symbol"
                  help="Click to open the stock's full history."
                  sort={sort}
                  sortKey="symbol"
                />
                <HeadCell
                  label="What happened"
                  help="The base's current state. Hover any chip for what the app observed."
                  sort={sort}
                  sortKey="state"
                />
                <HeadCell
                  label="Why"
                  help="The event behind the state — the level it closed through, or the filter it stopped clearing."
                />
                <HeadCell
                  label="Sessions"
                  help="Sessions since the base first appeared. Gaps of up to three sessions do not restart this, so it is the base's true age rather than an unbroken run."
                  align="right"
                  sort={sort}
                  sortKey="age"
                />
                <HeadCell
                  label="Found at"
                  help="The close on the session the base first cleared the filters. Not an entry price — the app does not know if or when anyone bought."
                  align="right"
                  sort={sort}
                  sortKey="entry_price"
                />
                <HeadCell
                  label="Trigger"
                  help="The breakout level, frozen at the session the base was found. It does not track the rolling high, or the level would move every day and nothing would ever count as a breakout."
                  align="right"
                  sort={sort}
                  sortKey="entry_trigger"
                />
                <HeadCell
                  label="Since found"
                  help="Change from the close on the day the base appeared to its latest close."
                  align="right"
                  sort={sort}
                  sortKey="move"
                />
                <HeadCell
                  label="Best price"
                  help="The highest intraday price the base traded at since the session it appeared, and the gain to it. Measured from the session after it was found."
                  align="right"
                  sort={sort}
                  sortKey="peak"
                />
                <HeadCell label="Sector" sort={sort} sortKey="sector" />
              </TableRow>
            </TableHead>
            <TableBody>
              {capped.map((r) => {
                const heavy = r.trigger_vol === true;
                return (
                  <TableRow
                    key={`${r.symbol}-${r.started_on}`}
                    hover
                    sx={{
                      "&:hover": { bgcolor: "rgba(255,255,255,0.025) !important" },
                    }}
                  >
                    <TableCell sx={{ py: 0, px: 0.75, width: 36 }}>
                      <BookmarkButton symbol={r.symbol} />
                    </TableCell>

                    <TableCell
                      role="button"
                      tabIndex={0}
                      onClick={() => onOpenStock?.(r.symbol)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") onOpenStock?.(r.symbol);
                      }}
                      sx={{
                        cursor: onOpenStock ? "pointer" : "default",
                        fontFamily: MONO,
                        fontSize: 13,
                        fontWeight: 600,
                        color: C.text,
                        py: 1.25,
                        "&:hover": onOpenStock ? { color: C.accent } : {},
                      }}
                    >
                      {r.symbol}
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <StateChip state={r.state} />
                        {heavy && (
                          <Tooltip
                            title="Turnover on the breakout ran at least 1.5x its recent average."
                            arrow
                          >
                            <Chip
                              size="small"
                              label="1.5x+ vol"
                              sx={{
                                fontFamily: MONO,
                                bgcolor: "rgba(125,186,150,0.12)",
                                color: C.good,
                                fontSize: 10,
                                fontWeight: 600,
                                height: 20,
                              }}
                            />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>

                    <TableCell sx={{ fontSize: 12.5, color: C.muted, maxWidth: 280 }}>
                      {r.reason || "—"}
                    </TableCell>

                    <TableCell
                      align="right"
                      className="num"
                      sx={{ fontFamily: MONO, fontSize: 12.5, color: C.text }}
                    >
                      {r.age != null ? `${r.age}d` : "—"}
                    </TableCell>

                    <TableCell
                      align="right"
                      className="num"
                      sx={{ fontFamily: MONO, fontSize: 12.5, color: C.text }}
                    >
                      {num(r.entry_price)}
                    </TableCell>

                    <TableCell
                      align="right"
                      className="num"
                      sx={{ fontFamily: MONO, fontSize: 12.5, color: C.accent }}
                    >
                      {num(r.entry_trigger)}
                    </TableCell>

                    <TableCell
                      align="right"
                      className="num"
                      sx={{
                        fontFamily: MONO,
                        fontSize: 12.5,
                        fontWeight: 500,
                        color: r.move == null ? C.muted : r.move >= 0 ? C.good : C.bad,
                      }}
                    >
                      {r.move == null ? "—" : pct(r.move, 1)}
                    </TableCell>

                    <TableCell align="right" className="num">
                      {r.peak == null ? (
                        <Typography sx={{ fontFamily: MONO, fontSize: 12.5, color: C.muted }}>
                          —
                        </Typography>
                      ) : (
                        <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 0.75 }}>
                          <Typography
                            sx={{
                              fontFamily: MONO,
                              fontSize: 12.5,
                              fontWeight: 500,
                              color: r.peak > 0 ? C.good : C.muted,
                            }}
                          >
                            {pct(r.peak, 1)}
                          </Typography>
                          <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>
                            ({num(r.peak_high)})
                          </Typography>
                        </Box>
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
                        fontSize: 12,
                        color: C.muted,
                        cursor: onOpenSector ? "pointer" : "default",
                        "&:hover": onOpenSector ? { color: C.accent } : {},
                      }}
                    >
                      {r.sector || "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Bottom Methodological Notes Bento */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 2,
        }}
      >
        {[
          {
            tag: "NOTE 01 · EVENT VS OUTCOME",
            title: "Breaking out is not the same as working",
            body: "Of the bases that cleared their trigger level, fewer than half were still above it ten sessions later. 'Broke out' marks a structural event on the chart, not a guaranteed outcome.",
          },
          {
            tag: "NOTE 02 · FOUND AT PRICE",
            title: "'Found at' is a discovery close, not an entry",
            body: "'Since found' measures from the close on the day the filters first noticed the base. A coiled base is watched for a close through its trigger level on volume, not bought blind.",
          },
          {
            tag: "NOTE 03 · BEST PRICE CEILING",
            title: "'Best price' measures room offered, not return",
            body: "Peak intraday gain never falls and assumes selling at the exact tick high. Read it as how much excursion the base offered before resolving. Resolved episodes age out after ~20 sessions.",
          },
        ].map((item) => (
          <Box
            key={item.tag}
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              bgcolor: "#15161b",
              border: `1px solid ${C.line}`,
            }}
          >
            <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: C.accent, mb: 0.75 }}>
              {item.tag}
            </Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: C.text, mb: 0.75 }}>
              {item.title}
            </Typography>
            <Typography sx={{ fontSize: 12.75, color: C.muted, lineHeight: 1.6 }}>
              {item.body}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
