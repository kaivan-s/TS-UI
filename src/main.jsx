import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { AuthProvider } from "./auth.jsx";
import AuthGate from "./components/AuthGate.jsx";
import { theme } from "./theme.js";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
