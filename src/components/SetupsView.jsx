/**
 * Setups — one page, two cuts of the same coil pool.
 *
 * "Sector agrees" is the default: coiled stocks whose sector is also moving.
 * "Leaders at rest" drops the sector condition and instead ranks the pool by
 * 12-month momentum, keeping 20.
 *
 * Both are deliberately short. The unranked 63-name pool and the separate
 * 80-name momentum list were removed because neither was a list anyone would
 * finish reading, and ranking the pool by momentum measured better than
 * either of them — see eval_listsize.py.
 */

import { useState } from "react";
import { Box, Chip, Tooltip, Typography } from "@mui/material";
import { LockedTab } from "./Premium.jsx";
import { useAuth } from "../auth.jsx";
import UpdateBanner from "./UpdateBanner.jsx";
import BuysTab from "./BuysTab.jsx";
import LeadersAtRestTab from "./LeadersAtRestTab.jsx";
import { C } from "../theme.js";

const FILTERS = [
  {
    id: "agree",
    label: "Sector agrees",
    help: "Coiled stocks whose sector is also waking up or resting after waking up. Grouped by sector, because names inside one sector tend to resolve together. Measured +3.7% median excess over 20 sessions against the all-stock median.",
  },
  {
    id: "rest",
    label: "Leaders at rest",
    help: "The same coil pool ignoring sector state, ranked by return over the twelve months ending a month ago, cut to 20. A proven leader that has gone quiet. Ranking this way measured about twice the edge of showing the full pool, on five months of history.",
  },
];

export default function SetupsView({
  buys,
  rest,
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

  const counts = { agree: buys.length, rest: rest.length };

  // A night where no sector agreed saves no setup rows, so the newest ones
  // in the table are from an earlier session. They still render, but saying
  // nothing would present a four-day-old list as tonight's.
  const setupsStale = (status?.stale || []).includes("setups");

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
            ? "sector must agree"
            : "any sector, ranked by the last twelve months"}
        </Typography>
      </Box>

      {filter === "agree" ? (
        <>
          {setupsStale && (
            <Box
              sx={{
                mb: 2,
                px: 1.5,
                py: 1.25,
                borderRadius: 1,
                border: `1px solid ${C.line}`,
                bgcolor: "rgba(196,164,106,0.06)",
              }}
            >
              <Typography sx={{ fontSize: 13, color: C.warn }}>
                No sector agreed in the {status?.session} session.
              </Typography>
              <Typography sx={{ fontSize: 12, color: C.muted, mt: 0.25 }}>
                Below is the last list that had any, from{" "}
                {status?.dates?.setups} — history, not tonight's candidates.
                Leaders at rest is current.
              </Typography>
            </Box>
          )}
          <BuysTab
            rows={buys}
            onOpenSector={onOpenSector}
            onOpenStock={onOpenStock}
          />
        </>
      ) : (
        <LeadersAtRestTab
          rows={rest}
          coilReady={status?.coil_ready !== false}
          onOpenSector={onOpenSector}
          onOpenStock={onOpenStock}
        />
      )}
    </Box>
  );
}
