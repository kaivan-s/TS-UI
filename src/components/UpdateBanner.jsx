import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import ScheduleIcon from "@mui/icons-material/Schedule";

const MARKET_CLOSE = 15 * 60 + 30; // 15:30 IST
const UPDATE_TIME = 19 * 60 + 30; // 19:30 IST, when the post-market job runs

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
            "Market closed. Today's post-market data lands after 7:30 PM IST.",
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
        mb: 2,
        p: 1.5,
        bgcolor: "rgba(255,167,38,0.08)",
        border: "1px solid rgba(255,167,38,0.2)",
        borderRadius: 1.5,
      }}
    >
      <ScheduleIcon sx={{ fontSize: 18, color: "#ffa726" }} />
      <Typography sx={{ fontSize: 13, color: "#ffa726" }}>
        {status.message}
      </Typography>
    </Box>
  );
}
