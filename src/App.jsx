import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Alert,
  Box,
  LinearProgress,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { C } from "./theme.js";
import Sidebar from "./components/Sidebar.jsx";
import Header from "./components/Header.jsx";
import SetupsView from "./components/SetupsView.jsx";
import TrackingView from "./components/TrackingView.jsx";
import SectorsView from "./components/SectorsView.jsx";
import Guide from "./components/Guide.jsx";
import Pricing from "./components/Pricing.jsx";
import PrivacyPolicy from "./components/PrivacyPolicy.jsx";
import TermsConditions from "./components/TermsConditions.jsx";
import SectorDrawer from "./components/SectorDrawer.jsx";
import StockDrawer from "./components/StockDrawer.jsx";
import { getDashboard, getSector, getStock, getSymbols } from "./api.js";

// Map URL paths to view names
const PATH_TO_VIEW = {
  "/setups": "setups",
  "/sectors": "sectors",
  "/tracking": "tracking",
  "/guide": "guide",
  "/pricing": "pricing",
  "/privacy": "privacy",
  "/terms": "terms",
};

export default function App() {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  // Derive view from URL path
  const view = PATH_TO_VIEW[location.pathname] || "setups";

  const [status, setStatus] = useState(null);
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

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

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
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", bgcolor: C.bg }}>
      {/* Disclaimer Banner */}
      <Box
        sx={{
          bgcolor: "rgba(196,164,106,0.1)",
          borderBottom: "1px solid rgba(196,164,106,0.2)",
          px: 2,
          py: 0.75,
          textAlign: "center",
        }}
      >
        <Typography sx={{ fontSize: 11, color: "rgba(238,234,227,0.7)" }}>
          Not SEBI registered. Not financial advice. This is a screening tool to help identify setups — all decisions are yours.{" "}
          <Link to="/terms" style={{ color: C.accent, textDecoration: "none" }}>Terms</Link>
          {" · "}
          <Link to="/privacy" style={{ color: C.accent, textDecoration: "none" }}>Privacy</Link>
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flex: 1 }}>
        {/* Sidebar */}
        <Sidebar
          counts={counts}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

      {/* Main content */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          ml: { xs: 0, md: "220px" },
          transition: "margin-left 0.2s ease",
        }}
      >
        {/* Header */}
        <Header
          status={status}
          loading={loading}
          symbols={symbols}
          onLookup={openStock}
          onMenuClick={handleDrawerToggle}
          showMenuButton={isMobile}
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
        <Box sx={{ flex: 1, px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
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

          {view === "privacy" && <PrivacyPolicy />}

          {view === "terms" && <TermsConditions />}
        </Box>
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
