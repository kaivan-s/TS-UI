/**
 * Feedback — a simple form for users to share ideas, bugs or general thoughts.
 */

import { useState } from "react";
import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import { submitFeedback } from "../api.js";
import { C } from "../theme.js";

const MONO = '"IBM Plex Mono", ui-monospace, monospace';

const CATEGORIES = [
  { id: "feature", label: "Feature request", desc: "Something you'd like to see" },
  { id: "bug", label: "Bug report", desc: "Something that isn't working right" },
  { id: "general", label: "General", desc: "Anything else on your mind" },
];

const RATINGS = [1, 2, 3, 4, 5];
const RATING_LABELS = ["Poor", "Needs work", "Okay", "Good", "Excellent"];

export default function FeedbackView() {
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setBusy(true);
    setError("");
    try {
      await submitFeedback(message, category, rating);
      setDone(true);
      setMessage("");
      setRating(null);
    } catch (e) {
      setError(e.message || "Could not submit feedback");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ pb: 6, maxWidth: 720 }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: "#15161b",
          border: `1px solid ${C.line}`,
          borderRadius: 2.5,
          p: { xs: 2, sm: 2.5 },
          mb: 2.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.4 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: C.accent }} />
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: "0.16em",
              color: C.accent,
              textTransform: "uppercase",
            }}
          >
            SHARE YOUR THOUGHTS
          </Typography>
        </Box>
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: 20, sm: 22 },
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            color: C.text,
          }}
        >
          Feedback
        </Typography>
        <Typography sx={{ color: C.muted, fontSize: 12.75, lineHeight: 1.5, mt: 0.35 }}>
          Found a bug? Have an idea for a feature? Just want to say something? We read every message.
        </Typography>
      </Box>

      {done ? (
        <Box
          sx={{
            p: 4,
            borderRadius: 2.5,
            bgcolor: "#15161b",
            border: "1px solid rgba(125,186,150,0.3)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <CheckCircleOutlineRoundedIcon sx={{ fontSize: 40, color: C.good }} />
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: C.text }}>
            Thank you for your feedback!
          </Typography>
          <Typography sx={{ fontSize: 13, color: C.muted }}>
            We appreciate you taking the time. Your input helps shape what we build next.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => setDone(false)}
            sx={{
              mt: 1,
              fontFamily: MONO,
              fontSize: 12,
              color: C.accent,
              borderColor: C.line,
              textTransform: "none",
              "&:hover": { borderColor: C.accent },
            }}
          >
            Submit another
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderRadius: 2.5,
            bgcolor: "#15161b",
            border: `1px solid ${C.line}`,
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
          }}
        >
          {/* Category picker */}
          <Box>
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: "0.1em",
                color: C.muted,
                textTransform: "uppercase",
                mb: 1,
              }}
            >
              Category
            </Typography>
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
              {CATEGORIES.map((c) => {
                const active = category === c.id;
                return (
                  <Box
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setCategory(c.id)}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      px: 1.5,
                      py: 1,
                      borderRadius: 1.5,
                      cursor: "pointer",
                      bgcolor: active ? "rgba(142,180,196,0.1)" : "#0e0f12",
                      border: `1px solid ${active ? "rgba(142,180,196,0.35)" : C.line}`,
                      transition: "all 0.15s ease",
                      "&:hover": { borderColor: "rgba(238,234,227,0.2)" },
                      minWidth: 120,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 12.5,
                        fontWeight: active ? 600 : 500,
                        color: active ? C.text : C.muted,
                      }}
                    >
                      {c.label}
                    </Typography>
                    <Typography sx={{ fontSize: 10.5, color: C.muted, mt: 0.15 }}>
                      {c.desc}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Rating (optional) */}
          <Box>
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: "0.1em",
                color: C.muted,
                textTransform: "uppercase",
                mb: 1,
              }}
            >
              Overall experience{" "}
              <Box component="span" sx={{ fontWeight: 400, letterSpacing: 0, textTransform: "none" }}>
                (optional)
              </Box>
            </Typography>
            <Box sx={{ display: "flex", gap: 0.65 }}>
              {RATINGS.map((r) => {
                const active = rating === r;
                return (
                  <Box
                    key={r}
                    role="button"
                    tabIndex={0}
                    onClick={() => setRating(active ? null : r)}
                    title={RATING_LABELS[r - 1]}
                    sx={{
                      width: 38,
                      height: 38,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 1.25,
                      cursor: "pointer",
                      fontFamily: MONO,
                      fontSize: 14,
                      fontWeight: 600,
                      bgcolor: active ? "rgba(142,180,196,0.15)" : "#0e0f12",
                      border: `1px solid ${active ? C.accent : C.line}`,
                      color: active ? C.accent : C.muted,
                      transition: "all 0.15s ease",
                      "&:hover": { borderColor: C.accent, color: C.text },
                    }}
                  >
                    {r}
                  </Box>
                );
              })}
              {rating && (
                <Typography
                  sx={{
                    alignSelf: "center",
                    ml: 1,
                    fontFamily: MONO,
                    fontSize: 11,
                    color: C.accent,
                  }}
                >
                  {RATING_LABELS[rating - 1]}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Message */}
          <Box>
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: "0.1em",
                color: C.muted,
                textTransform: "uppercase",
                mb: 1,
              }}
            >
              Your message
            </Typography>
            <TextField
              multiline
              minRows={4}
              maxRows={12}
              fullWidth
              placeholder="Tell us what's on your mind…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              inputProps={{ maxLength: 5000 }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#0e0f12",
                  borderRadius: 1.5,
                  fontSize: 13.5,
                  lineHeight: 1.6,
                },
              }}
            />
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: 10,
                color: C.muted,
                textAlign: "right",
                mt: 0.5,
              }}
            >
              {message.length} / 5,000
            </Typography>
          </Box>

          {error && (
            <Typography sx={{ fontSize: 13, color: C.bad }}>
              {error}
            </Typography>
          )}

          <Button
            variant="contained"
            disabled={busy || !message.trim()}
            onClick={handleSubmit}
            startIcon={busy ? <CircularProgress size={14} sx={{ color: C.muted }} /> : undefined}
            sx={{
              alignSelf: "flex-start",
              fontFamily: MONO,
              fontSize: 12.5,
              fontWeight: 600,
              textTransform: "none",
              bgcolor: C.accent,
              color: "#0e0f12",
              px: 3,
              py: 1,
              borderRadius: 1.5,
              "&:hover": { bgcolor: "#a5c7d4" },
              "&.Mui-disabled": { bgcolor: "rgba(142,180,196,0.2)", color: C.muted },
            }}
          >
            {busy ? "Submitting…" : "Submit feedback"}
          </Button>
        </Box>
      )}
    </Box>
  );
}
