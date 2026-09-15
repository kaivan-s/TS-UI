import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Typography } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import { C } from "../theme.js";
import { useAuth } from "../auth.jsx";

const FEATURES = [
  "Full setups list with entry levels",
  "Leaders at rest (top 20 momentum)",
  "All coiled bases with scores",
  "Sector shape analysis",
  "Episode tracking & resolution",
  "Stock lookup with planning",
];

const COMPARISON = [
  { feature: "Daily sector scan", free: true, premium: true },
  { feature: "Guide & methodology", free: true, premium: true },
  { feature: "Episode tracking", free: true, premium: true },
  { feature: "Stock lookup", free: true, premium: true },
  { feature: "Setups preview (1)", free: true, premium: false },
  { feature: "Full setups list", free: false, premium: true },
  { feature: "Leaders at rest (20)", free: false, premium: true },
  { feature: "Sector details & history", free: false, premium: true },
];

export default function Pricing() {
  const { upgrade, busy, isPremium, plan: currentPlan, email, refreshSubscription, cancelSubscription } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccess(true);
      refreshSubscription?.();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, refreshSubscription]);

  const handleCancelConfirm = async () => {
    setShowCancelDialog(false);
    const result = await cancelSubscription?.();
    if (result?.success) {
      setShowCancelled(true);
    }
  };

  return (
    <Box sx={{ pb: 8, maxWidth: 800, mx: "auto" }}>
      {/* Alerts */}
      {showSuccess && (
        <Alert
          severity="success"
          icon={<CelebrationRoundedIcon />}
          onClose={() => setShowSuccess(false)}
          sx={{
            mb: 4,
            bgcolor: "rgba(125,186,150,0.12)",
            border: "1px solid rgba(125,186,150,0.25)",
            color: C.text,
            "& .MuiAlert-icon": { color: C.good },
          }}
        >
          <Typography sx={{ fontWeight: 600 }}>Welcome to Premium!</Typography>
          <Typography sx={{ fontSize: 14, color: "rgba(238,234,227,0.7)" }}>
            Your subscription is now active. Full access unlocked.
          </Typography>
        </Alert>
      )}

      {showCancelled && (
        <Alert
          severity="info"
          icon={<CancelRoundedIcon />}
          onClose={() => setShowCancelled(false)}
          sx={{
            mb: 4,
            bgcolor: "rgba(142,180,196,0.12)",
            border: "1px solid rgba(142,180,196,0.25)",
            color: C.text,
            "& .MuiAlert-icon": { color: C.accent },
          }}
        >
          <Typography sx={{ fontWeight: 600 }}>Subscription Cancelled</Typography>
          <Typography sx={{ fontSize: 14, color: "rgba(238,234,227,0.7)" }}>
            You can resubscribe anytime.
          </Typography>
        </Alert>
      )}

      {/* Cancel Dialog */}
      <Dialog
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        PaperProps={{ sx: { bgcolor: C.paper, border: `1px solid ${C.line}`, borderRadius: 2, maxWidth: 400 } }}
      >
        <DialogTitle sx={{ color: C.text, pb: 1 }}>Cancel Subscription?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "rgba(238,234,227,0.7)" }}>
            You'll lose access to premium features immediately. You can resubscribe anytime.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setShowCancelDialog(false)} sx={{ color: "rgba(238,234,227,0.6)" }}>
            Keep Subscription
          </Button>
          <Button
            onClick={handleCancelConfirm}
            disabled={busy}
            sx={{ color: C.bad, fontWeight: 600, "&:hover": { bgcolor: "rgba(229,115,115,0.1)" } }}
          >
            {busy ? "Cancelling…" : "Cancel"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Header */}
      <Box sx={{ textAlign: "center", mb: 5 }}>
        <Typography
          sx={{
            fontSize: { xs: 28, sm: 36 },
            fontWeight: 700,
            color: C.text,
            letterSpacing: "-0.03em",
            mb: 1.5,
          }}
        >
          {isPremium ? "Your Plan" : "Choose your plan"}
        </Typography>
        <Typography sx={{ fontSize: 16, color: "rgba(238,234,227,0.6)", maxWidth: 400, mx: "auto" }}>
          {isPremium 
            ? `You're on the ${currentPlan === "yearly" ? "Pro" : "Premium"} plan`
            : "Full access to setups, sectors, and tracking tools"
          }
        </Typography>
      </Box>

      {/* Pricing Cards - Side by Side */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2,
          mb: 4,
        }}
      >
        {/* Monthly Plan */}
        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: C.paper,
            border: `1px solid ${isPremium && currentPlan === "monthly" ? C.good : C.line}`,
            position: "relative",
          }}
        >
          {isPremium && currentPlan === "monthly" && (
            <Chip
              label="Current"
              size="small"
              sx={{
                position: "absolute",
                top: 12,
                right: 12,
                bgcolor: C.good,
                color: C.bg,
                fontWeight: 600,
                fontSize: 11,
              }}
            />
          )}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <StarRoundedIcon sx={{ fontSize: 20, color: C.accent }} />
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: C.text }}>Premium</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mb: 1 }}>
            <Typography sx={{ fontSize: 32, fontWeight: 700, color: C.text }}>₹499</Typography>
            <Typography sx={{ fontSize: 14, color: "rgba(238,234,227,0.5)" }}>/month</Typography>
          </Box>
          <Typography sx={{ fontSize: 13, color: "rgba(238,234,227,0.5)", mb: 3 }}>
            Billed monthly
          </Typography>
          <Button
            fullWidth
            variant="contained"
            disabled={busy || (isPremium && currentPlan === "monthly")}
            onClick={() => upgrade("monthly")}
            sx={{
              py: 1.25,
              bgcolor: C.accent,
              color: C.bg,
              fontWeight: 600,
              "&:hover": { bgcolor: "#7aa4b4" },
              "&.Mui-disabled": {
                bgcolor: isPremium && currentPlan === "monthly" ? "rgba(125,186,150,0.15)" : "rgba(238,234,227,0.08)",
                color: isPremium && currentPlan === "monthly" ? C.good : "rgba(238,234,227,0.4)",
              },
            }}
          >
            {busy ? "Loading…" : isPremium && currentPlan === "monthly" ? "Active" : "Get Premium"}
          </Button>
        </Box>

        {/* Yearly Plan */}
        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: "rgba(125,186,150,0.04)",
            border: `1px solid ${isPremium && currentPlan === "yearly" ? C.good : "rgba(125,186,150,0.2)"}`,
            position: "relative",
          }}
        >
          <Chip
            label={isPremium && currentPlan === "yearly" ? "Current" : "Save 33%"}
            size="small"
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              bgcolor: C.good,
              color: C.bg,
              fontWeight: 600,
              fontSize: 11,
            }}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <WorkspacePremiumRoundedIcon sx={{ fontSize: 20, color: C.good }} />
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: C.text }}>Pro</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mb: 1 }}>
            <Typography sx={{ fontSize: 32, fontWeight: 700, color: C.text }}>₹3,999</Typography>
            <Typography sx={{ fontSize: 14, color: "rgba(238,234,227,0.5)" }}>/year</Typography>
          </Box>
          <Typography sx={{ fontSize: 13, color: "rgba(238,234,227,0.5)", mb: 3 }}>
            ₹333/month · Save ₹1,989
          </Typography>
          <Button
            fullWidth
            variant="contained"
            disabled={busy || (isPremium && currentPlan === "yearly")}
            onClick={() => upgrade("yearly")}
            sx={{
              py: 1.25,
              bgcolor: C.good,
              color: C.bg,
              fontWeight: 600,
              "&:hover": { bgcolor: "#6aa880" },
              "&.Mui-disabled": {
                bgcolor: isPremium && currentPlan === "yearly" ? "rgba(125,186,150,0.15)" : "rgba(238,234,227,0.08)",
                color: isPremium && currentPlan === "yearly" ? C.good : "rgba(238,234,227,0.4)",
              },
            }}
          >
            {busy ? "Loading…" : isPremium && currentPlan === "yearly" ? "Active" : "Get Pro"}
          </Button>
        </Box>
      </Box>

      {/* Cancel Subscription - Only for premium users */}
      {isPremium && (
        <Box sx={{ textAlign: "center", mb: 5 }}>
          <Button
            size="small"
            onClick={() => setShowCancelDialog(true)}
            sx={{ color: "rgba(238,234,227,0.4)", fontSize: 13, "&:hover": { color: C.bad } }}
          >
            Cancel subscription
          </Button>
        </Box>
      )}

      {/* What's Included */}
      <Box
        sx={{
          p: 3,
          borderRadius: 2,
          bgcolor: C.paper,
          border: `1px solid ${C.line}`,
          mb: 3,
        }}
      >
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: C.text, mb: 2.5 }}>
          What's included
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 1.5,
          }}
        >
          {FEATURES.map((f) => (
            <Box key={f} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <CheckRoundedIcon sx={{ fontSize: 18, color: C.good }} />
              <Typography sx={{ fontSize: 14, color: C.text }}>{f}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Comparison Table */}
      <Box
        sx={{
          borderRadius: 2,
          bgcolor: C.paper,
          border: `1px solid ${C.line}`,
          overflow: "hidden",
          mb: 3,
        }}
      >
        <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${C.line}` }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: C.text }}>
            Free vs Premium
          </Typography>
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 70px 70px", px: 3, py: 1.5, borderBottom: `1px solid ${C.line}`, bgcolor: "rgba(238,234,227,0.02)" }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: "rgba(238,234,227,0.5)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Feature
          </Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: "rgba(238,234,227,0.5)", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center" }}>
            Free
          </Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: C.good, textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center" }}>
            Pro
          </Typography>
        </Box>
        {COMPARISON.map((row, i) => (
          <Box
            key={row.feature}
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 70px 70px",
              px: 3,
              py: 1.5,
              borderBottom: i < COMPARISON.length - 1 ? `1px solid ${C.line}` : "none",
            }}
          >
            <Typography sx={{ fontSize: 14, color: C.text }}>{row.feature}</Typography>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              {row.free ? (
                <CheckRoundedIcon sx={{ fontSize: 18, color: "rgba(238,234,227,0.4)" }} />
              ) : (
                <CloseRoundedIcon sx={{ fontSize: 18, color: "rgba(238,234,227,0.2)" }} />
              )}
            </Box>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              {row.premium !== false ? (
                <CheckRoundedIcon sx={{ fontSize: 18, color: C.good }} />
              ) : (
                <CloseRoundedIcon sx={{ fontSize: 18, color: "rgba(238,234,227,0.2)" }} />
              )}
            </Box>
          </Box>
        ))}
      </Box>

      {/* FAQ */}
      <Box
        sx={{
          p: 3,
          borderRadius: 2,
          bgcolor: C.paper,
          border: `1px solid ${C.line}`,
        }}
      >
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: C.text, mb: 2.5 }}>
          Questions
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: C.text, mb: 0.5 }}>
              Can I cancel anytime?
            </Typography>
            <Typography sx={{ fontSize: 13, color: "rgba(238,234,227,0.6)", lineHeight: 1.6 }}>
              Yes. Cancel before the next billing cycle and you won't be charged again.
            </Typography>
          </Box>
          <Divider sx={{ borderColor: C.line }} />
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: C.text, mb: 0.5 }}>
              What payment methods?
            </Typography>
            <Typography sx={{ fontSize: 13, color: "rgba(238,234,227,0.6)", lineHeight: 1.6 }}>
              Credit/debit cards, UPI, and net banking through our secure payment partner.
            </Typography>
          </Box>
          <Divider sx={{ borderColor: C.line }} />
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: C.text, mb: 0.5 }}>
              Is this financial advice?
            </Typography>
            <Typography sx={{ fontSize: 13, color: "rgba(238,234,227,0.6)", lineHeight: 1.6 }}>
              No. This is a screening tool. Position sizing and whether to act are your decisions.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
