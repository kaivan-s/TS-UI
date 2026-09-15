import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { C } from "../theme.js";
import { useAuth } from "../auth.jsx";
import Landing from "./Landing.jsx";
import Login from "./Login.jsx";
import App from "../App.jsx";

export default function AuthGate() {
  const { session, configured, loading, denied } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (loading) {
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

  // Authenticated user — show the app
  if (session && !denied) return <App />;

  // Not authenticated — show landing or login
  if (configured) {
    if (showLogin || denied) {
      return <Login onBack={() => setShowLogin(false)} />;
    }
    return <Landing onGetStarted={() => setShowLogin(true)} />;
  }

  // Auth not configured — go straight to app (local dev mode)
  return <App />;
}
