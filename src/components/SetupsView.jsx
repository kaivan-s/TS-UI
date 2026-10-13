/**
 * Setups — one page, two cuts of the same coil pool.
 *
 * "Sector agrees" is the default: coiled stocks whose sector is also moving.
 * "Leaders at rest" drops the sector-acting condition (keeping only the
 * DISQUALIFIED exclusion) and instead ranks the market leaders in the pool by
 * risk-adjusted 12-month momentum, keeping 20.
 *
 * Both are deliberately short. The unranked 63-name pool and the separate
 * 80-name momentum list were removed because neither was a list anyone would
 * finish reading, and ranking the pool by momentum measured better than
 * either of them — see eval_listsize.py.
 */

import { useState } from "react";
import { Box, Chip, Tooltip, Typography } from "@mui/material";
import { PremiumOverlay } from "./Premium.jsx";
import { useAuth } from "../auth.jsx";
import UpdateBanner from "./UpdateBanner.jsx";
import BuysTab from "./BuysTab.jsx";
import LeadersAtRestTab from "./LeadersAtRestTab.jsx";
import { C } from "../theme.js";

const FREE_PREVIEW_SETUPS = 1;
const FREE_PREVIEW_LEADERS = 2;

const FILTERS = [
  {
    id: "agree",
    label: "Sector agrees",
    help: "Coiled stocks whose sector is also waking up or resting after waking up. Grouped by sector, because names inside one sector tend to resolve together. Measured +3.7% median excess over 20 sessions against the all-stock median.",
  },
  {
    id: "rest",
    label: "Leaders at rest",
    help: "The same coil pool, kept to stocks in the top 30% of the market on return over the twelve months ending a month ago and outside disqualified sectors, then ranked with steadier trends first and cut to 20. A proven leader that has gone quiet.",
  },
];

function MarketQuietCard({ status }) {
  const bullish = status?.bullish_sectors ?? 0;
  const total = status?.total_sectors ?? 59;
  const pct = total ? Math.round((bullish / total) * 100) : 0;
  const nCoil = status?.n_coil ?? 0;
  const session = status?.session || status?.as_of || "—";
  const lastSetupDate = status?.dates?.setups;

  return (
    <Box
      sx={{
        mt: 1,
        mb: 3,
        px: 2.5,
        py: 2.5,
        borderRadius: 2,
        border: `1px solid ${C.line}`,
        bgcolor: C.paper,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: "50%",
          bgcolor: "rgba(196,164,106,0.10)", display: "flex",
          alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>
          ⏸️
        </Box>
        <Box>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: C.text }}>
            Market isn't offering setups right now
          </Typography>
          <Typography sx={{ fontSize: 12, color: C.muted }}>
            As of {session} — the scan ran, but no sectors qualify
          </Typography>
        </Box>
      </Box>

      <Box sx={{
        display: "flex", gap: 2, flexWrap: "wrap", mt: 2, mb: 2,
        "& > div": {
          flex: "1 1 120px", px: 1.5, py: 1.25, borderRadius: 1,
          bgcolor: C.surface, border: `1px solid ${C.line}`,
        },
      }}>
        <Box>
          <Typography sx={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Sectors in uptrend
          </Typography>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: bullish > 0 ? C.warn : C.muted }}>
            {bullish}<Typography component="span" sx={{ fontSize: 13, color: C.muted, fontWeight: 400 }}>/{total}</Typography>
          </Typography>
          <Typography sx={{ fontSize: 11, color: C.muted }}>
            {pct}% — needs ≥40% for setups
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Coiled stocks
          </Typography>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: C.text }}>
            {nCoil}
          </Typography>
          <Typography sx={{ fontSize: 11, color: C.muted }}>
            compressed — waiting for sectors
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Last setups
          </Typography>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: C.text }}>
            {lastSetupDate || "—"}
          </Typography>
          <Typography sx={{ fontSize: 11, color: C.muted }}>
            most recent qualifying list
          </Typography>
        </Box>
      </Box>

      <Typography sx={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
        Setups appear when a coiled stock's sector is also in CROSSING or PULLBACK.
        Right now most sectors are basing or declining, so the intersection is empty.
        This is the system working — not every session produces a setup,
        and sitting out is part of the methodology.
      </Typography>
      <Typography sx={{ fontSize: 12, color: C.muted, mt: 1.5, fontStyle: "italic" }}>
        💡 Check "Leaders at rest" — it doesn't require sector agreement
        and is usually populated even in quiet markets.
      </Typography>
    </Box>
  );
}

function StaleSetupsBanner({ status }) {
  return (
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
        No sector agreed in the {status?.session || status?.as_of} session
      </Typography>
      <Typography sx={{ fontSize: 12, color: C.muted, mt: 0.25 }}>
        Below is the last list that had any, from{" "}
        {status?.dates?.setups} — history, not tonight's candidates.
        Leaders at rest is current.
      </Typography>
    </Box>
  );
}

export default function SetupsView({
  buys,
  rest,
  status,
  onOpenSector,
  onOpenStock,
}) {
  const { isPremium } = useAuth();
  const [filter, setFilter] = useState("agree");

  const counts = { agree: buys.length, rest: rest.length };

  const previewBuys = isPremium ? buys : buys.slice(0, FREE_PREVIEW_SETUPS);
  const previewRest = isPremium ? rest : rest.slice(0, FREE_PREVIEW_LEADERS);

  const setupsStale = (status?.stale || []).includes("setups");
  const noSetupsAtAll = buys.length === 0 && setupsStale;

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
        <Typography sx={{ fontSize: 12, color: C.muted, ml: "auto", display: { xs: "none", sm: "block" } }}>
          {filter === "agree"
            ? "sector must agree"
            : "any sector, ranked by the last twelve months"}
        </Typography>
      </Box>

      {filter === "agree" ? (
        <>
          {noSetupsAtAll ? (
            <MarketQuietCard status={status} />
          ) : setupsStale ? (
            <>
              <StaleSetupsBanner status={status} />
              <PremiumOverlay
                previewCount={FREE_PREVIEW_SETUPS}
                totalCount={buys.length}
                feature="Full setups list"
              >
                <BuysTab
                  rows={previewBuys}
                  onOpenSector={onOpenSector}
                  onOpenStock={onOpenStock}
                />
              </PremiumOverlay>
            </>
          ) : (
            <PremiumOverlay
              previewCount={FREE_PREVIEW_SETUPS}
              totalCount={buys.length}
              feature="Full setups list"
            >
              <BuysTab
                rows={previewBuys}
                onOpenSector={onOpenSector}
                onOpenStock={onOpenStock}
              />
            </PremiumOverlay>
          )}
        </>
      ) : (
        <PremiumOverlay
          previewCount={FREE_PREVIEW_LEADERS}
          totalCount={rest.length}
          feature="Leaders at rest"
        >
          <LeadersAtRestTab
            rows={previewRest}
            coilReady={rest.length > 0 || status?.coil_ready !== false}
            onOpenSector={onOpenSector}
            onOpenStock={onOpenStock}
          />
        </PremiumOverlay>
      )}
    </Box>
  );
}
