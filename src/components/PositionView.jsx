/**
 * Position Trades — 12-month momentum leaders still holding above their
 * 50-day average, held one to two weeks rather than overnight.
 *
 * Replaces Expected Movers, which ranked names by how far they would travel
 * but had no measured edge on which way. Reads the saved post-market scan
 * rather than the live engine, so the list shown is the one recorded at scan
 * time.
 *
 * Deliberately carries no BaseRate strip. The factor rests on published
 * evidence, not on our cache, which only holds ~9 independent periods at this
 * horizon — printing a win rate off that is the mistake Expected Movers made.
 */

import { useEffect, useMemo, useState } from "react";
import {
  Box,
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
import { HeadCell, Note, PageIntro } from "./ui.jsx";
import UpdateBanner from "./UpdateBanner.jsx";
import { C } from "../theme.js";
import { num, pct } from "../format.js";
import { getPositionTrades } from "../api.js";

export default function PositionView({ status, onOpenSector, onOpenStock }) {
  const [rows, setRows] = useState([]);
  const [scanDate, setScanDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getPositionTrades();
        if (!alive) return;
        setRows(res?.rows || []);
        setScanDate(res?.scan_date || null);
        setErr("");
      } catch (e) {
        if (alive) setErr(e?.message || "Could not load position trades");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(
      (r) =>
        (r.symbol || "").toLowerCase().includes(query) ||
        (r.sector || "").toLowerCase().includes(query),
    );
  }, [rows, q]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={22} />
      </Box>
    );
  }

  return (
    <Box>
      <PageIntro
        title="Position trades"
        action={
          <TextField
            size="small"
            placeholder="Symbol or sector"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            sx={{ width: 220 }}
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
        The {rows.length} strongest performers of the last year that are still
        trading above their 50-day average. Momentum is measured over twelve
        months <em>ending a month ago</em> — the most recent month is skipped
        on purpose, because very recent gains tend to give back. Hold these
        seven to ten sessions; they are trends to sit with, not next-day
        moves. Unlike the other tabs, sort order here is meaningful: stronger
        twelve-month momentum measured better than weaker, consistently across
        the ranking.
      </PageIntro>

      <UpdateBanner asOf={scanDate} />

      {err ? (
        <Note>{err}</Note>
      ) : rows.length === 0 ? (
        <Note>
          No position trades saved yet. This scan needs 270 sessions of history
          per stock to compute a twelve-month reading, and it runs with the
          post-market job after 7:30 PM IST.
        </Note>
      ) : (
        <TableContainer sx={{ mb: 5 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <HeadCell label="#" align="right" />
                <HeadCell label="Symbol" />
                <HeadCell
                  label="Sector"
                  help="Click to open the sector's full history. Unlike Setups, this list ignores sector state entirely — a leader qualifies on its own strength."
                />
                <HeadCell k="adj" align="right" />
                <HeadCell
                  label="12m momentum"
                  help="Return over the twelve months ending one month ago. The recent month is excluded because short-term gains tend to reverse, which would contaminate the signal."
                  align="right"
                />
                <HeadCell
                  label="Percentile"
                  help="Where that twelve-month return ranks against every other liquid stock on the scan date. Only the top decile reaches this list."
                  align="right"
                />
                <HeadCell
                  label="Above 50-day"
                  help="How far above its 50-day average the stock closed. Must be positive to appear here — tested directly, the names above their 50-day beat the ones below by +0.80% over seven sessions."
                  align="right"
                />
                <HeadCell
                  label="Last month"
                  help="Return over the most recent 20 sessions — the stretch excluded from the momentum score. Shown so you can see whether the leader is currently running or resting."
                  align="right"
                />
                <HeadCell k="rsi" align="right" />
                <HeadCell
                  label="ATR %"
                  help="Average daily range as a share of price. Higher means wider swings, so size the position smaller."
                  align="right"
                />
                <HeadCell
                  label="Turnover"
                  help="60-day median daily traded value in ₹ lakh. Higher is easier to get in and out of."
                  align="right"
                />
              </TableRow>
            </TableHead>
            <TableBody>
              {shown.map((r, i) => (
                <TableRow key={r.symbol} hover>
                  <TableCell align="right" className="num" sx={{ color: C.muted }}>
                    {i + 1}
                  </TableCell>
                  <TableCell
                    className={onOpenStock ? "linkish" : undefined}
                    sx={{ fontWeight: 500 }}
                    onClick={() => onOpenStock?.(r.symbol)}
                  >
                    {r.symbol}
                  </TableCell>
                  <TableCell
                    className="row-click linkish"
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenSector?.(r.sector)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") onOpenSector?.(r.sector);
                    }}
                    sx={{ maxWidth: 240 }}
                  >
                    {r.sector}
                  </TableCell>
                  <TableCell align="right" className="num">{num(r.adj, 2)}</TableCell>
                  <TableCell
                    align="right"
                    className="num"
                    sx={{ color: C.good, fontWeight: 500 }}
                  >
                    {pct(r.mom12_1, 0)}
                  </TableCell>
                  <TableCell align="right" className="num">
                    {r.mom_rank == null ? "—" : `${(r.mom_rank * 100).toFixed(0)}th`}
                  </TableCell>
                  <TableCell align="right" className="num">{pct(r.ext_ema50, 1)}</TableCell>
                  <TableCell
                    align="right"
                    className="num"
                    sx={{ color: (r.mom20 ?? 0) < 0 ? C.muted : undefined }}
                  >
                    {pct(r.mom20, 1)}
                  </TableCell>
                  <TableCell align="right" className="num">{num(r.rsi, 1)}</TableCell>
                  <TableCell align="right" className="num">{pct(r.atr_pct, 1)}</TableCell>
                  <TableCell align="right" className="num">
                    {num(r.med_turn60, 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Tooltip
        title="Twelve-month momentum is one of the most replicated effects in equities, documented across decades and dozens of markets. Our own history is too short to confirm it independently — about 9 independent periods at this holding length — so no win rate is advertised here."
        placement="top"
        arrow
      >
        <Typography
          sx={{ fontSize: 13, color: C.muted, cursor: "help", display: "inline-block" }}
        >
          Why no track record on this tab?
        </Typography>
      </Tooltip>
    </Box>
  );
}
