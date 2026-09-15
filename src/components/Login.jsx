import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, InputBase, Typography } from "@mui/material";
import { C } from "../theme.js";
import { useAuth } from "../auth.jsx";

function GoogleIcon() {
  return (
    <Box
      component="svg"
      viewBox="0 0 18 18"
      sx={{ width: 16, height: 16 }}
    >
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" />
    </Box>
  );
}

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
        filter: "blur(60px)",
        opacity: 0.4,
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

function Input({ ...props }) {
  return (
    <InputBase
      {...props}
      sx={{
        width: "100%",
        px: 2,
        py: 1.5,
        fontSize: 14,
        color: C.text,
        bgcolor: "rgba(255,255,255,0.03)",
        borderRadius: 2,
        border: "1px solid rgba(255,255,255,0.06)",
        transition: "all 0.2s ease",
        "&:hover": {
          bgcolor: "rgba(255,255,255,0.05)",
          borderColor: "rgba(255,255,255,0.1)",
        },
        "&.Mui-focused": {
          bgcolor: "rgba(255,255,255,0.06)",
          borderColor: "rgba(142,180,196,0.4)",
        },
        "& input::placeholder": {
          color: C.muted,
          opacity: 1,
        },
        ...props.sx,
      }}
    />
  );
}

export default function Login() {
  const navigate = useNavigate();
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    error,
    notice,
    denied,
    signOut,
    email: sessionEmail,
    busy,
  } = useAuth();

  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    if (mode === "forgot") {
      if (!email.trim()) return;
      resetPassword(email);
      return;
    }
    if (!email.trim() || !password) return;
    if (mode === "signup") signUpWithEmail(email, password);
    else signInWithEmail(email, password);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#050506",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background orbs */}
      <FloatingOrb delay={0} duration={20} size={400} x="10%" y="20%" color="rgba(142,180,196,0.15)" />
      <FloatingOrb delay={2} duration={25} size={300} x="70%" y="60%" color="rgba(125,186,150,0.12)" />
      <FloatingOrb delay={4} duration={22} size={350} x="80%" y="10%" color="rgba(180,168,210,0.1)" />
      <FloatingOrb delay={1} duration={18} size={250} x="20%" y="70%" color="rgba(196,164,106,0.08)" />

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
          maskImage: "radial-gradient(ellipse at center, black 0%, transparent 70%)",
        }}
      />

      {/* Main card */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 380,
          mx: 3,
          p: 4,
          borderRadius: 4,
          bgcolor: "rgba(12,13,15,0.8)",
          backdropFilter: "blur(40px)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Logo / Brand */}
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: 3,
              bgcolor: "rgba(142,180,196,0.1)",
              border: "1px solid rgba(142,180,196,0.2)",
              mb: 2,
            }}
          >
            <Typography sx={{ fontSize: 20, fontWeight: 600, color: C.accent }}>M</Typography>
          </Box>
          <Typography
            sx={{
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: "-0.04em",
              color: C.text,
            }}
          >
            Morrow Desk
          </Typography>
          <Typography
            sx={{
              fontSize: 13,
              color: C.muted,
              mt: 0.5,
              transition: "all 0.3s ease",
            }}
          >
            {denied
              ? "Account not on allow list"
              : mode === "signin"
              ? "Welcome back"
              : mode === "signup"
              ? "Create your account"
              : "Reset your password"}
          </Typography>
        </Box>

        {denied ? (
          <Box sx={{ textAlign: "center" }}>
            <Typography sx={{ fontSize: 13, color: C.muted, mb: 3 }}>
              {sessionEmail || "This account"} is not authorized.
            </Typography>
            <Button
              onClick={signOut}
              sx={{
                width: "100%",
                py: 1.5,
                bgcolor: "rgba(255,255,255,0.05)",
                color: C.text,
                borderRadius: 2,
                fontSize: 13,
                fontWeight: 500,
                "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
              }}
            >
              Sign out
            </Button>
          </Box>
        ) : (
          <>
            {/* Google button first */}
            <Button
              onClick={signInWithGoogle}
              disabled={busy}
              sx={{
                width: "100%",
                py: 1.5,
                mb: 2.5,
                bgcolor: "rgba(255,255,255,0.05)",
                color: C.text,
                borderRadius: 2,
                fontSize: 13,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1.25,
                border: "1px solid rgba(255,255,255,0.06)",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.08)",
                  borderColor: "rgba(255,255,255,0.12)",
                  transform: "translateY(-1px)",
                },
                "&:active": { transform: "translateY(0)" },
              }}
            >
              <GoogleIcon />
              Continue with Google
            </Button>

            {/* Divider */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, my: 2.5 }}>
              <Box sx={{ flex: 1, height: "1px", bgcolor: "rgba(255,255,255,0.06)" }} />
              <Typography sx={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                or
              </Typography>
              <Box sx={{ flex: 1, height: "1px", bgcolor: "rgba(255,255,255,0.06)" }} />
            </Box>

            {/* Email form */}
            <Box component="form" onSubmit={onSubmit}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Input
                  type="email"
                  placeholder="Email address"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {mode !== "forgot" && (
                  <Input
                    type="password"
                    placeholder="Password"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                )}
              </Box>

              <Button
                type="submit"
                disabled={busy}
                sx={{
                  width: "100%",
                  mt: 2,
                  py: 1.5,
                  bgcolor: C.text,
                  color: "#0a0a0b",
                  borderRadius: 2,
                  fontSize: 13,
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: "#d4d0c8",
                    transform: "translateY(-1px)",
                  },
                  "&:active": { transform: "translateY(0)" },
                  "&.Mui-disabled": {
                    bgcolor: "rgba(238,234,227,0.15)",
                    color: C.muted,
                  },
                }}
              >
                {busy
                  ? "Please wait..."
                  : mode === "signin"
                  ? "Sign in"
                  : mode === "signup"
                  ? "Create account"
                  : "Send reset link"}
              </Button>
            </Box>

            {/* Mode switchers */}
            <Box sx={{ mt: 3, display: "flex", justifyContent: "center", gap: 0.5 }}>
              {mode === "signin" && (
                <>
                  <Typography sx={{ fontSize: 12, color: C.muted }}>
                    Don't have an account?
                  </Typography>
                  <Typography
                    component="button"
                    onClick={() => switchMode("signup")}
                    sx={{
                      fontSize: 12,
                      color: C.accent,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    Sign up
                  </Typography>
                </>
              )}
              {mode === "signup" && (
                <>
                  <Typography sx={{ fontSize: 12, color: C.muted }}>
                    Already have an account?
                  </Typography>
                  <Typography
                    component="button"
                    onClick={() => switchMode("signin")}
                    sx={{
                      fontSize: 12,
                      color: C.accent,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    Sign in
                  </Typography>
                </>
              )}
              {mode === "forgot" && (
                <Typography
                  component="button"
                  onClick={() => switchMode("signin")}
                  sx={{
                    fontSize: 12,
                    color: C.accent,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  Back to sign in
                </Typography>
              )}
            </Box>

            {mode === "signin" && (
              <Box sx={{ mt: 1.5, textAlign: "center" }}>
                <Typography
                  component="button"
                  onClick={() => switchMode("forgot")}
                  sx={{
                    fontSize: 12,
                    color: C.muted,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    "&:hover": { color: C.text },
                  }}
                >
                  Forgot password?
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* Notices and errors */}
        {notice && (
          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 2,
              bgcolor: "rgba(142,180,196,0.1)",
              border: "1px solid rgba(142,180,196,0.2)",
            }}
          >
            <Typography sx={{ fontSize: 12, color: C.accent, lineHeight: 1.5 }}>
              {notice}
            </Typography>
          </Box>
        )}
        {error && (
          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 2,
              bgcolor: "rgba(200,122,122,0.1)",
              border: "1px solid rgba(200,122,122,0.2)",
            }}
          >
            <Typography sx={{ fontSize: 12, color: C.bad, lineHeight: 1.5 }}>
              {error}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Back to home link */}
      {!denied && (
        <Typography
          component="button"
          onClick={() => navigate("/")}
          sx={{
            position: "absolute",
            top: 24,
            left: 24,
            fontSize: 13,
            color: C.muted,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            transition: "color 0.2s ease",
            "&:hover": { color: C.text },
          }}
        >
          ← Back
        </Typography>
      )}

      {/* Bottom attribution */}
      <Typography
        sx={{
          position: "absolute",
          bottom: 24,
          fontSize: 11,
          color: "rgba(255,255,255,0.2)",
          letterSpacing: "0.05em",
        }}
      >
        Sector accumulation scan
      </Typography>
    </Box>
  );
}
