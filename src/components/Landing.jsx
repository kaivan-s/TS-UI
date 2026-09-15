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
        opacity: 0.4,
        animation: `float ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        "@keyframes float": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(40px, -50px) scale(1.15)" },
        },
      }}
    />
  );
}

function Section({ children, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <Box
      sx={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {children}
    </Box>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#050506",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background orbs */}
      <FloatingOrb delay={0} duration={15} size={600} x="-5%" y="-10%" color="rgba(142,180,196,0.15)" />
      <FloatingOrb delay={1} duration={18} size={500} x="60%" y="20%" color="rgba(125,186,150,0.12)" />
      <FloatingOrb delay={2} duration={20} size={400} x="75%" y="65%" color="rgba(180,168,210,0.10)" />
      <FloatingOrb delay={3} duration={16} size={350} x="5%" y="55%" color="rgba(196,164,106,0.08)" />

      {/* Subtle grid overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at center, black 0%, transparent 65%)",
        }}
      />

      {/* Content */}
      <Box
        sx={{
          position: "relative",
          maxWidth: 900,
          mx: "auto",
          px: 3,
          py: { xs: 6, sm: 10 },
        }}
      >
        {/* Hero Section with CTA */}
        <Section delay={0}>
          <Box
            sx={{
              textAlign: "center",
              minHeight: { xs: "70vh", sm: "60vh" },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Logo */}
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 64,
                height: 64,
                borderRadius: 3,
                bgcolor: "rgba(142,180,196,0.1)",
                border: "1px solid rgba(142,180,196,0.25)",
                mb: 4,
                animation: "pulse 3s ease-in-out infinite",
                "@keyframes pulse": {
                  "0%, 100%": { boxShadow: "0 0 0 0 rgba(142,180,196,0.2)" },
                  "50%": { boxShadow: "0 0 0 15px rgba(142,180,196,0)" },
                },
              }}
            >
              <Typography sx={{ fontSize: 28, fontWeight: 600, color: C.accent }}>M</Typography>
            </Box>

            {/* Headline */}
            <Typography
              sx={{
                fontSize: { xs: 40, sm: 56, md: 64 },
                fontWeight: 600,
                letterSpacing: "-0.04em",
                color: C.text,
                lineHeight: 1.05,
                mb: 3,
              }}
            >
              Morrow Desk
            </Typography>

            {/* Tagline */}
            <Typography
              sx={{
                fontSize: { xs: 18, sm: 22 },
                color: C.muted,
                lineHeight: 1.5,
                maxWidth: 420,
                mb: 5,
              }}
            >
              Find stocks setting up.
              <Box component="span" sx={{ color: C.text }}> Before they move.</Box>
            </Typography>

            {/* CTA */}
            <Button
              onClick={() => navigate("/login")}
              sx={{
                px: 5,
                py: 1.75,
                bgcolor: C.text,
                color: "#0a0a0b",
                borderRadius: 2.5,
                fontSize: 16,
                fontWeight: 600,
                transition: "all 0.25s ease",
                "&:hover": {
                  bgcolor: "#d4d0c8",
                  transform: "translateY(-3px)",
                  boxShadow: "0 15px 40px -10px rgba(238,234,227,0.35)",
                },
                "&:active": { transform: "translateY(0)" },
              }}
            >
              Get started free
            </Button>

            <Typography
              sx={{
                fontSize: 13,
                color: "rgba(255,255,255,0.25)",
                mt: 2,
              }}
            >
              NSE · Updated daily
            </Typography>
          </Box>
        </Section>

        {/* Problem Section - Compact */}
        <Section delay={300}>
          <Box
            sx={{
              mb: { xs: 8, sm: 10 },
              p: { xs: 3, sm: 4 },
              borderRadius: 4,
              bgcolor: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.06)",
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: 22, sm: 28 },
                fontWeight: 600,
                color: C.text,
                lineHeight: 1.3,
                letterSpacing: "-0.02em",
                mb: 2,
              }}
            >
              Pattern recognition looks simple.
              <Box component="span" sx={{ color: C.muted, display: "block" }}>
                The math isn't.
              </Box>
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: 14, sm: 15 },
                color: C.muted,
                lineHeight: 1.7,
                maxWidth: 540,
                mx: "auto",
              }}
            >
              Identifying a real setup requires layering dozens of conditions — volume, money flow, 
              delivery, sector timing, breadth. <Box component="span" sx={{ color: C.text }}>We run
              the math on 2,000+ stocks every night.</Box> You wake up to what passed.
            </Typography>
          </Box>
        </Section>

        {/* Features - Compact cards */}
        <Section delay={500}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
              gap: 2.5,
              mb: 10,
            }}
          >
            {[
              {
                title: "Sector momentum",
                desc: "Which sectors are waking up with real buying",
                color: C.accent,
              },
              {
                title: "Quiet bases",
                desc: "Stocks coiling near highs, volume dried up",
                color: C.good,
              },
              {
                title: "Outcome tracking",
                desc: "What happens after the breakout triggers",
                color: C.warn,
              },
            ].map((item) => (
              <Box
                key={item.title}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.04)",
                    transform: "translateY(-4px)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: item.color,
                    mb: 2,
                  }}
                />
                <Typography
                  sx={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: C.text,
                    mb: 1,
                  }}
                >
                  {item.title}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 13.5,
                    color: C.muted,
                    lineHeight: 1.5,
                  }}
                >
                  {item.desc}
                </Typography>
              </Box>
            ))}
          </Box>
        </Section>

        {/* Footer */}
        <Box
          sx={{
            textAlign: "center",
            pb: 4,
            opacity: 0.4,
          }}
        >
          <Typography sx={{ fontSize: 11, color: C.muted, letterSpacing: "0.05em" }}>
            Indian equities · Post-market updates
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
