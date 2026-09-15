import { Box, Button, IconButton, Typography } from "@mui/material";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import PlaylistAddCheckRoundedIcon from "@mui/icons-material/PlaylistAddCheckRounded";
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { C } from "../theme.js";
import { useAuth } from "../auth.jsx";

const NAV_ITEMS = [
  {
    id: "setups",
    Icon: PlaylistAddCheckRoundedIcon,
    label: "Setups",
    desc: "Coil and sector agree",
  },
  {
    id: "sectors",
    Icon: GridViewRoundedIcon,
    label: "Sectors",
    desc: "Where setups come from",
  },
  {
    id: "coils",
    Icon: ShowChartRoundedIcon,
    label: "Coiled Bases",
    desc: "Every quiet base, no sector filter",
  },
  {
    id: "momentum",
    Icon: TrendingUpRoundedIcon,
    label: "Expected Movers",
    desc: "Range forecast, not direction",
  },
  {
    id: "track",
    Icon: AssessmentRoundedIcon,
    label: "Track Record",
    desc: "Past performance",
  },
  {
    id: "guide",
    Icon: MenuBookRoundedIcon,
    label: "Guide",
    desc: "How it works",
  },
];

export default function Sidebar({ active, onChange, counts }) {
  const { email, signOut, isPremium, plan, upgrade, busy } = useAuth();

  return (
    <Box
      sx={{
        width: 220,
        minWidth: 220,
        borderRight: `1px solid ${C.line}`,
        bgcolor: C.bg,
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        zIndex: 1000,
      }}
    >
      {/* Logo / Brand */}
      <Box
        sx={{
          px: 2.5,
          pt: 2.5,
          pb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              background: `linear-gradient(135deg, ${C.accent} 0%, ${C.good} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 700,
                color: C.bg,
                letterSpacing: "-0.03em",
              }}
            >
              M
            </Typography>
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 600,
                color: C.text,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              Morrow Desk
            </Typography>
            <Typography
              sx={{
                fontSize: 11,
                color: C.muted,
                letterSpacing: "0.02em",
              }}
            >
              NSE scanner
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{ px: 1.5 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          const count = counts?.[item.id];
          const Icon = item.Icon;

          return (
            <Box
              key={item.id}
              onClick={() => onChange(item.id)}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1.5,
                px: 1.5,
                py: 1.25,
                mb: 0.5,
                cursor: "pointer",
                borderRadius: 2,
                bgcolor: isActive ? "rgba(142,180,196,0.12)" : "transparent",
                "&:hover": {
                  bgcolor: isActive
                    ? "rgba(142,180,196,0.12)"
                    : "rgba(238,234,227,0.04)",
                },
                transition: "all 0.15s ease",
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  bgcolor: isActive
                    ? "rgba(142,180,196,0.15)"
                    : "rgba(238,234,227,0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
              >
                <Icon
                  sx={{
                    fontSize: 20,
                    color: isActive ? C.accent : C.muted,
                    transition: "color 0.15s ease",
                  }}
                />
              </Box>

              <Box sx={{ flex: 1, minWidth: 0, pt: 0.25 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 13.5,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? C.text : C.muted,
                      lineHeight: 1.3,
                      transition: "color 0.15s ease",
                    }}
                  >
                    {item.label}
                  </Typography>
                  {count > 0 && (
                    <Box
                      sx={{
                        minWidth: 18,
                        height: 18,
                        px: 0.6,
                        borderRadius: 0.75,
                        bgcolor: isActive ? C.accent : "rgba(238,234,227,0.12)",
                        color: isActive ? C.bg : C.muted,
                        fontSize: 11,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {count}
                    </Box>
                  )}
                </Box>
                <Typography
                  sx={{
                    fontSize: 11.5,
                    color: C.muted,
                    opacity: isActive ? 0.9 : 0.65,
                    lineHeight: 1.4,
                    mt: 0.25,
                  }}
                >
                  {item.desc}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Spacer */}
      <Box sx={{ flex: 1 }} />

      {/* Upgrade / Premium badge */}
      {email && !isPremium && (
        <Box sx={{ mx: 1.5, mb: 1.5 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => upgrade("monthly")}
            disabled={busy}
            startIcon={<StarRoundedIcon sx={{ fontSize: 16 }} />}
            sx={{
              bgcolor: C.accent,
              color: C.bg,
              fontWeight: 600,
              fontSize: 13,
              py: 1,
              "&:hover": { bgcolor: "#7aa4b4" },
            }}
          >
            {busy ? "Loading…" : "Upgrade · ₹499/mo"}
          </Button>
        </Box>
      )}

      {email && isPremium && (
        <Box
          sx={{
            mx: 1.5,
            mb: 1.5,
            p: 1.25,
            borderRadius: 2,
            bgcolor: "rgba(125,186,150,0.08)",
            border: "1px solid rgba(125,186,150,0.15)",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <StarRoundedIcon sx={{ fontSize: 16, color: C.good }} />
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: C.good }}>
            {plan === "yearly" ? "Pro (Yearly)" : "Premium"}
          </Typography>
        </Box>
      )}

      {/* User / Sign out */}
      {email && (
        <Box
          sx={{
            mx: 1.5,
            mb: 1.5,
            p: 1.5,
            borderRadius: 2,
            bgcolor: "rgba(238,234,227,0.03)",
            border: `1px solid ${C.line}`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: C.text,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {email.split("@")[0]}
              </Typography>
              <Typography
                sx={{
                  fontSize: 10.5,
                  color: C.muted,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {email.includes("@") ? `@${email.split("@")[1]}` : ""}
              </Typography>
            </Box>
            <IconButton
              onClick={signOut}
              size="small"
              sx={{
                color: C.muted,
                "&:hover": {
                  color: C.bad,
                  bgcolor: "rgba(200,122,122,0.1)",
                },
              }}
            >
              <LogoutRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>
      )}
    </Box>
  );
}
