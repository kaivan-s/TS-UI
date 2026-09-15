/**
 * Premium gating components.
 * 
 * - PremiumGate: Wraps content, shows upgrade prompt if not premium
 * - PremiumOverlay: Blurs content with upgrade CTA overlay
 * - LockedTab: Shows locked state for premium-only tabs
 */

import { Box, Button, Typography } from "@mui/material";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { C } from "../theme.js";
import { useAuth } from "../auth.jsx";

/**
 * Gate that only renders children if user is premium.
 * Otherwise shows an upgrade prompt.
 */
export function PremiumGate({ children, feature = "This feature" }) {
  const { isPremium, upgrade, busy } = useAuth();

  if (isPremium) return children;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
        px: 3,
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: 3,
          bgcolor: "rgba(142,180,196,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 2.5,
        }}
      >
        <LockRoundedIcon sx={{ fontSize: 28, color: C.accent }} />
      </Box>
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: C.text, mb: 1 }}>
        {feature} is Premium
      </Typography>
      <Typography sx={{ fontSize: 14, color: C.muted, mb: 3, maxWidth: 320 }}>
        Upgrade to access the full scan results, coiled bases, and actionable setups.
      </Typography>
      <Button
        variant="contained"
        onClick={() => upgrade("monthly")}
        disabled={busy}
        startIcon={<StarRoundedIcon />}
        sx={{
          bgcolor: C.accent,
          color: C.bg,
          fontWeight: 600,
          px: 3,
          "&:hover": { bgcolor: "#7aa4b4" },
        }}
      >
        {busy ? "Loading…" : "Upgrade for ₹499/month"}
      </Button>
    </Box>
  );
}

/**
 * Overlay that blurs content and shows upgrade CTA.
 * Shows `previewCount` items clearly, blurs the rest.
 */
export function PremiumOverlay({
  children,
  previewCount = 3,
  totalCount = 0,
  feature = "Full list",
}) {
  const { isPremium, upgrade, busy } = useAuth();

  const hiddenCount = Math.max(0, totalCount - previewCount);

  // Premium users or nothing hidden = no overlay
  if (isPremium || hiddenCount <= 0) return children;

  return (
    <Box sx={{ position: "relative" }}>
      {children}
      
      {/* Gradient overlay */}
      <Box
        sx={{
          position: "absolute",
          top: 120, // Leave first few rows visible
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(to bottom, transparent 0%, ${C.bg}ee 30%, ${C.bg} 100%)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pt: 8,
        }}
      >
        <Box
          sx={{
            bgcolor: C.paper,
            border: `1px solid ${C.line}`,
            borderRadius: 3,
            p: 4,
            textAlign: "center",
            maxWidth: 360,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: "rgba(142,180,196,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <LockRoundedIcon sx={{ fontSize: 22, color: C.accent }} />
          </Box>
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: C.text, mb: 0.75 }}>
            {hiddenCount > 0 ? `+${hiddenCount} more` : feature}
          </Typography>
          <Typography sx={{ fontSize: 13, color: C.muted, mb: 2.5 }}>
            Upgrade to see the complete list
          </Typography>
          <Button
            variant="contained"
            onClick={() => upgrade("monthly")}
            disabled={busy}
            size="small"
            sx={{
              bgcolor: C.accent,
              color: C.bg,
              fontWeight: 600,
              "&:hover": { bgcolor: "#7aa4b4" },
            }}
          >
            {busy ? "Loading…" : "Upgrade · ₹499/mo"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Locked tab content placeholder.
 */
export function LockedTab({ name }) {
  const { upgrade, busy } = useAuth();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 10,
        px: 3,
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: 4,
          bgcolor: "rgba(142,180,196,0.08)",
          border: `1px solid rgba(142,180,196,0.15)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 3,
        }}
      >
        <LockRoundedIcon sx={{ fontSize: 32, color: C.accent }} />
      </Box>
      <Typography sx={{ fontSize: 20, fontWeight: 600, color: C.text, mb: 1 }}>
        {name}
      </Typography>
      <Typography sx={{ fontSize: 14, color: C.muted, mb: 3, maxWidth: 400, textAlign: "center" }}>
        {name === "Coils"
          ? "Coiled bases are tight, quiet setups near their highs. Upgrade to see which stocks are ready to break out."
          : name === "Setups"
          ? "Setups combine sector strength with coiled stocks. Upgrade to see the shortlist."
          : "This feature requires a premium subscription."}
      </Typography>
      <Button
        variant="contained"
        onClick={() => upgrade("monthly")}
        disabled={busy}
        startIcon={<StarRoundedIcon />}
        sx={{
          bgcolor: C.accent,
          color: C.bg,
          fontWeight: 600,
          px: 3,
          "&:hover": { bgcolor: "#7aa4b4" },
        }}
      >
        {busy ? "Loading…" : "Unlock for ₹499/month"}
      </Button>
    </Box>
  );
}

/**
 * Badge showing premium status.
 */
export function PremiumBadge({ small = false }) {
  const { isPremium, plan } = useAuth();

  if (!isPremium) return null;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: small ? 0.75 : 1,
        py: small ? 0.25 : 0.5,
        borderRadius: 1,
        bgcolor: "rgba(125,186,150,0.12)",
        color: C.good,
        fontSize: small ? 10 : 11,
        fontWeight: 600,
      }}
    >
      <StarRoundedIcon sx={{ fontSize: small ? 12 : 14 }} />
      {plan === "yearly" ? "Pro" : "Premium"}
    </Box>
  );
}
