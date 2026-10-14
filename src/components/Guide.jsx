import { useState } from "react";
import { Box, Chip, Typography } from "@mui/material";
import { C, KLASS_GROUP } from "../theme.js";
import { BASE_RATES, EVIDENCE_WINDOW } from "../evidence.js";
import { TELEGRAM_BOT } from "../config.js";

const MONO = '"IBM Plex Mono", ui-monospace, monospace';

const SECTOR_FIELDS = [
  {
    field: "T",
    tag: "Turnover",
    what: "Sector turnover vs its own last 9 days.",
    read: ">1 is busier than usual. On a market-wide heavy day every sector rises together, so this alone means nothing.",
  },
  {
    field: "T rel",
    tag: "Trigger",
    what: "T divided by the median sector that day.",
    read: "The one that matters. 1.30 means 30% more expansion than a typical sector today. This is the crossing trigger.",
  },
  {
    field: "B",
    tag: "Breadth",
    what: "Breadth: advancing minus declining turnover.",
    read: "+0.15 or better = buying is spread. Negative on high T is dumping, not accumulation.",
  },
  {
    field: "Deliv",
    tag: "Quality",
    what: "Delivery quality vs each stock's own norm, then vs other sectors.",
    read: "≥1.00 confirms real buying. A huge volume day at 0.25 is HFT churn. Below 0.80 on a spike is a hard stop.",
  },
  {
    field: "CMF",
    tag: "Money Flow",
    what: "20-day Chaikin money flow (close location × volume).",
    read: "Positive and rising vs peers = accumulation. Negative and falling = distribution. The gates use the peer-relative version.",
  },
  {
    field: "RS / RS 5d",
    tag: "Relative Strength",
    what: "55-day return rank (0–100), and the 5-day change.",
    read: "Rising RS = the sector is starting to lead. RS 5d below −3 is decaying — already too late or dying.",
  },
  {
    field: "Adv",
    tag: "Participation",
    what: "Names up today / names in the sector.",
    read: "Need at least 3 advancing. 1/8 is one stock wearing a sector's clothes.",
  },
  {
    field: "Top",
    tag: "Concentration",
    what: "Largest name's share of sector turnover.",
    read: "Under 0.50 is a real sector. Over 0.50 is one name. Do not treat that as a sector move.",
  },
  {
    field: "Note",
    tag: "Diagnostic",
    what: "Why this class fired.",
    read: "Read this first on Disqualified rows. It is often more useful than the greens.",
  },
];

const COIL_FIELDS = [
  {
    field: "Coil",
    tag: "0–100 Rank",
    what: "0–100 rank among names that already passed the hard filters.",
    read: "Higher = tighter, quieter, more accumulated. 80 is not a signal. It only sorts the watchlist.",
  },
  {
    field: "Pos high",
    tag: "92–98%",
    what: "Close vs the 85-day high.",
    read: "92–98% is coiled under the high. 85% is still far. Sitting at 99% can be a flat base — that is allowed.",
  },
  {
    field: "To trigger",
    tag: "20d High",
    what: "Percent to the 20-day high (the breakout line).",
    read: "2–4% means a breakout is close. Large means it is still basing. Put the alert here, not at the close.",
  },
  {
    field: "RSI",
    tag: "45–68 Window",
    what: "14-day Wilder RSI on the split-adjusted series.",
    read: "45–68 is the window. Below 45 the trend is damaged. Above 68 the move already happened.",
  },
  {
    field: "Vol 5/20",
    tag: "0.5–0.8 Dry-up",
    what: "5-day volume vs 20-day volume.",
    read: "0.5–0.8 is a real dry-up. 0.99 is barely quiet. Rising volume here is the wrong phase — that is the breakout, not the coil.",
  },
  {
    field: "Range 20",
    tag: "6–10% Tight",
    what: "20-day high/low spread.",
    read: "6–10% is tight. Near 14% is the filter ceiling, not a tight base.",
  },
  {
    field: "CMF",
    tag: "> 0 Flow",
    what: "20-day Chaikin money flow on the stock.",
    read: "Clearly positive = quiet buying. Near 0 or negative is not accumulation, even if the range is tight.",
  },
  {
    field: "Deliv",
    tag: "> 1.0 Tape",
    what: "Delivery quality vs the median stock that day.",
    read: ">1 is better than the tape. <1 on a quiet day is just the market, not buying.",
  },
  {
    field: "Base d",
    tag: "35–55 Days",
    what: "How many of the last 60 days it sat above 90% of the high.",
    read: "35–55 = it has been sitting here. Low teens = it only just arrived.",
  },
];

const CLASSES = [
  {
    group: "acting",
    tag: "FEEDS SETUPS",
    do: "The only group that feeds Setups. The expansion day itself is the loud day rather than the setup; what the scan surfaces is the coiled names inside the sector, each with its own trigger.",
    states: [
      ["Crossing", "Turnover expanded out of quiet with breadth green and the move broad. Something is starting."],
      ["Pullback", "The intended setup shape: a crossing already fired and today cooled on lighter volume. The rest after the first push."],
    ],
  },
  {
    group: "watching",
    tag: "ON DECK",
    do: "No sector is acting today. Recheck tomorrow — these are the sectors most likely to become Acting next.",
    states: [
      ["Unverified", "Expansion is there, but too few names advanced or delivery was weak. Not confirmed."],
      ["Base", "Quiet and being bought, no expansion yet. Keep its names on the coil list."],
    ],
  },
  {
    group: "out",
    tag: "FILTERED OUT",
    do: "Skip. Read the Why column on the ruled-out rows — it is often more informative than the greens.",
    states: [
      ["Neglect", "Quiet and drifting down. Different from a base: quiet for the wrong reason."],
      ["Disqualified", "A hard stop fired — distribution, volume into falling stocks, poor delivery, decaying strength, or a markup already public."],
      ["None", "No pattern the scan recognises."],
    ],
  },
];

const WORKFLOW_STEPS = [
  {
    n: "01",
    tag: "LANDING SCREEN",
    title: "Setups — the shortlist",
    body: "This is the landing screen and most days it is the only one you need. It lists coiled names whose sector is also Acting, grouped by sector because names in one sector resolve together. Empty is normal: most sessions produce no setups.",
  },
  {
    n: "02",
    tag: "SECTOR CONFIRMATION",
    title: "Check the sector behind it",
    body: "Open Sectors and click the sector a setup came from. The panel shows whether turnover expanded out of genuine quiet while breadth stayed green, and whether every red day since traded lighter than the crossing. Crossing days are marked green, lighter reds blue, and a red day that traded more than the crossing is marked Heavy red — sellers won, so it is not a pullback. Setups whose sector passed all three checks carry a Shape confirmed mark.",
  },
  {
    n: "03",
    tag: "20-DAY HIGH TRIGGER",
    title: "The coil is not the trigger",
    body: "A setup is not a confirmation. The trigger is the 20-day high, and to_trigger is the distance to it; the structure only confirms on a close through that level on heavy volume. Until then the coil is a watchlist entry, nothing more.",
  },
  {
    n: "04",
    tag: "12M MOMENTUM CUT",
    title: "Leaders at rest — the other cut",
    body: "Switch the Setups page to Leaders at rest to drop the requirement that the sector is acting. Instead, the same coil pool is cut to stocks in the top 30% of the whole market on return over the twelve months ending a month ago, with anything in a disqualified sector removed. Survivors are ranked by that return divided by its volatility, so a steady trend outranks an erratic one, and the top 20 are shown.",
  },
  {
    n: "05",
    tag: "PERSONAL WATCHLIST",
    title: "Save stocks from any screen",
    body: "Bookmark any stock with the save icon on any table row or in the stock drawer. Your watchlist syncs across devices and enriches each saved name with live coil scores, fundamental data, and sector state — so you can track your own research without losing context.",
  },
  {
    n: "06",
    tag: "ANY NSE SYMBOL",
    title: "Look up any name in the header",
    body: "The header search runs the exact same coil filters, sector shape, and setup checks on any symbol you type. The drawer reports the structural state of the last close, the coil filters, and the sector behind the name. Those are observations about the chart, not instructions.",
  },
];

const BOT_COMMANDS = [
  ["/today", "Today's brief — stocks closest to their breakout trigger, strongest sector flow, and market regime.", "Always Free"],
  ["/r SYMBOL", "Quick stock report — sector, coil score, distance to trigger, sector shape. Tap 'Full report' for detail.", "Always Free"],
  ["/heatmap", "Sector rotation map — which sectors are crossing, pulling back, or ruled out.", "3/day · Pro ∞"],
  ["/flow", "Money flow — sectors ranked by institutional accumulation (20d CMF).", "3/day · Pro ∞"],
  ["/triggers", "Stocks from the coil pool within 2% of their 20-day high breakout trigger.", "3/day · Pro ∞"],
  ["/delivery", "Unusual delivery activity — institutional accumulation vs distribution.", "3/day · Pro ∞"],
  ["/changed", "What changed since yesterday — sector upgrades/downgrades and new/removed setups.", "3/day · Pro ∞"],
  ["/sector Name", "Drill into a specific sector with classification, CMF, and constituents.", "3/day · Pro ∞"],
  ["/link email", "Link your Telegram account to your Morrow Desk login email.", "Always Free"],
  ["/verify CODE", "Complete account linking with the 6-digit code shown on the Pricing page.", "Always Free"],
];

const BOT_VIEWS = [
  {
    code: "/heatmap",
    metric: "59 sectors",
    title: "Sector Rotation Map",
    body: "Groups all 59 sectors by their classification — Crossing, Pullback, Base, Neglect, Disqualified. The concise view shows sectors in uptrend; tap 'Show all' for the full map. Same data as the Sectors tab on the desk.",
  },
  {
    code: "/flow",
    metric: "20d CMF",
    title: "Institutional Money Flow",
    body: "Ranks sectors by 20-day Chaikin Money Flow (CMF). Positive CMF = close near the high on volume = institutional accumulation. Negative = distribution. Split into inflows, neutral, and outflows.",
  },
  {
    code: "/triggers",
    metric: "≤ 2.0% to high",
    title: "Near-Trigger Coils",
    body: "Stocks from the coil pool that are within 2% of their 20-day high. These are the names closest to a breakout. The trigger is the level, not the stock — it only confirms on a close through it on volume.",
  },
  {
    code: "/delivery",
    metric: "≥ 1.3× norm & ≥ 40%",
    title: "Delivery Spikes",
    body: "Stocks where today's delivery % is ≥1.3× their own 20-day average and ≥40% absolute. Split into accumulation (price rising + high delivery) and distribution (price falling + high delivery).",
  },
  {
    code: "/changed",
    metric: "Session diff",
    title: "Daily Delta",
    body: "A clean diff against the previous session: which sectors upgraded or downgraded, which setups entered the list, and which dropped off. Spot rotation without comparing screenshots.",
  },
];

const TABS = [
  { id: "methodology", label: "Methodology & Workflow", count: "7 steps" },
  { id: "reference", label: "Field & State Glossary", count: "18 metrics" },
  { id: "telegram", label: "Telegram Bot", count: "10 commands" },
];

function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <Box sx={{ mb: 2.5 }}>
      {eyebrow && (
        <Typography
          sx={{
            fontFamily: MONO,
            fontSize: 10.5,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: C.accent,
            mb: 0.75,
          }}
        >
          {eyebrow}
        </Typography>
      )}
      <Typography
        sx={{
          fontSize: { xs: 18, sm: 20 },
          fontWeight: 600,
          color: C.text,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography sx={{ fontSize: 14, color: C.muted, mt: 0.5, lineHeight: 1.6, maxWidth: 720 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

// ── Tab 1: Methodology & Workflow ──
function MethodologyTab() {
  const setupWin = Math.round(BASE_RATES.setups.winRate * 100);
  const coilWin = Math.round(BASE_RATES.coils.winRate * 100);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4.5 }}>
      {/* Empirical Base-Rate Telemetry Bento */}
      <Box>
        <SectionHeader
          eyebrow={`EMPIRICAL BASE RATES · ${EVIDENCE_WINDOW}`}
          title="Why the overlap matters"
          subtitle="Sectors show where money is moving. The coil scan shows which names are tight. Setups are the overlap — measured against the same session's all-stock median over the following 20 trading days."
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          {/* Card 1: Overlap Edge */}
          <Box
            sx={{
              p: 2.75,
              borderRadius: 2.5,
              bgcolor: "#15161b",
              border: `1px solid ${C.line}`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography sx={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.14em", color: C.good }}>
                  SETUPS OVERLAP
                </Typography>
                <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>
                  n = {BASE_RATES.setups.n} names
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                <Typography sx={{ fontFamily: MONO, fontSize: 34, fontWeight: 600, color: C.text, lineHeight: 1 }}>
                  {setupWin}%
                </Typography>
                <Typography sx={{ fontFamily: MONO, fontSize: 12, color: C.good }}>
                  vs {coilWin}% coils alone
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 13, color: C.muted, mt: 1, lineHeight: 1.55 }}>
                Traded above the same session&apos;s all-stock median 20 days later (de-duplicated to each name&apos;s first qualifying day).
              </Typography>
            </Box>

            <Box sx={{ mt: 2.5, pt: 1.75, borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 11, color: C.muted }}>
              <span>Median 20d excess</span>
              <span style={{ color: C.good }}>+{(BASE_RATES.setups.medianExcess * 100).toFixed(1)}% vs +{(BASE_RATES.coils.medianExcess * 100).toFixed(1)}%</span>
            </Box>
          </Box>

          {/* Card 2: Volume Confirmation */}
          <Box
            sx={{
              p: 2.75,
              borderRadius: 2.5,
              bgcolor: "#15161b",
              border: `1px solid ${C.line}`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography sx={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.14em", color: C.warn }}>
                  POST-TRIGGER HOLD RATE
                </Typography>
                <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>
                  +10 sessions
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                <Typography sx={{ fontFamily: MONO, fontSize: 34, fontWeight: 600, color: C.text, lineHeight: 1 }}>
                  52%
                </Typography>
                <Typography sx={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>
                  on heavy vol vs 41% light
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 13, color: C.muted, mt: 1, lineHeight: 1.55 }}>
                A breakout is an event, not an outcome. Across all breakouts, 45% were still above the trigger 10 sessions later.
              </Typography>
            </Box>

            <Box sx={{ mt: 2.5, pt: 1.75, borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 11, color: C.muted }}>
              <span>Trigger rule</span>
              <span style={{ color: C.text }}>Close &gt; 20d high + Vol</span>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* The 7-Step Daily Sequence */}
      <Box>
        <SectionHeader
          eyebrow="DAILY DESK SEQUENCE"
          title="How to work through tonight's scan"
          subtitle="A structured 7-step routine designed to take 10 minutes after NSE close."
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
            gap: 2,
          }}
        >
          {WORKFLOW_STEPS.map((s, idx) => (
            <Box
              key={s.n}
              sx={{
                p: 2.75,
                borderRadius: 2.5,
                bgcolor: "#15161b",
                border: `1px solid ${C.line}`,
                gridColumn: idx === WORKFLOW_STEPS.length - 1 ? { xs: "span 1", md: "span 2" } : "span 1",
                transition: "border-color 0.15s ease",
                "&:hover": { borderColor: "rgba(238,234,227,0.16)" },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.25 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                  <Box
                    sx={{
                      px: 1,
                      py: 0.25,
                      borderRadius: 1,
                      bgcolor: "rgba(142,180,196,0.1)",
                      border: "1px solid rgba(142,180,196,0.2)",
                      fontFamily: MONO,
                      fontSize: 11,
                      fontWeight: 600,
                      color: C.accent,
                    }}
                  >
                    STEP {s.n}
                  </Box>
                  <Typography sx={{ fontSize: 15.5, fontWeight: 600, color: C.text }}>
                    {s.title}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontFamily: MONO,
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    color: C.muted,
                    display: { xs: "none", sm: "block" },
                  }}
                >
                  {s.tag}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 13.75, lineHeight: 1.65, color: C.muted }}>
                {s.body}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Diagnostics: Near Misses & Empty Screens */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2,
        }}
      >
        <Box
          sx={{
            p: 3,
            borderRadius: 2.5,
            bgcolor: "#15161b",
            border: `1px solid ${C.line}`,
          }}
        >
          <Typography sx={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.16em", color: C.warn, mb: 0.75 }}>
            DIAGNOSTIC 01 · NEAR MISSES
          </Typography>
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: C.text, mb: 1 }}>
            Read one-filter failures as a tape thermometer
          </Typography>
          <Typography sx={{ fontSize: 13.5, lineHeight: 1.65, color: C.muted }}>
            Near misses are names that failed exactly one filter. Read them as a market diagnostic, not a shopping list:
          </Typography>
          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
            {[
              ["Fails on vol", "Volume has not dried up anywhere — the market is not offering quiet bases yet."],
              ["Fails on range", "The tape is too wide and volatile for tight compression."],
              ["Fails on rsi / ext", "The move already ran without a rest, or structure already broke down."],
            ].map(([k, v]) => (
              <Box
                key={k}
                sx={{
                  display: "flex",
                  gap: 1.5,
                  alignItems: "baseline",
                  p: 1.25,
                  borderRadius: 1.5,
                  bgcolor: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: C.text, minWidth: 115, flexShrink: 0 }}>
                  {k}
                </Typography>
                <Typography sx={{ fontSize: 12.75, color: C.muted, lineHeight: 1.5 }}>
                  {v}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box
          sx={{
            p: 3,
            borderRadius: 2.5,
            bgcolor: "#15161b",
            border: `1px solid ${C.line}`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography sx={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.16em", color: C.good, mb: 0.75 }}>
              DIAGNOSTIC 02 · EMPTY LISTS
            </Typography>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: C.text, mb: 1 }}>
              When the lists are empty, the filter is working
            </Typography>
            <Typography sx={{ fontSize: 13.5, lineHeight: 1.65, color: C.muted }}>
              No sectors Acting and zero setups on the board means the market is not offering this structure tonight.
              The empirical base rates above were measured on a few hundred names over fifteen months — roughly{" "}
              <Box component="span" sx={{ color: C.text, fontWeight: 500 }}>
                one qualifying setup every other session
              </Box>
              .
            </Typography>
          </Box>

          <Box
            sx={{
              mt: 2.5,
              p: 2,
              borderRadius: 2,
              bgcolor: "rgba(125,186,150,0.05)",
              border: "1px solid rgba(125,186,150,0.16)",
            }}
          >
            <Typography sx={{ fontFamily: MONO, fontSize: 11.5, color: C.good, fontWeight: 500 }}>
              Rule of discipline
            </Typography>
            <Typography sx={{ fontSize: 12.75, color: C.muted, mt: 0.5, lineHeight: 1.55 }}>
              Never loosen the filters just to put names on the screen. When the market compresses again, Setups populates automatically at 20:30 IST.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ── Tab 2: Field & State Glossary ──
function ReferenceTab() {
  const [fieldView, setFieldView] = useState("sector");
  const activeRows = fieldView === "sector" ? SECTOR_FIELDS : COIL_FIELDS;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4.5 }}>
      {/* Sector Classification States */}
      <Box>
        <SectionHeader
          eyebrow="SECTOR CLASSIFICATION ENGINE"
          title="What each sector state means"
          subtitle="The Sectors screen groups industries into Acting, Watching, or Ruled out. Underneath, the engine evaluates seven finer states visible on chip hover."
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          {CLASSES.map((c) => {
            const themeGroup = KLASS_GROUP[c.group];
            return (
              <Box
                key={c.group}
                sx={{
                  p: 2.75,
                  borderRadius: 2.5,
                  bgcolor: "#15161b",
                  border: `1px solid ${C.line}`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.75 }}>
                    <Chip
                      size="small"
                      label={themeGroup.label}
                      sx={{
                        bgcolor: themeGroup.bg,
                        color: themeGroup.fg,
                        fontWeight: 600,
                        fontSize: 12,
                        px: 0.5,
                      }}
                    />
                    <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: C.muted }}>
                      {c.tag}
                    </Typography>
                  </Box>

                  <Typography sx={{ fontSize: 13.25, color: C.muted, lineHeight: 1.6, mb: 2.25 }}>
                    {c.do}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, pt: 2, borderTop: `1px solid ${C.line}` }}>
                  {c.states.map(([name, why]) => (
                    <Box
                      key={name}
                      sx={{
                        p: 1.5,
                        borderRadius: 1.5,
                        bgcolor: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <Typography sx={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: C.text, mb: 0.4 }}>
                        {name}
                      </Typography>
                      <Typography sx={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>
                        {why}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Column Definitions Switcher */}
      <Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "flex-end" },
            justifyContent: "space-between",
            gap: 2,
            mb: 2.5,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: 10.5,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: C.accent,
                mb: 0.75,
              }}
            >
              COLUMN DICTIONARY
            </Typography>
            <Typography sx={{ fontSize: { xs: 18, sm: 20 }, fontWeight: 600, color: C.text, letterSpacing: "-0.02em" }}>
              {fieldView === "sector" ? "Sector table columns" : "Coil & setup columns"}
            </Typography>
            <Typography sx={{ fontSize: 13.75, color: C.muted, mt: 0.5, maxWidth: 640 }}>
              {fieldView === "sector"
                ? "A regular heatmap tells you an industry is up on volume. These columns look for the phase before that: quiet buying that then expands."
                : "A normal breakout screener asks for rising volume at the high. Coil asks the inverse: near the high, volume drying up, range narrowing, money still coming in."}
            </Typography>
          </Box>

          {/* Toggle pill */}
          <Box
            sx={{
              display: "inline-flex",
              p: 0.5,
              borderRadius: 2,
              bgcolor: "#15161b",
              border: `1px solid ${C.line}`,
              flexShrink: 0,
            }}
          >
            {[
              { id: "sector", label: "Sector Fields (9)" },
              { id: "coil", label: "Coil Fields (9)" },
            ].map((item) => {
              const active = fieldView === item.id;
              return (
                <Box
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setFieldView(item.id)}
                  onKeyDown={(e) => e.key === "Enter" && setFieldView(item.id)}
                  sx={{
                    px: 1.75,
                    py: 0.75,
                    borderRadius: 1.5,
                    cursor: "pointer",
                    fontFamily: MONO,
                    fontSize: 12,
                    fontWeight: 500,
                    bgcolor: active ? "rgba(238,234,227,0.1)" : "transparent",
                    color: active ? C.text : C.muted,
                    transition: "all 0.15s ease",
                    "&:hover": { color: C.text },
                  }}
                >
                  {item.label}
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Field Cards Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 1.75,
          }}
        >
          {activeRows.map((r) => (
            <Box
              key={r.field}
              sx={{
                p: 2.5,
                borderRadius: 2,
                bgcolor: "#15161b",
                border: `1px solid ${C.line}`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.25 }}>
                  <Box
                    sx={{
                      px: 1.25,
                      py: 0.35,
                      borderRadius: 1,
                      bgcolor: "rgba(238,234,227,0.06)",
                      border: "1px solid rgba(238,234,227,0.1)",
                      fontFamily: MONO,
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: C.text,
                    }}
                  >
                    {r.field}
                  </Box>
                  <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.accent }}>
                    {r.tag}
                  </Typography>
                </Box>

                <Typography sx={{ fontSize: 13.5, fontWeight: 500, color: C.text, mb: 1, lineHeight: 1.45 }}>
                  {r.what}
                </Typography>
              </Box>

              <Box sx={{ pt: 1.25, borderTop: `1px solid ${C.line}` }}>
                <Typography sx={{ fontSize: 12.75, color: C.muted, lineHeight: 1.55 }}>
                  {r.read}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

// ── Tab 3: Telegram Bot ──
function TelegramTab() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4.5 }}>
      {/* Top Bot Banner + 3-Step Link Flow */}
      <Box
        sx={{
          p: { xs: 2.75, sm: 3.5 },
          borderRadius: 2.5,
          bgcolor: "#15161b",
          border: `1px solid ${C.line}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: 2,
            pb: 3,
            borderBottom: `1px solid ${C.line}`,
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
              <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: C.good }} />
              <Typography sx={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.16em", color: C.accent }}>
                ON-DEMAND TELEGRAM BOT
              </Typography>
            </Box>
            <Typography sx={{ fontSize: { xs: 18, sm: 21 }, fontWeight: 600, color: C.text, letterSpacing: "-0.02em" }}>
              The same quantitative desk, inside Telegram
            </Typography>
            <Typography sx={{ fontSize: 13.75, color: C.muted, mt: 0.5, maxWidth: 600 }}>
              Query sector rotation, coil scores, breakout distances, and unusual delivery spikes on the go. Formatted for mobile screens.
            </Typography>
          </Box>

          <Box
            component="a"
            href={TELEGRAM_BOT}
            target="_blank"
            rel="noopener"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              px: 2.5,
              py: 1.25,
              borderRadius: 2,
              bgcolor: C.text,
              color: C.bg,
              fontSize: 13.5,
              fontWeight: 600,
              textDecoration: "none",
              flexShrink: 0,
              transition: "background-color 0.15s ease",
              "&:hover": { bgcolor: "#d8d4cd" },
            }}
          >
            <span>Open Telegram Bot</span>
            <span style={{ fontFamily: MONO }}>↗</span>
          </Box>
        </Box>

        {/* 3-Step Linking Flow */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 2,
            mt: 3,
          }}
        >
          {[
            {
              step: "01",
              cmd: "@nse_circuit_bot",
              title: "Open the bot",
              desc: "Open the bot in Telegram and type any NSE symbol or /today — no account required for free queries.",
            },
            {
              step: "02",
              cmd: "/link your@email.com",
              title: "Request link code",
              desc: "Send /link with the same email address you use on Morrow Desk to request a verification code.",
            },
            {
              step: "03",
              cmd: "/verify 6-DIGIT-CODE",
              title: "Verify & sync",
              desc: "Open the Pricing page on the web desk to view your 6-digit code, then send /verify CODE to the bot.",
            },
          ].map((s) => (
            <Box
              key={s.step}
              sx={{
                p: 2.25,
                borderRadius: 2,
                bgcolor: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.muted }}>
                  STEP {s.step}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: MONO,
                    fontSize: 11,
                    color: C.accent,
                    bgcolor: "rgba(142,180,196,0.08)",
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                  }}
                >
                  {s.cmd}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 14.5, fontWeight: 600, color: C.text, mb: 0.5 }}>
                {s.title}
              </Typography>
              <Typography sx={{ fontSize: 12.75, color: C.muted, lineHeight: 1.55 }}>
                {s.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Command Reference Table */}
      <Box>
        <SectionHeader
          eyebrow="BOT COMMAND DIRECTORY"
          title="Available slash commands"
          subtitle="Stock reports (/r) and the daily brief (/today) are unlimited for everyone. Free accounts include 3 market-wide scan queries per day; Pro removes all limits."
        />

        <Box
          sx={{
            borderRadius: 2.5,
            bgcolor: "#15161b",
            border: `1px solid ${C.line}`,
            overflow: "hidden",
          }}
        >
          {BOT_COMMANDS.map(([cmd, desc, access], idx) => {
            const isFree = access === "Always Free";
            return (
              <Box
                key={cmd}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "160px 1fr 130px" },
                  alignItems: "center",
                  gap: { xs: 1, sm: 2 },
                  px: 2.75,
                  py: 1.75,
                  borderBottom: idx < BOT_COMMANDS.length - 1 ? `1px solid ${C.line}` : "none",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.015)" },
                }}
              >
                <Box>
                  <Box
                    component="span"
                    sx={{
                      fontFamily: MONO,
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: C.text,
                      px: 1.25,
                      py: 0.4,
                      borderRadius: 1,
                      bgcolor: "rgba(238,234,227,0.06)",
                      border: "1px solid rgba(238,234,227,0.09)",
                    }}
                  >
                    {cmd}
                  </Box>
                </Box>

                <Typography sx={{ fontSize: 13.5, color: C.muted, lineHeight: 1.55 }}>
                  {desc}
                </Typography>

                <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", sm: "flex-end" } }}>
                  <Chip
                    size="small"
                    label={access}
                    sx={{
                      fontFamily: MONO,
                      fontSize: 10.5,
                      fontWeight: 600,
                      bgcolor: isFree ? "rgba(125,186,150,0.12)" : "rgba(142,180,196,0.12)",
                      color: isFree ? C.good : C.accent,
                    }}
                  />
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* What's Behind Each Bot View */}
      <Box>
        <SectionHeader
          eyebrow="UNDER THE HOOD"
          title="What each bot screen computes"
          subtitle="Every bot response is generated from the same nightly NSE EOD dataset as the web desk."
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
            gap: 2,
          }}
        >
          {BOT_VIEWS.map((v, i) => (
            <Box
              key={v.code}
              sx={{
                p: 2.75,
                borderRadius: 2.5,
                bgcolor: "#15161b",
                border: `1px solid ${C.line}`,
                gridColumn: i === BOT_VIEWS.length - 1 ? { xs: "span 1", md: "span 2" } : "span 1",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.25 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                  <Typography sx={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: C.accent }}>
                    {v.code}
                  </Typography>
                  <Typography sx={{ fontSize: 15, fontWeight: 600, color: C.text }}>
                    {v.title}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontFamily: MONO,
                    fontSize: 10.5,
                    color: C.muted,
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    bgcolor: "rgba(255,255,255,0.03)",
                    border: `1px solid ${C.line}`,
                  }}
                >
                  {v.metric}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6 }}>
                {v.body}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

// ── Main Guide Component ──
export default function Guide() {
  const [tab, setTab] = useState("methodology");

  return (
    <Box sx={{ pb: 8 }}>
      {/* Top Hero Header Card */}
      <Box
        sx={{
          p: { xs: 2.75, sm: 3.75 },
          mb: 4,
          borderRadius: 3,
          bgcolor: "#15161b",
          border: `1px solid ${C.line}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "flex-start", md: "flex-end" },
            justifyContent: "space-between",
            gap: 3,
          }}
        >
          <Box sx={{ maxWidth: 640 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: C.accent }} />
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: 10.5,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: C.accent,
                }}
              >
                FIELD MANUAL &amp; METHODOLOGY
              </Typography>
            </Box>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: 24, sm: 30 },
                fontWeight: 600,
                letterSpacing: "-0.03em",
                color: C.text,
                mb: 1,
              }}
            >
              How to read Morrow Desk
            </Typography>
            <Typography sx={{ fontSize: 14.25, color: C.muted, lineHeight: 1.6 }}>
              Every number on the desk has an explicit threshold and an empirical base rate. Neither a coil nor a sector crossing is a market order — the breakout is a close through the 20-day high on volume.
            </Typography>
          </Box>

          {/* Segmented Tab Switcher */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 0.75,
              p: 0.6,
              borderRadius: 2,
              bgcolor: "#0e0f12",
              border: `1px solid ${C.line}`,
            }}
          >
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <Box
                  key={t.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setTab(t.id)}
                  onKeyDown={(e) => e.key === "Enter" && setTab(t.id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.75,
                    py: 0.9,
                    borderRadius: 1.5,
                    cursor: "pointer",
                    bgcolor: active ? "rgba(238,234,227,0.1)" : "transparent",
                    color: active ? C.text : C.muted,
                    transition: "all 0.15s ease",
                    "&:hover": { color: C.text },
                  }}
                >
                  <Typography sx={{ fontSize: 13, fontWeight: active ? 600 : 500 }}>
                    {t.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: MONO,
                      fontSize: 10.5,
                      color: active ? C.accent : "rgba(142,138,131,0.6)",
                    }}
                  >
                    {t.count}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Active Tab Body */}
      {tab === "methodology" && <MethodologyTab />}
      {tab === "reference" && <ReferenceTab />}
      {tab === "telegram" && <TelegramTab />}

      {/* Bottom Disclaimer Card */}
      <Box
        sx={{
          mt: 5,
          p: 2.5,
          borderRadius: 2,
          bgcolor: "rgba(255,255,255,0.015)",
          border: `1px solid ${C.line}`,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Typography sx={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
          Morrow Desk is a descriptive screening tool. It describes what sector flow, price compression and volume are doing — it does not predict future returns or recommend any security. All decisions are yours.
        </Typography>
        <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.muted, flexShrink: 0 }}>
          NSE EOD · 20:30 IST
        </Typography>
      </Box>
    </Box>
  );
}
