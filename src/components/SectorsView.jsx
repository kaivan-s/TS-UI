import { useState, useEffect } from "react";
import {
  Box,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { C } from "../theme.js";
import { TabLabel } from "./ui.jsx";
import SectorLookoutsTab from "./SectorLookoutsTab.jsx";
import SectorTab from "./SectorTab.jsx";

// Check if current time is in the "waiting for update" window (3:30 PM - 7:30 PM IST on weekdays)
function useUpdateStatus(asOf) {
  const [status, setStatus] = useState({ waiting: false, message: "" });

  useEffect(() => {
    const checkStatus = () => {
      const now = new Date();
      // Convert to IST (UTC+5:30)
      const istOffset = 5.5 * 60 * 60 * 1000;
      const ist = new Date(now.getTime() + istOffset + now.getTimezoneOffset() * 60 * 1000);
      
      const hour = ist.getHours();
      const minute = ist.getMinutes();
      const day = ist.getDay(); // 0 = Sunday, 6 = Saturday
      const timeInMinutes = hour * 60 + minute;
      
      // Weekday check (Monday-Friday)
      const isWeekday = day >= 1 && day <= 5;
      
      // 3:30 PM = 15:30 = 930 minutes, 7:30 PM = 19:30 = 1170 minutes
      const marketClose = 15 * 60 + 30; // 3:30 PM
      const updateTime = 19 * 60 + 30;  // 7:30 PM
      
      // Check if today's data is already loaded
      const today = ist.toISOString().split("T")[0];
      const hasToday = asOf === today;
      
      if (isWeekday && timeInMinutes >= marketClose && timeInMinutes < updateTime && !hasToday) {
        setStatus({
          waiting: true,
          message: "Market closed. Today's post-market data will be available after 7:30 PM IST.",
        });
      } else {
        setStatus({ waiting: false, message: "" });
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [asOf]);

  return status;
}

export default function SectorsView({
  scan,
  status,
  onOpenSector,
}) {
  const [subTab, setSubTab] = useState(0);
  const actionable = status?.actionable ?? 0;
  const updateStatus = useUpdateStatus(status?.as_of);

  return (
    <Box>
      {/* Waiting for update banner */}
      {updateStatus.waiting && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 2,
            p: 1.5,
            bgcolor: "rgba(255,167,38,0.08)",
            border: "1px solid rgba(255,167,38,0.2)",
            borderRadius: 1.5,
          }}
        >
          <ScheduleIcon sx={{ fontSize: 18, color: "#ffa726" }} />
          <Typography sx={{ fontSize: 13, color: "#ffa726" }}>
            {updateStatus.message}
          </Typography>
        </Box>
      )}

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
        <Tab label={<TabLabel name="Lookouts" />} />
        <Tab label={<TabLabel name="Shortlisted" count={actionable} />} />
      </Tabs>

      <Typography sx={{ mb: 2.5, fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>
        {subTab === 0 &&
          "Post-market sector analysis. All sectors with heatmap showing turnover, breadth, and money flow. Click any row to see its 20-day shape history."}
        {subTab === 1 &&
          "Sectors worth watching — crossing or pulling back from a quiet base. A stock setup only counts if its sector is waking up."}
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
    </Box>
  );
}
