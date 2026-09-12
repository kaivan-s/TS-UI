import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import { C } from "../theme.js";
import { TabLabel } from "./ui.jsx";
import { LockedTab } from "./Premium.jsx";
import { useAuth } from "../auth.jsx";
import SectorTab from "./SectorTab.jsx";
import CoilTab from "./CoilTab.jsx";
import BuysTab from "./BuysTab.jsx";

const DAY_OPTS = [90, 120, 180, 220, 320];

// 200-day EMA needs a long warm-up; below this the Coils tab stays empty.
const COIL_MIN_SESSIONS = 220;

export default function ScanView({
  // Data
  scan,
  coil,
  miss,
  buys,
  status,
  // Controls
  days,
  end,
  onDays,
  onEnd,
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
      {/* Tabs + compact controls on same row */}
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
          <Tab label={<TabLabel name="Sectors" count={actionable} />} />
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

        {/* Compact controls */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FormControl size="small">
            <Select
              value={days}
              onChange={(e) => onDays(e.target.value)}
              disabled={loading}
              sx={{ minWidth: 80, fontSize: 13 }}
            >
              {DAY_OPTS.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}d
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            type="date"
            size="small"
            value={end}
            onChange={(e) => onEnd(e.target.value)}
            disabled={loading}
            sx={{ width: 140, "& input": { fontSize: 13 } }}
          />

          <Tooltip title="Reload data for this window" placement="top" arrow>
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
      </Box>

      {days < COIL_MIN_SESSIONS && (
        <Typography sx={{ mb: 2, fontSize: 12.5, color: C.warn }}>
          ⚠ Coils and Setups need at least {COIL_MIN_SESSIONS} sessions for
          the 200-day trend line.
        </Typography>
      )}

      <Typography sx={{ mb: 2.5, fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>
        {subTab === 0 &&
          "Which industries money is rotating into. Start here — a stock setup only counts if its sector is waking up. Click any row for the full history."}
        {subTab === 1 &&
          "Individual stocks sitting in a tight, quiet base near their highs. This is a study list, ranked by how coiled they are, not a list of buys."}
        {subTab === 2 &&
          "The overlap: coiled stocks that sit inside a sector that is waking up. The closest this system gets to a shortlist."}
      </Typography>

      {/* Content */}
      {subTab === 0 && (
        <SectorTab
          rows={scan}
          onOpen={onOpenSector}
          ready={status?.status === "ready"}
        />
      )}
      {subTab === 1 && (
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
      {subTab === 2 && (
        isPremium ? (
          <BuysTab rows={buys} onOpenSector={onOpenSector} onOpenStock={onOpenStock} />
        ) : (
          <LockedTab name="Setups" />
        )
      )}
    </Box>
  );
}
