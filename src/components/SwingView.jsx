import { useState } from "react";
import {
  Box,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { C } from "../theme.js";
import { TabLabel } from "./ui.jsx";
import { LockedTab } from "./Premium.jsx";
import { useAuth } from "../auth.jsx";
import CoilTab from "./CoilTab.jsx";
import BuysTab from "./BuysTab.jsx";

export default function SwingView({
  coil,
  miss,
  buys,
  status,
  onOpenSector,
  onOpenStock,
}) {
  const [subTab, setSubTab] = useState(0);
  const { isPremium } = useAuth();

  return (
    <Box>
      {/* Tabs */}
      <Tabs
        value={subTab}
        onChange={(_, v) => setSubTab(v)}
        sx={{
          minHeight: 40,
          mb: 2,
          "& .MuiTab-root": {
            minHeight: 40,
            py: 1,
          },
        }}
      >
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

      <Typography sx={{ mb: 2.5, fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>
        {subTab === 0 &&
          "Individual stocks sitting in a tight, quiet base near their highs. This is a study list, ranked by how coiled they are, not a list of buys."}
        {subTab === 1 &&
          "The overlap: coiled stocks that sit inside a sector that is waking up. The closest this system gets to a shortlist."}
      </Typography>

      {/* Content */}
      {subTab === 0 && (
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
      {subTab === 1 && (
        isPremium ? (
          <BuysTab rows={buys} onOpenSector={onOpenSector} onOpenStock={onOpenStock} />
        ) : (
          <LockedTab name="Setups" />
        )
      )}
    </Box>
  );
}
