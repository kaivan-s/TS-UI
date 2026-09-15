import { NavLink, useLocation } from "react-router-dom";
import { Box, Button, Drawer, IconButton, Typography, useMediaQuery, useTheme } from "@mui/material";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import PlaylistAddCheckRoundedIcon from "@mui/icons-material/PlaylistAddCheckRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import CloseIcon from "@mui/icons-material/Close";
import { C } from "../theme.js";
import { useAuth } from "../auth.jsx";
import logoIcon from "../Images/favicon.svg";

const NAV_ITEMS = [
  {
    id: "setups",
    path: "/setups",
    Icon: PlaylistAddCheckRoundedIcon,
    label: "Setups",
    desc: "Quiet bases, sector-filtered or all",
  },
  {
    id: "sectors",
    path: "/sectors",
    Icon: GridViewRoundedIcon,
    label: "Sectors",
    desc: "Where setups come from",
  },
  {
    id: "tracking",
    path: "/tracking",
    Icon: HistoryRoundedIcon,
    label: "Tracking",
    desc: "What happened to past bases",
  },
  {
    id: "guide",
    path: "/guide",
    Icon: MenuBookRoundedIcon,
    label: "Guide",
    desc: "How it works",
  },
  {
    id: "pricing",
    path: "/pricing",
    Icon: PaymentsRoundedIcon,
    label: "Pricing",
    desc: "Plans and features",
  },
];

const DRAWER_WIDTH = 220;

function SidebarContent({ onClose, showClose, counts }) {
  const location = useLocation();
  const { email, signOut, isPremium, plan, upgrade, busy } = useAuth();

  return (
    <Box
      sx={{
        width: DRAWER_WIDTH,
        minWidth: DRAWER_WIDTH,
        bgcolor: C.bg,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Logo / Brand */}
      <Box
        sx={{
          px: 2.5,
          pt: 2.5,
          pb: 3,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            component="img"
            src={logoIcon}
            alt="Morrow Desk"
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
            }}
          />
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
        {showClose && (
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: C.muted, mt: -0.5, mr: -0.5 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ px: 1.5 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const count = counts?.[item.id];
          const Icon = item.Icon;

          return (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={onClose}
              style={{ textDecoration: "none" }}
            >
              <Box
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
            </NavLink>
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

export default function Sidebar({ counts, mobileOpen, onMobileClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Mobile: use a temporary drawer
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            bgcolor: C.bg,
            borderRight: `1px solid ${C.line}`,
          },
        }}
      >
        <SidebarContent
          counts={counts}
          onClose={onMobileClose}
          showClose
        />
      </Drawer>
    );
  }

  // Desktop: fixed sidebar
  return (
    <Box
      sx={{
        width: DRAWER_WIDTH,
        minWidth: DRAWER_WIDTH,
        borderRight: `1px solid ${C.line}`,
        bgcolor: C.bg,
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1000,
      }}
    >
      <SidebarContent
        counts={counts}
        onClose={() => {}}
        showClose={false}
      />
    </Box>
  );
}
