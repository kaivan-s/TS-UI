import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import KlassChip from "./KlassChip.jsx";
import { HeadCell, Note } from "./ui.jsx";
import { useAuth } from "../auth.jsx";
import { C } from "../theme.js";
import { num, signed } from "../format.js";
import { BUY_READY_HELP, FILTER_HELP, STATES } from "../glossary.js";

const FILTERS = [
  "buy_ready",
  "actionable",
  "CROSSING",
  "PULLBACK",
  "CROSSING_UNVERIFIED",
  "BASE",
  "NEGLECT",
  "DISQUALIFIED",
  "NONE",
  "all",
];

const FILTER_LABEL = {
  buy_ready: "Setup ready",
  actionable: "Worth a look",
  all: "All",
  CROSSING: "Crossing",
  PULLBACK: "Pullback",
  CROSSING_UNVERIFIED: "Unverified",
  BASE: "Base",
  NEGLECT: "Neglect",
  DISQUALIFIED: "Disqualified",
  NONE: "None",
};

function filterHelp(f) {
  return FILTER_HELP[f] || STATES[f]?.help || "";
}

export default function SectorTab({ rows, onOpen, ready }) {
  const { isPremium, upgrade, busy } = useAuth();
  const [filter, setFilter] = useState("actionable");

  const counts = useMemo(() => {
    const c = { all: rows.length, actionable: 0, buy_ready: 0 };
    for (const r of rows) {
      c[r.klass] = (c[r.klass] || 0) + 1;
      if (r.klass === "CROSSING" || r.klass === "PULLBACK") c.actionable += 1;
      if (r.buy_ready) c.buy_ready += 1;
    }
    return c;
  }, [rows]);

  const shown = useMemo(() => {
    return rows.filter((r) => {
      if (filter === "buy_ready") {
        if (!r.buy_ready) return false;
      } else if (filter === "actionable") {
        if (r.klass !== "CROSSING" && r.klass !== "PULLBACK") return false;
      } else if (filter !== "all" && r.klass !== filter) {
        return false;
      }
      return true;
    });
  }, [rows, filter]);

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          gap: 0.75,
          flexWrap: "wrap",
          mb: 2.5,
          alignItems: "center",
        }}
      >
        {FILTERS.map((f) => {
          const on = filter === f;
          return (
            <Tooltip key={f} title={filterHelp(f)} placement="top" arrow enterDelay={300}>
              <Chip
                label={`${FILTER_LABEL[f]}  ${counts[f] || 0}`}
                onClick={() => setFilter(f)}
                variant={on ? "filled" : "outlined"}
                sx={{
                  borderColor: on ? "transparent" : "rgba(238,234,227,0.10)",
                  bgcolor: on ? C.text : "transparent",
                  color: on ? C.bg : C.muted,
                  "&:hover": {
                    bgcolor: on ? "#d8d4cd" : "rgba(238,234,227,0.04)",
                  },
                }}
              />
            </Tooltip>
          );
        })}
      </Box>

      {ready && filter === "actionable" && counts.actionable === 0 && (
        <Note>
          No sector woke up or pulled back today. Markets do not offer a setup
          every day — an empty list is the scan working, not a failure. Switch
          to Base to see what is quietly building.
        </Note>
      )}

      <Note>
        Hover any column heading to see what the number means. Every ratio compares the sector against either its own recent average or the other sectors that day, so 1.0 always reads as "normal".
      </Note>

      {!isPremium && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            mb: 2,
            p: 2,
            borderRadius: 2,
            bgcolor: "rgba(142,180,196,0.06)",
            border: "1px solid rgba(142,180,196,0.12)",
          }}
        >
          <Typography sx={{ fontSize: 13, color: C.muted }}>
            Upgrade to see volume, breadth, and momentum metrics
          </Typography>
          <Button
            variant="contained"
            onClick={() => upgrade?.("monthly")}
            disabled={busy}
            size="small"
            startIcon={<StarRoundedIcon sx={{ fontSize: 14 }} />}
            sx={{
              bgcolor: C.accent,
              color: C.bg,
              fontWeight: 600,
              whiteSpace: "nowrap",
              "&:hover": { bgcolor: "#7aa4b4" },
            }}
          >
            {busy ? "Loading…" : "Upgrade · ₹499/mo"}
          </Button>
        </Box>
      )}

      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <HeadCell label="Sector" />
              <HeadCell
                label="State"
                help="Where this sector is in the rotation cycle: quiet and building, waking up on heavy volume, resting after waking up, or ruled out. Hover the chip in any row for that specific state."
              />
              <HeadCell k="T" align="right" />
              <HeadCell k="T_rel" align="right" />
              <HeadCell k="B" align="right" />
              <HeadCell k="deliv_quality_rel" align="right" />
              <HeadCell k="cmf" align="right" />
              <HeadCell k="rs" align="right" />
              <HeadCell k="rs_chg_5" align="right" />
              <HeadCell k="n_adv" align="right" />
              <HeadCell k="top_share" align="right" />
              <HeadCell k="note" />
            </TableRow>
          </TableHead>
          <TableBody>
            {shown.map((r) => (
              <TableRow
                key={r.sector}
                hover
                className="row-click"
                role="button"
                tabIndex={0}
                onClick={() => onOpen(r.sector)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onOpen(r.sector);
                }}
              >
                <TableCell sx={{ fontWeight: 500, maxWidth: 280 }}>
                  {r.sector}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <KlassChip klass={r.klass} />
                    {r.buy_ready && (
                      <Tooltip title={BUY_READY_HELP} placement="top" arrow>
                        <Chip
                          size="small"
                          label="Setup ready"
                          sx={{
                            bgcolor: "rgba(125,186,150,0.12)",
                            color: C.good,
                          }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
                <TableCell
                  align="right"
                  className="num"
                  sx={!isPremium ? { filter: "blur(4px)", opacity: 0.5 } : undefined}
                >
                  {num(r.T)}
                </TableCell>
                <TableCell
                  align="right"
                  className="num"
                  sx={!isPremium ? { filter: "blur(4px)", opacity: 0.5 } : undefined}
                >
                  {num(r.T_rel)}
                </TableCell>
                <TableCell
                  align="right"
                  className="num"
                  sx={!isPremium ? { filter: "blur(4px)", opacity: 0.5 } : undefined}
                >
                  {num(r.B)}
                </TableCell>
                <TableCell
                  align="right"
                  className="num"
                  sx={!isPremium ? { filter: "blur(4px)", opacity: 0.5 } : undefined}
                >
                  {num(r.deliv_quality_rel)}
                </TableCell>
                <TableCell
                  align="right"
                  className="num"
                  sx={!isPremium ? { filter: "blur(4px)", opacity: 0.5 } : undefined}
                >
                  {num(r.cmf)}
                </TableCell>
                <TableCell
                  align="right"
                  className="num"
                  sx={!isPremium ? { filter: "blur(4px)", opacity: 0.5 } : undefined}
                >
                  {num(r.rs, 1)}
                </TableCell>
                <TableCell
                  align="right"
                  className="num"
                  sx={!isPremium ? { filter: "blur(4px)", opacity: 0.5 } : undefined}
                >
                  {signed(r.rs_chg_5, 1)}
                </TableCell>
                <TableCell
                  align="right"
                  className="num"
                  sx={!isPremium ? { filter: "blur(4px)", opacity: 0.5 } : undefined}
                >
                  {r.n_adv ?? "—"}/{r.n_stocks ?? "—"}
                </TableCell>
                <TableCell
                  align="right"
                  className="num"
                  sx={!isPremium ? { filter: "blur(4px)", opacity: 0.5 } : undefined}
                >
                  {num(r.top_share)}
                </TableCell>
                <TableCell sx={{ color: "text.secondary", maxWidth: 300, fontSize: 13 }}>
                  {r.note || ""}
                </TableCell>
              </TableRow>
            ))}
            {shown.length === 0 && (
              <TableRow>
                <TableCell colSpan={12} sx={{ color: "text.secondary", py: 6 }}>
                  Nothing in this filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
