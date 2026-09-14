import { Box } from "@mui/material";
import { LockedTab } from "./Premium.jsx";
import { useAuth } from "../auth.jsx";
import UpdateBanner from "./UpdateBanner.jsx";
import BuysTab from "./BuysTab.jsx";

export default function SetupsView({ buys, status, onOpenSector, onOpenStock }) {
  const { isPremium } = useAuth();

  return (
    <Box>
      <UpdateBanner asOf={status?.as_of} />
      {isPremium ? (
        <BuysTab
          rows={buys}
          onOpenSector={onOpenSector}
          onOpenStock={onOpenStock}
        />
      ) : (
        <LockedTab name="Setups" />
      )}
    </Box>
  );
}
