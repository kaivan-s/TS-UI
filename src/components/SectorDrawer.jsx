import { Fragment } from "react";
import {
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import KlassChip from "./KlassChip.jsx";
import { HeadCell, Note, WhyRow } from "./ui.jsx";
import { useAuth } from "../auth.jsx";
import { C } from "../theme.js";
import { fmtDate, num, pct } from "../format.js";
import { STATES } from "../glossary.js";

function BlurOverlay({ children, isPremium, upgrade, busy }) {
  if (isPremium) return children;
  return (
    <Box sx={{ position: "relative" }}>
      <Box sx={{ filter: "blur(5px)", pointerEvents: "none", userSelect: "none" }}>
        {children}
      </Box>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "rgba(11,12,14,0.7)",
          borderRadius: 2,
        }}
      >
        <Box sx={{ textAlign: "center", p: 3 }}>
          <Typography sx={{ fontSize: 14, color: C.muted, mb: 2 }}>
            Upgrade to see full metrics
          </Typography>
          <Button
            variant="contained"
            onClick={() => upgrade?.("monthly")}
            disabled={busy}
            startIcon={<StarRoundedIcon sx={{ fontSize: 16 }} />}
            size="small"
            sx={{
              bgcolor: C.accent,
              color: C.bg,
              fontWeight: 600,
              "&:hover": { bgcolor: "#7aa4b4" },
            }}
          >
            {busy ? "Loading…" : "Upgrade · ₹499/mo"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

function BuyTable({ rows, isPremium, upgrade, busy }) {
  if (!rows?.length) return null;
  return (
    <BlurOverlay isPremium={isPremium} upgrade={upgrade} busy={busy}>
      <Table>
        <TableHead>
          <TableRow>
            <HeadCell label="Symbol" />
            <HeadCell k="adj" align="right" />
            <HeadCell k="coil" align="right" />
            <HeadCell k="to_trigger" align="right" />
            <HeadCell k="pos_hi" align="right" />
            <HeadCell k="rsi" align="right" />
            <HeadCell k="vol_ratio" align="right" />
            <HeadCell k="cmf" align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <Fragment key={r.symbol}>
              <TableRow sx={{ "& td:first-of-type": { boxShadow: `inset 2px 0 0 ${C.good}` } }}>
                <TableCell sx={{ fontWeight: 500 }}>{r.symbol}</TableCell>
                <TableCell align="right" className="num">{num(r.adj, 2)}</TableCell>
                <TableCell align="right" className="num">{num(r.coil, 1)}</TableCell>
                <TableCell align="right" className="num">{pct(r.to_trigger, 1)}</TableCell>
                <TableCell align="right" className="num">{pct(r.pos_hi, 1)}</TableCell>
                <TableCell align="right" className="num">{num(r.rsi, 1)}</TableCell>
                <TableCell align="right" className="num">{num(r.vol_ratio)}</TableCell>
                <TableCell align="right" className="num">{num(r.cmf)}</TableCell>
              </TableRow>
              {r.why && <WhyRow cols={8}>{r.why}</WhyRow>}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </BlurOverlay>
  );
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

function CheckIcon({ ok }) {
  if (ok === true) return <CheckCircleOutlineIcon sx={{ fontSize: 18, color: C.good, mt: "2px" }} />;
  if (ok === false) return <HighlightOffIcon sx={{ fontSize: 18, color: C.bad, mt: "2px" }} />;
  return <RemoveCircleOutlineIcon sx={{ fontSize: 18, color: C.muted, mt: "2px" }} />;
}

function ShapeCard({ shape }) {
  if (!shape) return null;
  const fg = VERDICT[shape.verdict] || VERDICT.no_crossing;
  return (
    <Box sx={{ mb: 3.5, pl: 2, borderLeft: `2px solid ${fg}` }}>
      <Typography sx={{ fontWeight: 500, fontSize: 15, color: C.text, mb: 1.25 }}>
        {shape.verdict_text}
      </Typography>
      {(shape.checks || []).map((c) => (
        <Box key={c.id} sx={{ display: "flex", gap: 1.25, mb: 1, alignItems: "flex-start" }}>
          <CheckIcon ok={c.ok} />
          <Typography sx={{ fontSize: 14, lineHeight: 1.5 }}>{c.text}</Typography>
        </Box>
      ))}
    </Box>
  );
}

export default function SectorDrawer({ open, onClose, data, loading }) {
  const { isPremium, upgrade, busy } = useAuth();
  const title = data?.sector || "Sector";
  const verdictColor = VERDICT[data?.shape?.verdict] || C.muted;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { 
          width: { xs: "100%", sm: 860 }, 
          bgcolor: C.bg, 
          p: 0,
          boxShadow: "-8px 0 32px rgba(0,0,0,0.4)",
        },
      }}
    >
      {/* Header with gradient accent */}
      <Box
        sx={{
          position: "relative",
          px: 4,
          py: 3,
          borderBottom: `1px solid ${C.line}`,
          background: `linear-gradient(135deg, rgba(142,180,196,0.08) 0%, transparent 100%)`,
        }}
      >
        {/* Accent bar */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${verdictColor} 0%, transparent 100%)`,
          }}
        />
        
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h1" 
              sx={{ 
                fontSize: 22, 
                fontWeight: 600, 
                letterSpacing: "-0.02em",
                mb: 0.5,
              }}
            >
              {title}
            </Typography>
            {data?.klass && (
              <>
                <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                  <KlassChip klass={data.klass} />
                  <Typography sx={{ fontSize: 13, color: C.muted }}>
                    {STATES[data.klass]?.short}
                  </Typography>
                </Box>
                {data.note && (
                  <Typography sx={{ fontSize: 13, color: C.muted, mt: 1 }}>
                    {data.note}
                  </Typography>
                )}
              </>
            )}
          </Box>
          <IconButton 
            onClick={onClose} 
            sx={{ 
              color: C.muted,
              bgcolor: "rgba(255,255,255,0.05)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ px: 4, py: 3.5, overflowY: "auto" }}>
        {loading && (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <Typography sx={{ color: C.muted, fontSize: 14 }}>Loading sector details…</Typography>
          </Box>
        )}
        {data?.found === false && (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography sx={{ color: C.muted, fontSize: 14 }}>
              No match.
              {data.near?.length ? ` Did you mean: ${data.near.join(", ")}` : ""}
            </Typography>
          </Box>
        )}

        {data?.found && (
          <>
            <ShapeCard shape={data.shape} />

            {data.shape?.recommend && (data.buys || []).length > 0 && (
              <Box sx={{ mb: 4, p: 2.5, bgcolor: "rgba(125,186,150,0.05)", borderRadius: 2, border: "1px solid rgba(125,186,150,0.1)" }}>
                <Typography sx={{ fontWeight: 600, fontSize: 14, color: C.good, mb: 0.75 }}>
                  Setups in this sector
                </Typography>
                <Typography sx={{ color: C.muted, mb: 2, fontSize: 13 }}>
                  Coiled stocks inside this pullback. Set an alert at the
                  breakout price — none of these is a buy at today's price.
                </Typography>
                <BuyTable rows={data.buys} isPremium={isPremium} upgrade={upgrade} busy={busy} />
              </Box>
            )}
            {data.shape?.recommend && !(data.buys || []).length && (
              <Note>
                The sector looks clean, but no stock inside it is coiled right
                now. Check the Coils tab again tomorrow.
              </Note>
            )}
            {data.klass === "PULLBACK" && !data.shape?.recommend && (
              <Note>
                This is a pullback, but one of the shape checks above failed —
                usually the volume surge did not come out of a genuinely quiet
                stretch. No setup list for this sector.
              </Note>
            )}

            {/* History Section */}
            <Box sx={{ mb: 4 }}>
              <Typography sx={{ fontWeight: 600, fontSize: 14, color: C.text, mb: 0.75, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Last 20 sessions
              </Typography>
              <Typography sx={{ color: C.muted, mb: 2, fontSize: 13 }}>
                Green stripe = volume surge day. Blue = lighter down day (healthy). 
                Red = heavier down day (sellers showed up).
              </Typography>
            <BlurOverlay isPremium={isPremium} upgrade={upgrade} busy={busy}>
              <Box sx={{ overflow: "auto", mb: 4 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <HeadCell label="Date" />
                      <HeadCell
                        label="Day"
                        help="Whether this session was the volume surge, a healthy light pullback day, or a heavy down day."
                      />
                      <HeadCell k="T" align="right" />
                      <HeadCell k="T_rel" align="right" />
                      <HeadCell k="B" align="right" />
                      <HeadCell k="deliv_quality_rel" align="right" />
                      <HeadCell k="cmf" align="right" />
                      <HeadCell k="rs" align="right" />
                      <HeadCell k="n_adv" align="right" />
                      <HeadCell k="top_share" align="right" />
                      <HeadCell k="ret" align="right" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...(data.history || [])].reverse().map((r) => {
                      const m = MARK[r.mark];
                      return (
                        <TableRow
                          key={r.date}
                          sx={m ? { "& td:first-of-type": { boxShadow: `inset 2px 0 0 ${m.fg}` } } : undefined}
                        >
                          <TableCell className="num">{fmtDate(r.date)}</TableCell>
                          <TableCell>
                            {m ? (
                              <Chip
                                size="small"
                                label={m.label}
                                sx={{
                                  color: m.fg,
                                  bgcolor: `${m.fg}1a`,
                                }}
                              />
                            ) : null}
                          </TableCell>
                          <TableCell align="right" className="num">{num(r.T)}</TableCell>
                          <TableCell align="right" className="num">{num(r.T_rel)}</TableCell>
                          <TableCell align="right" className="num">{num(r.B)}</TableCell>
                          <TableCell align="right" className="num">{num(r.deliv_quality_rel)}</TableCell>
                          <TableCell align="right" className="num">{num(r.cmf)}</TableCell>
                          <TableCell align="right" className="num">{num(r.rs, 1)}</TableCell>
                          <TableCell align="right" className="num">
                            {r.n_adv ?? "—"}/{r.n_stocks ?? "—"}
                          </TableCell>
                          <TableCell align="right" className="num">{num(r.top_share)}</TableCell>
                          <TableCell align="right" className="num">{pct(r.ret, 2)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            </BlurOverlay>
            </Box>

            {/* Constituents Section */}
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: 14, color: C.text, mb: 0.75, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Constituents
              </Typography>
              <Typography sx={{ color: C.muted, mb: 2, fontSize: 13 }}>
                Stocks in this sector, biggest by value traded first. Check whether 
                the move is broad or just one large company.
              </Typography>
              <BlurOverlay isPremium={isPremium} upgrade={upgrade} busy={busy}>
                <Table>
                <TableHead>
                  <TableRow>
                    <HeadCell label="Symbol" />
                    <HeadCell k="close" align="right" />
                    <HeadCell k="ret" label="Day %" align="right" />
                    <HeadCell k="turnover" align="right" />
                    <HeadCell k="deliv_pct" align="right" />
                    <HeadCell k="deliv_quality" align="right" />
                    <HeadCell k="cmf" align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data.constituents || []).map((r) => (
                    <TableRow key={r.symbol}>
                      <TableCell sx={{ fontWeight: 500 }}>{r.symbol}</TableCell>
                      <TableCell align="right" className="num">{num(r.close, 2)}</TableCell>
                      <TableCell align="right" className="num">{pct(r.ret, 2)}</TableCell>
                      <TableCell align="right" className="num">{num(r.turnover, 1)}</TableCell>
                      <TableCell align="right" className="num">{num(r.deliv_pct, 1)}</TableCell>
                      <TableCell align="right" className="num">{num(r.deliv_quality)}</TableCell>
                      <TableCell align="right" className="num">{num(r.cmf)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </BlurOverlay>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );
}
