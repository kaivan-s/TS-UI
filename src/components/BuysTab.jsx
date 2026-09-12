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
import { C } from "../theme.js";
import { num, pct } from "../format.js";
import { STATES } from "../glossary.js";

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

export default function BuysTab({ rows, onOpenSector, onOpenStock }) {
  // Split on the sector's own state so each heading matches its rows.
  const resting = rows.filter((r) => r.sector_klass === "PULLBACK");
  const waking = rows.filter((r) => r.sector_klass === "CROSSING");
  const other = rows.filter(
    (r) => r.sector_klass !== "PULLBACK" && r.sector_klass !== "CROSSING",
  );

  return (
    <Box>
      <PageIntro title="Setups">
        Coiled stocks whose sector is also moving — the two halves of the scan
        agreeing. Nothing here is a buy at today's price: the plan is to set a
        price alert at the breakout level in the "To breakout" column and only
        act if the stock closes through it on heavy volume.
      </PageIntro>

      {rows.length === 0 ? (
        <Note>
          Nothing qualifies today. Either no sector is in a clean pullback, or
          the sectors that are have no stock coiled inside them right now.
          This is the normal state most days.
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
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <HeadCell label="Symbol" />
            <HeadCell label="Sector" help="Click to open the sector's full history." />
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
          {rows.map((r) => (
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
                </TableCell>
                <TableCell
                  className="row-click linkish"
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenSector(r.sector)}
                  sx={{ maxWidth: 240 }}
                >
                  {r.sector}
                  {r.sector_klass && (
                    <Tooltip
                      title={STATES[r.sector_klass]?.help || r.sector_klass}
                      placement="top"
                      arrow
                    >
                      <Typography
                        component="span"
                        sx={{
                          ml: 1,
                          px: 0.6,
                          py: 0.1,
                          fontSize: 10,
                          fontWeight: 500,
                          borderRadius: 0.4,
                          bgcolor: r.sector_klass === "PULLBACK" ? "rgba(95,180,95,0.12)" : "rgba(238,196,120,0.12)",
                          color: r.sector_klass === "PULLBACK" ? C.good : C.warn,
                        }}
                      >
                        {STATES[r.sector_klass]?.label || r.sector_klass}
                      </Typography>
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
              {r.why && <WhyRow cols={9}>{r.why}</WhyRow>}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
