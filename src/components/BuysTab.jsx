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
    py: 1.25,
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
        px: 2.25,
        py: 1.25,
        bgcolor: "#15161b",
        border: `1px solid ${C.line}`,
        borderBottom: "none",
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 1.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: 1.25 }}>
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: color }} />
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: 10.5,
              letterSpacing: "0.12em",
              color,
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: 13.75, fontWeight: 600, color: C.text }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: 12.25, color: C.muted }}>
          — {children}
        </Typography>
      </Box>
      {count != null && (
        <Box
          component="span"
          sx={{
            px: 0.9,
            py: 0.2,
            borderRadius: 1,
            bgcolor: `${color}14`,
            border: `1px solid ${color}33`,
            fontFamily: MONO,
            fontSize: 10.5,
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
  const emerging = rows.filter((r) => r.sector_klass === "CROSSING_UNVERIFIED").sort(byConfidence);
  const other = rows.filter(
    (r) =>
      r.sector_klass !== "PULLBACK" &&
      r.sector_klass !== "CROSSING" &&
      r.sector_klass !== "CROSSING_UNVERIFIED",
  );

  const fullSetups = resting.length + waking.length;

  return (
    <Box>
      {rows.length === 0 ? (
        <Box
          sx={{
            p: 4,
            borderRadius: 2.5,
            bgcolor: "#15161b",
            border: `1px solid ${C.line}`,
            textAlign: "center",
          }}
        >
          <Typography sx={{ fontSize: 13.75, color: C.muted, lineHeight: 1.6, maxWidth: 560, mx: "auto" }}>
            Nothing qualifies today — no sector is expanding, and no coiled stocks sit in sectors that are. Most sessions produce no setups, so an empty list is the filter working.
          </Typography>
        </Box>
      ) : (
        <>
          {resting.length > 0 && (
            <Box sx={{ mb: 2.5 }}>
              <SectionHead
                eyebrow="PULLBACK REGIME"
                color={C.good}
                title="Sector is resting after a volume surge"
                count={resting.length}
              >
                Volume surged earlier, sellers never took over, easing back quietly
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
            <Box sx={{ mb: 2.5 }}>
              <SectionHead
                eyebrow="CROSSING REGIME"
                color={C.warn}
                title="Sector surged today — early"
                count={waking.length}
              >
                Volume surge happening today; pullback shape has not formed yet
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

          {emerging.length > 0 && (
            <Box sx={{ mb: 2.5 }}>
              <SectionHead
                eyebrow="EMERGING"
                color="#7b8ab8"
                title="Sector expanding, not yet fully verified"
                count={emerging.length}
              >
                Turnover and breadth expanded but delivery width or participation
                is narrow — watch, don't act
              </SectionHead>
              {fullSetups === 0 && (
                <Box
                  sx={{
                    px: 2.25,
                    py: 1,
                    bgcolor: "#15161b",
                    borderLeft: `1px solid ${C.line}`,
                    borderRight: `1px solid ${C.line}`,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: C.muted,
                      fontStyle: "italic",
                      lineHeight: 1.5,
                    }}
                  >
                    No fully verified setups tonight. The names below are in
                    sectors that expanded but failed the breadth or delivery
                    check — treat them as a watchlist, not a buy list.
                  </Typography>
                </Box>
              )}
              <SetupTable
                rows={emerging}
                onOpenSector={onOpenSector}
                onOpenStock={onOpenStock}
                color="#7b8ab8"
                label="Emerging"
              />
            </Box>
          )}

          {other.length > 0 && (
            <Box sx={{ mb: 2.5 }}>
              <SectionHead
                eyebrow="UNCLASSIFIED"
                color={C.muted}
                title="Sector state unknown"
                count={other.length}
              >
                Coiled stock inside a sector with too few liquid names to classify
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
        <Table size="small" sx={{ minWidth: 780, ...TABLE_SX }}>
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
                      py: 0.75,
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
                          sx={{ fontSize: 12.75, fontWeight: 600, color: C.text, transition: "color 0.15s ease" }}
                        >
                          {g.sector}
                        </Typography>
                        <OpenInNewRoundedIcon sx={{ fontSize: 13, color: C.muted }} />
                      </Box>
                      <Box
                        component="span"
                        sx={{
                          px: 0.75,
                          py: 0.1,
                          borderRadius: 1,
                          bgcolor: "rgba(255,255,255,0.04)",
                          border: `1px solid ${C.line}`,
                          fontFamily: MONO,
                          fontSize: 10,
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
                          py: 1,
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
                      <TableCell align="right" className="num" sx={{ py: 1, fontFamily: MONO, fontSize: 12.5 }}>
                        {num(r.adj, 2)}
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1 }}>
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
                      <TableCell sx={{ py: 1 }}>
                        <CoilBar value={r.coil} />
                      </TableCell>
                      <TableCell align="right" className="num" sx={{ py: 1, fontFamily: MONO, fontSize: 12.5 }}>
                        {pct(r.pos_hi, 1)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="num"
                        sx={{
                          py: 1,
                          fontFamily: MONO,
                          fontSize: 12.5,
                          color: r.to_trigger <= 3 ? C.good : C.text,
                          fontWeight: r.to_trigger <= 3 ? 600 : 400,
                        }}
                      >
                        {pct(r.to_trigger, 1)}
                      </TableCell>
                      <TableCell align="right" className="num" sx={{ py: 1, fontFamily: MONO, fontSize: 12.5 }}>
                        {num(r.rsi, 1)}
                      </TableCell>
                      <TableCell align="right" className="num" sx={{ py: 1, fontFamily: MONO, fontSize: 12.5 }}>
                        {num(r.vol_ratio)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="num"
                        sx={{
                          py: 1,
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
