import { Box, Typography } from "@mui/material";
import { C } from "../theme.js";
import { useAuth } from "../auth.jsx";
import Login from "./Login.jsx";
import App from "../App.jsx";

export default function AuthGate() {
  const { session, configured, loading, denied } = useAuth();

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

  if (configured && (!session || denied)) return <Login />;
  return <App />;
}
