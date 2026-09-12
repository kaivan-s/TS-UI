import { createTheme } from "@mui/material/styles";

export const C = {
  bg: "#0b0c0e",
  paper: "#121418",
  surface: "#181b20",
  line: "rgba(238,234,227,0.08)",
  text: "#eeeae3",
  muted: "#8e8a83",
  accent: "#8eb4c4",
  good: "#7dba96",
  warn: "#c4a46a",
  bad: "#c87a7a",
};

export const KLASS = {
  CROSSING: { bg: "rgba(125,186,150,0.10)", fg: C.good, label: "Crossing" },
  PULLBACK: { bg: "rgba(142,180,196,0.10)", fg: C.accent, label: "Pullback" },
  CROSSING_UNVERIFIED: { bg: "rgba(196,164,106,0.10)", fg: C.warn, label: "Unverified" },
  BASE: { bg: "rgba(180,168,210,0.10)", fg: "#b8aed4", label: "Base" },
  NEGLECT: { bg: "rgba(255,255,255,0.04)", fg: C.muted, label: "Neglect" },
  DISQUALIFIED: { bg: "rgba(200,122,122,0.10)", fg: C.bad, label: "Disqualified" },
  NONE: { bg: "rgba(255,255,255,0.03)", fg: "#6e6b66", label: "None" },
};

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: C.accent },
    secondary: { main: C.good },
    warning: { main: C.warn },
    error: { main: C.bad },
    background: {
      default: C.bg,
      paper: C.paper,
    },
    divider: C.line,
    text: {
      primary: C.text,
      secondary: C.muted,
    },
  },
  typography: {
    fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
    fontSize: 15,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    h1: {
      fontSize: 22,
      fontWeight: 500,
      letterSpacing: "-0.03em",
      lineHeight: 1.25,
      color: C.text,
    },
    h2: {
      fontSize: 16,
      fontWeight: 500,
      letterSpacing: "-0.015em",
      lineHeight: 1.35,
      color: C.text,
    },
    body1: {
      fontSize: 15,
      lineHeight: 1.65,
    },
    body2: {
      fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
      fontSize: 13,
      lineHeight: 1.5,
    },
    caption: {
      fontSize: 12.5,
      lineHeight: 1.5,
      color: C.muted,
    },
    button: {
      fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
      fontWeight: 500,
    },
  },
  shape: { borderRadius: 6 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: C.bg,
          color: C.text,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: C.line,
          padding: "12px 14px",
          fontSize: 13.5,
          lineHeight: 1.45,
        },
        head: {
          color: C.muted,
          fontWeight: 500,
          fontSize: 12,
          letterSpacing: "0.01em",
          textTransform: "none",
          background: C.bg,
          borderBottom: `1px solid ${C.line}`,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:last-child td": { borderBottom: 0 },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          height: 26,
          fontSize: 12,
          fontWeight: 500,
          borderRadius: 999,
        },
        sizeSmall: {
          height: 22,
          fontSize: 11.5,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          letterSpacing: 0,
          borderRadius: 6,
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        },
        contained: {
          backgroundColor: C.text,
          color: C.bg,
          "&:hover": { backgroundColor: "#d8d4cd" },
          "&.Mui-disabled": {
            backgroundColor: "rgba(238,234,227,0.12)",
            color: C.muted,
          },
        },
        outlined: {
          borderColor: "rgba(238,234,227,0.16)",
          color: C.text,
          "&:hover": {
            borderColor: "rgba(238,234,227,0.28)",
            backgroundColor: "rgba(238,234,227,0.04)",
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          fontSize: 14.5,
          minHeight: 48,
          padding: "12px 16px",
          color: C.muted,
          "&.Mui-selected": { color: C.text },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 48 },
        indicator: {
          height: 1.5,
          backgroundColor: C.text,
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined" },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: C.surface,
          "& fieldset": { borderColor: "rgba(238,234,227,0.10)" },
          "&:hover fieldset": { borderColor: "rgba(238,234,227,0.20)" },
          "&.Mui-focused fieldset": { borderColor: "rgba(238,234,227,0.35)" },
        },
        input: { fontSize: 14, padding: "9px 12px" },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: { fontSize: 14, padding: "9px 12px" },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          border: `1px solid ${C.line}`,
          backgroundColor: C.paper,
          color: C.text,
          alignItems: "flex-start",
          fontSize: 14,
          lineHeight: 1.55,
        },
        standardError: {
          backgroundColor: "rgba(200,122,122,0.08)",
          borderColor: "rgba(200,122,122,0.22)",
        },
        standardWarning: {
          backgroundColor: "rgba(196,164,106,0.08)",
          borderColor: "rgba(196,164,106,0.22)",
        },
        standardInfo: {
          backgroundColor: "rgba(142,180,196,0.08)",
          borderColor: "rgba(142,180,196,0.22)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        outlined: {
          backgroundColor: C.paper,
          borderColor: C.line,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(238,234,227,0.08)",
          borderRadius: 99,
        },
        bar: { borderRadius: 99 },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          backgroundColor: C.paper,
          border: `1px solid ${C.line}`,
        },
      },
    },
  },
});
