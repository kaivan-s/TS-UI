import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Dialog,
  LinearProgress,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import { C } from "./theme.js";
import { capturePageview } from "./posthog.js";
import Sidebar from "./components/Sidebar.jsx";
import Header from "./components/Header.jsx";
import SetupsView from "./components/SetupsView.jsx";
import MarketView from "./components/MarketView.jsx";
import SectorsView from "./components/SectorsView.jsx";
import Guide from "./components/Guide.jsx";
import Pricing from "./components/Pricing.jsx";
import WatchlistView from "./components/WatchlistView.jsx";
import FundamentalsView from "./components/FundamentalsView.jsx";
import ResultsCalendarView from "./components/ResultsCalendarView.jsx";
import PrivacyPolicy from "./components/PrivacyPolicy.jsx";
import TermsConditions from "./components/TermsConditions.jsx";
import FeedbackView from "./components/FeedbackView.jsx";
import SectorDrawer from "./components/SectorDrawer.jsx";
import StockPage from "./components/StockPage.jsx";
import InsightsView from "./components/InsightsView.jsx";
import { getDashboard, getSector, getSymbols } from "./api.js";
import { useWatchlist } from "./watchlist.jsx";
import { useAuth } from "./auth.jsx";

// Map URL paths to view names
const PATH_TO_VIEW = {
  "/setups": "setups",
  "/sectors": "sectors",
  "/watchlist": "watchlist",
  "/fundamentals": "fundamentals",
  "/results": "results",
  "/market": "market",
  "/insights": "insights",
  "/carry": "market",
  "/scanners": "market",
  "/guide": "guide",
  "/pricing": "pricing",
  "/feedback": "feedback",
  "/privacy": "privacy",
  "/terms": "terms",
};

export default function App() {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { isPremium, trial, trialDaysLeft, trialUsed, startTrial, busy } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [trialDialogOpen, setTrialDialogOpen] = useState(false);

  // Show trial dialog once per session for eligible users (not premium, no active/used trial)
  useEffect(() => {
    if (isPremium || trial || trialUsed) return;
    const dismissed = sessionStorage.getItem("trial_dialog_dismissed");
    if (!dismissed) setTrialDialogOpen(true);
  }, [isPremium, trial, trialUsed]);

  const dismissTrialDialog = () => {
    setTrialDialogOpen(false);
    sessionStorage.setItem("trial_dialog_dismissed", "1");
  };

  const handleStartTrial = async () => {
    await startTrial?.();
    setTrialDialogOpen(false);
    sessionStorage.setItem("trial_dialog_dismissed", "1");
  };

  // Track pageviews on route change
  useEffect(() => { capturePageview(location.pathname); }, [location.pathname]);

  // Derive view from URL path (strip trailing slash)
  const cleanPath = location.pathname.replace(/\/+$/, "") || "/";
  const view = cleanPath.startsWith("/stock/")
    ? "stock"
    : PATH_TO_VIEW[cleanPath] || "setups";

  const [status, setStatus] = useState(null);
  const [scan, setScan] = useState([]);
  const [rest, setRest] = useState([]);
  const [buys, setBuys] = useState([]);
  const [error, setError] = useState("");
  const [sectorName, setSectorName] = useState(null);
  const [sector, setSector] = useState(null);
  const [sectorLoading, setSectorLoading] = useState(false);
  const [symbols, setSymbols] = useState([]);

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

  const openStock = (q, entry) => {
    const name = (q || "").trim();
    if (!name) return;
    setSectorName(null);
    const qs = entry != null && entry !== "" ? `?entry=${encodeURIComponent(entry)}` : "";
    window.open(`/stock/${encodeURIComponent(name)}${qs}`, "_blank", "noopener");
  };

  // Counts for sidebar badges
  const { count: watchlistCount } = useWatchlist();
  const counts = {
    setups: status?.n_buys ?? buys.length,
    sectors: status?.actionable ?? 0,
    watchlist: watchlistCount || undefined,
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
          Descriptive screening tool only — not SEBI-registered, not investment advice, and not a recommendation to buy or sell. All decisions are yours.{" "}
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

        {/* Trial banner */}
        {trial && (
          <Box
            sx={{
              px: { xs: 2, sm: 3 },
              pt: 1.5,
              pb: 0,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                px: 2,
                py: 1,
                borderRadius: 1.5,
                bgcolor: "rgba(142,180,196,0.08)",
                border: "1px solid rgba(142,180,196,0.2)",
              }}
            >
              <Typography sx={{ fontSize: 12.5, color: C.text }}>
                <Box component="span" sx={{ fontWeight: 600, color: C.accent }}>
                  Free trial
                </Box>
                {" · "}
                {trialDaysLeft > 1
                  ? `${trialDaysLeft} days remaining`
                  : trialDaysLeft === 1
                    ? "Last day"
                    : "Expires today"}{" "}
                — full access to all features
              </Typography>
              <Typography
                component={Link}
                to="/pricing"
                sx={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: C.accent,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                View plans →
              </Typography>
            </Box>
          </Box>
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
              onOpenStock={openStock}
            />
          )}

          {view === "watchlist" && (
            <WatchlistView onOpenStock={openStock} />
          )}

          {view === "fundamentals" && (
            <FundamentalsView onOpenStock={openStock} />
          )}

          {view === "results" && (
            <ResultsCalendarView onOpenStock={openStock} />
          )}

          {view === "market" && <MarketView onOpenStock={openStock} />}

          {view === "insights" && (
            <InsightsView onOpenStock={openStock} onOpenSector={openSector} />
          )}

          {view === "stock" && <StockPage onOpenSector={openSector} />}

          {view === "guide" && <Guide />}

          {view === "pricing" && <Pricing />}

          {view === "feedback" && <FeedbackView />}

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
        onOpenStock={openStock}
      />

      {/* Trial offer dialog */}
      <Dialog
        open={trialDialogOpen}
        onClose={dismissTrialDialog}
        PaperProps={{
          sx: {
            bgcolor: "#15161b",
            border: `1px solid ${C.line}`,
            borderRadius: 3,
            maxWidth: 440,
            width: "100%",
            mx: 2,
            overflow: "visible",
          },
        }}
        slotProps={{ backdrop: { sx: { bgcolor: "rgba(0,0,0,0.65)" } } }}
      >
        <Box sx={{ p: { xs: 3, sm: 4 }, textAlign: "center" }}>
          {/* Icon */}
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              bgcolor: "rgba(142,180,196,0.1)",
              border: "1px solid rgba(142,180,196,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2.5,
            }}
          >
            <RocketLaunchRoundedIcon sx={{ fontSize: 28, color: C.accent }} />
          </Box>

          {/* Heading */}
          <Typography
            sx={{
              fontSize: { xs: 20, sm: 22 },
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: C.text,
              mb: 0.75,
            }}
          >
            Try Pro Desk — free for 3 days
          </Typography>

          <Typography sx={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6, mb: 3 }}>
            Unlock every setup, every scan, unlimited stock lookups, and full Telegram bot access.
            No card needed — it activates instantly.
          </Typography>

          {/* Feature pills */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 0.75,
              mb: 3.5,
            }}
          >
            {[
              "Full setups list",
              "Unlimited lookups",
              "All movers & drivers",
              "Sector deep-dives",
              "Telegram bot unlimited",
            ].map((f) => (
              <Box
                key={f}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 5,
                  bgcolor: "rgba(142,180,196,0.08)",
                  border: "1px solid rgba(142,180,196,0.15)",
                  fontSize: 11.5,
                  fontWeight: 500,
                  color: C.text,
                  fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
                }}
              >
                {f}
              </Box>
            ))}
          </Box>

          {/* CTA */}
          <Button
            fullWidth
            variant="contained"
            disabled={busy}
            onClick={handleStartTrial}
            sx={{
              py: 1.4,
              borderRadius: 1.5,
              bgcolor: C.accent,
              color: "#0e0f12",
              fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
              fontSize: 14,
              fontWeight: 700,
              textTransform: "none",
              "&:hover": { bgcolor: "#a5c7d4" },
              "&.Mui-disabled": { bgcolor: "rgba(142,180,196,0.2)", color: C.muted },
            }}
          >
            {busy ? "Starting…" : "Start 3-day free trial"}
          </Button>

          {/* Dismiss */}
          <Button
            fullWidth
            onClick={dismissTrialDialog}
            sx={{
              mt: 1,
              py: 0.75,
              fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
              fontSize: 12,
              color: C.muted,
              textTransform: "none",
              "&:hover": { bgcolor: "transparent", color: C.text },
            }}
          >
            Maybe later
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}
