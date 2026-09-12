import { Box, LinearProgress, TableCell, TableRow, Tooltip, Typography } from "@mui/material";
import { C } from "../theme.js";
import { num } from "../format.js";
import { M } from "../glossary.js";

/**
 * Table header that explains itself on hover.
 *
 * Pass `k` to pull the label and definition from the glossary, or pass
 * `label`/`help` directly for one-off columns.
 */
export function HeadCell({ k, label, help, align = "left", ...rest }) {
  const entry = (k && M[k]) || {};
  const text = label ?? entry.label ?? k;
  const tip = help ?? entry.help;
  if (!tip) {
    return (
      <TableCell align={align} {...rest}>
        {text}
      </TableCell>
    );
  }
  return (
    <TableCell align={align} {...rest}>
      <Tooltip title={tip} placement="top" arrow enterDelay={200}>
        <Box
          component="span"
          sx={{
            borderBottom: `1px dotted ${C.muted}`,
            cursor: "help",
            paddingBottom: "1px",
          }}
        >
          {text}
        </Box>
      </Tooltip>
    </TableCell>
  );
}

/** Inline term with the same hover explanation, for use outside tables. */
export function Term({ k, label, help, children }) {
  const entry = (k && M[k]) || {};
  const tip = help ?? entry.help;
  const text = children ?? label ?? entry.label ?? k;
  if (!tip) return <>{text}</>;
  return (
    <Tooltip title={tip} placement="top" arrow enterDelay={200}>
      <Box
        component="span"
        sx={{ borderBottom: `1px dotted ${C.muted}`, cursor: "help" }}
      >
        {text}
      </Box>
    </Tooltip>
  );
}

export function PageIntro({ title, action, children }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 2,
          flexWrap: "wrap",
          mb: children ? 0.75 : 0,
        }}
      >
        <Typography variant="h1" sx={{ flex: 1, fontSize: 20, minWidth: 160 }}>
          {title}
        </Typography>
        {action}
      </Box>
      {children && (
        <Typography
          color="text.secondary"
          sx={{ fontSize: 14.5, lineHeight: 1.65 }}
        >
          {children}
        </Typography>
      )}
    </Box>
  );
}

export function Note({ children }) {
  return (
    <Box
      sx={{
        px: 0,
        py: 0.5,
        mb: 3,
        borderLeft: `2px solid ${C.line}`,
        pl: 2,
      }}
    >
      <Typography sx={{ fontSize: 14.5, lineHeight: 1.65, color: "text.secondary" }}>
        {children}
      </Typography>
    </Box>
  );
}

export function TabLabel({ name, count, locked }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <span>{name}</span>
      {locked ? (
        <Box
          component="span"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            color: C.muted,
            fontSize: 11,
            opacity: 0.7,
          }}
        >
          🔒
        </Box>
      ) : count ? (
        <Typography component="span" sx={{ fontSize: 12.5, color: C.muted, fontWeight: 400 }}>
          {count}
        </Typography>
      ) : null}
    </Box>
  );
}

export function CoilBar({ value }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
      <LinearProgress
        variant="determinate"
        value={Math.max(0, Math.min(100, value || 0))}
        sx={{
          flex: 1,
          height: 3,
          bgcolor: "rgba(238,234,227,0.08)",
          "& .MuiLinearProgress-bar": { bgcolor: C.text },
        }}
      />
      <Typography className="num" sx={{ width: 36, fontSize: 12.5, color: "text.secondary" }}>
        {num(value, 1)}
      </Typography>
    </Box>
  );
}

export function WhyRow({ cols, children }) {
  return (
    <TableRow>
      <TableCell
        colSpan={cols}
        sx={{
          pt: 0,
          pb: 2,
          borderTop: "none",
          color: "text.secondary",
        }}
      >
        <Typography sx={{ fontSize: 13.5, lineHeight: 1.6 }}>
          {children}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

export function AccentRow({ color = C.line, children, ...rest }) {
  return (
    <TableRow
      hover
      {...rest}
      sx={{
        "& td:first-of-type": {
          boxShadow: `inset 2px 0 0 ${color}`,
        },
        ...rest.sx,
      }}
    >
      {children}
    </TableRow>
  );
}
