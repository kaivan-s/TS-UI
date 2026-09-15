import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { CoilBar, HeadCell, Note, PageIntro } from "./ui.jsx";
import { C } from "../theme.js";
import { closeGain, fmtDate, num, pct, predScore, reachedGain, reachedLabel } from "../format.js";
import { getTrackRecord, verifyOutcomes } from "../api.js";
import { KIND_HELP, STAT_HELP } from "../glossary.js";

function CalendarBanner({ calendar, scanDate }) {
  if (!calendar) return null;
  const last = calendar.last_session;
  const next = calendar.next_session || calendar.verify_session;
  const showingLast = scanDate && last && String(scanDate).slice(0, 10) === last;

  let text = "";
  if (calendar.today_holiday) {
    const when = calendar.today_kind === "weekend" ? "the weekend" : "a market holiday";
    text = `NSE is closed today (${when}). You're looking at the last session${
      last ? ` (${fmtDate(last)})` : ""
    }. Come back ${next ? fmtDate(next) : "next trading day"} after the close for a fresh scan and scored results.`;
  } else if (calendar.yesterday_holiday && showingLast) {
    text = `Yesterday was not a trading session. Showing the last scan${
      last ? ` from ${fmtDate(last)}` : ""
    }. Today's picks score after this session closes.`;
  } else {
    return null;
  }

  return (
    <Box
      sx={{
        mb: 3,
        px: 2,
        py: 1.25,
        borderLeft: `2px solid ${C.warn}`,
        bgcolor: "rgba(196,164,106,0.08)",
      }}
    >
      <Typography sx={{ fontSize: 14.5, lineHeight: 1.6, color: C.warn }}>
        {text}
      </Typography>
    </Box>
  );
}

const KIND_COLORS = {
  through: C.warn,
  setup: C.good,
  near: C.accent,
  momentum: "#e8a87c",
  potential: "#b8aed4",
};

function StatCard({ label, value, sub, color, help }) {
  const card = (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        flex: "1 1 140px",
        minWidth: 120,
        borderColor: color ? `${color}44` : C.line,
        cursor: help ? "help" : "default",
      }}
    >
      <Typography
        sx={{
          fontSize: 12,
          color: "text.secondary",
          mb: 0.5,
          borderBottom: help ? `1px dotted ${C.muted}` : "none",
          display: "inline-block",
        }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontSize: 24, fontWeight: 500, color: color || C.text }}>
        {value}
      </Typography>
      {sub && (
        <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.25 }}>
          {sub}
        </Typography>
      )}
    </Paper>
  );
  if (!help) return card;
  return (
    <Tooltip title={help} placement="top" arrow enterDelay={200}>
      {card}
    </Tooltip>
  );
}

function KindStats({ data }) {
  if (!data || Object.keys(data).length === 0) return null;

  const order = ["through", "momentum", "setup", "early", "near", "potential"];
  const keys = [
    ...order.filter((k) => data[k]),
    ...Object.keys(data).filter((k) => !order.includes(k)),
  ];
  const rows = keys.map((k) => ({
    kind: k,
    ...data[k],
  }));

  if (rows.length <= 1) return null;

  return (
    <>
      <Typography variant="h2" sx={{ mb: 1, fontSize: 15 }}>
        By category
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 1.5, fontSize: 13.5 }}>
        How each type of pick performed. Hover a category name for what it
        means.
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <HeadCell label="Category" help="How the stock qualified for the list." />
              <HeadCell label="Total" help="Number of picks of this type on the scan date." align="right" />
              <HeadCell label="Verified" help="Picks whose next-session data is available." align="right" />
              <HeadCell k="broke_out" label="Broke out" align="right" />
              <HeadCell k="hit_rate" align="right" />
              <HeadCell k="avg_gain" label="Avg reached" align="right" />
              <HeadCell k="avg_close" align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.kind}>
                <TableCell>
                  <Tooltip title={KIND_HELP[r.kind] || r.kind} placement="top" arrow>
                    <Chip
                      size="small"
                      label={r.kind}
                      sx={{
                        bgcolor: `${KIND_COLORS[r.kind]}22`,
                        color: KIND_COLORS[r.kind],
                        textTransform: "capitalize",
                        cursor: "help",
                      }}
                    />
                  </Tooltip>
                </TableCell>
                <TableCell align="right" className="num">{r.total}</TableCell>
                <TableCell align="right" className="num">{r.verified}</TableCell>
                <TableCell align="right" className="num">{r.broke_out}</TableCell>
                <TableCell align="right" className="num">
                  {r.hit_rate != null ? pct(r.hit_rate, 1) : "—"}
                </TableCell>
                <TableCell align="right" className="num">
                  {r.avg_gain != null ? pct(r.avg_gain, 1) : "—"}
                </TableCell>
                <TableCell align="right" className="num">
                  {r.avg_close != null ? pct(r.avg_close, 1) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

export default function TrackRecordTab({ onOpenStock }) {
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [scanDate, setScanDate] = useState("");
  const [dates, setDates] = useState([]);
  const [data, setData] = useState({ stats: {}, predictions: [] });
  const [error, setError] = useState("");

  const load = async (date) => {
    setLoading(true);
    setError("");
    try {
      const d = await getTrackRecord(date || undefined);
      setDates(d.dates || []);
      setScanDate(d.scan_date || "");
      setData(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setVerifying(true);
    setError("");
    try {
      await verifyOutcomes();
      await load(scanDate);
    } catch (e) {
      setError(e.message);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = data.stats || {};
  const predictions = data.predictions || [];
  const dateIdx = dates.indexOf(scanDate);
  const older = dateIdx >= 0 && dateIdx < dates.length - 1 ? dates[dateIdx + 1] : null;
  const newer = dateIdx > 0 ? dates[dateIdx - 1] : null;
  // API tells us whether the next session has completed (outcomes are real)
  const outcomesReady = data.outcomes_ready ?? false;
  const calendar = data.calendar || null;
  // Show pending if outcomes aren't ready, even if DB has stale data
  const showPending = !outcomesReady;
  const avgClose = (() => {
    if (!outcomesReady) return null;
    if (stats.avg_close != null) return stats.avg_close;
    const xs = predictions.map(closeGain).filter((v) => v != null);
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
  })();
  const kindStats = Object.fromEntries(
    Object.entries(stats.by_kind || {}).map(([k, v]) => {
      if (v.avg_close != null || !outcomesReady) return [k, v];
      const xs = predictions.filter((p) => p.kind === k).map(closeGain).filter((x) => x != null);
      return [k, {
        ...v,
        avg_close: xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null,
      }];
    }),
  );

  return (
    <Box>
      <PageIntro
        title="Track Record"
        action={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <IconButton
              size="small"
              onClick={() => older && load(older)}
              disabled={!older || loading}
              aria-label="Older day"
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <FormControl size="small">
              <Select
                value={scanDate || ""}
                onChange={(e) => load(e.target.value)}
                disabled={loading || dates.length === 0}
                displayEmpty
                sx={{ minWidth: 148 }}
              >
                {dates.length === 0 && (
                  <MenuItem value="" disabled>No scans</MenuItem>
                )}
                {dates.map((d) => (
                  <MenuItem key={d} value={d}>
                    {fmtDate(d)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton
              size="small"
              onClick={() => newer && load(newer)}
              disabled={!newer || loading}
              aria-label="Newer day"
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
            <Button
              variant="outlined"
              size="small"
              onClick={verify}
              disabled={verifying}
            >
              {verifying ? "Verifying…" : "Verify"}
            </Button>
          </Box>
        }
      >
        Did last session's picks actually break out? Weekends and holidays are
        skipped — the default date is the previous trading day, and results
        post only after the next session closes. Use the arrows to step through
        past scans. <strong>Verify</strong> fills in missing next-session
        numbers. Each metric shows its <em>base rate</em> — the same number for
        every stock that passed the scan's hard filters, before the ranking.
      </PageIntro>

      <CalendarBanner calendar={calendar} scanDate={scanDate} />

      {error && (
        <Note>
          {error.includes("relation") || error.includes("does not exist")
            ? "Database tables not created yet. Run the SQL schema in Supabase."
            : error}
        </Note>
      )}

      {loading && !predictions.length ? (
        <Typography color="text.secondary">Loading track record…</Typography>
      ) : (
        <>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
            <StatCard
              label="Picks"
              value={stats.total || 0}
              sub={scanDate ? fmtDate(scanDate) : null}
              help={STAT_HELP.picks}
            />
            <StatCard
              label="Verified"
              value={outcomesReady ? (stats.verified || 0) : "—"}
              sub={outcomesReady && stats.total ? `${Math.round((stats.verified / stats.total) * 100)}%` : (showPending ? "Awaiting next session" : null)}
              help={STAT_HELP.verified}
            />
            <StatCard
              label="Avg reached"
              value={outcomesReady && stats.avg_gain != null ? pct(stats.avg_gain, 1) : "—"}
              color={outcomesReady && stats.avg_gain > 0 ? C.good : outcomesReady && stats.avg_gain < 0 ? C.bad : undefined}
              sub={
                outcomesReady && stats.base_avg_gain != null
                  ? `vs ${pct(stats.base_avg_gain, 1)} base${
                      stats.edge_gain != null
                        ? ` · edge ${stats.edge_gain >= 0 ? "+" : ""}${(stats.edge_gain * 100).toFixed(1)}pp`
                        : ""
                    }`
                  : (showPending ? "Awaiting next session" : null)
              }
              help={STAT_HELP.avg_reached}
            />
            <StatCard
              label="Avg close"
              value={outcomesReady && avgClose != null ? pct(avgClose, 1) : "—"}
              color={outcomesReady && avgClose > 0 ? C.good : outcomesReady && avgClose < 0 ? C.bad : undefined}
              sub={showPending ? "Awaiting next session" : "vs scan price"}
              help={STAT_HELP.avg_close}
            />
            <StatCard
              label="Broke out"
              value={outcomesReady ? (stats.broke_out || 0) : "—"}
              color={outcomesReady ? C.good : undefined}
              sub={
                outcomesReady && stats.hit_rate != null
                  ? `${(stats.hit_rate * 100).toFixed(1)}% of verified${
                      stats.base_hit_rate != null
                        ? ` vs ${(stats.base_hit_rate * 100).toFixed(1)}% base`
                        : ""
                    }${
                      stats.edge_hit != null
                        ? ` · edge ${stats.edge_hit >= 0 ? "+" : ""}${(stats.edge_hit * 100).toFixed(1)}pp`
                        : ""
                    }`
                  : (showPending ? "Awaiting next session" : null)
              }
              help={STAT_HELP.broke_out}
            />
          </Box>

          {stats.base_n > 0 && (
            <Note>
              Base rate is {stats.base_n.toLocaleString()} names that passed the
              same For Tom gates
              {stats.base_scope === "date"
                ? " on this scan date"
                : " across the loaded history (next session is not in the panel yet)"}
              , with no top-40 cut.
            </Note>
          )}

          {outcomesReady && <KindStats data={kindStats} />}

          {predictions.length === 0 ? (
            <Note>
              {dates.length
                ? "No picks on this date."
                : "No predictions logged yet."}
            </Note>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <HeadCell label="Symbol" />
                    <HeadCell k="kind" />
                    <HeadCell k="score" />
                    <HeadCell k="trigger_price" label="Breakout" align="right" />
                    <HeadCell k="price_at_scan" label="Scan price" align="right" />
                    <HeadCell k="next_high" label="High" align="right" />
                    <HeadCell k="reached" align="right" />
                    <HeadCell k="next_close" label="Close" align="right" />
                    <HeadCell k="close_pct" align="right" />
                    <HeadCell k="broke_out" label="Outcome" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...predictions]
                    .sort((a, b) => {
                      // Sort by close % descending (best performers first)
                      const cA = closeGain(a) ?? -Infinity;
                      const cB = closeGain(b) ?? -Infinity;
                      return cB - cA;
                    })
                    .map((p) => {
                    const outcome = p.tom_outcomes?.[0];
                    const gain = outcome?.gain_from_close;
                    const reached = reachedGain(p);
                    const closed = closeGain(p);
                    const brokeOut = outcome?.broke_out;
                    // Only highlight/show outcome data if the next session is done
                    const hasRealOutcome = outcomesReady && outcome;
                    const reachedPct = reached ?? gain;
                    const reachedGreen = hasRealOutcome && reachedPct != null && reachedPct > 0;
                    const closedGreen = hasRealOutcome && closed != null && closed > 0;
                    const hot = reachedGreen && closedGreen;
                    return (
                      <TableRow
                        key={p.id}
                        sx={hot ? { bgcolor: `${C.good}14` } : undefined}
                      >
                        <TableCell
                          className={onOpenStock ? "linkish" : undefined}
                          sx={{ fontWeight: 500 }}
                          onClick={() => onOpenStock?.(p.symbol)}
                        >
                          {p.symbol}
                        </TableCell>
                        <TableCell>
                          <Tooltip title={KIND_HELP[p.kind] || p.kind} placement="top" arrow>
                            <Chip
                              size="small"
                              label={p.kind}
                              sx={{
                                bgcolor: `${KIND_COLORS[p.kind] || C.muted}22`,
                                color: KIND_COLORS[p.kind] || C.muted,
                                textTransform: "capitalize",
                                cursor: "help",
                              }}
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ minWidth: 90 }}>
                          {predScore(p) != null ? <CoilBar value={predScore(p) * 100} /> : "—"}
                        </TableCell>
                        <TableCell align="right" className="num">
                          {num(p.trigger, 2)}
                        </TableCell>
                        <TableCell align="right" className="num">
                          {num(p.price_at_scan, 2)}
                        </TableCell>
                        <TableCell align="right" className="num">
                          {hasRealOutcome ? num(outcome.next_high ?? outcome.next_close, 2) : "—"}
                        </TableCell>
                        <TableCell
                          align="right"
                          className="num"
                          sx={{
                            color: hasRealOutcome && (reached ?? gain) > 0 ? C.good : hasRealOutcome && (reached ?? gain) < 0 ? C.bad : "inherit",
                          }}
                        >
                          {hasRealOutcome ? (reached != null ? pct(reached, 1) : gain != null ? pct(gain, 1) : "—") : "—"}
                        </TableCell>
                        <TableCell align="right" className="num">
                          {hasRealOutcome ? num(outcome.next_close, 2) : "—"}
                        </TableCell>
                        <TableCell
                          align="right"
                          className="num"
                          sx={{
                            color: hasRealOutcome && closed > 0 ? C.good : hasRealOutcome && closed < 0 ? C.bad : "inherit",
                          }}
                        >
                          {hasRealOutcome && closed != null ? pct(closed, 1) : "—"}
                        </TableCell>
                        <TableCell>
                          {hasRealOutcome ? (
                            brokeOut ? (
                              <Chip
                                size="small"
                                label={reachedLabel(p) || "Broke out"}
                                sx={{ bgcolor: `${C.good}22`, color: C.good }}
                              />
                            ) : (
                              <Chip
                                size="small"
                                label={reached != null ? reachedLabel(p) : "Held"}
                                sx={{
                                  bgcolor: hot ? `${C.good}22` : `${C.muted}22`,
                                  color: hot ? C.good : C.muted,
                                }}
                              />
                            )
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              {showPending
                                ? (calendar?.verify_session
                                  ? `Awaiting ${fmtDate(calendar.verify_session)}`
                                  : "Awaiting next session")
                                : "Pending"}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Box>
  );
}
