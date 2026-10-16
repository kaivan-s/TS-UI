import { NavLink, useLocation } from "react-router-dom";
import { Box, Button, Drawer, IconButton, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import PlaylistAddCheckRoundedIcon from "@mui/icons-material/PlaylistAddCheckRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";

import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import FeedbackRoundedIcon from "@mui/icons-material/FeedbackRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import BookmarkRoundedIcon from "@mui/icons-material/BookmarkRounded";
import CloseIcon from "@mui/icons-material/Close";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import { C } from "../theme.js";
import { useAuth } from "../auth.jsx";
import logoIcon from "../Images/favicon.svg";

const MONO = '"IBM Plex Mono", ui-monospace, monospace';

const NAV_SECTIONS = [
  {
    title: "POST-MARKET ENGINE",
    items: [
      {
        id: "setups",
        path: "/setups",
        Icon: PlaylistAddCheckRoundedIcon,
        label: "Setups",
        desc: "Coils, movers & scanners",
      },
      {
        id: "sectors",
        path: "/sectors",
        Icon: GridViewRoundedIcon,
        label: "Sectors",
        desc: "Rotation & state heatmap",
      },
    ],
  },
  {
    title: "DESK & RESEARCH",
    items: [
      {
        id: "watchlist",
        path: "/watchlist",
        Icon: BookmarkRoundedIcon,
        label: "Watchlist",
        desc: "Saved equities",
      },
      {
        id: "fundamentals",
        path: "/fundamentals",
        Icon: AccountBalanceRoundedIcon,
        label: "Fundamentals",
        desc: "P/E, OPM, growth & cap",
      },
      {
        id: "results",
        path: "/results",
        Icon: CalendarMonthRoundedIcon,
        label: "Results",
        desc: "Quarterly earnings dates",
      },
    ],
  },
  {
    title: "MARKET PULSE",
    items: [
      {
        id: "insights",
        path: "/insights",
        Icon: InsightsRoundedIcon,
        label: "Insights",
        desc: "Why stocks moved 5%+",
      },
    ],
  },
  {
    title: "REFERENCE & PLAN",
    items: [
      {
        id: "guide",
        path: "/guide",
        Icon: MenuBookRoundedIcon,
        label: "Guide",
        desc: "Methodology & glossary",
      },
      {
        id: "pricing",
        path: "/pricing",
        Icon: PaymentsRoundedIcon,
        label: "Pricing",
        desc: "Membership & Telegram",
      },
      {
        id: "feedback",
        path: "/feedback",
        Icon: FeedbackRoundedIcon,
        label: "Feedback",
        desc: "Share ideas or report bugs",
      },
    ],
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
        bgcolor: "#0f1014",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Logo / Brand Header */}
      <Box
        sx={{
          px: 2,
          py: 2,
          borderBottom: `1px solid ${C.line}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box
            component="img"
            src={logoIcon}
            alt="Morrow Desk"
            sx={{
              width: 30,
              height: 30,
              borderRadius: 1.5,
            }}
          />
          <Box>
            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 600,
                color: C.text,
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
              }}
            >
              Morrow Desk
            </Typography>
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: 9.5,
                color: C.accent,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                mt: 0.25,
              }}
            >
              NSE EOD TERMINAL
            </Typography>
          </Box>
        </Box>
        {showClose && (
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: C.muted, mr: -0.5 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Compartmentalized Navigation */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 1.25,
          py: 1.5,
          display: "flex",
          flexDirection: "column",
          gap: 1.75,
        }}
      >
        {NAV_SECTIONS.map((section, idx) => (
          <Box
            key={section.title}
            sx={{
              pt: idx === 0 ? 0 : 1.25,
              borderTop: idx === 0 ? "none" : "1px solid rgba(238,234,227,0.05)",
            }}
          >
            <Typography
              sx={{
                px: 1.25,
                mb: 0.65,
                fontFamily: MONO,
                fontSize: 9.5,
                fontWeight: 600,
                letterSpacing: "0.14em",
                color: "rgba(238,234,227,0.38)",
                textTransform: "uppercase",
              }}
            >
              {section.title}
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.35 }}>
              {section.items.map((item) => {
                const matchPaths = item.paths || [item.path];
                const isActive = matchPaths.includes(location.pathname);
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
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.25,
                        px: 1.25,
                        py: 0.85,
                        cursor: "pointer",
                        borderRadius: 1.75,
                        bgcolor: isActive ? "#171920" : "transparent",
                        border: isActive
                          ? "1px solid rgba(142,180,196,0.22)"
                          : "1px solid transparent",
                        "&:hover": {
                          bgcolor: isActive
                            ? "#171920"
                            : "rgba(255,255,255,0.03)",
                        },
                        transition: "all 0.14s ease",
                      }}
                    >
                      {isActive && (
                        <Box
                          sx={{
                            position: "absolute",
                            left: 0,
                            top: 8,
                            bottom: 8,
                            width: 2.5,
                            borderRadius: 1,
                            bgcolor: C.accent,
                          }}
                        />
                      )}

                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: 1.25,
                          bgcolor: isActive
                            ? "rgba(142,180,196,0.14)"
                            : "rgba(255,255,255,0.03)",
                          border: isActive
                            ? "1px solid rgba(142,180,196,0.28)"
                            : "1px solid rgba(238,234,227,0.05)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "all 0.14s ease",
                        }}
                      >
                        <Icon
                          sx={{
                            fontSize: 16.5,
                            color: isActive ? C.accent : C.muted,
                            transition: "color 0.14s ease",
                          }}
                        />
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 0.75,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 13,
                              fontWeight: isActive ? 600 : 500,
                              color: isActive ? C.text : "rgba(238,234,227,0.78)",
                              lineHeight: 1.2,
                              transition: "color 0.14s ease",
                            }}
                          >
                            {item.label}
                          </Typography>
                          {count > 0 && (
                            <Box
                              sx={{
                                minWidth: 18,
                                height: 17,
                                px: 0.6,
                                borderRadius: 0.85,
                                bgcolor: isActive
                                  ? "rgba(142,180,196,0.18)"
                                  : "rgba(255,255,255,0.05)",
                                border: isActive
                                  ? "1px solid rgba(142,180,196,0.35)"
                                  : `1px solid ${C.line}`,
                                color: isActive ? C.accent : C.muted,
                                fontFamily: MONO,
                                fontSize: 10,
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
                            fontSize: 10.75,
                            color: C.muted,
                            opacity: isActive ? 0.85 : 0.6,
                            lineHeight: 1.25,
                            mt: 0.2,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
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
          </Box>
        ))}
      </Box>

      {/* Bottom Account & Plan Compartment */}
      <Box
        sx={{
          p: 1.25,
          borderTop: `1px solid ${C.line}`,
          bgcolor: "#0c0d10",
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        {email && !isPremium && (
          <Button
            variant="contained"
            fullWidth
            onClick={() => upgrade("monthly")}
            disabled={busy}
            startIcon={<StarRoundedIcon sx={{ fontSize: 15 }} />}
            sx={{
              bgcolor: C.accent,
              color: C.bg,
              fontWeight: 600,
              fontSize: 12,
              textTransform: "none",
              py: 0.75,
              borderRadius: 1.5,
              "&:hover": { bgcolor: "#7aa4b4" },
            }}
          >
            {busy ? "Loading…" : "Upgrade · ₹499/mo"}
          </Button>
        )}

        {email && isPremium && (
          <Box
            sx={{
              px: 1.25,
              py: 0.75,
              borderRadius: 1.5,
              bgcolor: "rgba(125,186,150,0.08)",
              border: "1px solid rgba(125,186,150,0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <StarRoundedIcon sx={{ fontSize: 15, color: C.good }} />
              <Typography sx={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: C.good }}>
                {plan === "yearly" ? "PRO DESK · YEARLY" : "PRO DESK · MONTHLY"}
              </Typography>
            </Box>
          </Box>
        )}

        {email && (
          <Box
            sx={{
              px: 1.25,
              py: 0.85,
              borderRadius: 1.5,
              bgcolor: "#14151a",
              border: `1px solid ${C.line}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.text,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  lineHeight: 1.2,
                }}
              >
                {email.split("@")[0]}
              </Typography>
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: 10,
                  color: C.muted,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {email.includes("@") ? `@${email.split("@")[1]}` : ""}
              </Typography>
            </Box>
            <Tooltip title="Sign out" placement="top" arrow>
              <IconButton
                onClick={signOut}
                size="small"
                sx={{
                  p: 0.5,
                  color: C.muted,
                  "&:hover": {
                    color: C.bad,
                    bgcolor: "rgba(200,122,122,0.1)",
                  },
                }}
              >
                <LogoutRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
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
            bgcolor: "#0f1014",
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
        bgcolor: "#0f1014",
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
