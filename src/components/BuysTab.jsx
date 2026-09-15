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
import { AccentRow, CoilBar, HeadCell, Note, PageIntro, WhyRow } from "./ui.jsx";
import BaseRate from "./BaseRate.jsx";
import { C } from "../theme.js";
import { num, pct } from "../format.js";

function SectionHead({ color, title, children }) {
  return (
    <>
      <Typography
        variant="subtitle2"
        sx={{ color, fontSize: 13.5, fontWeight: 500 }}
      >
        {title}
      </Typography>
      <Typography sx={{ mb: 1.5, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
        {children}
      </Typography>
    </>
  );
}

// Sectors whose shape checks all passed come first inside each section.
const byConfidence = (a, b) => Number(b.recommended) - Number(a.recommended);

export default function BuysTab({ rows, onOpenSector, onOpenStock }) {
  // Split on the sector's own state so each heading matches its rows.
  const resting = rows.filter((r) => r.sector_klass === "PULLBACK").sort(byConfidence);
  const waking = rows.filter((r) => r.sector_klass === "CROSSING").sort(byConfidence);
  const other = rows.filter(
    (r) => r.sector_klass !== "PULLBACK" && r.sector_klass !== "CROSSING",
  );
  const nConfirmed = rows.filter((r) => r.recommended).length;

  // This list is usually one sector wearing several names — across the
  // backtest window a single sector was half or more of it on 85% of the
  // sessions that produced setups. The row count alone implies breadth that
  // is not there, so state the split.
  const bySector = rows.reduce((acc, r) => {
    acc[r.sector] = (acc[r.sector] || 0) + 1;
    return acc;
  }, {});
  const sectors = Object.keys(bySector).sort((a, b) => bySector[b] - bySector[a]);
  const top = sectors[0];

  return (
    <Box>
      <PageIntro title="Setups">
        Coiled stocks whose sector is also moving — the two halves of the scan
        agreeing, and the only list here with a measured edge. Act on a close
        through the level in "To breakout" on heavy volume, not on today's
        price.
        {nConfirmed > 0 && (
          <>
            {" "}
            {nConfirmed} of {rows.length} sit in a sector that passed every
            shape check — those carry a "Shape confirmed" mark and are listed
            first.
          </>
        )}
      </PageIntro>

      <BaseRate metric="setups" />

      {rows.length > 1 && (
        <Note>
          {rows.length} names across {sectors.length}{" "}
          {sectors.length === 1 ? "sector" : "sectors"} — {top} is{" "}
          {bySector[top]} of {rows.length} (
          {Math.round((bySector[top] / rows.length) * 100)}%). Names inside one
          sector tend to resolve together, so the sector is the position rather
          than each row.
        </Note>
      )}

      {rows.length === 0 ? (
        <Note>
          Nothing qualifies today — either no sector is moving, or the ones
          that are have no stock coiled inside them. Most sessions produce no
          setups, so an empty list is the filter working.
        </Note>
      ) : (
        <>
          {resting.length > 0 && (
            <>
              <SectionHead color={C.good} title="Sector is resting after a volume surge">
                The stronger case. The sector already surged on heavy volume,
                sellers never took over, and it is now easing back quietly.
              </SectionHead>
              <SetupTable rows={resting} onOpenSector={onOpenSector} onOpenStock={onOpenStock} color={C.good} label="Confirmed" />
            </>
          )}

          {waking.length > 0 && (
            <Box sx={{ mt: resting.length > 0 ? 4 : 0 }}>
              <SectionHead color={C.warn} title="Sector surged today — early">
                The volume surge is happening right now, so there is no
                pullback to buy into yet. Watch rather than act; it may turn
                into the group above in a few sessions, or fail.
              </SectionHead>
              <SetupTable rows={waking} onOpenSector={onOpenSector} onOpenStock={onOpenStock} color={C.warn} label="Early" />
            </Box>
          )}

          {other.length > 0 && (
            <Box sx={{ mt: resting.length + waking.length > 0 ? 4 : 0 }}>
              <SectionHead color={C.muted} title="Sector state unknown">
                The stock is coiled but its sector could not be classified,
                usually because too few names in it are liquid enough to
                measure.
              </SectionHead>
              <SetupTable rows={other} onOpenSector={onOpenSector} onOpenStock={onOpenStock} color={C.muted} label="Unclassified" />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

function SetupTable({ rows, onOpenSector, onOpenStock, color, label }) {
  // Largest sector first, and every name under its own sector heading: the
  // concentration is the thing a reader needs to see before the row detail.
  const groups = Object.values(
    rows.reduce((acc, r) => {
      if (!acc[r.sector]) {
        acc[r.sector] = { sector: r.sector, klass: r.sector_klass, rows: [] };
      }
      acc[r.sector].rows.push(r);
      return acc;
    }, {}),
  ).sort(
    (a, b) => b.rows.length - a.rows.length || a.sector.localeCompare(b.sector),
  );

  return (
    <TableContainer sx={{ overflowX: "auto" }}>
      <Table sx={{ minWidth: 750 }}>
        <TableHead>
          <TableRow>
            <HeadCell label="Symbol" />
            <HeadCell k="adj" align="right" />
            <HeadCell k="coil" sx={{ minWidth: 140 }} />
            <HeadCell k="pos_hi" align="right" />
            <HeadCell k="to_trigger" align="right" />
            <HeadCell k="rsi" align="right" />
            <HeadCell k="vol_ratio" align="right" />
            <HeadCell k="cmf" align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {groups.map((g) => (
            <Fragment key={g.sector}>
              <TableRow>
                <TableCell
                  colSpan={8}
                  sx={{ py: 0.9, bgcolor: "rgba(238,234,227,0.03)" }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      component="span"
                      className="linkish"
                      role="button"
                      tabIndex={0}
                      onClick={() => onOpenSector(g.sector)}
                      sx={{ fontSize: 13, fontWeight: 500 }}
                    >
                      {g.sector}
                    </Typography>
                    <Typography component="span" sx={{ fontSize: 12, color: C.muted }}>
                      {g.rows.length} {g.rows.length === 1 ? "name" : "names"}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
              {g.rows.map((r) => (
                <Fragment key={r.symbol}>
                  <AccentRow color={color}>
                    <TableCell
                      className={onOpenStock ? "linkish" : undefined}
                      sx={{ fontWeight: 500 }}
                      onClick={() => onOpenStock?.(r.symbol)}
                    >
                      {r.symbol}
                      <Chip
                        size="small"
                        label={label}
                        sx={{
                          ml: 1,
                          bgcolor: `${color}1f`,
                          color: color,
                        }}
                      />
                      {r.recommended && (
                        <Tooltip
                          title="Every shape check on this sector passed: the crossing came from quiet and the red days since have traded lighter. This is the subset the backtest measures."
                          placement="top"
                          arrow
                        >
                          <Chip
                            size="small"
                            label="Shape confirmed"
                            sx={{
                              ml: 0.75,
                              bgcolor: "rgba(125,186,150,0.14)",
                              color: C.good,
                            }}
                          />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell align="right" className="num">{num(r.adj, 2)}</TableCell>
                    <TableCell>
                      <CoilBar value={r.coil} />
                    </TableCell>
                    <TableCell align="right" className="num">{pct(r.pos_hi, 1)}</TableCell>
                    <TableCell align="right" className="num">{pct(r.to_trigger, 1)}</TableCell>
                    <TableCell align="right" className="num">{num(r.rsi, 1)}</TableCell>
                    <TableCell align="right" className="num">{num(r.vol_ratio)}</TableCell>
                    <TableCell align="right" className="num">{num(r.cmf)}</TableCell>
                  </AccentRow>
                  {r.why && <WhyRow cols={8}>{r.why}</WhyRow>}
                </Fragment>
              ))}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
