/**
 * Tracking — what became of the bases that appeared on the other lists.
 *
 * Every other screen is a snapshot: a name is on tonight's list or it is not.
 * That leaves the reader's actual question unanswered a week later, because a
 * row can vanish for four different reasons and the table looked identical in
 * all four. This gives each base a persistent identity and reports what it
 * did — broke out, broke down, went quiet, or nothing at all.
 *
 * Every row here is an observation about price and filters. There is nothing
 * to act on directly and no instruction implied: the measured edge behind the
 * lists is a basket median over 7-20 sessions, which says nothing about what
 * any single name should do next, and the app does not know anyone's entry.
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
import BaseRate from "./BaseRate.jsx";
import { HeadCell, Note, PageIntro, useTableSort } from "./ui.jsx";

const ROW_CAP = 200;

/** Close-to-close change, or null when either end is missing. */
const gain = (from, to) => (from && to ? to / from - 1 : null);

/** The digest line: transitions that happened on the latest session. */
const NEWS = [
  { key: "triggered", label: "broke out", color: C.good },
  { key: "broke_down", label: "broke down", color: C.bad },
  { key: "failed", label: "failed after breaking out", color: C.bad },
  { key: "new", label: "new bases", color: C.accent },
  { key: "dropped", label: "left the list", color: C.muted },
];

function StateChip({ state }) {
  const meta = EPISODE_STATE[state] || { label: state, help: "" };
  const col = EPISODE_COLOR[state] || { bg: "rgba(255,255,255,0.04)", fg: C.muted };
  return (
    <Tooltip title={meta.help} arrow>
      <Chip
        size="small"
        label={meta.label}
        sx={{
          bgcolor: col.bg,
          color: col.fg,
          fontSize: 11.5,
          height: 22,
          borderRadius: 1,
        }}
      />
    </Tooltip>
  );
}

/**
 * The one-line summary of the session.
 *
 * Counts transitions, not standing totals, so a genuinely quiet evening says
 * so rather than restating the backlog as if it were news.
 */
function Digest({ digest }) {
  if (!digest) return null;
  const items = NEWS.filter((n) => (digest[n.key] || 0) > 0);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: { xs: 1.5, sm: 2 },
        px: { xs: 1.5, sm: 2 },
        py: 1.5,
        mb: 2,
        bgcolor: C.paper,
        border: `1px solid ${C.line}`,
        borderRadius: 1,
      }}
    >
      <Typography sx={{ fontSize: 12, color: C.muted, letterSpacing: 0.4 }}>
        LAST SESSION
      </Typography>
      {items.length === 0 ? (
        <Typography sx={{ fontSize: 13, color: C.muted }}>
          Nothing resolved — every open base is where it was.
        </Typography>
      ) : (
        items.map((n) => (
          <Box key={n.key} sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
            <Typography sx={{ fontSize: 17, color: n.color, fontWeight: 500 }}>
              {digest[n.key]}
            </Typography>
            <Typography sx={{ fontSize: 13, color: C.muted }}>{n.label}</Typography>
          </Box>
        ))
      )}
      <Box sx={{ flex: 1 }} />
      <Typography sx={{ fontSize: 12.5, color: C.muted }}>
        {digest.live} open
      </Typography>
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

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (pick.length && !pick.includes(r.state)) return false;
      if (!query) return true;
      return (
        (r.symbol || "").toLowerCase().includes(query) ||
        (r.sector || "").toLowerCase().includes(query)
      );
    });
    // Both moves are derived, and the sort reads fields straight off the row,
    // so they have to exist before `apply` rather than at render time.
    const priced = filtered.map((r) => ({
      ...r,
      move: gain(r.entry_price, r.last_close),
      peak: gain(r.entry_price, r.peak_high),
    }));
    return sort.apply(priced);
  }, [rows, pick, q, sort.key, sort.dir]);

  // Twenty sessions of retention runs to ~600 episodes, which is more table
  // than anyone reads. The default sort is most-recent-activity first, so the
  // cap only ever hides the oldest rows -- and search reaches them anyway.
  const capped = shown.slice(0, ROW_CAP);

  const toggle = (s) =>
    setPick((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  if (busy && !rows.length) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={28} sx={{ color: C.accent }} />
      </Box>
    );
  }

  if (err) return <Note>{err}</Note>;

  if (!rows.length) {
    return (
      <Note>
        {note ||
          "No episodes tracked yet. This fills in after the first post-market " +
          "run, which also reconstructs the recent history."}
      </Note>
    );
  }

  return (
    <Box>
      <PageIntro
        title="Tracking"
        action={
          <TextField
            size="small"
            placeholder="Symbol or sector"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            sx={{ width: { xs: "100%", sm: 200 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: C.muted }} />
                </InputAdornment>
              ),
            }}
          />
        }
      >
        Each base keeps its identity from the session it first cleared the coil
        filters until it resolves, so a name that disappears from Setups is
        accounted for here instead of just going missing. A base survives gaps
        of up to three sessions — about half of all drop-offs return within ten,
        so ending an episode on the first miss would report the same base as
        dead and then brand new a week later.
      </PageIntro>

      <BaseRate metric="episodes" />

      <Digest digest={digest} />

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
        {EPISODE_ORDER.filter((s) => counts[s]).map((s) => {
          const on = pick.includes(s);
          const col = EPISODE_COLOR[s] || {};
          return (
            <Tooltip key={s} title={EPISODE_STATE[s]?.help || ""} arrow>
              <Chip
                size="small"
                clickable
                onClick={() => toggle(s)}
                label={`${EPISODE_STATE[s]?.label || s} ${counts[s]}`}
                sx={{
                  bgcolor: on ? col.fg : col.bg,
                  color: on ? C.bg : col.fg,
                  fontSize: 12,
                  "&:hover": { bgcolor: on ? col.fg : col.bg },
                }}
              />
            </Tooltip>
          );
        })}
        {pick.length > 0 && (
          <Chip
            size="small"
            clickable
            variant="outlined"
            label="Clear"
            onClick={() => setPick([])}
            sx={{ fontSize: 12, color: C.muted, borderColor: C.line }}
          />
        )}
        <Box sx={{ flex: 1, display: { xs: "none", sm: "block" } }} />
        <Typography sx={{ fontSize: 12.5, color: C.muted, alignSelf: "center", width: { xs: "100%", sm: "auto" }, mt: { xs: 0.5, sm: 0 } }}>
          {capped.length < shown.length
            ? `Newest ${capped.length} of ${shown.length} — search or filter to narrow`
            : `${shown.length} shown`}
        </Typography>
      </Box>

      <TableContainer
        sx={{ bgcolor: C.paper, border: `1px solid ${C.line}`, borderRadius: 1, overflowX: "auto" }}
      >
        <Table size="small" sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow>
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
                label="Level"
                help="The breakout level, frozen at the session the base was found. It does not track the rolling high, or the target would move every day and nothing would ever count as a breakout."
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
                help="The highest intraday price the base traded at since the session it appeared, and the gain to it. Measured from the session after it was found, since the list publishes after the close. This is the most generous number on the page — it assumes selling at the exact high — so read it as how much room the base ever offered, not as a return anyone captured."
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
                <TableRow key={`${r.symbol}-${r.started_on}`} hover>
                  <TableCell
                    className="row-click linkish"
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenStock?.(r.symbol)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") onOpenStock?.(r.symbol);
                    }}
                    sx={{ fontWeight: 500 }}
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
                            label="heavy"
                            sx={{
                              bgcolor: "rgba(125,186,150,0.10)",
                              color: C.good,
                              fontSize: 10.5,
                              height: 19,
                            }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: 12.5, color: C.muted, maxWidth: 260 }}>
                    {r.reason || "—"}
                  </TableCell>
                  <TableCell align="right" className="num">
                    {r.age ?? "—"}
                  </TableCell>
                  <TableCell align="right" className="num">
                    {num(r.entry_price)}
                  </TableCell>
                  <TableCell align="right" className="num">
                    {num(r.entry_trigger)}
                  </TableCell>
                  <TableCell
                    align="right"
                    className="num"
                    sx={{
                      color:
                        r.move == null ? C.muted : r.move >= 0 ? C.good : C.bad,
                    }}
                  >
                    {r.move == null ? "—" : pct(r.move, 1)}
                  </TableCell>
                  <TableCell align="right" className="num">
                    {r.peak == null ? (
                      "—"
                    ) : (
                      <>
                        <Box sx={{ color: r.peak > 0 ? C.good : C.muted }}>
                          {pct(r.peak, 1)}
                        </Box>
                        <Box sx={{ fontSize: 11.5, color: C.muted }}>
                          {num(r.peak_high)}
                        </Box>
                      </>
                    )}
                  </TableCell>
                  <TableCell
                    className="row-click linkish"
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenSector?.(r.sector)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") onOpenSector?.(r.sector);
                    }}
                    sx={{ fontSize: 12.5, color: C.muted }}
                  >
                    {r.sector || "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Note>
        Three things worth knowing before reading this as a scoreboard. Breaking
        out is not the same as working: of the bases that cleared their level,
        fewer than half were still above it ten sessions later, so "Broke out"
        marks an event rather than a result. And "Since found" measures from
        the day the base appeared, which is not an entry price — it is where
        the stock was when the filters first noticed it, and a base is meant
        to be acted on at the level, not before. "Best price" is the kindest
        number on the page by construction — it never falls, and nobody sells
        at the exact high — so it answers how much room a base ever offered
        rather than what it paid. Resolved bases age out after about twenty
        sessions so the table stays about the current window rather than the
        archive.
      </Note>
    </Box>
  );
}
