import { useState } from "react";
import {
  Box,
  IconButton,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { C } from "../theme.js";
import { TabLabel } from "./ui.jsx";
import { LockedTab } from "./Premium.jsx";
import { useAuth } from "../auth.jsx";
import SectorLookoutsTab from "./SectorLookoutsTab.jsx";
import SectorTab from "./SectorTab.jsx";
import CoilTab from "./CoilTab.jsx";
import BuysTab from "./BuysTab.jsx";

export default function ScanView({
  // Data
  scan,
  coil,
  miss,
  buys,
  status,
  // Controls
  onRefresh,
  loading,
  // Actions
  onOpenSector,
  onOpenStock,
}) {
  const [subTab, setSubTab] = useState(0);
  const { isPremium } = useAuth();
  const actionable = status?.actionable ?? 0;

  return (
    <Box>
      {/* Tabs + refresh button */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
          mb: 2,
        }}
      >
        <Tabs
          value={subTab}
          onChange={(_, v) => setSubTab(v)}
          sx={{
            minHeight: 40,
            "& .MuiTab-root": {
              minHeight: 40,
              py: 1,
            },
          }}
        >
          <Tab label={<TabLabel name="Lookouts" />} />
          <Tab label={<TabLabel name="Shortlisted" count={actionable} />} />
          <Tab
            label={
              <TabLabel
                name="Coils"
                count={isPremium ? status?.n_coil : null}
                locked={!isPremium}
              />
            }
          />
          <Tab
            label={
              <TabLabel
                name="Setups"
                count={isPremium ? (status?.n_buys ?? buys?.length ?? 0) : null}
                locked={!isPremium}
              />
            }
          />
        </Tabs>

        <Tooltip
          title={
            status?.job_refresh_at
              ? `System refresh ${status.job_refresh_at.slice(11, 16)} IST — click to re-run`
              : "The panel refreshes on its own after the close. Click to re-run now."
          }
          placement="top"
          arrow
        >
          <span>
            <IconButton
              onClick={onRefresh}
              disabled={loading}
              size="small"
              sx={{ color: C.muted, "&:hover": { color: C.text } }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Typography sx={{ mb: 2.5, fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>
        {subTab === 0 &&
          "Post-market sector analysis. All sectors with heatmap showing turnover, breadth, and money flow. Click any row to see its 20-day shape history."}
        {subTab === 1 &&
          "Sectors worth watching — crossing or pulling back from a quiet base. A stock setup only counts if its sector is waking up."}
        {subTab === 2 &&
          "Individual stocks sitting in a tight, quiet base near their highs. This is a study list, ranked by how coiled they are, not a list of buys."}
        {subTab === 3 &&
          "The overlap: coiled stocks that sit inside a sector that is waking up. The closest this system gets to a shortlist."}
      </Typography>

      {/* Content */}
      {subTab === 0 && (
        <SectorLookoutsTab onOpenSector={onOpenSector} />
      )}
      {subTab === 1 && (
        <SectorTab
          rows={scan}
          onOpen={onOpenSector}
          ready={status?.status === "ready"}
        />
      )}
      {subTab === 2 && (
        isPremium ? (
          <CoilTab
            hits={coil}
            misses={miss}
            coilReady={status?.coil_ready !== false}
            onOpenSector={onOpenSector}
            onOpenStock={onOpenStock}
          />
        ) : (
          <LockedTab name="Coils" />
        )
      )}
      {subTab === 3 && (
        isPremium ? (
          <BuysTab rows={buys} onOpenSector={onOpenSector} onOpenStock={onOpenStock} />
        ) : (
          <LockedTab name="Setups" />
        )
      )}
    </Box>
  );
}
