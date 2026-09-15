/**
 * Leaders at rest — the coil pool ordered by 12-month momentum, cut to 20.
 *
 * A name qualifies on the coil gates (quiet, tight, near its highs) and is
 * then ranked by how strong its last year was, so the top of this list is a
 * proven leader taking a rest. The gates time the entry; momentum picks which
 * bases are worth the wait.
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
  Chip,
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
import { CoilBar, HeadCell, MultiSelect, Note, PageIntro, useTableSort } from "./ui.jsx";
import { C } from "../theme.js";
import { num, pct } from "../format.js";

export default function LeadersAtRestTab({ rows, coilReady, onOpenSector, onOpenStock }) {
  const [q, setQ] = useState("");
  const [sectorPick, setSectorPick] = useState([]);
  // Default order is the backend's: strongest twelve months first.
  const sort = useTableSort({
    key: "mom12_1",
    dir: "desc",
    // Symbol and sector read naturally A-Z; every measure wants big-first.
    dirFor: (k) => (k === "symbol" || k === "sector" ? "asc" : "desc"),
  });

  // The momentum rank is assigned once, from the order the scan delivered, so
  // re-sorting by RSI or turnover cannot renumber it into something false.
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
      <Note>
        This list measures each stock against its 200-day trend and its last
        twelve months, which needs about 290 sessions of history. The data is
        still loading — it will fill in once the panel is deep enough.
      </Note>
    );
  }

  const sectors = new Set(ranked.map((r) => r.sector)).size;
  const filtering = shown.length !== ranked.length;

  return (
    <Box>
      <PageIntro
        title="Leaders at rest"
        action={
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <MultiSelect
              label="Sector"
              options={sectorOptions}
              selected={sectorPick}
              onChange={setSectorPick}
              width={260}
            />
            <TextField
              size="small"
              placeholder="Symbol or sector"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              sx={{ width: 200 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: C.muted }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        }
      >
        The {ranked.length} coiled names with the strongest last twelve months,
        spread across {sectors} {sectors === 1 ? "sector" : "sectors"}. Every
        row cleared the same seven coil filters — quiet, tight, near its highs
        — and they are ordered by twelve-month return, so a stock near the top
        has both gone quiet <em>and</em> been a genuine leader. Momentum is
        measured over the year ending a month ago, since very recent gains tend
        to give back. Act the same way as any coil: on a close through the
        level in "To breakout" on heavy volume, not on today's price.
      </PageIntro>

      <Note>
        This is the one list here where sort order means something. The coil
        score does not predict returns and never ordered this list; twelve-month
        momentum does, consistently from the top of the ranking to the bottom.
        Ranking the pool this way and keeping 20 measured about twice the edge
        of showing all 63 — but on five months of history, so treat the order as
        a sensible priority rather than a promise.
      </Note>

      {filtering && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
          <Typography sx={{ fontSize: 13, color: C.muted }}>
            Showing {shown.length} of {ranked.length}
          </Typography>
          <Button
            size="small"
            onClick={() => {
              setQ("");
              setSectorPick([]);
            }}
            sx={{ textTransform: "none", color: C.accent, fontWeight: 400 }}
          >
            Clear filters
          </Button>
        </Box>
      )}

      {ranked.length === 0 ? (
        <Note>
          No stock is in a coil today. This scan only fires when price, trend,
          volume and range line up at once, which most sessions do not.
        </Note>
      ) : shown.length === 0 ? (
        <Note>
          Nothing matches those filters. Clear them to see all{" "}
          {ranked.length} names.
        </Note>
      ) : (
        <TableContainer sx={{ mb: 5 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <HeadCell
                  label="#"
                  help="Rank by twelve-month momentum, fixed when the scan ran. Re-sorting the table does not change it, so you can always see where a name sits in the original order."
                  align="right"
                  sort={sort}
                  sortKey="rank"
                />
                <HeadCell label="Symbol" sort={sort} sortKey="symbol" />
                <HeadCell
                  label="12m momentum"
                  help="Return over the twelve months ending one month ago — the column this list is sorted by out of the box. The recent month is excluded because short-term gains tend to reverse, which would contaminate the ranking."
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
                  sx={
                    r.recommended
                      ? { "& td:first-of-type": { boxShadow: `inset 2px 0 0 ${C.good}` } }
                      : undefined
                  }
                >
                  <TableCell align="right" className="num" sx={{ color: C.muted }}>
                    {r.rank}
                  </TableCell>
                  <TableCell
                    className={onOpenStock ? "linkish" : undefined}
                    sx={{ fontWeight: 500 }}
                    onClick={() => onOpenStock?.(r.symbol)}
                  >
                    {r.symbol}
                    {r.recommended && (
                      <Tooltip
                        title="This stock's sector is also waking up or resting after waking up, so it appears under Sector agrees too."
                        placement="top"
                        arrow
                      >
                        <Chip
                          size="small"
                          label="Sector agrees"
                          sx={{
                            ml: 1,
                            bgcolor: "rgba(125,186,150,0.12)",
                            color: C.good,
                            cursor: "help",
                          }}
                        />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell
                    align="right"
                    className="num"
                    sx={{ color: C.good, fontWeight: 500 }}
                  >
                    {r.mom12_1 == null ? "—" : pct(r.mom12_1, 0)}
                  </TableCell>
                  <TableCell align="right" className="num">
                    {/* episode_new comes from episode tracking, which bridges
                        three-session gaps. Keying "New" off coil_days === 1
                        labelled 88% of these rows fresh when they were
                        long-standing bases that had wobbled once. */}
                    {r.episode_new ? (
                      <Chip
                        size="small"
                        label="New"
                        sx={{ bgcolor: "rgba(142,180,196,0.16)", color: C.accent }}
                      />
                    ) : (
                      (r.episode_days ?? r.coil_days ?? "—")
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
                    sx={{ maxWidth: 220 }}
                  >
                    {r.sector}
                  </TableCell>
                  <TableCell align="right" className="num">{num(r.adj, 2)}</TableCell>
                  <TableCell align="right" className="num">{pct(r.to_trigger, 1)}</TableCell>
                  <TableCell>
                    <CoilBar value={r.coil} />
                  </TableCell>
                  <TableCell align="right" className="num">{pct(r.pos_hi, 1)}</TableCell>
                  <TableCell align="right" className="num">{num(r.rsi, 1)}</TableCell>
                  <TableCell align="right" className="num">{num(r.vol_ratio)}</TableCell>
                  <TableCell align="right" className="num">{pct(r.range20, 1)}</TableCell>
                  <TableCell align="right" className="num">{num(r.cmf)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
