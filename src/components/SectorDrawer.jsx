import { Fragment } from "react";
import {
  Box,
  Button,
  Drawer,
  IconButton,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import RemoveCircleRoundedIcon from "@mui/icons-material/RemoveCircleRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import KlassChip from "./KlassChip.jsx";
import { HeadCell, WhyRow } from "./ui.jsx";
import { useAuth } from "../auth.jsx";
import { C } from "../theme.js";
import { fmtDate, num, pct } from "../format.js";
import { STATES } from "../glossary.js";
import { BookmarkButton } from "../watchlist.jsx";

const MONO = '"IBM Plex Mono", ui-monospace, monospace';

const TABLE_SX = {
  "& .MuiTableCell-stickyHeader, & .MuiTableCell-head": {
    bgcolor: "#0e0f12",
    fontFamily: MONO,
    fontSize: 10.5,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    py: 1.25,
  },
};

function Card({ children, highlight, sx }) {
  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2.5,
        bgcolor: highlight ? "rgba(125,186,150,0.05)" : "#15161b",
        border: `1px solid ${highlight ? "rgba(125,186,150,0.22)" : C.line}`,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.75 }}>
      {Icon && <Icon sx={{ fontSize: 17, color: C.accent }} />}
      <Typography
        sx={{
          fontFamily: MONO,
          fontSize: 11,
          fontWeight: 600,
          color: C.text,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}

function Check({ ok }) {
  if (ok === true) return <CheckCircleRoundedIcon sx={{ fontSize: 17, color: C.good, mt: 0.15 }} />;
  if (ok === false) return <CancelRoundedIcon sx={{ fontSize: 17, color: C.bad, mt: 0.15 }} />;
  return <RemoveCircleRoundedIcon sx={{ fontSize: 17, color: "rgba(238,234,227,0.4)", mt: 0.15 }} />;
}

const MARK = {
  crossing: { label: "Volume surge", fg: C.good },
  pullback: { label: "Light down day", fg: C.accent },
  heavy_red: { label: "Heavy down day", fg: C.bad },
};

const VERDICT = {
  orderly: C.good,
  crossing: C.good,
  waiting: C.accent,
  expand_not_quiet: C.warn,
  sellers_won: C.bad,
  no_crossing: C.muted,
};

function ShapeCard({ shape }) {
  if (!shape) return null;
  const fg = VERDICT[shape.verdict] || VERDICT.no_crossing;
  const checks = shape.checks || [];
  const passed = checks.filter((c) => c.ok === true).length;
  const total = checks.length;
  const progress = total > 0 ? (passed / total) * 100 : 0;

  return (
    <Card sx={{ borderColor: `${fg}33`, bgcolor: "#15161b" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.75 }}>
        <SectionTitle icon={TrendingUpRoundedIcon}>Shape Analysis</SectionTitle>
        {total > 0 && (
          <Box
            component="span"
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: 1,
              bgcolor: passed === total ? "rgba(125,186,150,0.14)" : "rgba(238,234,227,0.06)",
              border: `1px solid ${passed === total ? "rgba(125,186,150,0.32)" : C.line}`,
              color: passed === total ? C.good : C.muted,
              fontFamily: MONO,
              fontWeight: 600,
              fontSize: 11,
            }}
          >
            {passed}/{total} PASSED
          </Box>
        )}
      </Box>

      <Typography sx={{ fontWeight: 500, fontSize: 14.5, color: C.text, mb: 2, lineHeight: 1.5 }}>
        {shape.verdict_text}
      </Typography>

      {total > 0 && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            mb: 2.25,
            height: 4,
            borderRadius: 2,
            bgcolor: "rgba(238,234,227,0.08)",
            "& .MuiLinearProgress-bar": {
              bgcolor: passed === total ? C.good : fg,
              borderRadius: 2,
            },
          }}
        />
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.1 }}>
        {checks.map((c) => (
          <Box key={c.id} sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
            <Check ok={c.ok} />
            <Typography sx={{ fontSize: 12.75, lineHeight: 1.5, color: c.ok ? C.text : C.muted }}>
              {c.text}
            </Typography>
          </Box>
        ))}
      </Box>
    </Card>
  );
}

function SetupsCard({ buys, onOpenStock }) {
  if (!buys?.length) return null;
  return (
    <Card highlight sx={{ p: 0, overflow: "hidden" }}>
      <Box sx={{ p: 2.5, borderBottom: `1px solid ${C.line}` }}>
        <SectionTitle icon={StarRoundedIcon}>Setups in this Sector</SectionTitle>
        <Typography sx={{ color: C.muted, fontSize: 12.75, lineHeight: 1.55 }}>
          Coiled stocks inside this pullback. The breakout price is the level each one has yet to clear — none of them has confirmed at today&apos;s price.
        </Typography>
      </Box>
      <Box sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 620, ...TABLE_SX }}>
          <TableHead>
            <TableRow>
              <HeadCell label="" sx={{ width: 34, p: 0 }} />
              <HeadCell label="Symbol" />
              <HeadCell k="adj" align="right" />
              <HeadCell k="coil" align="right" />
              <HeadCell k="to_trigger" align="right" />
              <HeadCell k="pos_hi" align="right" />
              <HeadCell k="rsi" align="right" />
              <HeadCell k="vol_ratio" align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {buys.map((r) => (
              <Fragment key={r.symbol}>
                <TableRow
                  hover
                  sx={{
                    "& td:first-of-type": { boxShadow: `inset 2px 0 0 ${C.good}` },
                    "&:hover": { bgcolor: "rgba(255,255,255,0.025) !important" },
                  }}
                >
                  <TableCell sx={{ py: 0, px: 0.75, width: 34 }}>
                    <BookmarkButton symbol={r.symbol} />
                  </TableCell>
                  <TableCell
                    onClick={() => onOpenStock?.(r.symbol)}
                    sx={{
                      fontFamily: MONO,
                      fontWeight: 600,
                      fontSize: 12.75,
                      color: C.text,
                      cursor: onOpenStock ? "pointer" : "default",
                      "&:hover": onOpenStock ? { color: C.accent } : {},
                    }}
                  >
                    {r.symbol}
                  </TableCell>
                  <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.25 }}>{num(r.adj, 2)}</TableCell>
                  <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.25 }}>{num(r.coil, 1)}</TableCell>
                  <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.25 }}>{pct(r.to_trigger, 1)}</TableCell>
                  <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.25 }}>{pct(r.pos_hi, 1)}</TableCell>
                  <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.25 }}>{num(r.rsi, 1)}</TableCell>
                  <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12.25 }}>{num(r.vol_ratio)}</TableCell>
                </TableRow>
                {r.why && <WhyRow cols={8}>{r.why}</WhyRow>}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Card>
  );
}

export default function SectorDrawer({ open, onClose, data, loading, onOpenStock }) {
  const { isPremium, upgrade, busy } = useAuth();
  const title = data?.sector || "Sector";

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 760 },
          bgcolor: C.bg,
          borderLeft: `1px solid ${C.line}`,
          p: 0,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          borderBottom: `1px solid ${C.line}`,
          position: "sticky",
          top: 0,
          bgcolor: "#131419",
          zIndex: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", color: C.accent, mb: 0.5 }}>
              SECTOR DOSSIER
            </Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: "-0.02em", mb: 1 }}>
              {title}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
              {data?.klass && <KlassChip klass={data.klass} />}
              {data?.klass && STATES[data.klass] && (
                <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: C.muted }}>
                  {STATES[data.klass].label} · {STATES[data.klass].short}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: C.muted, mt: 0.5 }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ px: 3, py: 3, overflowY: "auto" }}>
        {/* Premium gate */}
        {!isPremium && (
          <Box
            sx={{
              py: 7,
              px: 3,
              borderRadius: 2.5,
              bgcolor: "#15161b",
              border: `1px solid ${C.line}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2.5,
                bgcolor: "rgba(142,180,196,0.1)",
                border: "1px solid rgba(142,180,196,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <StarRoundedIcon sx={{ fontSize: 26, color: C.accent }} />
            </Box>
            <Typography sx={{ fontSize: 18, fontWeight: 600, color: C.text, mb: 1 }}>
              Sector Dossier
            </Typography>
            <Typography sx={{ fontSize: 13.5, color: C.muted, mb: 3, maxWidth: 340 }}>
              Shape checks, session history, and constituent stocks are available with a Pro Desk membership.
            </Typography>
            <Button
              variant="contained"
              onClick={() => upgrade("monthly")}
              disabled={busy}
              startIcon={<StarRoundedIcon />}
              sx={{
                bgcolor: C.accent,
                color: C.bg,
                fontWeight: 600,
                textTransform: "none",
                px: 3,
                "&:hover": { bgcolor: "#7aa4b4" },
              }}
            >
              {busy ? "Loading…" : "Upgrade · ₹499/mo"}
            </Button>
          </Box>
        )}

        {isPremium && loading && (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <Typography sx={{ color: C.muted, fontSize: 14 }}>Loading sector details…</Typography>
          </Box>
        )}

        {isPremium && data?.found === false && (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography sx={{ color: C.muted, fontSize: 14 }}>
              {data.reason || "No match."}
              {data.near?.length ? ` Did you mean: ${data.near.join(", ")}` : ""}
            </Typography>
          </Box>
        )}

        {isPremium && data?.found && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {/* Note */}
            {data.note && (
              <Card sx={{ py: 1.75, px: 2.25 }}>
                <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", color: C.muted, mb: 0.5 }}>
                  CLASSIFICATION NOTE
                </Typography>
                <Typography sx={{ fontSize: 13.5, lineHeight: 1.65, color: C.text }}>
                  {data.note}
                </Typography>
              </Card>
            )}

            {/* Shape Analysis */}
            <ShapeCard shape={data.shape} />

            {/* Setups */}
            {data.shape?.recommend && <SetupsCard buys={data.buys} onOpenStock={onOpenStock} />}

            {data.shape?.recommend && !(data.buys || []).length && (
              <Card>
                <Typography sx={{ fontSize: 13.5, color: C.muted }}>
                  The sector looks clean, but no stock inside it is coiled right now. Check the Setups tab again tomorrow.
                </Typography>
              </Card>
            )}

            {data.klass === "PULLBACK" && !data.shape?.recommend && (
              <Card>
                <Typography sx={{ fontSize: 13.5, color: C.muted }}>
                  This is a pullback, but one of the shape checks above failed — usually the volume surge did not come out of a genuinely quiet stretch. No setup list for this sector.
                </Typography>
              </Card>
            )}

            {/* History */}
            {data.history?.length > 0 && (
              <Card sx={{ p: 0, overflow: "hidden" }}>
                <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${C.line}` }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TimelineRoundedIcon sx={{ fontSize: 17, color: C.accent }} />
                    <Typography sx={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: C.text, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      Last {data.history.length} Sessions
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 12, color: C.muted, mt: 0.5 }}>
                    Green = volume surge · Blue = light pullback · Red = heavy down
                  </Typography>
                </Box>
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small" sx={{ minWidth: 650, ...TABLE_SX }}>
                    <TableHead>
                      <TableRow>
                        <HeadCell label="Date" />
                        <HeadCell label="Day" />
                        <HeadCell k="T" align="right" />
                        <HeadCell k="T_rel" align="right" />
                        <HeadCell k="B" align="right" />
                        <HeadCell k="cmf" align="right" />
                        <HeadCell k="rs" align="right" />
                        <HeadCell k="ret" align="right" />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[...(data.history || [])].reverse().slice(0, 15).map((r) => {
                        const m = MARK[r.mark];
                        return (
                          <TableRow
                            key={r.date}
                            hover
                            sx={{
                              ...(m ? { "& td:first-of-type": { boxShadow: `inset 2px 0 0 ${m.fg}` } } : {}),
                              "&:hover": { bgcolor: "rgba(255,255,255,0.02) !important" },
                            }}
                          >
                            <TableCell sx={{ fontFamily: MONO, fontSize: 12, py: 1 }}>{fmtDate(r.date)}</TableCell>
                            <TableCell sx={{ py: 1 }}>
                              {m ? (
                                <Box
                                  component="span"
                                  sx={{
                                    px: 0.85,
                                    py: 0.2,
                                    borderRadius: 1,
                                    color: m.fg,
                                    bgcolor: `${m.fg}16`,
                                    border: `1px solid ${m.fg}33`,
                                    fontFamily: MONO,
                                    fontSize: 10.5,
                                    fontWeight: 600,
                                  }}
                                >
                                  {m.label}
                                </Box>
                              ) : null}
                            </TableCell>
                            <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, py: 1 }}>{num(r.T)}</TableCell>
                            <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, py: 1 }}>{num(r.T_rel)}</TableCell>
                            <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, py: 1 }}>{num(r.B)}</TableCell>
                            <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, py: 1 }}>{num(r.cmf)}</TableCell>
                            <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, py: 1 }}>{num(r.rs, 1)}</TableCell>
                            <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, py: 1 }}>{pct(r.ret, 2)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
              </Card>
            )}

            {/* Constituents */}
            {data.constituents?.length > 0 && (
              <Card sx={{ p: 0, overflow: "hidden" }}>
                <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${C.line}` }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <GroupsRoundedIcon sx={{ fontSize: 17, color: C.accent }} />
                    <Typography sx={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: C.text, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      Constituents
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 12, color: C.muted, mt: 0.5 }}>
                    Stocks in this sector ordered by value traded
                  </Typography>
                </Box>
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small" sx={{ minWidth: 540, ...TABLE_SX }}>
                    <TableHead>
                      <TableRow>
                        <HeadCell label="" sx={{ width: 34, p: 0 }} />
                        <HeadCell label="Symbol" />
                        <HeadCell k="close" align="right" />
                        <HeadCell label="Day %" align="right" />
                        <HeadCell k="turnover" align="right" />
                        <HeadCell k="deliv_pct" align="right" />
                        <HeadCell k="cmf" align="right" />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(data.constituents || []).slice(0, 15).map((r) => (
                        <TableRow
                          key={r.symbol}
                          hover
                          sx={{
                            "&:last-child td": { border: 0 },
                            "&:hover": { bgcolor: "rgba(255,255,255,0.025) !important" },
                          }}
                        >
                          <TableCell sx={{ py: 0, px: 0.75, width: 34 }}>
                            <BookmarkButton symbol={r.symbol} />
                          </TableCell>
                          <TableCell
                            onClick={() => onOpenStock?.(r.symbol)}
                            sx={{
                              fontFamily: MONO,
                              fontWeight: 600,
                              fontSize: 12.25,
                              py: 1,
                              color: C.text,
                              cursor: onOpenStock ? "pointer" : "default",
                              "&:hover": onOpenStock ? { color: C.accent } : {},
                            }}
                          >
                            {r.symbol}
                          </TableCell>
                          <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, py: 1 }}>{num(r.close, 2)}</TableCell>
                          <TableCell
                            align="right"
                            className="num"
                            sx={{
                              fontFamily: MONO,
                              fontSize: 12,
                              py: 1,
                              color: r.ret > 0 ? C.good : r.ret < 0 ? C.bad : undefined,
                            }}
                          >
                            {pct(r.ret, 2)}
                          </TableCell>
                          <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, py: 1 }}>{num(r.turnover, 1)}</TableCell>
                          <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, py: 1 }}>{num(r.deliv_pct, 1)}</TableCell>
                          <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, py: 1 }}>{num(r.cmf)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Card>
            )}
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
