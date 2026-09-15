import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  LinearProgress,
  ListItemText,
  Menu,
  MenuItem,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import FilterListIcon from "@mui/icons-material/FilterList";
import { C } from "../theme.js";
import { num } from "../format.js";
import { M } from "../glossary.js";

/**
 * Column sorting for any table.
 *
 * Comparison is inferred from the values rather than declared per column, so
 * a new column is sortable without registering its type. Blanks always sink
 * to the bottom regardless of direction — a missing reading is not a small
 * one, and letting nulls lead an ascending sort buries the real rows.
 */
export function useTableSort(initial = {}) {
  const [key, setKey] = useState(initial.key ?? null);
  const [dir, setDir] = useState(initial.dir ?? "desc");

  const toggle = (k) => {
    if (k === key) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setKey(k);
      // Text reads naturally A-Z; numbers are almost always wanted big-first.
      setDir(initial.dirFor?.(k) ?? "desc");
    }
  };

  const apply = (rows) => {
    if (!key || !rows?.length) return rows || [];
    const sign = dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = a?.[key];
      const y = b?.[key];
      const xEmpty = x == null || x === "";
      const yEmpty = y == null || y === "";
      if (xEmpty || yEmpty) return xEmpty && yEmpty ? 0 : xEmpty ? 1 : -1;
      if (typeof x === "number" && typeof y === "number") return (x - y) * sign;
      return String(x).localeCompare(String(y)) * sign;
    });
  };

  return { key, dir, toggle, apply, reset: () => setKey(initial.key ?? null) };
}

/**
 * Table header that explains itself on hover, and sorts when given `sort`.
 *
 * Pass `k` to pull the label and definition from the glossary, or pass
 * `label`/`help` directly for one-off columns. Pass `sort` (a useTableSort
 * result) plus `sortKey` to make the column clickable.
 */
export function HeadCell({
  k,
  label,
  help,
  align = "left",
  sort,
  sortKey,
  ...rest
}) {
  const entry = (k && M[k]) || {};
  const text = label ?? entry.label ?? k;
  const tip = help ?? entry.help;
  const field = sortKey ?? k;
  const sortable = Boolean(sort && field);
  const active = sortable && sort.key === field;

  let inner = text;
  if (tip) {
    inner = (
      <Tooltip title={tip} placement="top" arrow enterDelay={200}>
        <Box
          component="span"
          sx={{
            borderBottom: `1px dotted ${C.muted}`,
            cursor: sortable ? "pointer" : "help",
            paddingBottom: "1px",
          }}
        >
          {text}
        </Box>
      </Tooltip>
    );
  }

  if (!sortable) {
    return (
      <TableCell align={align} {...rest}>
        {inner}
      </TableCell>
    );
  }

  const Arrow = active && sort.dir === "asc" ? ArrowDropUpIcon : ArrowDropDownIcon;
  return (
    <TableCell
      align={align}
      {...rest}
      onClick={() => sort.toggle(field)}
      sx={{
        cursor: "pointer",
        userSelect: "none",
        whiteSpace: "nowrap",
        color: active ? C.text : undefined,
        "&:hover": { color: C.text },
        ...(rest.sx || {}),
      }}
    >
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          flexDirection: align === "right" ? "row-reverse" : "row",
          gap: 0.15,
        }}
      >
        {inner}
        <Arrow
          fontSize="small"
          sx={{ opacity: active ? 0.9 : 0.22, transition: "opacity 120ms" }}
        />
      </Box>
    </TableCell>
  );
}

/**
 * Multi-select for a categorical column. Empty selection means no filter,
 * which keeps "show everything" as the default without a special All entry.
 */
export function MultiSelect({ label, options, selected, onChange, width = 200 }) {
  const [anchor, setAnchor] = useState(null);
  const all = useMemo(() => options.slice().sort(), [options]);
  const on = (v) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);

  return (
    <>
      <Button
        size="small"
        onClick={(e) => setAnchor(e.currentTarget)}
        startIcon={<FilterListIcon fontSize="small" />}
        sx={{
          color: selected.length ? C.text : C.muted,
          borderColor: "rgba(238,234,227,0.12)",
          textTransform: "none",
          fontWeight: 400,
        }}
        variant="outlined"
      >
        {selected.length ? `${label}: ${selected.length}` : label}
      </Button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { maxHeight: 360, width } } }}
      >
        {selected.length > 0 && (
          <MenuItem onClick={() => onChange([])} sx={{ color: C.muted }}>
            Clear
          </MenuItem>
        )}
        {all.map((o) => (
          <MenuItem key={o} onClick={() => on(o)} dense>
            <Checkbox
              checked={selected.includes(o)}
              size="small"
              sx={{ p: 0.5, mr: 1 }}
            />
            <ListItemText
              primary={o}
              primaryTypographyProps={{ fontSize: 13, noWrap: true }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
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
          alignItems: { xs: "stretch", sm: "flex-start" },
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 1.5, sm: 2 },
          flexWrap: "wrap",
          mb: children ? 0.75 : 0,
        }}
      >
        <Typography variant="h1" sx={{ flex: 1, fontSize: { xs: 18, sm: 20 }, minWidth: 160 }}>
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
