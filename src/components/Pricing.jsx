import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import { C } from "../theme.js";
import { useAuth } from "../auth.jsx";
import { TELEGRAM_BOT } from "../config.js";

const MONO = '"IBM Plex Mono", ui-monospace, monospace';

const FREE_HIGHLIGHTS = [
  "Nightly sector momentum scans",
  "Coiled bases overview",
  "Interactive 6M–5Y candlestick charts",
  "Company fundamentals + CSV export",
  "Synced personal watchlist",
  "Results calendar (120-day window)",
  "3 Telegram bot market views / day",
];

const PRO_HIGHLIGHTS = [
  "Everything in Free Desk, unlimited",
  "Full sector-agreed Setups list + triggers",
  "Leaders at rest (top 20 momentum)",
  "Sector shape & constituent history",
  "Complete 365-day episode & outcome log",
  "Sector & delivery queries in Telegram",
  "Unlimited on-demand Telegram bot views",
  "Priority EOD refresh after 20:30 IST",
];

const COMPARISON_GROUPS = [
  {
    category: "Core Screening & Charts",
    rows: [
      { feature: "Nightly sector rotation scan", free: "Full access", pro: "Full access" },
      { feature: "Sector constituent & shape history", free: false, pro: "Full history" },
      { feature: "Interactive 6M–5Y candlestick charts", free: "Included", pro: "Included" },
      { feature: "Company fundamentals & CSV export", free: "2,000+ stocks", pro: "2,000+ stocks" },
      { feature: "Earnings results calendar", free: "120d window", pro: "120d window" },
      { feature: "Personal synced watchlist", free: "Included", pro: "Included" },
    ],
  },
  {
    category: "Actionable Setups & Audit Trail",
    rows: [
      { feature: "Sector-agreed Setups list", free: "1 preview", pro: "Full list + entry levels" },
      { feature: "Leaders at rest (12M momentum cut)", free: false, pro: "Top 20 ranked" },
      { feature: "All coiled bases with scores", free: "Overview", pro: "Full pool + filters" },
      { feature: "365-day basing episode & outcome log", free: "Summary", pro: "Full resolution log" },
      { feature: "Header stock lookup & gate check", free: "Included", pro: "Included" },
    ],
  },
  {
    category: "Telegram Bot Integration",
    rows: [
      { feature: "Stock lookup (/r) & daily brief (/today)", free: "Unlimited", pro: "Unlimited" },
      { feature: "Market views (/heatmap, /flow, /triggers, /delivery)", free: "3 / day", pro: "Unlimited" },
      { feature: "Sector drilldown (/sector) & session diff (/changed)", free: "3 / day", pro: "Unlimited" },
    ],
  },
];

const FAQS = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel with one click before your next billing date and you won't be charged again. Your Pro access stays active through the end of the paid period.",
  },
  {
    q: "What payment methods are supported?",
    a: "All major credit and debit cards, UPI, and net banking through our secure payment partner.",
  },
  {
    q: "How do I connect the Telegram Bot to my Pro plan?",
    a: "Open the Telegram Bot, send /link with your Morrow Desk login email, and then enter the 6-digit verification code displayed in the Telegram card on this page.",
  },
  {
    q: "Is Morrow Desk financial advice?",
    a: "No. Morrow Desk is a quantitative post-market screening tool. It highlights where sector flow and price compression overlap — position sizing, stops, and execution are yours.",
  },
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
  const {
    upgrade,
    busy,
    isPremium,
    plan: currentPlan,
    email,
    refreshSubscription,
    cancelSubscription,
    subscriptionExpires,
    subscriptionCancelled,
    telegramLinked,
    telegramLinkCode,
  } = useAuth();

  const [searchParams, setSearchParams] = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [cancelledExpiry, setCancelledExpiry] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

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

  const handleCopyVerify = () => {
    if (!telegramLinkCode) return;
    navigator.clipboard?.writeText(`/verify ${telegramLinkCode}`);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const monthlyActive = isPremium && currentPlan === "monthly" && !subscriptionCancelled;
  const yearlyActive = isPremium && currentPlan === "yearly" && !subscriptionCancelled;

  return (
    <Box sx={{ pb: 8, maxWidth: 1080, mx: "auto" }}>
      {/* Alerts */}
      {showSuccess && (
        <Alert
          severity="success"
          icon={<CelebrationRoundedIcon />}
          onClose={() => setShowSuccess(false)}
          sx={{
            mb: 3.5,
            borderRadius: 2.5,
            bgcolor: "rgba(125,186,150,0.1)",
            border: "1px solid rgba(125,186,150,0.28)",
            color: C.text,
            "& .MuiAlert-icon": { color: C.good },
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: 15 }}>Welcome to Pro Desk!</Typography>
          <Typography sx={{ fontSize: 13.5, color: C.muted, mt: 0.25 }}>
            Your subscription is active and all setups, leaders at rest, and episode logs are unlocked.
          </Typography>
          <Typography sx={{ fontSize: 12.75, color: C.muted, mt: 1, fontFamily: MONO }}>
            Link Telegram:{" "}
            <a href={TELEGRAM_BOT} target="_blank" rel="noopener" style={{ color: C.accent }}>
              Open Bot ↗
            </a>{" "}
            → send <code>/link {email}</code>
          </Typography>
        </Alert>
      )}

      {showCancelled && (
        <Alert
          severity="info"
          icon={<CancelRoundedIcon />}
          onClose={() => setShowCancelled(false)}
          sx={{
            mb: 3.5,
            borderRadius: 2.5,
            bgcolor: "rgba(142,180,196,0.1)",
            border: "1px solid rgba(142,180,196,0.25)",
            color: C.text,
            "& .MuiAlert-icon": { color: C.accent },
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: 15 }}>Subscription Cancelled</Typography>
          <Typography sx={{ fontSize: 13.5, color: C.muted, mt: 0.25 }}>
            You&apos;ll retain full Pro access until {formatDate(cancelledExpiry || subscriptionExpires)}. You can resubscribe anytime.
          </Typography>
        </Alert>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: "#15161b",
            border: `1px solid ${C.line}`,
            borderRadius: 2.5,
            maxWidth: 420,
          },
        }}
      >
        <DialogTitle sx={{ color: C.text, fontWeight: 600, pb: 1 }}>
          Cancel Pro Subscription?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
            Your subscription won&apos;t renew, and you&apos;ll keep full Pro access until{" "}
            <Box component="span" sx={{ color: C.text, fontWeight: 500 }}>
              {formatDate(subscriptionExpires)}
            </Box>
            . You can resubscribe whenever you like.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setShowCancelDialog(false)} sx={{ color: C.muted }}>
            Keep Pro
          </Button>
          <Button
            onClick={handleCancelConfirm}
            disabled={busy}
            sx={{
              color: C.bad,
              fontWeight: 600,
              "&:hover": { bgcolor: "rgba(200,122,122,0.1)" },
            }}
          >
            {busy ? "Cancelling…" : "Confirm Cancel"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Top Header Banner */}
      <Box
        sx={{
          p: { xs: 2.75, sm: 3.75 },
          mb: 3.5,
          borderRadius: 3,
          bgcolor: "#15161b",
          border: `1px solid ${C.line}`,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 2.5,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: isPremium ? C.good : C.accent,
              }}
            />
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: 10.5,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: isPremium ? C.good : C.accent,
              }}
            >
              {isPremium ? "PRO DESK MEMBERSHIP" : "PLANS & MEMBERSHIP"}
            </Typography>
          </Box>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: 24, sm: 30 },
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: C.text,
              mb: 0.75,
            }}
          >
            {isPremium ? "Your Morrow Desk Plan" : "Start free. Upgrade for the full lists."}
          </Typography>
          <Typography sx={{ fontSize: 14.25, color: C.muted, lineHeight: 1.6, maxWidth: 620 }}>
            {isPremium
              ? subscriptionCancelled
                ? `Your Pro subscription is set to end on ${formatDate(subscriptionExpires)}.`
                : `You have full access to all sector-agreed setups, leaders at rest, 365-day episode logs, and unlimited Telegram bot queries.`
              : "The core desk — charts, fundamentals, watchlist, results calendar, and nightly sector scans — is free forever. Upgrade to Pro for the complete setups shortlist and unlimited bot queries."}
          </Typography>
        </Box>

        {/* Current Plan Status Pill */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: { xs: "flex-start", md: "flex-end" },
            gap: 1,
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.25,
              borderRadius: 2,
              bgcolor: "#0e0f12",
              border: `1px solid ${isPremium ? "rgba(125,186,150,0.28)" : C.line}`,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: isPremium ? (subscriptionCancelled ? C.warn : C.good) : C.muted,
              }}
            />
            <Box>
              <Typography sx={{ fontFamily: MONO, fontSize: 10, color: C.muted, letterSpacing: "0.12em" }}>
                CURRENT TIER
              </Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: C.text }}>
                {isPremium
                  ? `Pro Desk · ${currentPlan === "yearly" ? "Yearly" : "Monthly"}`
                  : "Free Desk · ₹0"}
              </Typography>
            </Box>
          </Box>

          {isPremium && !subscriptionCancelled && (
            <Button
              size="small"
              onClick={() => setShowCancelDialog(true)}
              sx={{
                fontFamily: MONO,
                fontSize: 11,
                color: C.muted,
                px: 1,
                py: 0.25,
                "&:hover": { color: C.bad, bgcolor: "transparent" },
              }}
            >
              Cancel renewal
            </Button>
          )}
        </Box>
      </Box>

      {/* 3-Column Pricing Tier Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "repeat(12, 1fr)" },
          gap: 2.25,
          mb: 4,
        }}
      >
        {/* Column 1: Free Desk (4 cols) */}
        <Box
          sx={{
            gridColumn: { xs: "span 1", lg: "span 4" },
            p: 3,
            borderRadius: 2.5,
            bgcolor: "#15161b",
            border: `1px solid ${!isPremium ? "rgba(238,234,227,0.16)" : C.line}`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.16em", color: C.muted }}>
                FREE DESK
              </Typography>
              {!isPremium && (
                <Chip
                  size="small"
                  label="Current tier"
                  sx={{
                    fontFamily: MONO,
                    fontSize: 10.5,
                    bgcolor: "rgba(238,234,227,0.08)",
                    color: C.text,
                  }}
                />
              )}
            </Box>

            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 0.75 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 34, fontWeight: 600, color: C.text }}>
                ₹0
              </Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>
                / forever
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 13, color: C.muted, mb: 2.5, lineHeight: 1.55 }}>
              Market breadth, candlestick charts, fundamentals, results calendar, and watchlist.
            </Typography>

            <Box sx={{ height: "1px", bgcolor: C.line, mb: 2.25 }} />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
              {FREE_HIGHLIGHTS.map((item) => (
                <Box key={item} sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                  <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "rgba(238,234,227,0.35)", flexShrink: 0 }} />
                  <Typography sx={{ fontSize: 13, color: C.muted }}>{item}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{ mt: 3.5 }}>
            <Box
              sx={{
                py: 1.25,
                borderRadius: 1.5,
                border: `1px solid ${C.line}`,
                bgcolor: "rgba(255,255,255,0.02)",
                textAlign: "center",
                fontFamily: MONO,
                fontSize: 12,
                color: C.muted,
              }}
            >
              {isPremium ? "Included in your account" : "✓ Active on your account"}
            </Box>
          </Box>
        </Box>

        {/* Column 2: Pro Monthly (4 cols) */}
        <Box
          sx={{
            gridColumn: { xs: "span 1", lg: "span 4" },
            p: 3,
            borderRadius: 2.5,
            bgcolor: "#15161b",
            border: `1px solid ${monthlyActive ? C.good : "rgba(142,180,196,0.22)"}`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.16em", color: C.accent }}>
                PRO · MONTHLY
              </Typography>
              {isPremium && currentPlan === "monthly" ? (
                <Chip
                  size="small"
                  label={subscriptionCancelled ? "Cancelling" : "Active plan"}
                  sx={{
                    fontFamily: MONO,
                    fontSize: 10.5,
                    fontWeight: 600,
                    bgcolor: subscriptionCancelled ? "rgba(196,164,106,0.16)" : "rgba(125,186,150,0.16)",
                    color: subscriptionCancelled ? C.warn : C.good,
                  }}
                />
              ) : (
                <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>
                  Flexible
                </Typography>
              )}
            </Box>

            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 0.75 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 34, fontWeight: 600, color: C.text }}>
                ₹499
              </Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>
                / month
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 13, color: C.muted, mb: 2.5, lineHeight: 1.55 }}>
              Full access to every screen and unlimited Telegram bot queries. Cancel anytime.
            </Typography>

            <Box sx={{ height: "1px", bgcolor: C.line, mb: 2.25 }} />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
              {PRO_HIGHLIGHTS.slice(0, 7).map((item) => (
                <Box key={item} sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                  <CheckRoundedIcon sx={{ fontSize: 16, color: C.accent, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: 13, color: C.text }}>{item}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{ mt: 3.5 }}>
            <Button
              fullWidth
              variant="contained"
              disabled={busy || (isPremium && !subscriptionCancelled)}
              onClick={() => upgrade("monthly")}
              sx={{
                py: 1.3,
                borderRadius: 1.5,
                bgcolor: "rgba(238,234,227,0.1)",
                color: C.text,
                border: "1px solid rgba(238,234,227,0.16)",
                fontWeight: 600,
                fontSize: 13.5,
                "&:hover": {
                  bgcolor: "rgba(238,234,227,0.16)",
                  borderColor: "rgba(238,234,227,0.28)",
                },
                "&.Mui-disabled": {
                  bgcolor: monthlyActive ? "rgba(125,186,150,0.12)" : "rgba(255,255,255,0.04)",
                  color: monthlyActive ? C.good : C.muted,
                  borderColor: monthlyActive ? "rgba(125,186,150,0.25)" : C.line,
                },
              }}
            >
              {busy
                ? "Loading…"
                : monthlyActive
                  ? "✓ Current Plan"
                  : yearlyActive
                    ? "Included in Yearly Plan"
                    : subscriptionCancelled
                      ? "Resubscribe Monthly →"
                      : "Choose Monthly →"}
            </Button>
          </Box>
        </Box>

        {/* Column 3: Pro Yearly — Recommended (4 cols) */}
        <Box
          sx={{
            gridColumn: { xs: "span 1", lg: "span 4" },
            p: 3,
            borderRadius: 2.5,
            bgcolor: "#15161b",
            border: `1px solid ${yearlyActive ? C.good : "rgba(125,186,150,0.32)"}`,
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Box
            sx={{
              pointerEvents: "none",
              position: "absolute",
              top: -80,
              right: -80,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(125,186,150,0.14) 0%, transparent 70%)",
            }}
          />

          <Box sx={{ position: "relative" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: C.good }} />
                <Typography sx={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.16em", color: C.good }}>
                  PRO · YEARLY
                </Typography>
              </Box>
              <Chip
                size="small"
                label={
                  isPremium && currentPlan === "yearly"
                    ? subscriptionCancelled
                      ? "Cancelling"
                      : "Active plan"
                    : "Save 33% · ₹1,989 off"
                }
                sx={{
                  fontFamily: MONO,
                  fontSize: 10.5,
                  fontWeight: 600,
                  bgcolor:
                    isPremium && currentPlan === "yearly" && subscriptionCancelled
                      ? "rgba(196,164,106,0.16)"
                      : "rgba(125,186,150,0.16)",
                  color:
                    isPremium && currentPlan === "yearly" && subscriptionCancelled
                      ? C.warn
                      : C.good,
                }}
              />
            </Box>

            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 0.75 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 34, fontWeight: 600, color: C.text }}>
                ₹333
              </Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>
                / month · ₹3,999 billed yearly
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 13, color: C.muted, mb: 2.5, lineHeight: 1.55 }}>
              Best value for full-cycle market preparation across four quarters of earnings and rotation.
            </Typography>

            <Box sx={{ height: "1px", bgcolor: C.line, mb: 2.25 }} />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
              {PRO_HIGHLIGHTS.map((item) => (
                <Box key={item} sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                  <CheckRoundedIcon sx={{ fontSize: 16, color: C.good, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: 13, color: C.text }}>{item}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{ mt: 3.5, position: "relative" }}>
            <Button
              fullWidth
              variant="contained"
              disabled={busy || yearlyActive}
              onClick={() => upgrade("yearly")}
              sx={{
                py: 1.3,
                borderRadius: 1.5,
                bgcolor: C.text,
                color: C.bg,
                fontWeight: 600,
                fontSize: 13.5,
                "&:hover": { bgcolor: "#d8d4cd" },
                "&.Mui-disabled": {
                  bgcolor: yearlyActive ? "rgba(125,186,150,0.14)" : "rgba(255,255,255,0.06)",
                  color: yearlyActive ? C.good : C.muted,
                  border: yearlyActive ? "1px solid rgba(125,186,150,0.28)" : "none",
                },
              }}
            >
              {busy
                ? "Loading…"
                : yearlyActive
                  ? "✓ Current Plan"
                  : monthlyActive
                    ? "Switch to Yearly (Save 33%) →"
                    : subscriptionCancelled
                      ? "Resubscribe Yearly →"
                      : "Upgrade to Pro Yearly →"}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Telegram Bot Account Link Card */}
      <Box
        sx={{
          mb: 4,
          borderRadius: 2.5,
          bgcolor: "#15161b",
          border: `1px solid ${telegramLinked ? "rgba(125,186,150,0.28)" : C.line}`,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: { xs: 2.5, sm: 3.25 },
            py: 2,
            borderBottom: `1px solid ${C.line}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: telegramLinked ? C.good : C.accent,
              }}
            />
            <Box>
              <Typography sx={{ fontSize: 15, fontWeight: 600, color: C.text }}>
                Telegram Bot Sync
              </Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>
                {telegramLinked
                  ? "Connected to your Morrow Desk account"
                  : "Sync your web account to unlock unlimited Pro bot queries"}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Chip
              size="small"
              label={telegramLinked ? "✓ Linked" : "Not linked"}
              sx={{
                fontFamily: MONO,
                fontSize: 11,
                fontWeight: 600,
                bgcolor: telegramLinked ? "rgba(125,186,150,0.14)" : "rgba(255,255,255,0.05)",
                color: telegramLinked ? C.good : C.muted,
              }}
            />
            <Button
              size="small"
              variant="outlined"
              href={TELEGRAM_BOT}
              target="_blank"
              rel="noopener"
              sx={{
                fontFamily: MONO,
                fontSize: 11.5,
                borderColor: C.line,
                color: C.text,
                px: 1.5,
                "&:hover": { borderColor: C.accent, bgcolor: "rgba(142,180,196,0.06)" },
              }}
            >
              Open Bot ↗
            </Button>
          </Box>
        </Box>

        <Box sx={{ p: { xs: 2.5, sm: 3.25 } }}>
          {telegramLinkCode && !telegramLinked ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: { xs: "stretch", md: "center" },
                justifyContent: "space-between",
                gap: 2.5,
              }}
            >
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: C.text, mb: 0.5 }}>
                  Verification code ready
                </Typography>
                <Typography sx={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                  Send the command on the right to{" "}
                  <a href={TELEGRAM_BOT} target="_blank" rel="noopener" style={{ color: C.accent, fontWeight: 500 }}>
                    the Telegram Bot
                  </a>{" "}
                  to finish linking your account. Expires in 5 minutes.
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  px: 2.5,
                  py: 1.5,
                  borderRadius: 2,
                  bgcolor: "#0e0f12",
                  border: "1px dashed rgba(142,180,196,0.35)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                  <Typography sx={{ fontFamily: MONO, fontSize: 13, color: C.muted }}>
                    /verify
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: MONO,
                      fontSize: 24,
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      color: C.accent,
                    }}
                  >
                    {telegramLinkCode}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={handleCopyVerify}
                  startIcon={<ContentCopyRoundedIcon sx={{ fontSize: 14 }} />}
                  sx={{
                    fontFamily: MONO,
                    fontSize: 11,
                    color: copiedCode ? C.good : C.text,
                    bgcolor: "rgba(255,255,255,0.05)",
                    px: 1.25,
                    "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                  }}
                >
                  {copiedCode ? "Copied" : "Copy"}
                </Button>
              </Box>
            </Box>
          ) : !telegramLinked ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                gap: 2,
              }}
            >
              {[
                {
                  step: "01",
                  cmd: "Open Bot",
                  text: "Launch the Morrow Desk bot on Telegram and run /today or /r SYMBOL.",
                },
                {
                  step: "02",
                  cmd: `/link ${email || "your@email.com"}`,
                  text: "Send /link with your account email to request a 6-digit verification code.",
                },
                {
                  step: "03",
                  cmd: "/verify CODE",
                  text: "Refresh this page to view your 6-digit code and send /verify CODE to the bot.",
                },
              ].map((s) => (
                <Box
                  key={s.step}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.75 }}>
                    <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>
                      STEP {s.step}
                    </Typography>
                    <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.accent }}>
                      {s.cmd}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 12.75, color: C.muted, lineHeight: 1.55 }}>
                    {s.text}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography sx={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>
              Your Telegram account is synced with{" "}
              <Box component="span" sx={{ color: C.text, fontFamily: MONO, fontSize: 12.5 }}>
                {email}
              </Box>
              . All bot commands (<code>/heatmap</code>, <code>/flow</code>, <code>/triggers</code>, <code>/delivery</code>, <code>/changed</code>) reflect your current plan automatically.
            </Typography>
          )}
        </Box>
      </Box>

      {/* Detailed Comparison Matrix */}
      <Box
        sx={{
          mb: 4,
          borderRadius: 2.5,
          bgcolor: "#15161b",
          border: `1px solid ${C.line}`,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: { xs: 2.5, sm: 3.25 },
            py: 2.25,
            borderBottom: `1px solid ${C.line}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography sx={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.16em", color: C.accent }}>
              FEATURE MATRIX
            </Typography>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: C.text, mt: 0.25 }}>
              Free Desk vs Pro Desk
            </Typography>
          </Box>
        </Box>

        {/* Column Header */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1.4fr 1fr 1fr", sm: "1fr 160px 180px" },
            px: { xs: 2.5, sm: 3.25 },
            py: 1.5,
            bgcolor: "#0e0f12",
            borderBottom: `1px solid ${C.line}`,
          }}
        >
          <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.muted, textTransform: "uppercase" }}>
            Capability
          </Typography>
          <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.muted, textTransform: "uppercase", textAlign: "center" }}>
            Free Desk
          </Typography>
          <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.good, textTransform: "uppercase", textAlign: "center" }}>
            Pro Desk
          </Typography>
        </Box>

        {COMPARISON_GROUPS.map((group) => (
          <Box key={group.category}>
            <Box
              sx={{
                px: { xs: 2.5, sm: 3.25 },
                py: 1,
                bgcolor: "rgba(255,255,255,0.02)",
                borderBottom: `1px solid ${C.line}`,
              }}
            >
              <Typography sx={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase" }}>
                {group.category}
              </Typography>
            </Box>

            {group.rows.map((row) => (
              <Box
                key={row.feature}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1.4fr 1fr 1fr", sm: "1fr 160px 180px" },
                  alignItems: "center",
                  px: { xs: 2.5, sm: 3.25 },
                  py: 1.5,
                  borderBottom: `1px solid ${C.line}`,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.01)" },
                }}
              >
                <Typography sx={{ fontSize: 13.5, color: C.text, pr: 1 }}>
                  {row.feature}
                </Typography>

                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  {row.free ? (
                    <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: C.muted, textAlign: "center" }}>
                      {row.free}
                    </Typography>
                  ) : (
                    <CloseRoundedIcon sx={{ fontSize: 16, color: "rgba(238,234,227,0.2)" }} />
                  )}
                </Box>

                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <Typography
                    sx={{
                      fontFamily: MONO,
                      fontSize: 11.5,
                      fontWeight: 500,
                      color: C.good,
                      textAlign: "center",
                    }}
                  >
                    {row.pro}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        ))}
      </Box>

      {/* FAQ Grid */}
      <Box>
        <Typography
          sx={{
            fontFamily: MONO,
            fontSize: 10.5,
            letterSpacing: "0.16em",
            color: C.accent,
            textTransform: "uppercase",
            mb: 0.75,
          }}
        >
          FREQUENTLY ASKED
        </Typography>
        <Typography sx={{ fontSize: 18, fontWeight: 600, color: C.text, mb: 2 }}>
          Billing &amp; access questions
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
          }}
        >
          {FAQS.map((item) => (
            <Box
              key={item.q}
              sx={{
                p: 2.75,
                borderRadius: 2.5,
                bgcolor: "#15161b",
                border: `1px solid ${C.line}`,
              }}
            >
              <Typography sx={{ fontSize: 14.5, fontWeight: 600, color: C.text, mb: 0.75 }}>
                {item.q}
              </Typography>
              <Typography sx={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                {item.a}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
