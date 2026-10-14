import {
  Box,
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
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import KlassChip from "./KlassChip.jsx";
import TvChart from "./TvChart.jsx";
import { HeadCell } from "./ui.jsx";
import { BookmarkButton } from "../watchlist.jsx";
import { C } from "../theme.js";
import { fmtDate, num, pct } from "../format.js";
import { M } from "../glossary.js";

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

const PHASE = {
  broke_out: { fg: C.warn, label: "Broke out" },
  potential: { fg: C.good, label: "Potential" },
  coiled: { fg: C.accent, label: "Coiled" },
  near_miss: { fg: C.warn, label: "Near miss" },
  at_high: { fg: C.warn, label: "At the high" },
  momentum: { fg: C.warn, label: "Volume break" },
  watching: { fg: C.muted, label: "Watching" },
};

const TREND = {
  "↑↑": { label: "Accelerating", fg: C.good, bg: "rgba(125,186,150,0.14)", border: "rgba(125,186,150,0.32)" },
  "↑":  { label: "Growing",      fg: C.good, bg: "rgba(125,186,150,0.10)", border: "rgba(125,186,150,0.28)" },
  "→":  { label: "Flat",         fg: C.warn, bg: "rgba(196,164,106,0.10)", border: "rgba(196,164,106,0.28)" },
  "↓":  { label: "Declining",    fg: C.bad,  bg: "rgba(200,122,122,0.10)", border: "rgba(200,122,122,0.28)" },
  "?":  { label: "No data",      fg: C.muted, bg: "rgba(238,234,227,0.04)", border: "rgba(238,234,227,0.12)" },
};

function fmtCr(v) {
  if (v == null || Number.isNaN(Number(v))) return "—";
  const n = Number(v);
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L Cr`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K Cr`;
  return `₹${n.toFixed(0)} Cr`;
}

function growthColor(v) {
  if (v == null) return undefined;
  return v > 0.05 ? C.good : v < -0.05 ? C.bad : C.warn;
}

function PhaseChip({ phase, label }) {
  const p = PHASE[phase] || PHASE.watching;
  return (
    <Box
      component="span"
      sx={{
        px: 0.9,
        py: 0.25,
        borderRadius: 1,
        bgcolor: `${p.fg}16`,
        border: `1px solid ${p.fg}36`,
        color: p.fg,
        fontFamily: MONO,
        fontWeight: 600,
        fontSize: 10.5,
      }}
    >
      {label || p.label}
    </Box>
  );
}

function Check({ ok }) {
  if (ok) return <CheckCircleRoundedIcon sx={{ fontSize: 17, color: C.good, mt: 0.15 }} />;
  return <CancelRoundedIcon sx={{ fontSize: 17, color: C.bad, mt: 0.15 }} />;
}

function Metric({ label, k, value, hint, color, size = "normal" }) {
  const entry = (k && M[k]) || {};
  const text = label ?? entry.label ?? k;
  const help = hint ?? entry.help;
  const fontSize = size === "large" ? 19 : 14.5;

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 1.75,
        bgcolor: "#111216",
        border: `1px solid ${C.line}`,
        minWidth: 0,
      }}
    >
      <Tooltip title={help || ""} placement="top" arrow enterDelay={300}>
        <Typography
          sx={{
            fontFamily: MONO,
            fontSize: 10,
            fontWeight: 500,
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            mb: 0.5,
            cursor: help ? "help" : "inherit",
          }}
        >
          {text}
        </Typography>
      </Tooltip>
      <Typography
        className="num"
        sx={{
          fontFamily: MONO,
          fontSize,
          fontWeight: 600,
          color: color || C.text,
          lineHeight: 1.2,
        }}
      >
        {value ?? "—"}
      </Typography>
    </Box>
  );
}

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

export default function StockDrawer({
  open,
  onClose,
  data,
  loading,
  onOpenSector,
  onLookup,
}) {
  const m = data?.metrics || {};
  const filters = data?.filters || [];
  const passedFilters = filters.filter((f) => f.ok).length;
  const totalFilters = filters.length;
  const coilProgress = totalFilters > 0 ? (passedFilters / totalFilters) * 100 : 0;

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
              EQUITY DOSSIER
            </Typography>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mb: 1 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>
                {data?.symbol || data?.query || "Stock"}
              </Typography>
              {m.adj && (
                <Typography sx={{ fontFamily: MONO, fontSize: 18, fontWeight: 500, color: C.muted }}>
                  ₹{num(m.adj, 2)}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              {data?.found && <PhaseChip phase={data.phase} label={data.phase_label} />}
              {data?.sector_klass && <KlassChip klass={data.sector_klass} />}
              {data?.sector && (
                <Box
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenSector?.(data.sector)}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    bgcolor: "rgba(255,255,255,0.03)",
                    border: `1px solid ${C.line}`,
                    color: C.text,
                    fontSize: 11.5,
                    fontWeight: 500,
                    cursor: "pointer",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.06)", borderColor: C.accent },
                  }}
                >
                  <span>{data.sector}</span>
                  <OpenInNewRoundedIcon sx={{ fontSize: 12, color: C.muted }} />
                </Box>
              )}
              {data?.as_of && (
                <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>
                  As of {fmtDate(data.as_of)}
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
            {data?.symbol && <BookmarkButton symbol={data.symbol} size="medium" />}
            <IconButton onClick={onClose} size="small" sx={{ color: C.muted }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <Box sx={{ px: 3, py: 3, overflowY: "auto" }}>
        {loading && (
          <Typography color="text.secondary">Reading the name…</Typography>
        )}

        {!loading && data?.found === false && (
          <Box sx={{ p: 3, borderRadius: 2.5, bgcolor: "#15161b", border: `1px solid ${C.line}` }}>
            <Typography sx={{ fontSize: 15, mb: 1.25 }}>
              No match for &ldquo;{data.query}&rdquo;.
            </Typography>
            {data.near?.length > 0 && (
              <>
                <Typography color="text.secondary" sx={{ fontSize: 13.5, mb: 1 }}>
                  Did you mean:
                </Typography>
                {data.near.map((n) => (
                  <Typography
                    key={n.symbol}
                    className="linkish"
                    role="button"
                    tabIndex={0}
                    onClick={() => onLookup?.(n.symbol)}
                    sx={{ fontFamily: MONO, fontSize: 13.5, mb: 0.6 }}
                  >
                    {n.symbol}
                    {n.sector ? ` · ${n.sector}` : ""}
                  </Typography>
                ))}
              </>
            )}
          </Box>
        )}

        {!loading && data?.found && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {/* Summary description */}
            {data.why && (
              <Card sx={{ py: 1.75, px: 2.25 }}>
                <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", color: C.muted, mb: 0.4 }}>
                  SCAN DIAGNOSTIC
                </Typography>
                <Typography sx={{ fontSize: 13.5, lineHeight: 1.65, color: C.text }}>
                  {data.why}
                </Typography>
              </Card>
            )}

            {/* TradingView chart */}
            <TvChart symbol={data.symbol} height={420} />

            {/* Fundamentals Card */}
            {data.fundamentals && data.fundamentals.market_cap_cr != null && (() => {
              const f = data.fundamentals;
              const t = TREND[f.earnings_trend] || TREND["?"];
              return (
                <Card>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.75 }}>
                    <SectionTitle icon={AccountBalanceRoundedIcon}>Fundamentals</SectionTitle>
                    <Box
                      component="span"
                      sx={{
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        bgcolor: t.bg,
                        border: `1px solid ${t.border}`,
                        color: t.fg,
                        fontFamily: MONO,
                        fontWeight: 600,
                        fontSize: 11,
                      }}
                    >
                      {f.earnings_trend || "?"} · {t.label}
                    </Box>
                  </Box>

                  {/* Row 1: Headline numbers */}
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: 1.5, mb: 1.5 }}>
                    <Metric label="Market Cap" value={fmtCr(f.market_cap_cr)} />
                    <Metric
                      label="PE (TTM)"
                      value={f.pe_ttm != null ? num(f.pe_ttm, 1) : "—"}
                      color={f.pe_ttm > 0 && f.pe_ttm < 25 ? C.good : f.pe_ttm > 50 ? C.bad : undefined}
                    />
                    <Metric
                      label="Promoter %"
                      value={f.promoter_pct != null ? `${num(f.promoter_pct, 1)}%` : "—"}
                      color={f.promoter_pct >= 50 ? C.good : f.promoter_pct < 30 ? C.bad : undefined}
                    />
                    <Metric
                      label="OPM"
                      value={f.latest_opm_pct != null ? `${num(f.latest_opm_pct, 1)}%` : "—"}
                      color={f.latest_opm_pct > 15 ? C.good : f.latest_opm_pct < 5 ? C.bad : undefined}
                    />
                  </Box>

                  {/* Row 2: TTM + growth */}
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: 1.5, mb: 2 }}>
                    <Metric label="TTM Revenue" value={fmtCr(f.ttm_revenue_cr)} />
                    <Metric label="TTM PAT" value={fmtCr(f.ttm_pat_cr)} />
                    <Metric
                      label="Rev Growth YoY"
                      value={f.latest_revenue_growth_yoy != null ? pct(f.latest_revenue_growth_yoy) : "—"}
                      color={growthColor(f.latest_revenue_growth_yoy)}
                    />
                    <Metric
                      label="PAT Growth YoY"
                      value={f.latest_pat_growth_yoy != null ? pct(f.latest_pat_growth_yoy) : "—"}
                      color={growthColor(f.latest_pat_growth_yoy)}
                    />
                  </Box>

                  {/* Quarterly breakdown mini-table */}
                  {f.quarters?.length > 0 && (
                    <Box
                      sx={{
                        borderRadius: 1.75,
                        border: `1px solid ${C.line}`,
                        overflow: "hidden",
                      }}
                    >
                      <Box sx={{ overflowX: "auto" }}>
                        <Table size="small" sx={{ minWidth: 380, ...TABLE_SX }}>
                          <TableHead>
                            <TableRow>
                              <HeadCell label="Quarter" />
                              <HeadCell label="Revenue" align="right" />
                              <HeadCell label="PAT" align="right" />
                              <HeadCell label="OPM %" align="right" />
                              <HeadCell label="EPS" align="right" />
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {f.quarters.slice(0, 6).map((q) => (
                              <TableRow key={q.quarter} sx={{ "&:last-child td": { border: 0 } }}>
                                <TableCell sx={{ fontFamily: MONO, fontSize: 12, py: 0.85, fontWeight: 500 }}>{q.quarter}</TableCell>
                                <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, py: 0.85 }}>{fmtCr(q.revenue_cr)}</TableCell>
                                <TableCell
                                  align="right"
                                  className="num"
                                  sx={{
                                    fontFamily: MONO,
                                    fontSize: 12,
                                    py: 0.85,
                                    color: q.pat_cr > 0 ? C.good : q.pat_cr < 0 ? C.bad : undefined,
                                  }}
                                >
                                  {fmtCr(q.pat_cr)}
                                </TableCell>
                                <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, py: 0.85 }}>
                                  {q.opm_pct != null ? `${num(q.opm_pct, 1)}%` : "—"}
                                </TableCell>
                                <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, py: 0.85 }}>
                                  {q.eps_basic != null ? num(q.eps_basic, 2) : "—"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    </Box>
                  )}

                  {f.industry && (
                    <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.muted, mt: 1.5 }}>
                      {f.industry}
                      {f.updated_at ? ` · Updated ${fmtDate(f.updated_at?.slice(0, 10))}` : ""}
                    </Typography>
                  )}
                </Card>
              );
            })()}

            {/* Coil Status Card */}
            {filters.length > 0 && (
              <Card>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.75 }}>
                  <SectionTitle>Coil Gate Diagnostics</SectionTitle>
                  <Box
                    component="span"
                    sx={{
                      px: 1,
                      py: 0.25,
                      borderRadius: 1,
                      bgcolor: passedFilters === totalFilters ? "rgba(125,186,150,0.14)" : "rgba(238,234,227,0.06)",
                      border: `1px solid ${passedFilters === totalFilters ? "rgba(125,186,150,0.32)" : C.line}`,
                      color: passedFilters === totalFilters ? C.good : C.muted,
                      fontFamily: MONO,
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                  >
                    {passedFilters}/{totalFilters} GATES
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={coilProgress}
                  sx={{
                    mb: 2.25,
                    height: 4,
                    borderRadius: 2,
                    bgcolor: "rgba(238,234,227,0.08)",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: passedFilters === totalFilters ? C.good : C.accent,
                      borderRadius: 2,
                    },
                  }}
                />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.1 }}>
                  {filters.map((f) => (
                    <Box key={f.id} sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
                      <Check ok={f.ok} />
                      <Typography sx={{ fontSize: 12.75, lineHeight: 1.5, color: f.ok ? C.text : C.muted }}>
                        {f.text}
                      </Typography>
                    </Box>
                  ))}
                  {m.liquid === false && (
                    <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
                      <Check ok={false} />
                      <Typography sx={{ fontSize: 12.75, lineHeight: 1.5, color: C.muted }}>
                        Median turnover below liquidity floor — excluded from scan
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Card>
            )}

            {/* Key Metrics */}
            <Card>
              <SectionTitle icon={ShowChartRoundedIcon}>Price & Position</SectionTitle>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" }, gap: 1.5, mb: 2.75 }}>
                <Metric k="adj" value={num(m.adj, 2)} />
                <Metric k="trigger" value={num(m.trigger, 2)} />
                <Metric k="to_trigger" value={pct(m.to_trigger, 1)} color={m.to_trigger <= 3 ? C.good : undefined} />
                <Metric k="pos_hi" value={pct(m.pos_hi, 1)} color={m.pos_hi >= 90 ? C.good : undefined} />
                <Metric k="range20" value={pct(m.range20, 1)} color={m.range20 <= 14 ? C.good : undefined} />
                <Metric label="50 / 200 EMA" value={`${num(m.ema50, 1)} / ${num(m.ema200, 1)}`} />
              </Box>

              <SectionTitle icon={BarChartRoundedIcon}>Volume & Flow</SectionTitle>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" }, gap: 1.5 }}>
                <Metric k="vol_ratio" value={num(m.vol_ratio)} color={m.vol_ratio <= 1 ? C.good : undefined} />
                <Metric k="vol_expand" value={m.vol_expand != null ? `${num(m.vol_expand, 2)}×` : "—"} />
                <Metric k="deliv_pct" value={m.deliv_pct != null ? `${num(m.deliv_pct, 1)}%` : "—"} />
                <Metric k="cmf" value={num(m.cmf)} color={m.cmf > 0 ? C.good : m.cmf < 0 ? C.bad : undefined} />
                <Metric k="coil" value={num(m.coil, 1)} color={m.coil >= 70 ? C.good : undefined} />
                <Metric k="rsi" value={num(m.rsi, 1)} color={m.rsi >= 45 && m.rsi <= 68 ? C.good : undefined} />
              </Box>
            </Card>

            {/* Sector info */}
            {data.shape?.verdict_text && (
              <Card>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                  <SectionTitle icon={TrendingUpRoundedIcon}>Sector Context</SectionTitle>
                  {data.sector && (
                    <Box
                      role="button"
                      tabIndex={0}
                      onClick={() => onOpenSector?.(data.sector)}
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.5,
                        px: 1.1,
                        py: 0.3,
                        borderRadius: 1,
                        bgcolor: "rgba(142,180,196,0.12)",
                        border: "1px solid rgba(142,180,196,0.28)",
                        color: C.accent,
                        fontFamily: MONO,
                        fontWeight: 600,
                        fontSize: 11,
                        cursor: "pointer",
                        "&:hover": { bgcolor: "rgba(142,180,196,0.18)" },
                      }}
                    >
                      <span>{data.sector}</span>
                      <OpenInNewRoundedIcon sx={{ fontSize: 12 }} />
                    </Box>
                  )}
                </Box>
                <Typography sx={{ fontSize: 13.25, lineHeight: 1.65, color: C.muted }}>
                  {data.shape.verdict_text}
                  {data.sector_note ? ` ${data.sector_note}` : ""}
                </Typography>
              </Card>
            )}

            {/* Flagged dates */}
            {data.flags?.length > 0 && (
              <Typography sx={{ fontFamily: MONO, fontSize: 12, color: C.muted, px: 0.5 }}>
                Flagged as a setup on {data.flags.map((f) => fmtDate(f.as_of)).join(", ")}.
              </Typography>
            )}

            {/* History table */}
            {data.history?.length > 0 && (
              <Card sx={{ p: 0, overflow: "hidden" }}>
                <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${C.line}` }}>
                  <Typography sx={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: C.text, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Last {data.history.length} Sessions
                  </Typography>
                </Box>
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small" sx={{ minWidth: 420, ...TABLE_SX }}>
                    <TableHead>
                      <TableRow>
                        <HeadCell label="Date" />
                        <HeadCell k="close" align="right" />
                        <HeadCell k="pos_hi" align="right" />
                        <HeadCell k="vol_ratio" align="right" />
                        <HeadCell k="cmf" align="right" />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[...(data.history || [])].reverse().slice(0, 10).map((r) => (
                        <TableRow key={r.date} sx={{ "&:last-child td": { border: 0 } }}>
                          <TableCell sx={{ fontFamily: MONO, fontSize: 12, py: 1 }}>{fmtDate(r.date)}</TableCell>
                          <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, py: 1 }}>{num(r.adj ?? r.close, 2)}</TableCell>
                          <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, py: 1 }}>{pct(r.pos_hi, 1)}</TableCell>
                          <TableCell align="right" className="num" sx={{ fontFamily: MONO, fontSize: 12, py: 1 }}>{num(r.vol_ratio)}</TableCell>
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
