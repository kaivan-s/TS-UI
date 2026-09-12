import { Chip, Tooltip } from "@mui/material";
import { KLASS } from "../theme.js";
import { STATES } from "../glossary.js";

export default function KlassChip({ klass, size = "small", plain = false }) {
  const k = KLASS[klass] || KLASS.NONE;
  const s = STATES[klass] || STATES.NONE;
  const chip = (
    <Chip
      size={size}
      label={k.label}
      sx={{
        bgcolor: k.bg,
        color: k.fg,
        border: "none",
        fontWeight: 500,
        letterSpacing: 0,
        cursor: plain ? "inherit" : "help",
      }}
    />
  );
  if (plain) return chip;
  return (
    <Tooltip title={`${s.short} — ${s.help}`} placement="top" arrow enterDelay={200}>
      {chip}
    </Tooltip>
  );
}
