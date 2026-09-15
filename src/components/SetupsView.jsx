/**
 * Setups — one page, two views of the same scan.
 *
 * "Sector agrees" is the default: coiled stocks whose sector is also moving,
 * which is the narrower list and the one with the stronger measured edge
 * (+3.7% median excess over 20 sessions against +1.7% for the unfiltered
 * pool). "All bases" drops the sector condition and shows every coil.
 *
 * These were two tabs until the sector filter turned out to be the only thing
 * separating them — same scan, same gates, one extra condition. Each view
 * keeps its own table because they answer different questions: setups group
 * by sector, since names inside one sector resolve together, while the full
 * pool is read flat and searched by name.
 */

import { useState } from "react";
import { Box, Chip, Tooltip, Typography } from "@mui/material";
import { LockedTab } from "./Premium.jsx";
import { useAuth } from "../auth.jsx";
import UpdateBanner from "./UpdateBanner.jsx";
import BuysTab from "./BuysTab.jsx";
import CoilTab from "./CoilTab.jsx";
import { C } from "../theme.js";

const FILTERS = [
  {
    id: "agree",
    label: "Sector agrees",
    help: "Coiled stocks whose sector is also waking up or resting after waking up. The narrower list, and the only one here with a measured edge — +3.7% median excess over 20 sessions against the all-stock median.",
  },
  {
    id: "all",
    label: "All bases",
    help: "Every stock that cleared the coil filters, with no regard to its sector. A wider pool at about half the edge (+1.7% median excess over 20 sessions). Useful for watching a base whose sector has not turned yet.",
  },
];

export default function SetupsView({
  buys,
  coil,
  miss,
  status,
  onOpenSector,
  onOpenStock,
}) {
  const { isPremium } = useAuth();
  const [filter, setFilter] = useState("agree");

  if (!isPremium) {
    return (
      <Box>
        <UpdateBanner asOf={status?.as_of} />
        <LockedTab name="Setups" />
      </Box>
    );
  }

  const counts = { agree: buys.length, all: coil.length };

  return (
    <Box>
      <UpdateBanner asOf={status?.as_of} />

      <Box
        sx={{
          display: "flex",
          gap: 0.75,
          flexWrap: "wrap",
          alignItems: "center",
          mb: 2,
        }}
      >
        {FILTERS.map((f) => {
          const on = filter === f.id;
          return (
            <Tooltip key={f.id} title={f.help} placement="top" arrow enterDelay={300}>
              <Chip
                label={`${f.label}  ${counts[f.id] || 0}`}
                onClick={() => setFilter(f.id)}
                variant={on ? "filled" : "outlined"}
                sx={{
                  borderColor: on ? "transparent" : "rgba(238,234,227,0.10)",
                  bgcolor: on ? C.text : "transparent",
                  color: on ? C.bg : C.muted,
                  "&:hover": { bgcolor: on ? "#d8d4cd" : "rgba(238,234,227,0.04)" },
                }}
              />
            </Tooltip>
          );
        })}
        <Typography sx={{ fontSize: 12, color: C.muted, ml: "auto" }}>
          {filter === "agree"
            ? "sector filter on"
            : "sector filter off — wider pool, weaker edge"}
        </Typography>
      </Box>

      {filter === "agree" ? (
        <BuysTab
          rows={buys}
          onOpenSector={onOpenSector}
          onOpenStock={onOpenStock}
        />
      ) : (
        <CoilTab
          hits={coil}
          misses={miss}
          coilReady={status?.coil_ready !== false}
          onOpenSector={onOpenSector}
          onOpenStock={onOpenStock}
        />
      )}
    </Box>
  );
}
