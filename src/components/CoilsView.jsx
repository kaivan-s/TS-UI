import { Box } from "@mui/material";
import { LockedTab } from "./Premium.jsx";
import { useAuth } from "../auth.jsx";
import CoilTab from "./CoilTab.jsx";

export default function CoilsView({
  coil,
  miss,
  status,
  onOpenSector,
  onOpenStock,
}) {
  const { isPremium } = useAuth();

  return (
    <Box>
      {isPremium ? (
        <CoilTab
          hits={coil}
          misses={miss}
          coilReady={status?.coil_ready !== false}
          onOpenSector={onOpenSector}
          onOpenStock={onOpenStock}
        />
      ) : (
        <LockedTab name="Coiled Bases" />
      )}
    </Box>
  );
}
