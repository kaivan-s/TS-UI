import { useEffect, useState } from "react";
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
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import KlassChip from "./KlassChip.jsx";
import { HeadCell } from "./ui.jsx";
import { C } from "../theme.js";
import { fmtDate, num, pct } from "../format.js";
import { M } from "../glossary.js";

const ACTION = {
  buy: { fg: C.good, bg: "rgba(125,186,150,0.08)" },
  add: { fg: C.accent, bg: "rgba(142,180,196,0.08)" },
  hold: { fg: C.warn, bg: "rgba(196,164,106,0.08)" },
  sell: { fg: C.bad, bg: "rgba(229,115,115,0.08)" },
  wait: { fg: C.muted, bg: "rgba(238,234,227,0.04)" },
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

function PhaseChip({ phase, label }) {
  const p = PHASE[phase] || PHASE.watching;
  return (
    <Chip
      size="small"
      label={label || p.label}
      sx={{
        bgcolor: `${p.fg}1f`,
        color: p.fg,
        fontWeight: 600,
        fontSize: 11,
      }}
    />
  );
}

function Check({ ok }) {
  if (ok) return <CheckCircleRoundedIcon sx={{ fontSize: 18, color: C.good }} />;
  return <CancelRoundedIcon sx={{ fontSize: 18, color: C.bad }} />;
}

function Metric({ label, k, value, hint, color, size = "normal" }) {
  const entry = (k && M[k]) || {};
  const text = label ?? entry.label ?? k;
  const help = hint ?? entry.help;
  const fontSize = size === "large" ? 20 : 15;
  
  return (
    <Box sx={{ minWidth: 0 }}>
      <Tooltip title={help || ""} placement="top" arrow enterDelay={400}>
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 500,
            color: "rgba(238,234,227,0.5)",
            textTransform: "uppercase",
            letterSpacing: "0.03em",
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

export default function StockDrawer({
  open, onClose, data, loading, onOpenSector, onLookup, onEntry,
}) {
  const m = data?.metrics || {};
  const plan = data?.plan;
  const act = ACTION[plan?.action] || ACTION.wait;
  const [entryDraft, setEntryDraft] = useState("");

  useEffect(() => {
    if (!open) return;
    const shown = plan?.entry ?? plan?.suggested_entry;
    setEntryDraft(shown != null ? String(shown) : "");
  }, [open, data?.symbol, plan?.entry, plan?.suggested_entry]);

  const applyEntry = () => {
    const n = Number(entryDraft);
    if (!Number.isFinite(n) || n <= 0) return;
    onEntry?.(n);
  };

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
        sx: { width: { xs: "100%", sm: 720 }, bgcolor: C.bg, p: 0 },
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
              <Typography sx={{ fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>
                {data?.symbol || data?.query || "Stock"}
              </Typography>
              {m.adj && (
                <Typography sx={{ fontSize: 20, fontWeight: 500, color: "rgba(238,234,227,0.6)" }}>
                  ₹{num(m.adj, 2)}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              {data?.found && <PhaseChip phase={data.phase} label={data.phase_label} />}
              {data?.sector_klass && <KlassChip klass={data.sector_klass} />}
              {data?.sector && (
                <Chip
                  size="small"
                  label={data.sector}
                  onClick={() => onOpenSector?.(data.sector)}
                  sx={{
                    bgcolor: "transparent",
                    border: `1px solid ${C.line}`,
                    color: C.text,
                    fontWeight: 500,
                    fontSize: 12,
                    cursor: "pointer",
                    "&:hover": { bgcolor: "rgba(238,234,227,0.06)" },
                  }}
                />
              )}
              {data?.as_of && (
                <Typography sx={{ fontSize: 12, color: "rgba(238,234,227,0.5)" }}>
                  {fmtDate(data.as_of)}
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
        {loading && (
          <Typography color="text.secondary">Reading the name…</Typography>
        )}

        {!loading && data?.found === false && (
          <Box>
            <Typography sx={{ fontSize: 15, mb: 1.25 }}>
              No match for "{data.query}".
            </Typography>
            {data.near?.length > 0 && (
              <>
                <Typography color="text.secondary" sx={{ fontSize: 14, mb: 1 }}>
                  Did you mean
                </Typography>
                {data.near.map((n) => (
                  <Typography
                    key={n.symbol}
                    className="linkish"
                    role="button"
                    tabIndex={0}
                    onClick={() => onLookup?.(n.symbol)}
                    sx={{ fontSize: 14, mb: 0.6 }}
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
              <Typography sx={{ fontSize: 14, lineHeight: 1.7, color: "rgba(238,234,227,0.7)" }}>
                {data.why}
              </Typography>
            )}

            {/* Entry Plan Card */}
            {plan && (
              <Card highlight={plan.action === "buy"} sx={{ bgcolor: act.bg, borderColor: `${act.fg}33` }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <Chip
                    size="small"
                    label={plan.action_label || plan.action}
                    sx={{
                      bgcolor: act.fg,
                      color: C.bg,
                      fontWeight: 700,
                      fontSize: 11,
                      textTransform: "uppercase",
                    }}
                  />
                  <Typography sx={{ fontSize: 12, color: "rgba(238,234,227,0.5)" }}>
                    mechanical levels · not a validated edge
                  </Typography>
                </Box>

                {/* Price levels grid */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 2,
                    mb: 2.5,
                  }}
                >
                  <Metric label="Entry" value={num(plan.entry, 2)} size="large" color={C.text} />
                  <Metric label="Stop" value={num(plan.stop, 2)} size="large" color={C.bad} />
                  <Metric label="Target" value={num(plan.target, 2)} size="large" color={C.good} />
                  <Metric label="Stretch" value={num(plan.target2, 2)} size="large" color={C.good} />
                </Box>

                {/* Entry input */}
                <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 2 }}>
                  <TextField
                    size="small"
                    label="Your entry"
                    value={entryDraft}
                    onChange={(e) => setEntryDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") applyEntry(); }}
                    sx={{ width: 120 }}
                  />
                  <Button
                    size="small"
                    variant="contained"
                    onClick={applyEntry}
                    disabled={loading}
                    sx={{
                      bgcolor: C.accent,
                      color: C.bg,
                      fontWeight: 600,
                      "&:hover": { bgcolor: "#7aa4b4" },
                    }}
                  >
                    Recalc
                  </Button>
                  {plan.suggested_entry != null && entryDraft !== String(plan.suggested_entry) && (
                    <Typography sx={{ fontSize: 12, color: "rgba(238,234,227,0.5)" }}>
                      system: {num(plan.suggested_entry, 2)}
                    </Typography>
                  )}
                </Box>

                {/* Risk info */}
                <Typography sx={{ fontSize: 13, lineHeight: 1.6, color: "rgba(238,234,227,0.65)" }}>
                  {plan.why}
                  {plan.risk != null && plan.rr != null && (
                    <Box component="span" sx={{ color: C.good, fontWeight: 600 }}>
                      {" "}Risk ₹{num(plan.risk, 2)} · {num(plan.rr, 1)}R
                    </Box>
                  )}
                </Typography>
              </Card>
            )}

            {/* Coil Status Card */}
            {filters.length > 0 && (
              <Card>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                  <SectionTitle>Coil Filters</SectionTitle>
                  <Chip
                    size="small"
                    label={`${passedFilters}/${totalFilters}`}
                    sx={{
                      bgcolor: passedFilters === totalFilters ? "rgba(125,186,150,0.15)" : "rgba(238,234,227,0.08)",
                      color: passedFilters === totalFilters ? C.good : C.muted,
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={coilProgress}
                  sx={{
                    mb: 2,
                    height: 4,
                    borderRadius: 2,
                    bgcolor: "rgba(238,234,227,0.08)",
                    "& .MuiLinearProgress-bar": {
                      bgcolor: passedFilters === totalFilters ? C.good : C.accent,
                      borderRadius: 2,
                    },
                  }}
                />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {filters.map((f) => (
                    <Box key={f.id} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                      <Check ok={f.ok} />
                      <Typography sx={{ fontSize: 13, lineHeight: 1.5, color: f.ok ? C.text : "rgba(238,234,227,0.5)" }}>
                        {f.text}
                      </Typography>
                    </Box>
                  ))}
                  {m.liquid === false && (
                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                      <Check ok={false} />
                      <Typography sx={{ fontSize: 13, lineHeight: 1.5, color: "rgba(238,234,227,0.5)" }}>
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
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2.5, mb: 3 }}>
                <Metric k="adj" value={num(m.adj, 2)} />
                <Metric k="trigger" value={num(m.trigger, 2)} />
                <Metric k="to_trigger" value={pct(m.to_trigger, 1)} color={m.to_trigger <= 3 ? C.good : undefined} />
                <Metric k="pos_hi" value={pct(m.pos_hi, 1)} color={m.pos_hi >= 90 ? C.good : undefined} />
                <Metric k="range20" value={pct(m.range20, 1)} color={m.range20 <= 14 ? C.good : undefined} />
                <Metric label="50 / 200 EMA" value={`${num(m.ema50, 1)} / ${num(m.ema200, 1)}`} />
              </Box>

              <SectionTitle icon={BarChartRoundedIcon}>Volume & Flow</SectionTitle>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2.5, mb: 3 }}>
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
                  <SectionTitle icon={TrendingUpRoundedIcon}>Sector</SectionTitle>
                  {data.sector && (
                    <Chip
                      size="small"
                      label={data.sector}
                      onClick={() => onOpenSector?.(data.sector)}
                      sx={{
                        bgcolor: "rgba(142,180,196,0.12)",
                        color: C.accent,
                        fontWeight: 500,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    />
                  )}
                </Box>
                <Typography sx={{ fontSize: 13, lineHeight: 1.65, color: "rgba(238,234,227,0.7)" }}>
                  {data.shape.verdict_text}
                  {data.sector_note ? ` ${data.sector_note}` : ""}
                </Typography>
              </Card>
            )}

            {/* Flagged dates */}
            {data.flags?.length > 0 && (
              <Typography sx={{ fontSize: 13, color: "rgba(238,234,227,0.6)", px: 0.5 }}>
                Flagged as a setup on {data.flags.map((f) => fmtDate(f.as_of)).join(", ")}.
              </Typography>
            )}

            {/* History table */}
            {data.history?.length > 0 && (
              <Card sx={{ p: 0, overflow: "hidden" }}>
                <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${C.line}` }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: C.text, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Last {data.history.length} Sessions
                  </Typography>
                </Box>
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small" sx={{ minWidth: 400 }}>
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
                          <TableCell sx={{ fontSize: 12, py: 1 }}>{fmtDate(r.date)}</TableCell>
                          <TableCell align="right" className="num" sx={{ fontSize: 12, py: 1 }}>{num(r.adj ?? r.close, 2)}</TableCell>
                          <TableCell align="right" className="num" sx={{ fontSize: 12, py: 1 }}>{pct(r.pos_hi, 1)}</TableCell>
                          <TableCell align="right" className="num" sx={{ fontSize: 12, py: 1 }}>{num(r.vol_ratio)}</TableCell>
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
