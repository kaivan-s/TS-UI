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
import TrackingView from "./components/TrackingView.jsx";
import SectorsView from "./components/SectorsView.jsx";
import Guide from "./components/Guide.jsx";
import Pricing from "./components/Pricing.jsx";
import SectorDrawer from "./components/SectorDrawer.jsx";
import StockDrawer from "./components/StockDrawer.jsx";
import { getDashboard, getSector, getStock, getSymbols } from "./api.js";

export default function App() {
  const [status, setStatus] = useState(null);
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

  const [loading, setLoading] = useState(true);

  const applyDash = (d) => {
    setStatus(d);
    if (d.scan) setScan(d.scan);
    if (d.rest) setRest(d.rest);
    if (d.buys) setBuys(d.buys);
    if (d.error) setError(d.error);
    else setError("");
  };

  // The lists live in Supabase, written once a day by the post-market job.
  // Nothing is polled and nothing waits on the in-process panel: a cold
  // server serves the same rows as a warm one, so this is a single read.
  useEffect(() => {
    let stop = false;
    setLoading(true);
    getDashboard()
      .then((d) => { if (!stop) applyDash(d); })
      .catch((e) => { if (!stop) setError(e.message); })
      .finally(() => { if (!stop) setLoading(false); });
    return () => { stop = true; };
  }, []);

  // Symbol list for the header lookup. Best-effort: it is the one thing that
  // still needs the panel, so it stays empty rather than blocking the app.
  useEffect(() => {
    getSymbols()
      .then((r) => { if (r.symbols) setSymbols(r.symbols); })
      .catch(() => {});
  }, []);

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

          {view === "tracking" && (
            <TrackingView onOpenSector={openSector} onOpenStock={openStock} />
          )}

          {view === "guide" && <Guide />}

          {view === "pricing" && <Pricing />}
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
