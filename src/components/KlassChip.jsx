import { Chip, Tooltip } from "@mui/material";
import { KLASS_GROUP } from "../theme.js";
import { STATE_GROUP, STATE_GROUPS, STATES } from "../glossary.js";

/**
 * Shows one of three groups, with the specific state it came from in the
 * tooltip. The scan computes seven states; six of them only matter to the
 * scan, so the chip answers "acting, watching, or out?" and the hover
 * answers "on what grounds?".
 */
export default function KlassChip({ klass, size = "small", plain = false }) {
  const group = STATE_GROUP[klass] || "out";
  const g = KLASS_GROUP[group];
  const s = STATES[klass];

  const chip = (
    <Chip
      size={size}
      label={g.label}
      sx={{
        bgcolor: g.bg,
        color: g.fg,
        border: "none",
        fontWeight: 500,
        letterSpacing: 0,
        cursor: plain ? "inherit" : "help",
      }}
    />
  );
  if (plain) return chip;

  const detail = s ? `${s.label}: ${s.short} — ${s.help}` : STATE_GROUPS[group].help;
  return (
    <Tooltip title={detail} placement="top" arrow enterDelay={200}>
      {chip}
    </Tooltip>
  );
}
