import {
  Box,
  Typography,
} from "@mui/material";
import { C } from "../theme.js";
import { LockedTab } from "./Premium.jsx";
import { useAuth } from "../auth.jsx";
import CoilTab from "./CoilTab.jsx";

export default function SwingView({
  coil,
  miss,
  status,
  onOpenSector,
  onOpenStock,
}) {
  const { isPremium } = useAuth();

  return (
    <Box>
      <Typography sx={{ mb: 2.5, fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>
        Individual stocks sitting in a tight, quiet base near their highs. 
        This is a study list, ranked by how coiled they are, not a list of buys.
        These are pure stock-level setups — for sector-confirmed picks, see Setups under Sectors.
      </Typography>

      {isPremium ? (
        <CoilTab
          hits={coil}
          misses={miss}
          coilReady={status?.coil_ready !== false}
          onOpenSector={onOpenSector}
          onOpenStock={onOpenStock}
        />
      ) : (
        <LockedTab name="Swing Trading" />
      )}
    </Box>
  );
}
