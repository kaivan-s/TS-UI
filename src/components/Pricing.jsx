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
  "Telegram bot — unlimited market views",
  "Telegram channel — daily alerts & insights",
];

const COMPARISON = [
  { feature: "Daily sector scan", free: true, premium: true },
  { feature: "Guide & methodology", free: true, premium: true },
  { feature: "Episode tracking", free: true, premium: true },
  { feature: "Stock lookup", free: true, premium: true },
  { feature: "Telegram bot (3/day)", free: true, premium: false },
  { feature: "Setups preview (1)", free: true, premium: false },
  { feature: "Full setups list", free: false, premium: true },
  { feature: "Leaders at rest (20)", free: false, premium: true },
  { feature: "Sector details & history", free: false, premium: true },
  { feature: "Telegram bot (unlimited)", free: false, premium: true },
  { feature: "Telegram channel alerts", free: false, premium: true },
];

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function Pricing() {
  const { upgrade, busy, isPremium, plan: currentPlan, email, refreshSubscription, cancelSubscription, subscriptionExpires, subscriptionCancelled, telegramLinked, telegramLinkCode } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [cancelledExpiry, setCancelledExpiry] = useState(null);

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
      setCancelledExpiry(result.expires_at);
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
            You'll keep premium access until {formatDate(cancelledExpiry || subscriptionExpires)}.
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
            Your subscription won't renew, but you'll keep premium access until {formatDate(subscriptionExpires)}.
            You can resubscribe anytime.
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
            ? subscriptionCancelled
              ? `Access until ${formatDate(subscriptionExpires)}`
              : `You're on the ${currentPlan === "yearly" ? "Pro" : "Premium"} plan`
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
              label={subscriptionCancelled ? "Cancelling" : "Current"}
              size="small"
              sx={{
                position: "absolute",
                top: 12,
                right: 12,
                bgcolor: subscriptionCancelled ? C.warn : C.good,
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
            disabled={busy || (isPremium && currentPlan === "monthly" && !subscriptionCancelled)}
            onClick={() => upgrade("monthly")}
            sx={{
              py: 1.25,
              bgcolor: C.accent,
              color: C.bg,
              fontWeight: 600,
              "&:hover": { bgcolor: "#7aa4b4" },
              "&.Mui-disabled": {
                bgcolor: isPremium && currentPlan === "monthly" && !subscriptionCancelled ? "rgba(125,186,150,0.15)" : "rgba(238,234,227,0.08)",
                color: isPremium && currentPlan === "monthly" && !subscriptionCancelled ? C.good : "rgba(238,234,227,0.4)",
              },
            }}
          >
            {busy ? "Loading…" : isPremium && currentPlan === "monthly" && !subscriptionCancelled ? "Active" : subscriptionCancelled ? "Resubscribe" : "Get Premium"}
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
            label={isPremium && currentPlan === "yearly" ? (subscriptionCancelled ? "Cancelling" : "Current") : "Save 33%"}
            size="small"
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              bgcolor: isPremium && currentPlan === "yearly" && subscriptionCancelled ? C.warn : C.good,
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
            disabled={busy || (isPremium && currentPlan === "yearly" && !subscriptionCancelled)}
            onClick={() => upgrade("yearly")}
            sx={{
              py: 1.25,
              bgcolor: C.good,
              color: C.bg,
              fontWeight: 600,
              "&:hover": { bgcolor: "#6aa880" },
              "&.Mui-disabled": {
                bgcolor: isPremium && currentPlan === "yearly" && !subscriptionCancelled ? "rgba(125,186,150,0.15)" : "rgba(238,234,227,0.08)",
                color: isPremium && currentPlan === "yearly" && !subscriptionCancelled ? C.good : "rgba(238,234,227,0.4)",
              },
            }}
          >
            {busy ? "Loading…" : isPremium && currentPlan === "yearly" && !subscriptionCancelled ? "Active" : subscriptionCancelled ? "Resubscribe" : "Get Pro"}
          </Button>
        </Box>
      </Box>

      {/* Cancel Subscription - Only for premium users who haven't cancelled */}
      {isPremium && !subscriptionCancelled && (
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

      {/* Show cancelled status */}
      {isPremium && subscriptionCancelled && (
        <Box sx={{ textAlign: "center", mb: 5 }}>
          <Typography sx={{ fontSize: 13, color: "rgba(238,234,227,0.5)" }}>
            Subscription cancelled · Access until {formatDate(subscriptionExpires)}
          </Typography>
        </Box>
      )}

      {/* Telegram section */}
      <Box
        sx={{
          mb: 3,
          borderRadius: 2,
          border: `1px solid ${telegramLinked ? "rgba(125,186,150,0.25)" : C.line}`,
          bgcolor: telegramLinked ? "rgba(125,186,150,0.04)" : C.paper,
          overflow: "hidden",
        }}
      >
        <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ fontSize: 20 }}>💬</Box>
          <Box>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: C.text }}>
              Telegram
            </Typography>
            <Typography sx={{ fontSize: 12, color: C.muted }}>
              {telegramLinked ? "Connected" : "Bot + channel alerts"}
            </Typography>
          </Box>
          {telegramLinked && (
            <Chip
              label="Linked"
              size="small"
              sx={{ ml: "auto", bgcolor: "rgba(125,186,150,0.15)", color: C.good, fontWeight: 600, fontSize: 11 }}
            />
          )}
        </Box>
        <Box sx={{ px: 3, py: 2.5 }}>
          {telegramLinkCode && !telegramLinked ? (
            <>
              <Typography sx={{ fontSize: 13, color: C.muted, mb: 2 }}>
                Open the <b>@MorrowDeskBot</b> on Telegram and send this code to link your account:
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  py: 2,
                  px: 3,
                  borderRadius: 1.5,
                  bgcolor: "rgba(142,180,196,0.08)",
                  border: "1px dashed rgba(142,180,196,0.25)",
                  mb: 2,
                }}
              >
                <Typography sx={{ fontSize: 13, color: C.muted, fontFamily: "monospace" }}>/verify</Typography>
                <Typography
                  sx={{
                    fontSize: 32,
                    fontWeight: 700,
                    fontFamily: "monospace",
                    letterSpacing: "0.15em",
                    color: C.accent,
                  }}
                >
                  {telegramLinkCode}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 12, color: "rgba(238,234,227,0.4)", textAlign: "center" }}>
                Code expires in 5 minutes
              </Typography>
            </>
          ) : !telegramLinked ? (
            <>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: C.text, mb: 0.5 }}>🤖 Bot</Typography>
                  <Typography sx={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                    Look up any stock, view heatmaps, triggers, delivery data, and sector flows on the go.
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: C.text, mb: 0.5 }}>📢 Channel</Typography>
                  <Typography sx={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                    Morning scorecard, midday pulse, EOD wrap — delivered to your phone automatically.
                  </Typography>
                </Box>
              </Box>
              <Typography sx={{ fontSize: 12, color: "rgba(238,234,227,0.4)" }}>
                Premium subscribers get unlimited bot access + channel alerts. To link, message <code>/link {email}</code> to <b>@MorrowDeskBot</b> on Telegram.
              </Typography>
            </>
          ) : (
            <Typography sx={{ fontSize: 13, color: C.muted }}>
              Your Telegram account is linked. All premium bot commands are unlimited and channel alerts are active.
            </Typography>
          )}
        </Box>
      </Box>

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
