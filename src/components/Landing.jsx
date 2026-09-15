import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import { C } from "../theme.js";

function FloatingOrb({ delay, duration, size, x, y, color }) {
  return (
    <Box
      sx={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        left: x,
        top: y,
        filter: "blur(80px)",
        opacity: 0.35,
        animation: `float ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        "@keyframes float": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -40px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
        },
      }}
    />
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#050506",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        px: 3,
      }}
    >
      {/* Animated background orbs */}
      <FloatingOrb delay={0} duration={20} size={500} x="5%" y="10%" color="rgba(142,180,196,0.12)" />
      <FloatingOrb delay={2} duration={25} size={400} x="65%" y="55%" color="rgba(125,186,150,0.10)" />
      <FloatingOrb delay={4} duration={22} size={350} x="75%" y="5%" color="rgba(180,168,210,0.08)" />
      <FloatingOrb delay={1} duration={18} size={300} x="15%" y="65%" color="rgba(196,164,106,0.06)" />

      {/* Subtle grid overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse at center, black 0%, transparent 75%)",
        }}
      />

      {/* Main content */}
      <Box
        sx={{
          position: "relative",
          maxWidth: 580,
          textAlign: "center",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Logo */}
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            borderRadius: 3,
            bgcolor: "rgba(142,180,196,0.1)",
            border: "1px solid rgba(142,180,196,0.2)",
            mb: 4,
          }}
        >
          <Typography sx={{ fontSize: 24, fontWeight: 600, color: C.accent }}>M</Typography>
        </Box>

        {/* Headline */}
        <Typography
          sx={{
            fontSize: { xs: 36, sm: 48 },
            fontWeight: 600,
            letterSpacing: "-0.04em",
            color: C.text,
            lineHeight: 1.1,
            mb: 2.5,
          }}
        >
          Morrow Desk
        </Typography>

        {/* Tagline */}
        <Typography
          sx={{
            fontSize: { xs: 18, sm: 20 },
            color: C.muted,
            lineHeight: 1.5,
            mb: 5,
            maxWidth: 440,
            mx: "auto",
          }}
        >
          A daily scan for stocks setting up.
          <br />
          Know what's building before it moves.
        </Typography>

        {/* Features - subtle, minimal */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 2, sm: 4 },
            justifyContent: "center",
            mb: 5,
          }}
        >
          {[
            "Sector momentum",
            "Quiet accumulation",
            "Breakout tracking",
          ].map((feature) => (
            <Box
              key={feature}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                justifyContent: "center",
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: C.accent,
                  opacity: 0.6,
                }}
              />
              <Typography sx={{ fontSize: 14, color: C.muted }}>{feature}</Typography>
            </Box>
          ))}
        </Box>

        {/* CTA */}
        <Button
          onClick={() => navigate("/login")}
          sx={{
            px: 4,
            py: 1.5,
            bgcolor: C.text,
            color: "#0a0a0b",
            borderRadius: 2,
            fontSize: 15,
            fontWeight: 600,
            transition: "all 0.2s ease",
            "&:hover": {
              bgcolor: "#d4d0c8",
              transform: "translateY(-2px)",
              boxShadow: "0 10px 30px -10px rgba(238,234,227,0.3)",
            },
            "&:active": { transform: "translateY(0)" },
          }}
        >
          Get started
        </Button>

        <Typography
          sx={{
            fontSize: 13,
            color: "rgba(255,255,255,0.25)",
            mt: 2,
          }}
        >
          Free to explore
        </Typography>
      </Box>

      {/* Bottom attribution */}
      <Typography
        sx={{
          position: "absolute",
          bottom: 24,
          fontSize: 11,
          color: "rgba(255,255,255,0.15)",
          letterSpacing: "0.05em",
        }}
      >
        Indian equities · Updated daily after market close
      </Typography>
    </Box>
  );
}
