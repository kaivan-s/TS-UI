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

import { Fragment } from "react";
import {
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { CoilBar, HeadCell, Note, PageIntro } from "./ui.jsx";
import { C } from "../theme.js";
import { num, pct } from "../format.js";

export default function LeadersAtRestTab({ rows, coilReady, onOpenSector, onOpenStock }) {
  if (!coilReady) {
    return (
      <Note>
        This list measures each stock against its 200-day trend and its last
        twelve months, which needs about 290 sessions of history. The data is
        still loading — it will fill in once the panel is deep enough.
      </Note>
    );
  }

  const sectors = new Set(rows.map((r) => r.sector)).size;

  return (
    <Box>
      <PageIntro title="Leaders at rest">
        The {rows.length} coiled names with the strongest last twelve months,
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

      {rows.length === 0 ? (
        <Note>
          No stock is in a coil today. This scan only fires when price, trend,
          volume and range line up at once, which most sessions do not.
        </Note>
      ) : (
        <TableContainer sx={{ mb: 5 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <HeadCell label="#" align="right" />
                <HeadCell label="Symbol" />
                <HeadCell
                  label="12m momentum"
                  help="Return over the twelve months ending one month ago — the column this list is sorted by. The recent month is excluded because short-term gains tend to reverse, which would contaminate the ranking."
                  align="right"
                />
                <HeadCell
                  label="Coiled"
                  help="Consecutive sessions this name has cleared all seven filters. 1 means it qualified today for the first time. A long run means the base has been sitting a while without resolving."
                  align="right"
                />
                <HeadCell
                  label="Sector"
                  help="Click to open the sector's full history and see whether money is rotating into it."
                />
                <HeadCell k="adj" align="right" />
                <HeadCell k="to_trigger" align="right" />
                <HeadCell k="coil" sx={{ minWidth: 120 }} />
                <HeadCell k="pos_hi" align="right" />
                <HeadCell k="rsi" align="right" />
                <HeadCell k="vol_ratio" align="right" />
                <HeadCell k="range20" align="right" />
                <HeadCell k="cmf" align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, i) => (
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
                    {i + 1}
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
                    {r.coil_days === 1 ? (
                      <Chip
                        size="small"
                        label="New"
                        sx={{ bgcolor: "rgba(142,180,196,0.16)", color: C.accent }}
                      />
                    ) : (
                      (r.coil_days ?? "—")
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
