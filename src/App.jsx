import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  LinearProgress,
  Typography,
} from "@mui/material";
import { C } from "./theme.js";
import Sidebar from "./components/Sidebar.jsx";
import Header from "./components/Header.jsx";
import SetupsView from "./components/SetupsView.jsx";
import SectorsView from "./components/SectorsView.jsx";
import TrackRecordTab from "./components/TrackRecordTab.jsx";
import Guide from "./components/Guide.jsx";
import SectorDrawer from "./components/SectorDrawer.jsx";
import StockDrawer from "./components/StockDrawer.jsx";
import { getDashboard, getSector, getStatus, getStock, getSymbols, refresh } from "./api.js";

function todayISO() {
  const d = new Date();
  const z = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

export default function App() {
  const [status, setStatus] = useState(null);
  const [days, setDays] = useState(220);
  const [end, setEnd] = useState(todayISO());
  const [view, setView] = useState("setups");
  const [scan, setScan] = useState([]);
  const [rest, setRest] = useState([]);
  const [buys, setBuys] = useState([]);
  const [error, setError] = useState("");
  const [sectorName, setSectorName] = useState(null);
  const [sector, setSector] = useState(null);
  const [sectorLoading, setSectorLoading] = useState(false);
  const [symbols, setSymbols] = useState([]);
  const [stockQuery, setStockQuery] = useState(null);
  const [stock, setStock] = useState(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [pollKey, setPollKey] = useState(0);

  const loading = status?.status === "loading" || status?.status === "idle" || !status;

  const applyDash = (d) => {
    setStatus(d);
    if (d.scan) setScan(d.scan);
    if (d.rest) setRest(d.rest);
    if (d.buys) setBuys(d.buys);
    if (d.error) setError(d.error);
    else setError("");
  };

  // Symbols load once the panel is ready, and again after a header Refresh.
  useEffect(() => {
    if (status?.status !== "ready") return;
    getSymbols()
      .then((r) => { if (r.symbols) setSymbols(r.symbols); })
      .catch(() => {});
  }, [pollKey, status?.status]);

  useEffect(() => {
    let stop = false;
    let timer;

    const tick = async () => {
      if (stop) return;
      try {
        const s = await getStatus();
        if (stop) return;
        setStatus(s);
        if (s.status === "ready") {
          // Only fetch the full dashboard when not mid-live-scan, or when
          // the live scan just finished. Polling status alone is enough
          // while the scan is running — the heavy payloads don't change.
          if (s.live_status !== "loading") {
            const d = await getDashboard();
            if (!stop) applyDash(d);
          } else {
            // Mid-scan: keep polling status, but don't refetch 200 KB every
            // second when the heavy payloads cannot have changed yet.
            timer = setTimeout(tick, 1000);
          }
          return;
        }
        if (s.status === "error") {
          setError(s.error || "Load failed.");
          return;
        }
      } catch (e) {
        if (!stop) setError(e.message);
      }
      timer = setTimeout(tick, 1000);
    };

    tick();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [pollKey]);

  const onRefresh = async () => {
    setError("");
    try {
      const s = await refresh(days, end);
      setStatus({ ...s, status: "loading" });
      setPollKey((n) => n + 1);
    } catch (e) {
      setError(e.message);
    }
  };

  const openSector = async (name) => {
    setStockQuery(null);
    setSectorName(name);
    setSector(null);
    setSectorLoading(true);
    try {
      setSector(await getSector(name));
    } catch (e) {
      setError(e.message);
    } finally {
      setSectorLoading(false);
    }
  };

  const openStock = async (q, entry) => {
    const name = (q || "").trim();
    if (!name) return;
    setSectorName(null);
    setStockQuery(name);
    if (entry == null) setStock(null);
    setStockLoading(true);
    try {
      setStock(await getStock(name, entry));
    } catch (e) {
      setError(e.message);
      if (entry == null) setStockQuery(null);
    } finally {
      setStockLoading(false);
    }
  };

  // Counts for sidebar badges
  const counts = {
    setups: status?.n_buys ?? buys.length,
    sectors: status?.actionable ?? 0,
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: C.bg }}>
      {/* Sidebar */}
      <Sidebar active={view} onChange={setView} counts={counts} />

      {/* Main content */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, ml: "220px" }}>
        {/* Header */}
        <Header
          status={status}
          loading={loading}
          symbols={symbols}
          onLookup={openStock}
        />

        {/* Loading bar */}
        {loading && (
          <LinearProgress
            sx={{
              height: 2,
              bgcolor: "transparent",
              "& .MuiLinearProgress-bar": { bgcolor: C.accent },
            }}
          />
        )}

        {/* Content area */}
        <Box sx={{ flex: 1, px: 3, py: 3 }}>
          {loading && (
            <Typography color="text.secondary" sx={{ mb: 2.5, fontSize: 14.5 }}>
              {status?.message || "Starting…"}
            </Typography>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {!loading && status && status.delivery_ok === false && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              The latest session has no delivery data
              {status.as_of ? ` (${status.as_of})` : ""} — usually a UDiFF
              fallback. Delivery quality, delivery breadth and the delivery
              gates are blank for that day.
            </Alert>
          )}

          {view === "setups" && (
            <SetupsView
              buys={buys}
              rest={rest}
              status={status}
              onOpenSector={openSector}
              onOpenStock={openStock}
            />
          )}

          {view === "sectors" && (
            <SectorsView
              scan={scan}
              status={status}
              onOpenSector={openSector}
            />
          )}

          {view === "track" && <TrackRecordTab onOpenStock={openStock} />}

          {view === "guide" && <Guide />}
        </Box>
      </Box>

      {/* Drawers */}
      <SectorDrawer
        open={Boolean(sectorName)}
        onClose={() => setSectorName(null)}
        data={sector}
        loading={sectorLoading}
      />
      <StockDrawer
        open={Boolean(stockQuery)}
        onClose={() => { setStockQuery(null); setStock(null); }}
        data={stock}
        loading={stockLoading}
        onOpenSector={openSector}
        onLookup={openStock}
        onEntry={(price) => stockQuery && openStock(stock?.symbol || stockQuery, price)}
      />
    </Box>
  );
}
