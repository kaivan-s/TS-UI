import { useState } from "react";
import {
  Box,
  Chip,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { C, KLASS_GROUP } from "../theme.js";
import { BASE_RATES, EVIDENCE_WINDOW } from "../evidence.js";
import { TELEGRAM_BOT, TELEGRAM_CHANNEL } from "../config.js";

function H({ children }) {
  return (
    <Typography variant="h2" sx={{ mt: 4.5, mb: 1.5, fontSize: 18 }}>
      {children}
    </Typography>
  );
}

function P({ children }) {
  return (
    <Typography sx={{ fontSize: 15.5, lineHeight: 1.7, color: "text.primary", mb: 1.5 }}>
      {children}
    </Typography>
  );
}

function Mute({ children }) {
  return (
    <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "text.secondary", mb: 1.5 }}>
      {children}
    </Typography>
  );
}

function Step({ n, title, body }) {
  return (
    <Box sx={{ display: "flex", gap: 2, mb: 2.25 }}>
      <Typography
        className="num"
        sx={{ flex: "0 0 22px", color: C.muted, fontSize: 13, mt: 0.3 }}
      >
        {n}
      </Typography>
      <Box>
        <Typography sx={{ fontWeight: 500, fontSize: 15.5, mb: 0.4 }}>{title}</Typography>
        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "text.secondary" }}>
          {body}
        </Typography>
      </Box>
    </Box>
  );
}

function FieldTable({ rows }) {
  return (
    <Paper variant="outlined" sx={{ overflow: "hidden", mb: 1, width: "100%", overflowX: "auto" }}>
      <Table sx={{ minWidth: 600 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 130 }}>Field</TableCell>
            <TableCell>What it is</TableCell>
            <TableCell>How to read it</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.field}>
              <TableCell className="num" sx={{ fontWeight: 500, color: C.text }}>
                {r.field}
              </TableCell>
              <TableCell sx={{ color: "text.secondary", fontSize: 13.5, lineHeight: 1.55 }}>{r.what}</TableCell>
              <TableCell sx={{ fontSize: 13.5, lineHeight: 1.55 }}>{r.read}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

const SECTOR_FIELDS = [
  { field: "T", what: "Sector turnover vs its own last 9 days.", read: ">1 is busier than usual. On a market-wide heavy day every sector rises together, so this alone means nothing." },
  { field: "T rel", what: "T divided by the median sector that day.", read: "The one that matters. 1.30 means 30% more expansion than a typical sector today. This is the crossing trigger." },
  { field: "B", what: "Breadth: advancing minus declining turnover.", read: "+0.15 or better = buying is spread. Negative on high T is dumping, not accumulation." },
  { field: "Deliv", what: "Delivery quality vs each stock's own norm, then vs other sectors.", read: "≥1.00 confirms real buying. A huge volume day at 0.25 is HFT churn. Below 0.80 on a spike is a hard stop." },
  { field: "CMF", what: "20-day Chaikin money flow (close location × volume).", read: "Positive and rising vs peers = accumulation. Negative and falling = distribution. The gates use the peer-relative version." },
  { field: "RS / RS 5d", what: "55-day return rank (0–100), and the 5-day change.", read: "Rising RS = the sector is starting to lead. RS 5d below −3 is decaying — already too late or dying." },
  { field: "Adv", what: "Names up today / names in the sector.", read: "Need at least 3 advancing. 1/8 is one stock wearing a sector's clothes." },
  { field: "Top", what: "Largest name's share of sector turnover.", read: "Under 0.50 is a real sector. Over 0.50 is one name. Do not treat that as a sector move." },
  { field: "Note", what: "Why this class fired.", read: "Read this first on Disqualified rows. It is often more useful than the greens." },
];

const COIL_FIELDS = [
  { field: "Coil", what: "0–100 rank among names that already passed the hard filters.", read: "Higher = tighter, quieter, more accumulated. 80 is not a signal. It only sorts the watchlist." },
  { field: "Pos high", what: "Close vs the 85-day high.", read: "92–98% is coiled under the high. 85% is still far. Sitting at 99% can be a flat base — that is allowed." },
  { field: "To trigger", what: "Percent to the 20-day high (the breakout line).", read: "2–4% means a breakout is close. Large means it is still basing. Put the alert here, not at the close." },
  { field: "RSI", what: "14-day Wilder RSI on the split-adjusted series.", read: "45–68 is the window. Below 45 the trend is damaged. Above 68 the move already happened." },
  { field: "Vol 5/20", what: "5-day volume vs 20-day volume.", read: "0.5–0.8 is a real dry-up. 0.99 is barely quiet. Rising volume here is the wrong phase — that is the breakout, not the coil." },
  { field: "Range 20", what: "20-day high/low spread.", read: "6–10% is tight. Near 14% is the filter ceiling, not a tight base." },
  { field: "CMF", what: "20-day Chaikin money flow on the stock.", read: "Clearly positive = quiet buying. Near 0 or negative is not accumulation, even if the range is tight." },
  { field: "Deliv", what: "Delivery quality vs the median stock that day.", read: ">1 is better than the tape. <1 on a quiet day is just the market, not buying." },
  { field: "Base d", what: "How many of the last 60 days it sat above 90% of the high.", read: "35–55 = it has been sitting here. Low teens = it only just arrived." },
];

const CLASSES = [
  {
    group: "acting",
    do: "The only group that feeds Setups. The expansion day itself is the loud day rather than the setup; what the scan surfaces is the coiled names inside the sector, each with its own trigger.",
    states: [
      ["Crossing", "Turnover expanded out of quiet with breadth green and the move broad. Something is starting."],
      ["Pullback", "The intended setup shape: a crossing already fired and today cooled on lighter volume. The rest after the first push."],
    ],
  },
  {
    group: "watching",
    do: "No sector is acting today. Recheck tomorrow — these are the sectors most likely to become Acting next.",
    states: [
      ["Unverified", "Expansion is there, but too few names advanced or delivery was weak. Not confirmed."],
      ["Base", "Quiet and being bought, no expansion yet. Keep its names on the coil list."],
    ],
  },
  {
    group: "out",
    do: "Skip. Read the Why column on the ruled-out rows — it is often more informative than the greens.",
    states: [
      ["Neglect", "Quiet and drifting down. Different from a base: quiet for the wrong reason."],
      ["Disqualified", "A hard stop fired — distribution, volume into falling stocks, poor delivery, decaying strength, or a markup already public."],
      ["None", "No pattern the scan recognises."],
    ],
  },
];

const TABS = [
  { id: "methodology", label: "📖 Methodology", help: "How the scan works, what the fields mean, and how to read the lists." },
  { id: "telegram", label: "💬 Telegram", help: "Bot commands, channel alerts, and how to link your account." },
];

const BOT_COMMANDS = [
  ["/today", "Today's brief — stocks closest to their breakout trigger, strongest sector flow, and market regime.", "Free"],
  ["/r SYMBOL", "Quick stock report — sector, coil score, distance to trigger, sector shape. Tap 'Full report' for detail.", "Free"],
  ["/heatmap", "Sector rotation map — which sectors are crossing, pulling back, or ruled out.", "3/day"],
  ["/flow", "Money flow — sectors ranked by institutional accumulation (CMF).", "3/day"],
  ["/triggers", "Stocks within 2% of their breakout trigger.", "3/day"],
  ["/delivery", "Unusual delivery activity — accumulation vs distribution.", "3/day"],
  ["/changed", "What changed since yesterday — sector moves, new/removed setups.", "3/day"],
  ["/sector Name", "Drill into a specific sector with classification, CMF, and constituents.", "3/day"],
  ["/link email", "Link your Telegram to your website account.", "Free"],
  ["/verify CODE", "Complete account linking with the 6-digit code from the website.", "Free"],
];

const CHANNEL_ALERTS = [
  ["9:00 AM", "☀️ Morning Scorecard", "Overnight results: which setups triggered, which held, gap-up/down reads, and what to watch today."],
  ["Intraday", "⚡ Circuit Flash", "Real-time alert when a new stock hits upper circuit. Only fires on new appearances — no repeated spam."],
  ["12:30 PM", "📊 Midday Pulse", "Market-breadth check halfway through the session. Sector flows, volume trends, and anything developing."],
  ["7:30 PM", "🌙 EOD Wrap", "The full evening read: sector scans, new setups, coil changes, circuit results, and delivery highlights."],
  ["Saturday", "📋 Weekly Digest", "Week's observations — how many setups triggered, held, broke down. Methodology check, not performance claim."],
];

// ── Methodology tab ──
function MethodologyTab() {
  return (
    <>
      <Mute>
        Sectors show where money is moving. The coil scan shows which names are
        tight. Setups are the overlap, and the overlap is where the edge is:
        over {EVIDENCE_WINDOW}, {Math.round(BASE_RATES.setups.winRate * 100)}%
        of setups beat the market over the following 20 days against{" "}
        {Math.round(BASE_RATES.coils.winRate * 100)}% for coils alone. Neither
        is a market order — the breakout is the close through the trigger on
        volume. Type a symbol in the header to run the same gates on any name.
      </Mute>

      <H>The daily sequence</H>
      <Step n="1" title="Setups — the shortlist" body="This is the landing screen and most days it is the only one you need. It lists coiled names whose sector is also Acting, grouped by sector because names in one sector resolve together. Empty is normal: most sessions produce no setups." />
      <Step n="2" title="Check the sector behind it" body="Open Sectors and click the sector a setup came from. The panel shows whether turnover expanded out of genuine quiet while breadth stayed green, and whether every red day since traded lighter than the crossing. Crossing days are marked green, lighter reds blue, and a red day that traded more than the crossing is marked Heavy red — sellers won, so it is not a pullback. Setups whose sector passed all three checks carry a Shape confirmed mark." />
      <Step n="3" title="The coil is not the trigger" body="A setup is not a confirmation. The trigger is the 20-day high, and to_trigger is the distance to it; the structure only confirms on a close through that level on heavy volume. Until then the coil is a watchlist entry, nothing more." />
      <Step n="4" title="Leaders at rest — the other cut" body="Switch the Setups page to Leaders at rest to drop the requirement that the sector is acting. Instead, the same coil pool is cut to stocks in the top 30% of the whole market on return over the twelve months ending a month ago, with anything in a disqualified sector removed. Survivors are ranked by that return divided by its volatility, so a steady trend outranks an erratic one, and the top 20 are shown. The top of that list is a proven leader that has gone quiet, which is a different bet from Sector agrees and picks up mostly different names. Twelve-month momentum is the one reading in the app that orders outcomes consistently; the risk-adjusted ordering is newer and still being measured, so treat it as a priority order, not a promise." />
      <Step n="5" title="Tracking — what happened to the last lot" body="Every other screen is tonight's snapshot, so a name that disappears leaves no trace. Tracking gives each base an identity from the session it first cleared the filters until it resolves, and says which of the four things happened: it broke out, it fell 7% below where it appeared, it stopped clearing the filters, or twenty sessions passed with neither. A base survives gaps of up to three sessions, because about half of all drop-offs are back within ten and ending an episode on the first miss reported the same base as dead and then brand new a week later. Read the top line first — it counts only what changed in the last session, so a quiet evening says so." />
      <Step n="6" title="Breaking out is not the same as working" body="Across 942 resolved episodes, 57% eventually closed through their level, 22% broke down first, and 21% did neither. But of the ones that broke out, fewer than half were still above the level ten sessions later. That is the single most useful number in this app: a breakout is an event, not an outcome, and the base rate for it holding is close to a coin toss. Breakouts on heavy volume held 52% of the time against 41% on light volume — consistent with the point in step 3, though that comparison is 'still above the level', not a return measurement, and is not a controlled test." />
      <Step n="7" title="Look up any name" body="The header field runs the same coil filters, sector shape, and setup checks on a symbol you type. The drawer reports which structural state the last close sits in — pre-trigger, at trigger, at the pullback line, structure intact, or structure broken — together with the structure level under the 20-day base (or 1.5 ATR), the 2R level and the measured move. Those are arithmetic from the base, not a measured edge and not instructions. Enter your own price to recompute them from it. Click a symbol on any list for the same drawer." />

      <H>What each state means</H>
      <P>
        The Sectors table labels every sector Acting, Watching, or Ruled out.
        The scan works with seven finer states underneath, which is what you
        see when you hover a chip.
      </P>
      <Paper variant="outlined" sx={{ overflow: "hidden", width: "100%", overflowX: "auto" }}>
        <Table sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: { xs: 100, sm: 130 } }}>Shown as</TableCell>
              <TableCell sx={{ width: { xs: 220, sm: 320 } }}>States behind it</TableCell>
              <TableCell>How the scan uses it</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {CLASSES.map((c) => (
              <TableRow key={c.group}>
                <TableCell sx={{ verticalAlign: "top", py: 1.75 }}>
                  <Chip size="small" label={KLASS_GROUP[c.group].label} sx={{ bgcolor: KLASS_GROUP[c.group].bg, color: KLASS_GROUP[c.group].fg, border: "none", fontWeight: 500 }} />
                </TableCell>
                <TableCell sx={{ verticalAlign: "top", py: 1.75 }}>
                  {c.states.map(([name, why]) => (
                    <Typography key={name} sx={{ fontSize: 13.5, lineHeight: 1.55, mb: 0.75, color: "text.secondary" }}>
                      <Box component="span" sx={{ color: C.text, fontWeight: 500 }}>{name}</Box>{" — "}{why}
                    </Typography>
                  ))}
                </TableCell>
                <TableCell sx={{ verticalAlign: "top", py: 1.75, lineHeight: 1.65, fontSize: 14.5 }}>{c.do}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <H>Sector fields</H>
      <P>A heatmap already tells you "this industry is up on volume." These columns look for the phase before that: quiet buying that then expands.</P>
      <FieldTable rows={SECTOR_FIELDS} />

      <H>Coil fields</H>
      <P>A normal breakout screener asks: at the high, rising volume, closing strong. Those are confirmations — the move has started. Coil asks the inverse: near the high, volume drying up, range narrowing, money still coming in.</P>
      <FieldTable rows={COIL_FIELDS} />

      <H>Near misses</H>
      <P>Names that fail exactly one filter. Read them as a market diagnostic, not a shopping list.</P>
      <Mute>
        If almost everything fails on vol, the market is not offering this
        setup — volume has not dried up anywhere. If everything fails on range,
        the tape is too wild. If missing is rsi or ext, the name already ran
        or already broke.
      </Mute>

      <H>When the lists are empty</H>
      <P>
        No sectors Acting and no setups is the scan working. Markets do not
        offer this shape every day, and the base rates above were measured on
        a few hundred names over fifteen months — roughly one qualifying name
        every other session. Do not loosen filters to fill the page.
      </P>
    </>
  );
}

// ── Telegram tab ──
function TelegramTab() {
  return (
    <>
      <P>
        Everything on this website is also available through Telegram: a bot
        you can query anytime and a channel that delivers the day's key reads
        to your phone without opening the app.
      </P>

      <H>Getting started</H>
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          mb: 3,
          flexWrap: "wrap",
        }}
      >
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
            bgcolor: "rgba(142,180,196,0.08)",
            border: "1px solid rgba(142,180,196,0.2)",
            color: C.accent,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            "&:hover": { bgcolor: "rgba(142,180,196,0.15)", borderColor: C.accent },
          }}
        >
          🤖 Open bot on Telegram
        </Box>
        <Box
          component="a"
          href={TELEGRAM_CHANNEL}
          target="_blank"
          rel="noopener"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            px: 2.5,
            py: 1.25,
            borderRadius: 2,
            bgcolor: "rgba(125,186,150,0.06)",
            border: "1px solid rgba(125,186,150,0.2)",
            color: C.good,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            "&:hover": { bgcolor: "rgba(125,186,150,0.12)", borderColor: C.good },
          }}
        >
          📢 Free channel
        </Box>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <Step n="1" title="Open the bot" body="Tap the button above or search @nse_circuit_bot on Telegram. Type any stock name to get started — no sign-up needed." />
        <Step n="2" title="Link your account" body="Send /link your@email.com to the bot. Use the same email you signed up with on the website." />
        <Step n="3" title="Verify" body="Log into the website — the Pricing page shows a 6-digit code. Send /verify CODE to the bot. Done." />
      </Box>
      <Mute>
        Linking connects your Telegram to your subscription. Premium unlocks
        unlimited commands and adds you to the alerts channel automatically.
      </Mute>

      <H>Bot commands</H>
      <P>
        The bot gives you the same analysis as the website — sector scans, coil
        scores, triggers, delivery — formatted for a phone screen. Tap the
        menu button in the bot to see all commands, or type them directly.
      </P>
      <Paper variant="outlined" sx={{ overflow: "hidden", mb: 2, width: "100%", overflowX: "auto" }}>
        <Table sx={{ minWidth: 500 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 140 }}>Command</TableCell>
              <TableCell>What it does</TableCell>
              <TableCell sx={{ width: 70 }}>Access</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {BOT_COMMANDS.map(([cmd, desc, access]) => (
              <TableRow key={cmd}>
                <TableCell className="num" sx={{ fontWeight: 500, color: C.text, fontFamily: "monospace", fontSize: 13 }}>{cmd}</TableCell>
                <TableCell sx={{ color: "text.secondary", fontSize: 13.5, lineHeight: 1.55 }}>{desc}</TableCell>
                <TableCell>
                  <Chip size="small" label={access} sx={{ fontSize: 11, fontWeight: 600, bgcolor: access === "Free" ? "rgba(125,186,150,0.12)" : "rgba(142,180,196,0.12)", color: access === "Free" ? C.good : C.accent, border: "none" }} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: "rgba(142,180,196,0.06)", border: `1px solid rgba(142,180,196,0.12)`, mb: 1.5 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: C.text, mb: 0.75 }}>Free vs Premium</Typography>
        <Typography sx={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
          Free users get <b>3 market-view commands per day</b> (heatmap, flow,
          triggers, delivery, changed, sector). Stock reports with{" "}
          <code>/r</code> and the daily brief with <code>/today</code> are{" "}
          <b>always free</b> with no limit. Premium removes all limits.
        </Typography>
      </Box>

      <H>Channel alerts</H>
      <P>
        The premium channel delivers structured updates at key points of the
        trading day. Nothing is random — each message has a purpose and a time.
      </P>
      <Paper variant="outlined" sx={{ overflow: "hidden", mb: 2, width: "100%", overflowX: "auto" }}>
        <Table sx={{ minWidth: 500 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 120 }}>When</TableCell>
              <TableCell sx={{ width: 180 }}>Alert</TableCell>
              <TableCell>What you get</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {CHANNEL_ALERTS.map(([when, name, desc]) => (
              <TableRow key={name}>
                <TableCell sx={{ fontWeight: 500, color: C.text, fontSize: 13 }}>{when}</TableCell>
                <TableCell sx={{ fontWeight: 500, color: C.text, fontSize: 13.5 }}>{name}</TableCell>
                <TableCell sx={{ color: "text.secondary", fontSize: 13.5, lineHeight: 1.55 }}>{desc}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Mute>
        Alerts are event-driven, not timer-based. A circuit flash only fires
        when a new stock hits circuit — not every 30 minutes. The goal is
        signal, not noise.
      </Mute>

      <H>What's behind each view</H>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <Step n="🗺️" title="Heatmap" body="Groups all 59 sectors by their classification — Crossing, Pullback, Base, Down, Disqualified. The concise view shows sectors in uptrend; tap 'Show all' for the full map. Same data as the Sectors tab on the website." />
        <Step n="🔄" title="Flow" body="Ranks sectors by 20-day Chaikin Money Flow (CMF). Positive CMF = close near the high on volume = institutional accumulation. Negative = distribution. The split into inflows / neutral / outflows makes it scannable in seconds." />
        <Step n="🎯" title="Triggers" body="Stocks from the coil pool that are within 2% of their 20-day high. These are the names closest to a breakout. The trigger is the level, not the stock — it only confirms on a close through it on volume." />
        <Step n="📦" title="Delivery" body="Stocks where today's delivery % is ≥1.3× their own 20-day average and ≥40% absolute. Split into accumulation (price rising + high delivery = institutions buying) and distribution (price falling + high delivery = institutions exiting). This is an NSE-unique metric." />
        <Step n="📋" title="Changed" body="A diff against the previous session: which sectors upgraded or downgraded, which setups entered the list, which dropped off. Useful for spotting rotation without comparing two screenshots." />
      </Box>
    </>
  );
}

// ── Main Guide component ──
export default function Guide() {
  const [tab, setTab] = useState("methodology");

  return (
    <Box sx={{ pb: 8 }}>
      <Typography variant="h1" sx={{ fontSize: 26, mb: 1.25, letterSpacing: "-0.03em" }}>
        Guide
      </Typography>

      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center", mb: 3 }}>
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <Tooltip key={t.id} title={t.help} placement="top" arrow enterDelay={300}>
              <Chip
                label={t.label}
                onClick={() => setTab(t.id)}
                variant={on ? "filled" : "outlined"}
                sx={{
                  borderColor: on ? "transparent" : "rgba(238,234,227,0.10)",
                  bgcolor: on ? C.text : "transparent",
                  color: on ? C.bg : C.muted,
                  fontWeight: 500,
                  fontSize: 14,
                  px: 0.5,
                  "&:hover": { bgcolor: on ? "#d8d4cd" : "rgba(238,234,227,0.04)" },
                }}
              />
            </Tooltip>
          );
        })}
      </Box>

      {tab === "methodology" ? <MethodologyTab /> : <TelegramTab />}

      <Divider sx={{ my: 4, borderColor: C.line }} />
      <Mute>
        This is a screening tool, not advice. It tells you where to look and
        where to put the alert. Position size, stop, and whether the breakout
        is worth taking are yours.
      </Mute>
    </Box>
  );
}
