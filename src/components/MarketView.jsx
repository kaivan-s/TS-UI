/**
 * Market — unified view merging Circuit carry and Market scanners.
 *
 * Top-level tabs:
 *   Circuit carry · Big movers · Unusual volume · Streaks · 52w breakouts · Sector pulse
 *
 * Circuit carry has its own internal sub-tabs (Today's scan / Track record).
 */

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { getCarry, getCarryIntraday, getScanners } from "../api.js";
import { C } from "../theme.js";
import { Note, PageIntro, TabLabel } from "./ui.jsx";

/* ─── lazy-import the heavy table components from the original files ─── */
import CarryView from "./CarryView.jsx";
import ScannersView from "./ScannersView.jsx";

const POLL_MS = 5 * 60 * 1000;

export default function MarketView({ onOpenStock }) {
  const [tab, setTab] = useState(0);
  const [carryData, setCarryData] = useState(null);
  const [intradayData, setIntradayData] = useState(null);
  const [scanData, setScanData] = useState(null);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      const [carry, intraday, scanners] = await Promise.all([
        getCarry(),
        getCarryIntraday(),
        getScanners(),
      ]);
      setCarryData(carry);
      setIntradayData(intraday);
      setScanData(scanners);
    } catch (e) {
      setErr(e?.message || "Could not load market data");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  if (busy && !carryData && !scanData) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={28} sx={{ color: C.accent }} />
      </Box>
    );
  }
  if (err && !carryData && !scanData) return <Note>{err}</Note>;

  const movers = scanData?.big_movers || [];
  const volume = scanData?.unusual_volume || [];
  const streaks = scanData?.momentum_streaks || [];
  const breakouts = scanData?.breakouts_52w || [];
  const sectors = scanData?.sector_pulse || [];
  const intradayCount = intradayData?.latest?.length || 0;

  return (
    <Box>
      <PageIntro
        title="Market"
        action={
          <Button
            size="small"
            variant="outlined"
            onClick={load}
            disabled={busy}
            startIcon={busy ? <CircularProgress size={14} /> : <RefreshRoundedIcon fontSize="small" />}
            sx={{ color: C.muted, borderColor: "rgba(238,234,227,0.12)", textTransform: "none" }}
          >
            Refresh
          </Button>
        }
      >
        Circuit carries, big movers, unusual volume, and more — everything happening in the market today.
        {scanData?.scan_time && (
          <Typography component="span" sx={{ display: "block", fontSize: 12, color: C.muted, mt: 0.5 }}>
            Last scan: {scanData.scan_time} IST
          </Typography>
        )}
      </PageIntro>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2, borderBottom: `1px solid ${C.line}` }}
      >
        <Tab label={<TabLabel name="Circuit carry" count={intradayCount} />} sx={{ textTransform: "none" }} />
        <Tab label={<TabLabel name="Big movers" count={movers.length} />} sx={{ textTransform: "none" }} />
        <Tab label={<TabLabel name="Unusual volume" count={volume.length} />} sx={{ textTransform: "none" }} />
        <Tab label={<TabLabel name="Streaks" count={streaks.length} />} sx={{ textTransform: "none" }} />
        <Tab label={<TabLabel name="52w breakouts" count={breakouts.length} />} sx={{ textTransform: "none" }} />
        <Tab label={<TabLabel name="Sector pulse" count={sectors.length} />} sx={{ textTransform: "none" }} />
      </Tabs>

      {tab === 0 && (
        <CarryView
          onOpenStock={onOpenStock}
          externalData={carryData}
          externalIntraday={intradayData}
          embedded
        />
      )}
      {tab === 1 && (
        <ScannersView onOpenStock={onOpenStock} externalData={scanData} embedded embeddedTab={0} />
      )}
      {tab === 2 && (
        <ScannersView onOpenStock={onOpenStock} externalData={scanData} embedded embeddedTab={1} />
      )}
      {tab === 3 && (
        <ScannersView onOpenStock={onOpenStock} externalData={scanData} embedded embeddedTab={2} />
      )}
      {tab === 4 && (
        <ScannersView onOpenStock={onOpenStock} externalData={scanData} embedded embeddedTab={3} />
      )}
      {tab === 5 && (
        <ScannersView onOpenStock={onOpenStock} externalData={scanData} embedded embeddedTab={4} />
      )}
    </Box>
  );
}
