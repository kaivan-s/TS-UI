import { Box } from "@mui/material";
import UpdateBanner from "./UpdateBanner.jsx";
import SectorLookoutsTab from "./SectorLookoutsTab.jsx";

/**
 * One sector table, not two. Lookouts and Shortlisted showed the same
 * sectors from two sources and differed only in how many rows they left
 * in, so the filter now does that job on a single table.
 */
export default function SectorsView({ scan, status, onOpenSector }) {
  return (
    <Box>
      <UpdateBanner asOf={status?.as_of} />
      <SectorLookoutsTab liveRows={scan} onOpenSector={onOpenSector} />
    </Box>
  );
}
