import { useEffect, useState } from "react";
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
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import KlassChip from "./KlassChip.jsx";
import { HeadCell, Term } from "./ui.jsx";
import { C } from "../theme.js";
import { fmtDate, num, pct } from "../format.js";
import { M } from "../glossary.js";

const ACTION = {
  buy: { fg: C.good },
  add: { fg: C.accent },
  hold: { fg: C.warn },
  sell: { fg: C.bad },
  wait: { fg: C.muted },
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
        fontWeight: 500,
      }}
    />
  );
}

function Check({ ok }) {
  if (ok) return <CheckCircleOutlineIcon sx={{ fontSize: 18, color: C.good, mt: "2px" }} />;
  return <HighlightOffIcon sx={{ fontSize: 18, color: C.bad, mt: "2px" }} />;
}

function Metric({ label, k, children }) {
  const entry = (k && M[k]) || {};
  const text = label ?? entry.label ?? k;
  const help = entry.help;
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          fontSize: 12,
          color: "text.secondary",
          mb: 0.4,
          borderBottom: help ? `1px dotted ${C.muted}` : "none",
          display: "inline-block",
          cursor: help ? "help" : "inherit",
        }}
        title={help || undefined}
      >
        {text}
      </Typography>
      <Typography className="num" sx={{ fontSize: 15, fontWeight: 500, color: C.text }}>
        {children}
      </Typography>
    </Box>
  );
}

function Section({ title, children }) {
  return (
    <Box sx={{ mb: 3.5 }}>
      <Typography variant="h2" sx={{ mb: 1.25, fontSize: 15 }}>
        {title}
      </Typography>
      {children}
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

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: "100%", sm: 800 }, bgcolor: C.bg, p: 0 },
      }}
    >
      <Box
        sx={{
          px: 3.5,
          py: 2.5,
          borderBottom: `1px solid ${C.line}`,
          display: "flex",
          alignItems: "flex-start",
          gap: 2,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h1">{data?.symbol || data?.query || "Stock"}</Typography>
          <Box sx={{ mt: 1.25, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            {data?.found && <PhaseChip phase={data.phase} label={data.phase_label} />}
            {data?.sector_klass && <KlassChip klass={data.sector_klass} />}
            {data?.sector && (
              <Typography
                className="linkish"
                role="button"
                tabIndex={0}
                onClick={() => onOpenSector?.(data.sector)}
                sx={{ fontSize: 13.5 }}
              >
                {data.sector}
              </Typography>
            )}
            {data?.as_of && (
              <Typography variant="caption">
                as of {fmtDate(data.as_of)}
              </Typography>
            )}
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: C.muted }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ px: 3.5, py: 3 }}>
        {loading && (
          <Typography color="text.secondary">Reading the name…</Typography>
        )}

        {!loading && data?.found === false && (
          <Box>
            <Typography sx={{ fontSize: 15, mb: 1.25 }}>
              No match for “{data.query}”.
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
          <>
            {data.why && (
              <Box
                sx={{
                  mb: 3,
                  pl: 2,
                  borderLeft: `2px solid ${C.line}`,
                }}
              >
                <Typography sx={{ fontSize: 14.5, lineHeight: 1.65, color: "text.secondary" }}>
                  {data.why}
                </Typography>
              </Box>
            )}

            {plan && (
              <Box
                sx={{
                  mb: 3.5,
                  pl: 2,
                  borderLeft: `2px solid ${act.fg}`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
                  <Typography variant="h2" sx={{ fontSize: 15, mr: 0.25 }}>Plan</Typography>
                  <Chip
                    size="small"
                    label={plan.action_label || plan.action}
                    sx={{
                      bgcolor: `${act.fg}1f`,
                      color: act.fg,
                      fontWeight: 500,
                    }}
                  />
                  <Typography variant="caption">
                    mechanical levels from the 20-day base and 1.5 ATR — not a validated edge
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, flexWrap: "wrap" }}>
                  <TextField
                    size="small"
                    label="Your entry"
                    value={entryDraft}
                    onChange={(e) => setEntryDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") applyEntry(); }}
                    sx={{ width: 148 }}
                  />
                  <Button size="small" variant="outlined" onClick={applyEntry} disabled={loading}>
                    Recalc
                  </Button>
                  {plan.suggested_entry != null && (
                    <Typography variant="caption">
                      system entry {num(plan.suggested_entry, 2)}
                    </Typography>
                  )}
                </Box>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                    gap: 2,
                    mb: 1.5,
                  }}
                >
                  <Metric label="Entry">{num(plan.entry, 2)}</Metric>
                  <Metric label="Stop">{num(plan.stop, 2)}</Metric>
                  <Metric label="Target (2R)">{num(plan.target, 2)}</Metric>
                  <Metric label="Stretch">{num(plan.target2, 2)}</Metric>
                </Box>
                <Typography sx={{ fontSize: 14, lineHeight: 1.6, color: "text.secondary" }}>
                  {plan.why}
                  {plan.risk != null && plan.rr != null
                    ? ` Risk ₹${num(plan.risk, 2)} · ${num(plan.rr, 1)}R.`
                    : ""}
                </Typography>
              </Box>
            )}

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 2.25,
                mb: 3.5,
              }}
            >
              <Metric k="adj">{num(m.adj, 2)}</Metric>
              <Metric k="trigger">{num(m.trigger, 2)}</Metric>
              <Metric k="to_trigger">{pct(m.to_trigger, 1)}</Metric>
              <Metric k="pos_hi">{pct(m.pos_hi, 1)}</Metric>
              <Metric k="rsi">{num(m.rsi, 1)}</Metric>
              <Metric k="vol_ratio">{num(m.vol_ratio)}</Metric>
              <Metric k="vol_expand">{m.vol_expand != null ? `${num(m.vol_expand, 2)}×` : "—"}</Metric>
              <Metric k="range20">{pct(m.range20, 1)}</Metric>
              <Metric k="cmf">{num(m.cmf)}</Metric>
              <Metric k="deliv_pct">{m.deliv_pct != null ? `${num(m.deliv_pct, 1)}%` : "—"}</Metric>
              <Metric k="coil">{num(m.coil, 1)}</Metric>
              <Metric k="ema50">{num(m.ema50, 1)} / {num(m.ema200, 1)}</Metric>
            </Box>

            <Section title="Coil filters">
              {(data.filters || []).map((f) => (
                <Box key={f.id} sx={{ display: "flex", gap: 1.25, mb: 1, alignItems: "flex-start" }}>
                  <Check ok={f.ok} />
                  <Typography sx={{ fontSize: 14, lineHeight: 1.5 }}>{f.text}</Typography>
                </Box>
              ))}
              {m.liquid === false && (
                <Box sx={{ display: "flex", gap: 1.25, mb: 1, alignItems: "flex-start" }}>
                  <Check ok={false} />
                  <Typography sx={{ fontSize: 14, lineHeight: 1.5 }}>
                    Median turnover is below the liquidity floor — the scan ignores this name
                  </Typography>
                </Box>
              )}
            </Section>

            {data.shape?.verdict_text && (
              <Section
                title={
                  <>
                    Sector
                    {data.sector ? (
                      <Typography
                        component="span"
                        className="linkish"
                        onClick={() => onOpenSector?.(data.sector)}
                        sx={{ ml: 1, fontSize: 13.5, fontWeight: 400 }}
                      >
                        {data.sector}
                      </Typography>
                    ) : null}
                  </>
                }
              >
                <Typography sx={{ fontSize: 14, lineHeight: 1.6, color: "text.secondary" }}>
                  {data.shape.verdict_text}
                  {data.sector_note ? ` · ${data.sector_note}` : ""}
                </Typography>
              </Section>
            )}

            {data.flags?.length > 0 && (
              <Typography sx={{ fontSize: 14, mb: 3, color: "text.secondary" }}>
                Flagged as a setup on {data.flags.map((f) => fmtDate(f.as_of)).join(", ")}.
              </Typography>
            )}

            <Section title="Last 20 sessions">
              <Table>
                <TableHead>
                  <TableRow>
                    <HeadCell label="Date" />
                    <HeadCell k="close" align="right" />
                    <HeadCell k="pos_hi" align="right" />
                    <HeadCell k="vol_ratio" align="right" />
                    <HeadCell k="cmf" align="right" />
                    <HeadCell k="deliv_pct" align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...(data.history || [])].reverse().map((r) => (
                    <TableRow key={r.date}>
                      <TableCell>{fmtDate(r.date)}</TableCell>
                      <TableCell align="right" className="num">{num(r.adj ?? r.close, 2)}</TableCell>
                      <TableCell align="right" className="num">{pct(r.pos_hi, 1)}</TableCell>
                      <TableCell align="right" className="num">{num(r.vol_ratio)}</TableCell>
                      <TableCell align="right" className="num">{num(r.cmf)}</TableCell>
                      <TableCell align="right" className="num">{num(r.deliv_pct, 1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Section>
          </>
        )}
      </Box>
    </Drawer>
  );
}
