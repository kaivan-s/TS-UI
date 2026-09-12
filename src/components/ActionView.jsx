import { Box } from "@mui/material";
import TomTab from "./TomTab.jsx";

export default function ActionView({
  tom,
  status,
  liveBusy,
  onOpenSector,
  onOpenStock,
  onTomRefresh,
}) {
  return (
    <Box>
      <TomTab
        rows={tom}
        liveAt={status?.live_at}
        liveN={status?.live_n}
        liveSource={status?.live_source}
        sectorsLive={status?.sectors_live}
        onOpenSector={onOpenSector}
        onOpenStock={onOpenStock}
        onRefresh={onTomRefresh}
        scanning={liveBusy}
        scanMessage={status?.message}
        preview={status?.tom_preview || []}
      />
    </Box>
  );
}
