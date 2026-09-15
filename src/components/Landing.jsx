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
        transform: visible ? "translateY(0)" : "translateY(30px)",
        transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
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
      <FloatingOrb delay={0} duration={20} size={500} x="5%" y="5%" color="rgba(142,180,196,0.12)" />
      <FloatingOrb delay={2} duration={25} size={400} x="70%" y="30%" color="rgba(125,186,150,0.10)" />
      <FloatingOrb delay={4} duration={22} size={350} x="80%" y="70%" color="rgba(180,168,210,0.08)" />
      <FloatingOrb delay={1} duration={18} size={300} x="10%" y="60%" color="rgba(196,164,106,0.06)" />

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
          maskImage: "radial-gradient(ellipse at center, black 0%, transparent 70%)",
        }}
      />

      {/* Content */}
      <Box
        sx={{
          position: "relative",
          maxWidth: 800,
          mx: "auto",
          px: 3,
          py: { xs: 8, sm: 12 },
        }}
      >
        {/* Hero Section */}
        <Section delay={0}>
          <Box sx={{ textAlign: "center", mb: { xs: 10, sm: 14 } }}>
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
                fontSize: { xs: 36, sm: 52 },
                fontWeight: 600,
                letterSpacing: "-0.04em",
                color: C.text,
                lineHeight: 1.1,
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
                lineHeight: 1.55,
                maxWidth: 500,
                mx: "auto",
              }}
            >
              A daily scan for stocks setting up.
              <br />
              Know what's building before it moves.
            </Typography>
          </Box>
        </Section>

        {/* Problem Section */}
        <Section delay={200}>
          <Box
            sx={{
              mb: { xs: 10, sm: 14 },
              p: { xs: 3, sm: 5 },
              borderRadius: 4,
              bgcolor: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: 11, sm: 12 },
                fontWeight: 600,
                color: C.accent,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                mb: 2,
              }}
            >
              The hidden problem
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: 20, sm: 26 },
                fontWeight: 600,
                color: C.text,
                lineHeight: 1.3,
                letterSpacing: "-0.02em",
                mb: 3,
              }}
            >
              Pattern recognition looks simple.
              <br />
              <Box component="span" sx={{ color: C.muted }}>The math behind it isn't.</Box>
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: 15, sm: 16 },
                color: C.muted,
                lineHeight: 1.7,
                maxWidth: 640,
              }}
            >
              You've seen the charts. A stock consolidates, volume dries up, then it breaks out. 
              Simple pattern, right? But here's what most traders miss: <Box component="span" sx={{ color: C.text }}>identifying 
              that pattern correctly requires layering dozens of conditions</Box> — relative 
              volume, money flow direction, delivery percentages, sector rotation timing, 
              breadth confirmation, and price position relative to multiple moving averages. 
              Do it by eye and you'll see patterns that aren't there. Do it by math and you 
              find the setups worth waiting for.
            </Typography>
          </Box>
        </Section>

        {/* What it does */}
        <Section delay={400}>
          <Box sx={{ mb: { xs: 10, sm: 14 } }}>
            <Typography
              sx={{
                fontSize: { xs: 11, sm: 12 },
                fontWeight: 600,
                color: C.good,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                mb: 2,
                textAlign: "center",
              }}
            >
              What we do
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: 20, sm: 26 },
                fontWeight: 600,
                color: C.text,
                lineHeight: 1.3,
                letterSpacing: "-0.02em",
                mb: 5,
                textAlign: "center",
              }}
            >
              Every night, we run the math on 2,000+ stocks.
              <br />
              <Box component="span" sx={{ color: C.muted }}>You wake up to what passed.</Box>
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
                gap: 3,
              }}
            >
              {[
                {
                  title: "Sector momentum",
                  desc: "We track which sectors are waking up — real volume expansion with genuine buying, not just noise.",
                },
                {
                  title: "Quiet accumulation",
                  desc: "Stocks building bases near their highs, with volume drying up and range tightening. The calm before the move.",
                },
                {
                  title: "Breakout tracking",
                  desc: "Once a setup triggers, we follow it. Did it hold? Did it fail? The data tells you what works.",
                },
              ].map((item) => (
                <Box
                  key={item.title}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: C.text,
                      mb: 1.5,
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 14,
                      color: C.muted,
                      lineHeight: 1.6,
                    }}
                  >
                    {item.desc}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Section>

        {/* The difference */}
        <Section delay={600}>
          <Box
            sx={{
              mb: { xs: 10, sm: 14 },
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: 11, sm: 12 },
                fontWeight: 600,
                color: C.warn,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                mb: 2,
              }}
            >
              The difference
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: 18, sm: 22 },
                color: C.muted,
                lineHeight: 1.6,
                maxWidth: 560,
                mx: "auto",
              }}
            >
              Most screeners give you a list of stocks that match a few filters.
              <Box component="span" sx={{ color: C.text, display: "block", mt: 1.5 }}>
                We give you stocks that passed a gauntlet — sector confirmed, 
                volume dried up, delivery genuine, trend intact, and sitting 
                right at the breakout level.
              </Box>
            </Typography>
          </Box>
        </Section>

        {/* CTA Section */}
        <Section delay={800}>
          <Box sx={{ textAlign: "center", pb: 8 }}>
            <Button
              onClick={() => navigate("/login")}
              sx={{
                px: 5,
                py: 1.75,
                bgcolor: C.text,
                color: "#0a0a0b",
                borderRadius: 2,
                fontSize: 16,
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
                fontSize: 14,
                color: "rgba(255,255,255,0.3)",
                mt: 2,
              }}
            >
              Free to explore · No credit card required
            </Typography>

            <Typography
              sx={{
                fontSize: 12,
                color: "rgba(255,255,255,0.15)",
                mt: 6,
                letterSpacing: "0.03em",
              }}
            >
              Indian equities (NSE) · Updated daily after market close
            </Typography>
          </Box>
        </Section>
      </Box>
    </Box>
  );
}
