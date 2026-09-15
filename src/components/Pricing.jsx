import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, Box, Button, Chip, Typography } from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";
import { C } from "../theme.js";
import { useAuth } from "../auth.jsx";

const PLANS = [
  {
    id: "monthly",
    name: "Premium",
    price: "₹499",
    period: "/month",
    description: "Full access to all scanner features",
    highlight: false,
  },
  {
    id: "yearly",
    name: "Pro",
    price: "₹3,999",
    period: "/year",
    description: "Best value — save ₹1,989",
    highlight: true,
    savings: "33% off",
  },
];

const FEATURES = [
  {
    title: "Full Setups List",
    description: "Coiled names in Acting sectors — the highest-edge overlap",
  },
  {
    title: "Leaders at Rest",
    description: "Top 20 momentum leaders ranked by 12-month return, gone quiet",
  },
  {
    title: "All Coiled Bases",
    description: "Complete list of tight, quiet setups near their highs",
  },
  {
    title: "Sector Analysis",
    description: "Turnover expansion, breadth, delivery quality, and shape confirmation",
  },
  {
    title: "Episode Tracking",
    description: "Follow each base from appearance to resolution",
  },
  {
    title: "Stock Lookup",
    description: "Run the full filter set on any symbol with entry planning",
  },
];

const COMPARISONS = [
  { feature: "Daily sector scan", free: true, premium: true },
  { feature: "Guide & methodology", free: true, premium: true },
  { feature: "Episode tracking", free: true, premium: true },
  { feature: "Stock lookup", free: true, premium: true },
  { feature: "Setups preview", free: true, premium: true },
  { feature: "Full setups list", free: false, premium: true },
  { feature: "Full leaders at rest (20)", free: false, premium: true },
  { feature: "Sector states & details", free: false, premium: true },
];

function PlanCard({ plan, selected, onSelect, onUpgrade, busy, isPremium, currentPlan }) {
  const isCurrentPlan = isPremium && currentPlan === plan.id;
  
  return (
    <Box
      onClick={() => onSelect(plan.id)}
      sx={{
        position: "relative",
        flex: 1,
        minWidth: 280,
        maxWidth: 360,
        p: 3,
        borderRadius: 3,
        bgcolor: selected ? "rgba(142,180,196,0.08)" : C.paper,
        border: `1px solid ${selected ? "rgba(142,180,196,0.3)" : C.line}`,
        cursor: isCurrentPlan ? "default" : "pointer",
        transition: "all 0.2s ease",
        "&:hover": isCurrentPlan ? {} : {
          borderColor: selected ? "rgba(142,180,196,0.4)" : "rgba(238,234,227,0.15)",
          transform: "translateY(-2px)",
        },
      }}
    >
      {/* Highlight badge */}
      {plan.highlight && (
        <Chip
          label={plan.savings}
          size="small"
          sx={{
            position: "absolute",
            top: -10,
            right: 16,
            bgcolor: C.good,
            color: C.bg,
            fontWeight: 600,
            fontSize: 11,
          }}
        />
      )}

      {/* Current plan badge */}
      {isCurrentPlan && (
        <Chip
          label="Current plan"
          size="small"
          icon={<CheckRoundedIcon sx={{ fontSize: 14 }} />}
          sx={{
            position: "absolute",
            top: -10,
            left: 16,
            bgcolor: C.good,
            color: C.bg,
            fontWeight: 600,
            fontSize: 11,
            "& .MuiChip-icon": { color: C.bg },
          }}
        />
      )}

      {/* Plan name */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        {plan.id === "yearly" ? (
          <WorkspacePremiumRoundedIcon sx={{ fontSize: 22, color: plan.highlight ? C.good : C.accent }} />
        ) : (
          <StarRoundedIcon sx={{ fontSize: 22, color: C.accent }} />
        )}
        <Typography sx={{ fontSize: 18, fontWeight: 600, color: C.text }}>
          {plan.name}
        </Typography>
      </Box>

      {/* Price */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
          <Typography sx={{ fontSize: 36, fontWeight: 700, color: C.text, lineHeight: 1 }}>
            {plan.price}
          </Typography>
          <Typography sx={{ fontSize: 14, color: C.muted }}>
            {plan.period}
          </Typography>
        </Box>
        {plan.id === "yearly" && (
          <Typography sx={{ fontSize: 12, color: C.muted, mt: 0.5 }}>
            ₹333/month, billed annually
          </Typography>
        )}
      </Box>

      {/* Description */}
      <Typography sx={{ fontSize: 14, color: C.muted, mb: 3 }}>
        {plan.description}
      </Typography>

      {/* CTA */}
      <Button
        variant="contained"
        fullWidth
        disabled={busy || isCurrentPlan}
        onClick={(e) => {
          e.stopPropagation();
          onUpgrade(plan.id);
        }}
        sx={{
          py: 1.25,
          bgcolor: plan.highlight ? C.good : C.accent,
          color: C.bg,
          fontWeight: 600,
          "&:hover": {
            bgcolor: plan.highlight ? "#6aa880" : "#7aa4b4",
          },
          "&.Mui-disabled": {
            bgcolor: isCurrentPlan ? "rgba(125,186,150,0.2)" : "rgba(238,234,227,0.12)",
            color: isCurrentPlan ? C.good : C.muted,
          },
        }}
      >
        {busy ? "Loading…" : isCurrentPlan ? "Active" : "Get started"}
      </Button>
    </Box>
  );
}

function FeatureItem({ title, description }) {
  return (
    <Box sx={{ display: "flex", gap: 2, py: 1.5 }}>
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: 1.5,
          bgcolor: "rgba(125,186,150,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <CheckRoundedIcon sx={{ fontSize: 16, color: C.good }} />
      </Box>
      <Box>
        <Typography sx={{ fontSize: 14, fontWeight: 500, color: C.text, mb: 0.25 }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
          {description}
        </Typography>
      </Box>
    </Box>
  );
}

function ComparisonTable() {
  return (
    <Box
      sx={{
        borderRadius: 2,
        border: `1px solid ${C.line}`,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 60px 60px", sm: "1fr 80px 80px" },
          gap: { xs: 1, sm: 2 },
          p: { xs: 1.5, sm: 2 },
          bgcolor: C.surface,
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <Typography sx={{ fontSize: { xs: 12, sm: 13 }, fontWeight: 600, color: C.muted }}>
          Feature
        </Typography>
        <Typography sx={{ fontSize: { xs: 12, sm: 13 }, fontWeight: 600, color: C.muted, textAlign: "center" }}>
          Free
        </Typography>
        <Typography sx={{ fontSize: { xs: 12, sm: 13 }, fontWeight: 600, color: C.accent, textAlign: "center" }}>
          Premium
        </Typography>
      </Box>

      {/* Rows */}
      {COMPARISONS.map((row, i) => (
        <Box
          key={row.feature}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 60px 60px", sm: "1fr 80px 80px" },
            gap: { xs: 1, sm: 2 },
            p: { xs: 1.5, sm: 2 },
            bgcolor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
            borderBottom: i < COMPARISONS.length - 1 ? `1px solid ${C.line}` : "none",
          }}
        >
          <Typography sx={{ fontSize: 13.5, color: C.text }}>
            {row.feature}
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            {row.free ? (
              <CheckRoundedIcon sx={{ fontSize: 18, color: C.muted }} />
            ) : (
              <Typography sx={{ fontSize: 14, color: C.muted }}>—</Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <CheckRoundedIcon sx={{ fontSize: 18, color: C.good }} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default function Pricing() {
  const { upgrade, busy, isPremium, plan: currentPlan, email, refreshSubscription } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [searchParams, setSearchParams] = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);

  // Handle success redirect from payment
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccess(true);
      // Refresh subscription status
      refreshSubscription?.();
      // Remove query param from URL
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, refreshSubscription]);

  const handleUpgrade = (planId) => {
    if (!email) {
      // Not logged in — upgrade will redirect to auth
    }
    upgrade(planId);
  };

  return (
    <Box sx={{ pb: 8, maxWidth: 900, mx: "auto" }}>
      {/* Success message */}
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
            "& .MuiAlert-action": { color: C.muted },
          }}
        >
          <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
            Welcome to Premium!
          </Typography>
          <Typography sx={{ fontSize: 14, color: C.muted }}>
            Your subscription is now active. You have full access to all setups and features.
          </Typography>
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ textAlign: "center", mb: 5 }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            py: 0.75,
            borderRadius: 2,
            bgcolor: "rgba(142,180,196,0.1)",
            border: "1px solid rgba(142,180,196,0.2)",
            mb: 2.5,
          }}
        >
          <TrendingUpRoundedIcon sx={{ fontSize: 16, color: C.accent }} />
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: C.accent, letterSpacing: "0.02em" }}>
            PRICING
          </Typography>
        </Box>

        <Typography
          sx={{
            fontSize: { xs: 24, sm: 32 },
            fontWeight: 600,
            color: C.text,
            letterSpacing: "-0.03em",
            mb: 1.5,
          }}
        >
          Unlock the full scanner
        </Typography>
        <Typography sx={{ fontSize: 16, color: C.muted, maxWidth: 480, mx: "auto", lineHeight: 1.6 }}>
          Get access to all setups, coiled bases, sector analysis, and tracking tools.
          Cancel anytime.
        </Typography>
      </Box>

      {/* Pricing cards */}
      <Box
        sx={{
          display: "flex",
          gap: 3,
          justifyContent: "center",
          flexWrap: "wrap",
          mb: 6,
        }}
      >
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={selectedPlan === plan.id}
            onSelect={setSelectedPlan}
            onUpgrade={handleUpgrade}
            busy={busy}
            isPremium={isPremium}
            currentPlan={currentPlan}
          />
        ))}
      </Box>

      {/* Features grid */}
      <Box sx={{ mb: 6 }}>
        <Typography
          sx={{
            fontSize: 18,
            fontWeight: 600,
            color: C.text,
            mb: 3,
            textAlign: "center",
          }}
        >
          Everything included
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 1,
            bgcolor: C.paper,
            border: `1px solid ${C.line}`,
            borderRadius: 3,
            p: 3,
          }}
        >
          {FEATURES.map((f) => (
            <FeatureItem key={f.title} {...f} />
          ))}
        </Box>
      </Box>

      {/* Comparison table */}
      <Box sx={{ mb: 6 }}>
        <Typography
          sx={{
            fontSize: 18,
            fontWeight: 600,
            color: C.text,
            mb: 3,
            textAlign: "center",
          }}
        >
          Free vs Premium
        </Typography>
        <ComparisonTable />
      </Box>

      {/* FAQ / Notes */}
      <Box
        sx={{
          bgcolor: C.paper,
          border: `1px solid ${C.line}`,
          borderRadius: 3,
          p: 4,
        }}
      >
        <Typography sx={{ fontSize: 16, fontWeight: 600, color: C.text, mb: 2.5 }}>
          Questions
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: C.text, mb: 0.5 }}>
              Can I cancel anytime?
            </Typography>
            <Typography sx={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>
              Yes. Cancel from your account settings before the next billing cycle and you won't be charged again.
              You keep access until the current period ends.
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: C.text, mb: 0.5 }}>
              What payment methods do you accept?
            </Typography>
            <Typography sx={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>
              We accept all major credit/debit cards, UPI, and net banking through our secure payment partner.
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: C.text, mb: 0.5 }}>
              Is this financial advice?
            </Typography>
            <Typography sx={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>
              No. Morrow Desk is a screening tool that helps you find where to look and where to set alerts.
              Position sizing, stops, and whether to act on a breakout are your decisions.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
