import { Box, Typography } from "@mui/material";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { useEffect, useState } from "react";
import { C } from "../theme.js";

const MONO = '"IBM Plex Mono", ui-monospace, monospace';
const MARKET_CLOSE = 15 * 60 + 30; // 15:30 IST
const UPDATE_TIME = 20 * 60 + 30; // 20:30 IST, when the post-market job runs

/**
 * True between the close and the post-market run, while today's numbers are
 * still yesterday's. Without this the page looks stale rather than pending.
 */
function useUpdateStatus(asOf) {
  const [status, setStatus] = useState({ waiting: false, message: "" });

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const ist = new Date(
        now.getTime() + istOffset + now.getTimezoneOffset() * 60 * 1000,
      );

      const minutes = ist.getHours() * 60 + ist.getMinutes();
      const day = ist.getDay();
      const isWeekday = day >= 1 && day <= 5;
      const hasToday = asOf === ist.toISOString().split("T")[0];

      if (isWeekday && minutes >= MARKET_CLOSE && minutes < UPDATE_TIME && !hasToday) {
        setStatus({
          waiting: true,
          message:
            "Market closed. Today's post-market scan data lands after 20:30 IST.",
        });
      } else {
        setStatus({ waiting: false, message: "" });
      }
    };

    check();
    const timer = setInterval(check, 60000);
    return () => clearInterval(timer);
  }, [asOf]);

  return status;
}

export default function UpdateBanner({ asOf }) {
  const status = useUpdateStatus(asOf);
  if (!status.waiting) return null;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        mb: 2.5,
        px: 2,
        py: 1.4,
        bgcolor: "rgba(196,164,106,0.08)",
        border: "1px solid rgba(196,164,106,0.22)",
        borderRadius: 2,
      }}
    >
      <ScheduleIcon sx={{ fontSize: 17, color: C.warn }} />
      <Typography sx={{ fontFamily: MONO, fontSize: 12, color: C.warn }}>
        {status.message}
      </Typography>
    </Box>
  );
}
