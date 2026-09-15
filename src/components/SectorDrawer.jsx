import { Fragment } from "react";
import {
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
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

function Card({ children, highlight, sx }) {
  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2,
        bgcolor: highlight ? "rgba(125,186,150,0.06)" : C.paper,
        border: `1px solid ${highlight ? "rgba(125,186,150,0.2)" : C.line}`,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
      {Icon && <Icon sx={{ fontSize: 18, color: C.accent }} />}
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: C.text, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {children}
      </Typography>
    </Box>
  );
}

function Check({ ok }) {
  if (ok === true) return <CheckCircleRoundedIcon sx={{ fontSize: 18, color: C.good }} />;
  if (ok === false) return <CancelRoundedIcon sx={{ fontSize: 18, color: C.bad }} />;
  return <RemoveCircleRoundedIcon sx={{ fontSize: 18, color: "rgba(238,234,227,0.4)" }} />;
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
    <Card sx={{ borderColor: `${fg}33`, bgcolor: `${fg}0a` }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <SectionTitle icon={TrendingUpRoundedIcon}>Shape Analysis</SectionTitle>
        {total > 0 && (
          <Chip
            size="small"
            label={`${passed}/${total}`}
            sx={{
              bgcolor: passed === total ? "rgba(125,186,150,0.15)" : "rgba(238,234,227,0.08)",
              color: passed === total ? C.good : "rgba(238,234,227,0.6)",
              fontWeight: 600,
              fontSize: 12,
            }}
          />
        )}
      </Box>
      
      <Typography sx={{ fontWeight: 500, fontSize: 15, color: C.text, mb: 2 }}>
        {shape.verdict_text}
      </Typography>

      {total > 0 && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            mb: 2,
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

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {checks.map((c) => (
          <Box key={c.id} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
            <Check ok={c.ok} />
            <Typography sx={{ fontSize: 13, lineHeight: 1.5, color: c.ok ? C.text : "rgba(238,234,227,0.5)" }}>
              {c.text}
            </Typography>
          </Box>
        ))}
      </Box>
    </Card>
  );
}

function SetupsCard({ buys }) {
  if (!buys?.length) return null;
  return (
    <Card highlight>
      <SectionTitle icon={StarRoundedIcon}>Setups in this Sector</SectionTitle>
      <Typography sx={{ color: "rgba(238,234,227,0.6)", mb: 2.5, fontSize: 13 }}>
        Coiled stocks inside this pullback. Set an alert at the breakout price — none of these is a buy at today's price.
      </Typography>
      <Box sx={{ overflowX: "auto", mx: -2.5, px: 2.5 }}>
        <Table size="small" sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow>
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
                <TableRow sx={{ "& td:first-of-type": { boxShadow: `inset 2px 0 0 ${C.good}` } }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>{r.symbol}</TableCell>
                  <TableCell align="right" className="num" sx={{ fontSize: 13 }}>{num(r.adj, 2)}</TableCell>
                  <TableCell align="right" className="num" sx={{ fontSize: 13 }}>{num(r.coil, 1)}</TableCell>
                  <TableCell align="right" className="num" sx={{ fontSize: 13 }}>{pct(r.to_trigger, 1)}</TableCell>
                  <TableCell align="right" className="num" sx={{ fontSize: 13 }}>{pct(r.pos_hi, 1)}</TableCell>
                  <TableCell align="right" className="num" sx={{ fontSize: 13 }}>{num(r.rsi, 1)}</TableCell>
                  <TableCell align="right" className="num" sx={{ fontSize: 13 }}>{num(r.vol_ratio)}</TableCell>
                </TableRow>
                {r.why && <WhyRow cols={7}>{r.why}</WhyRow>}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Card>
  );
}

export default function SectorDrawer({ open, onClose, data, loading }) {
  const { isPremium, upgrade, busy } = useAuth();
  const title = data?.sector || "Sector";

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { 
          width: { xs: "100%", sm: 720 }, 
          bgcolor: C.bg, 
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
          bgcolor: C.bg,
          zIndex: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: "-0.02em", mb: 1 }}>
              {title}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              {data?.klass && <KlassChip klass={data.klass} />}
              {data?.klass && (
                <Typography sx={{ fontSize: 13, color: "rgba(238,234,227,0.6)" }}>
                  {STATES[data.klass]?.short}
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
              py: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 3,
                bgcolor: "rgba(142,180,196,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2.5,
              }}
            >
              <StarRoundedIcon sx={{ fontSize: 28, color: C.accent }} />
            </Box>
            <Typography sx={{ fontSize: 18, fontWeight: 600, color: C.text, mb: 1 }}>
              Sector Details
            </Typography>
            <Typography sx={{ fontSize: 14, color: "rgba(238,234,227,0.6)", mb: 3, maxWidth: 320 }}>
              Shape checks, history, and constituent stocks are available with a premium subscription.
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
            <Typography sx={{ color: "rgba(238,234,227,0.6)", fontSize: 14 }}>Loading sector details…</Typography>
          </Box>
        )}

        {isPremium && data?.found === false && (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography sx={{ color: "rgba(238,234,227,0.6)", fontSize: 14 }}>
              No match.
              {data.near?.length ? ` Did you mean: ${data.near.join(", ")}` : ""}
            </Typography>
          </Box>
        )}

        {isPremium && data?.found && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {/* Note */}
            {data.note && (
              <Typography sx={{ fontSize: 14, lineHeight: 1.7, color: "rgba(238,234,227,0.7)" }}>
                {data.note}
              </Typography>
            )}

            {/* Shape Analysis */}
            <ShapeCard shape={data.shape} />

            {/* Setups */}
            {data.shape?.recommend && <SetupsCard buys={data.buys} />}
            
            {data.shape?.recommend && !(data.buys || []).length && (
              <Card>
                <Typography sx={{ fontSize: 14, color: "rgba(238,234,227,0.6)" }}>
                  The sector looks clean, but no stock inside it is coiled right now. Check the Coils tab again tomorrow.
                </Typography>
              </Card>
            )}

            {data.klass === "PULLBACK" && !data.shape?.recommend && (
              <Card>
                <Typography sx={{ fontSize: 14, color: "rgba(238,234,227,0.6)" }}>
                  This is a pullback, but one of the shape checks above failed — usually the volume surge did not come out of a genuinely quiet stretch. No setup list for this sector.
                </Typography>
              </Card>
            )}

            {/* History */}
            {data.history?.length > 0 && (
              <Card sx={{ p: 0, overflow: "hidden" }}>
                <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${C.line}` }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TimelineRoundedIcon sx={{ fontSize: 18, color: C.accent }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: C.text, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Last {data.history.length} Sessions
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 12, color: "rgba(238,234,227,0.5)", mt: 0.75 }}>
                    Green = volume surge · Blue = light pullback · Red = heavy down
                  </Typography>
                </Box>
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small" sx={{ minWidth: 650 }}>
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
                            sx={m ? { "& td:first-of-type": { boxShadow: `inset 2px 0 0 ${m.fg}` } } : undefined}
                          >
                            <TableCell sx={{ fontSize: 12, py: 1 }}>{fmtDate(r.date)}</TableCell>
                            <TableCell sx={{ py: 1 }}>
                              {m ? (
                                <Chip
                                  size="small"
                                  label={m.label}
                                  sx={{
                                    color: m.fg,
                                    bgcolor: `${m.fg}1a`,
                                    fontSize: 10,
                                    height: 20,
                                  }}
                                />
                              ) : null}
                            </TableCell>
                            <TableCell align="right" className="num" sx={{ fontSize: 12, py: 1 }}>{num(r.T)}</TableCell>
                            <TableCell align="right" className="num" sx={{ fontSize: 12, py: 1 }}>{num(r.T_rel)}</TableCell>
                            <TableCell align="right" className="num" sx={{ fontSize: 12, py: 1 }}>{num(r.B)}</TableCell>
                            <TableCell align="right" className="num" sx={{ fontSize: 12, py: 1 }}>{num(r.cmf)}</TableCell>
                            <TableCell align="right" className="num" sx={{ fontSize: 12, py: 1 }}>{num(r.rs, 1)}</TableCell>
                            <TableCell align="right" className="num" sx={{ fontSize: 12, py: 1 }}>{pct(r.ret, 2)}</TableCell>
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
                    <GroupsRoundedIcon sx={{ fontSize: 18, color: C.accent }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: C.text, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Constituents
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 12, color: "rgba(238,234,227,0.5)", mt: 0.75 }}>
                    Stocks in this sector by value traded
                  </Typography>
                </Box>
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small" sx={{ minWidth: 500 }}>
                    <TableHead>
                      <TableRow>
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
                        <TableRow key={r.symbol} sx={{ "&:last-child td": { border: 0 } }}>
                          <TableCell sx={{ fontWeight: 500, fontSize: 12, py: 1 }}>{r.symbol}</TableCell>
                          <TableCell align="right" className="num" sx={{ fontSize: 12, py: 1 }}>{num(r.close, 2)}</TableCell>
                          <TableCell align="right" className="num" sx={{ fontSize: 12, py: 1, color: r.ret > 0 ? C.good : r.ret < 0 ? C.bad : undefined }}>{pct(r.ret, 2)}</TableCell>
                          <TableCell align="right" className="num" sx={{ fontSize: 12, py: 1 }}>{num(r.turnover, 1)}</TableCell>
                          <TableCell align="right" className="num" sx={{ fontSize: 12, py: 1 }}>{num(r.deliv_pct, 1)}</TableCell>
                          <TableCell align="right" className="num" sx={{ fontSize: 12, py: 1 }}>{num(r.cmf)}</TableCell>
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
