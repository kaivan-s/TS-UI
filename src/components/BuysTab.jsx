import { Fragment } from "react";
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
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { AccentRow, CoilBar, HeadCell, WhyRow } from "./ui.jsx";
import BaseRate from "./BaseRate.jsx";
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

function SectionHead({ eyebrow, color, title, count, children }) {
  return (
    <Box
      sx={{
        px: 2.5,
        py: 2,
        bgcolor: "#15161b",
        border: `1px solid ${C.line}`,
        borderBottom: "none",
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.35 }}>
          <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: color }} />
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: 10.5,
              letterSpacing: "0.14em",
              color,
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: C.text }}>
          {title}
        </Typography>
        <Typography sx={{ mt: 0.35, fontSize: 12.75, color: C.muted, lineHeight: 1.55, maxWidth: 740 }}>
          {children}
        </Typography>
      </Box>
      {count != null && (
        <Box
          component="span"
          sx={{
            px: 1.1,
            py: 0.3,
            borderRadius: 1,
            bgcolor: `${color}14`,
            border: `1px solid ${color}33`,
            fontFamily: MONO,
            fontSize: 11,
            fontWeight: 600,
            color,
            flexShrink: 0,
          }}
        >
          {count} {count === 1 ? "SETUP" : "SETUPS"}
        </Box>
      )}
    </Box>
  );
}

// Sectors whose shape checks all passed come first inside each section.
const byConfidence = (a, b) => Number(b.shape_confirmed) - Number(a.shape_confirmed);

export default function BuysTab({ rows, onOpenSector, onOpenStock }) {
  // Split on the sector's own state so each heading matches its rows.
  const resting = rows.filter((r) => r.sector_klass === "PULLBACK").sort(byConfidence);
  const waking = rows.filter((r) => r.sector_klass === "CROSSING").sort(byConfidence);
  const other = rows.filter(
    (r) => r.sector_klass !== "PULLBACK" && r.sector_klass !== "CROSSING",
  );

  // Across the backtest window a single sector was half or more of the list
  // on 85% of the sessions that produced setups. State the concentration.
  const bySector = rows.reduce((acc, r) => {
    acc[r.sector] = (acc[r.sector] || 0) + 1;
    return acc;
  }, {});
  const sectors = Object.keys(bySector).sort((a, b) => bySector[b] - bySector[a]);
  const top = sectors[0];

  return (
    <Box>
      <BaseRate metric="setups" />

      {rows.length > 1 && (
        <Box
          sx={{
            mb: 2.5,
            px: 2.5,
            py: 1.75,
            borderRadius: 2.5,
            bgcolor: "#15161b",
            border: `1px solid ${C.line}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          <Box>
            <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: C.accent, mb: 0.35 }}>
              SECTOR CONCENTRATION READOUT
            </Typography>
            <Typography sx={{ fontSize: 13.25, color: C.muted, lineHeight: 1.55 }}>
              <Box component="span" sx={{ fontFamily: MONO, color: C.text, fontWeight: 600 }}>{rows.length}</Box> names across{" "}
              <Box component="span" sx={{ fontFamily: MONO, color: C.text, fontWeight: 600 }}>{sectors.length}</Box>{" "}
              {sectors.length === 1 ? "sector" : "sectors"} —{" "}
              <Box component="span" sx={{ color: C.text, fontWeight: 500 }}>{top}</Box> accounts for{" "}
              <Box component="span" sx={{ fontFamily: MONO, color: C.good, fontWeight: 600 }}>
                {bySector[top]} of {rows.length} ({Math.round((bySector[top] / rows.length) * 100)}%)
              </Box>
              . Names inside one sector tend to resolve together, so treat the sector as the position rather than each row independently.
            </Typography>
          </Box>
        </Box>
      )}

      {rows.length === 0 ? (
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
            Nothing qualifies today — either no sector is moving, or the ones that are have no stock coiled inside them. Most sessions produce no setups, so an empty list is the filter working.
          </Typography>
        </Box>
      ) : (
        <>
          {resting.length > 0 && (
            <Box sx={{ mb: 3.5 }}>
              <SectionHead
                eyebrow="PULLBACK REGIME · PRIMARY COHORT"
                color={C.good}
                title="Sector is resting after a volume surge"
                count={resting.length}
              >
                The stronger case. The sector already surged on heavy volume, sellers never took over, and it is now easing back quietly.
              </SectionHead>
              <SetupTable
                rows={resting}
                onOpenSector={onOpenSector}
                onOpenStock={onOpenStock}
                color={C.good}
                label="Confirmed"
              />
            </Box>
          )}

          {waking.length > 0 && (
            <Box sx={{ mb: 3.5 }}>
              <SectionHead
                eyebrow="CROSSING REGIME · EARLY COHORT"
                color={C.warn}
                title="Sector surged today — early"
                count={waking.length}
              >
                The volume surge is happening right now, so the pullback shape has not formed yet. These may turn into the group above in a few sessions, or fail.
              </SectionHead>
              <SetupTable
                rows={waking}
                onOpenSector={onOpenSector}
                onOpenStock={onOpenStock}
                color={C.warn}
                label="Early"
              />
            </Box>
          )}

          {other.length > 0 && (
            <Box sx={{ mb: 3.5 }}>
              <SectionHead
                eyebrow="UNCLASSIFIED SECTOR"
                color={C.muted}
                title="Sector state unknown"
                count={other.length}
              >
                The stock is coiled but its sector could not be classified, usually because too few names in it are liquid enough to measure.
              </SectionHead>
              <SetupTable
                rows={other}
                onOpenSector={onOpenSector}
                onOpenStock={onOpenStock}
                color={C.muted}
                label="Unclassified"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

function SetupTable({ rows, onOpenSector, onOpenStock, color, label }) {
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
    <Box
      sx={{
        bgcolor: "#15161b",
        border: `1px solid ${C.line}`,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        overflow: "hidden",
      }}
    >
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table sx={{ minWidth: 780, ...TABLE_SX }}>
          <TableHead>
            <TableRow>
              <HeadCell label="" sx={{ width: 36, p: 0 }} />
              <HeadCell label="Symbol" />
              <HeadCell k="adj" align="right" />
              <HeadCell
                label="Earnings"
                help="Trajectory of year-on-year profit growth across recent quarters. ↑↑ accelerating, ↑ growing, → flat, ↓ declining."
                align="center"
              />
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
                    colSpan={10}
                    sx={{
                      py: 1,
                      px: 2,
                      bgcolor: "#111216",
                      borderBottom: `1px solid ${C.line}`,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                      <Box
                        role="button"
                        tabIndex={0}
                        onClick={() => onOpenSector?.(g.sector)}
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.75,
                          cursor: onOpenSector ? "pointer" : "default",
                          "&:hover .sector-title": { color: C.accent },
                        }}
                      >
                        <Typography
                          className="sector-title"
                          sx={{ fontSize: 13, fontWeight: 600, color: C.text, transition: "color 0.15s ease" }}
                        >
                          {g.sector}
                        </Typography>
                        <OpenInNewRoundedIcon sx={{ fontSize: 13, color: C.muted }} />
                      </Box>
                      <Box
                        component="span"
                        sx={{
                          px: 0.85,
                          py: 0.15,
                          borderRadius: 1,
                          bgcolor: "rgba(255,255,255,0.04)",
                          border: `1px solid ${C.line}`,
                          fontFamily: MONO,
                          fontSize: 10.5,
                          color: C.muted,
                        }}
                      >
                        {g.rows.length} {g.rows.length === 1 ? "name" : "names"}
                      </Box>
                    </Box>
                  </TableCell>
                </TableRow>
                {g.rows.map((r) => (
                  <Fragment key={r.symbol}>
                    <AccentRow
                      color={color}
                      sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.025) !important" } }}
                    >
                      <TableCell sx={{ py: 0, px: 0.75, width: 36 }}>
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
                        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.85, flexWrap: "wrap" }}>
                          <span>{r.symbol}</span>
                          <Box
                            component="span"
                            sx={{
                              px: 0.8,
                              py: 0.15,
                              borderRadius: 1,
                              bgcolor: `${color}18`,
                              border: `1px solid ${color}33`,
                              color,
                              fontFamily: MONO,
                              fontSize: 10,
                              fontWeight: 600,
                            }}
                          >
                            {label}
                          </Box>
                          {r.shape_confirmed && (
                            <Tooltip
                              title="Every shape check on this sector passed: the crossing came from quiet and the red days since have traded lighter. This is the subset the backtest measures."
                              placement="top"
                              arrow
                            >
                              <Box
                                component="span"
                                sx={{
                                  px: 0.8,
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
                                Shape confirmed
                              </Box>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                        {num(r.adj, 2)}
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
                      <TableCell>
                        <CoilBar value={r.coil} />
                      </TableCell>
                      <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                        {pct(r.pos_hi, 1)}
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
                      <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                        {num(r.rsi, 1)}
                      </TableCell>
                      <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.5 }}>
                        {num(r.vol_ratio)}
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
                    </AccentRow>
                    {r.why && <WhyRow cols={10}>{r.why}</WhyRow>}
                  </Fragment>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
