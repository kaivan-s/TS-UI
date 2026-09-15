import { Routes, Route, Navigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { C } from "./theme.js";
import { useAuth } from "./auth.jsx";
import Landing from "./components/Landing.jsx";
import Login from "./components/Login.jsx";
import App from "./App.jsx";

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

function RequireAuth({ children }) {
  const { session, configured, loading, denied } = useAuth();

  if (loading) return <Loading />;

  // Not configured (local dev) — allow through
  if (!configured) return children;

  // Denied — show login with denial message
  if (denied) return <Navigate to="/login" replace />;

  // Not logged in — redirect to landing
  if (!session) return <Navigate to="/" replace />;

  return children;
}

function PublicOnly({ children }) {
  const { session, configured, loading, denied } = useAuth();

  if (loading) return <Loading />;

  // If logged in and not denied, redirect to app
  if (configured && session && !denied) {
    return <Navigate to="/setups" replace />;
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
        path="/tracking"
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

      {/* Catch-all: redirect to setups if logged in, landing if not */}
      <Route path="*" element={<Navigate to="/setups" replace />} />
    </Routes>
  );
}
