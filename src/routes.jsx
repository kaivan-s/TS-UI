import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { C } from "./theme.js";
import { useAuth } from "./auth.jsx";
import Landing from "./components/Landing.jsx";
import Login from "./components/Login.jsx";
import PrivacyPolicy from "./components/PrivacyPolicy.jsx";
import TermsConditions from "./components/TermsConditions.jsx";
import App from "./App.jsx";

function TrailingSlashRedirect() {
  const location = useLocation();
  const clean = location.pathname.replace(/\/+$/, "");
  // If stripping the slash gives a known route, redirect there
  if (clean && clean !== location.pathname) {
    return <Navigate to={clean + location.search} replace />;
  }
  // Otherwise fall back to setups
  return <Navigate to="/setups" replace />;
}

function Loading() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography sx={{ color: C.muted, fontSize: 14.5 }}>Opening…</Typography>
    </Box>
  );
}

function PublicPage({ children }) {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: C.bg }}>
      {/* Header with back link */}
      <Box
        sx={{
          borderBottom: `1px solid ${C.line}`,
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Link
          to="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1.5,
              bgcolor: "rgba(142,180,196,0.1)",
              border: "1px solid rgba(142,180,196,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: C.accent }}>M</Typography>
          </Box>
          <Typography sx={{ fontSize: 15, fontWeight: 500, color: C.text }}>
            Morrow Desk
          </Typography>
        </Link>
      </Box>
      {/* Content */}
      <Box sx={{ maxWidth: 800, mx: "auto", px: 3, py: 4 }}>
        {children}
      </Box>
    </Box>
  );
}

function RequireAuth({ children }) {
  const { session, configured, loading, denied } = useAuth();
  const location = useLocation();

  if (loading) return <Loading />;

  // Not configured (local dev) — allow through
  if (!configured) return children;

  // Denied — show login with denial message
  if (denied) return <Navigate to="/login" replace />;

  // Not logged in — redirect to landing, but remember where they were
  // so PublicOnly can send them back after login instead of always
  // landing on /setups.
  if (!session) {
    const next = location.pathname === "/setups" ? "" : location.pathname;
    return <Navigate to={next ? `/?next=${encodeURIComponent(next)}` : "/"} replace />;
  }

  return children;
}

function PublicOnly({ children }) {
  const { session, configured, loading, denied } = useAuth();
  const location = useLocation();

  if (loading) return <Loading />;

  // If logged in and not denied, redirect to app.
  // Honour ?next= so a page refresh returns to the same page.
  if (configured && session && !denied) {
    const params = new URLSearchParams(location.search);
    const next = params.get("next");
    const dest = next && next.startsWith("/") ? next : "/setups";
    return <Navigate to={dest} replace />;
  }

  return children;
}

export default function AppRoutes() {
  const { configured, loading } = useAuth();

  if (loading) return <Loading />;

  // Auth not configured — go straight to app (local dev mode)
  if (!configured) {
    return (
      <Routes>
        <Route path="/*" element={<App />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={
          <PublicOnly>
            <Landing />
          </PublicOnly>
        }
      />
      <Route
        path="/login"
        element={
          <PublicOnly>
            <Login />
          </PublicOnly>
        }
      />

      {/* Public legal pages - accessible without login */}
      <Route path="/privacy" element={<PublicPage><PrivacyPolicy /></PublicPage>} />
      <Route path="/terms" element={<PublicPage><TermsConditions /></PublicPage>} />

      {/* Protected app routes */}
      <Route
        path="/setups"
        element={
          <RequireAuth>
            <App />
          </RequireAuth>
        }
      />
      <Route
        path="/sectors"
        element={
          <RequireAuth>
            <App />
          </RequireAuth>
        }
      />
      <Route
        path="/insights"
        element={
          <RequireAuth>
            <App />
          </RequireAuth>
        }
      />
      <Route
        path="/commodities"
        element={
          <RequireAuth>
            <App />
          </RequireAuth>
        }
      />
      <Route
        path="/stock/:symbol"
        element={
          <RequireAuth>
            <App />
          </RequireAuth>
        }
      />
      {/* /tracking removed — episode log replaced by watchlist */}
      <Route path="/tracking" element={<Navigate to="/setups" replace />} />
      {/* Market scanners merged into Setups — redirect legacy URLs */}
      <Route path="/market" element={<Navigate to="/setups" replace />} />
      <Route path="/carry" element={<Navigate to="/setups" replace />} />
      <Route path="/scanners" element={<Navigate to="/setups" replace />} />
      <Route
        path="/watchlist"
        element={
          <RequireAuth>
            <App />
          </RequireAuth>
        }
      />
      <Route
        path="/fundamentals"
        element={
          <RequireAuth>
            <App />
          </RequireAuth>
        }
      />
      <Route
        path="/results"
        element={
          <RequireAuth>
            <App />
          </RequireAuth>
        }
      />
      <Route
        path="/guide"
        element={
          <RequireAuth>
            <App />
          </RequireAuth>
        }
      />
      <Route
        path="/pricing"
        element={
          <RequireAuth>
            <App />
          </RequireAuth>
        }
      />
      <Route
        path="/feedback"
        element={
          <RequireAuth>
            <App />
          </RequireAuth>
        }
      />

      {/* Strip trailing slashes — /pricing/ → /pricing */}
      <Route path="*" element={<TrailingSlashRedirect />} />
    </Routes>
  );
}
