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
  Typography,
} from "@mui/material";
import { C, KLASS_GROUP } from "../theme.js";
import { BASE_RATES, EVIDENCE_WINDOW } from "../evidence.js";

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
    <Paper variant="outlined" sx={{ overflow: "hidden", mb: 1, width: "100%" }}>
      <Table>
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
  {
    field: "T",
    what: "Sector turnover vs its own last 9 days.",
    read: ">1 is busier than usual. On a market-wide heavy day every sector rises together, so this alone means nothing.",
  },
  {
    field: "T rel",
    what: "T divided by the median sector that day.",
    read: "The one that matters. 1.30 means 30% more expansion than a typical sector today. This is the crossing trigger.",
  },
  {
    field: "B",
    what: "Breadth: advancing minus declining turnover.",
    read: "+0.15 or better = buying is spread. Negative on high T is dumping, not accumulation.",
  },
  {
    field: "Deliv",
    what: "Delivery quality vs each stock’s own norm, then vs other sectors.",
    read: "≥1.00 confirms real buying. A huge volume day at 0.25 is HFT churn. Below 0.80 on a spike is a hard stop.",
  },
  {
    field: "CMF",
    what: "20-day Chaikin money flow (close location × volume).",
    read: "Positive and rising vs peers = accumulation. Negative and falling = distribution. The gates use the peer-relative version.",
  },
  {
    field: "RS / RS 5d",
    what: "55-day return rank (0–100), and the 5-day change.",
    read: "Rising RS = the sector is starting to lead. RS 5d below −3 is decaying — already too late or dying.",
  },
  {
    field: "Adv",
    what: "Names up today / names in the sector.",
    read: "Need at least 3 advancing. 1/8 is one stock wearing a sector’s clothes.",
  },
  {
    field: "Top",
    what: "Largest name’s share of sector turnover.",
    read: "Under 0.50 is a real sector. Over 0.50 is one name. Do not treat that as a sector move.",
  },
  {
    field: "Note",
    what: "Why this class fired.",
    read: "Read this first on Disqualified rows. It is often more useful than the greens.",
  },
];

const COIL_FIELDS = [
  {
    field: "Coil",
    what: "0–100 rank among names that already passed the hard filters.",
    read: "Higher = tighter, quieter, more accumulated. 80 is not a buy. It only sorts the watchlist.",
  },
  {
    field: "Pos high",
    what: "Close vs the 85-day high.",
    read: "92–98% is coiled under the high. 85% is still far. Sitting at 99% can be a flat base — that is allowed.",
  },
  {
    field: "To trigger",
    what: "Percent to the 20-day high (the breakout line).",
    read: "2–4% means a breakout is close. Large means it is still basing. Put the alert here, not at the close.",
  },
  {
    field: "RSI",
    what: "14-day Wilder RSI on the split-adjusted series.",
    read: "45–68 is the window. Below 45 the trend is damaged. Above 68 the move already happened.",
  },
  {
    field: "Vol 5/20",
    what: "5-day volume vs 20-day volume.",
    read: "0.5–0.8 is a real dry-up. 0.99 is barely quiet. Rising volume here is the wrong phase — that is the breakout, not the coil.",
  },
  {
    field: "Range 20",
    what: "20-day high/low spread.",
    read: "6–10% is tight. Near 14% is the filter ceiling, not a tight base.",
  },
  {
    field: "CMF",
    what: "20-day Chaikin money flow on the stock.",
    read: "Clearly positive = quiet buying. Near 0 or negative is not accumulation, even if the range is tight.",
  },
  {
    field: "Deliv",
    what: "Delivery quality vs the median stock that day.",
    read: ">1 is better than the tape. <1 on a quiet day is just the market, not buying.",
  },
  {
    field: "Base d",
    what: "How many of the last 60 days it sat above 90% of the high.",
    read: "35–55 = it has been sitting here. Low teens = it only just arrived.",
  },
];

// The Sectors table shows three groups; these are the seven states behind
// them, which is what the chip tooltips name.
const CLASSES = [
  {
    group: "acting",
    do: "The only group that feeds Setups. Do not chase the expansion day itself — find the coiled names in the sector and set an alert at each trigger.",
    states: [
      ["Crossing", "Turnover expanded out of quiet with breadth green and the move broad. Something is starting."],
      ["Pullback", "The intended entry shape: a crossing already fired and today cooled on lighter volume. The rest after the first push."],
    ],
  },
  {
    group: "watching",
    do: "Nothing to buy today. Recheck tomorrow — these are the sectors most likely to become Acting next.",
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

export default function Guide() {
  return (
    <Box sx={{ pb: 8 }}>
      <Typography variant="h1" sx={{ fontSize: 26, mb: 1.25, letterSpacing: "-0.03em" }}>
        How to read this
      </Typography>
      <Mute>
        Sectors show where money is moving. Coiled Bases shows which names are
        tight. Setups are the overlap, and the overlap is where the edge is:
        over {EVIDENCE_WINDOW}, {Math.round(BASE_RATES.setups.winRate * 100)}%
        of setups beat the market over the following 20 days against{" "}
        {Math.round(BASE_RATES.coils.winRate * 100)}% for coils alone. Neither
        is a market order — the breakout is the close through the trigger on
        volume. Type a symbol in the header to run the same gates on any name.
      </Mute>

      <H>The daily sequence</H>
      <Step
        n="1"
        title="Setups — the shortlist"
        body="This is the landing screen and most days it is the only one you need. It lists coiled names whose sector is also Acting, grouped by sector because names in one sector resolve together. Empty is normal: most sessions produce no setups."
      />
      <Step
        n="2"
        title="Check the sector behind it"
        body="Open Sectors and click the sector a setup came from. The panel shows whether turnover expanded out of genuine quiet while breadth stayed green, and whether every red day since traded lighter than the crossing. Crossing days are marked green, lighter reds blue, and a red day that traded more than the crossing is marked Heavy red — sellers won, so it is not a pullback. Setups whose sector passed all three checks carry a Shape confirmed mark."
      />
      <Step
        n="3"
        title="Do not buy the coil"
        body="A setup is not a market order. Write down trigger (the 20-day high) and to_trigger, and put an alert there. Act only on a close through it on heavy volume."
      />
      <Step
        n="4"
        title="Widen only if you want more names"
        body="Coiled Bases is every stock that cleared all seven coil filters with no sector requirement. It is a bigger list with a thinner edge, so treat it as a study list rather than a shortlist. Its sort order carries no information — coil score showed no relationship with forward returns."
      />
      <Step
        n="5"
        title="Verify with Track Record"
        body="Use Verify on Track Record to score yesterday's list against today's high (Reached vs scan) and close (Close %). A name that never ran was never a trade."
      />
      <Step
        n="6"
        title="Look up any name"
        body="The header field runs the same coil filters, sector shape, and setup checks on a symbol you type. Put your entry in the drawer to get a mechanical plan: wait / buy / add / hold / sell, plus a stop under the 20-day base (or 1.5 ATR) and a 2R target. Those prices are risk math from this structure, not a measured edge. Click a symbol in Coiled Bases or Setups for the same drawer."
      />
      <Step
        n="7"
        title="Position Trades — a different clock entirely"
        body="The other tabs look for a base about to resolve over the next few days. This one ignores quietness and buys strength instead: the top decile of twelve-month performers that are still above their 50-day average, held seven to ten sessions. Momentum is measured over the year ending one month ago, because the most recent month tends to give back. Two things make it unlike the rest of the app — sort order is meaningful here (stronger twelve-month momentum measured better than weaker, right down the ranking), and no base rate is printed, because twelve-month momentum needs 250 sessions of warmup and our history leaves too few independent periods to honestly quote a win rate. It rests on the published record instead, where the effect has held across decades and dozens of markets."
      />

      <H>What each state means — and what to do</H>
      <P>
        The Sectors table labels every sector Acting, Watching, or Ruled out.
        The scan works with seven finer states underneath, which is what you
        see when you hover a chip.
      </P>
      <Paper variant="outlined" sx={{ overflow: "hidden", width: "100%" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 130 }}>Shown as</TableCell>
              <TableCell sx={{ width: 320 }}>States behind it</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {CLASSES.map((c) => (
              <TableRow key={c.group}>
                <TableCell sx={{ verticalAlign: "top", py: 1.75 }}>
                  <Chip
                    size="small"
                    label={KLASS_GROUP[c.group].label}
                    sx={{
                      bgcolor: KLASS_GROUP[c.group].bg,
                      color: KLASS_GROUP[c.group].fg,
                      border: "none",
                      fontWeight: 500,
                    }}
                  />
                </TableCell>
                <TableCell sx={{ verticalAlign: "top", py: 1.75 }}>
                  {c.states.map(([name, why]) => (
                    <Typography
                      key={name}
                      sx={{ fontSize: 13.5, lineHeight: 1.55, mb: 0.75, color: "text.secondary" }}
                    >
                      <Box component="span" sx={{ color: C.text, fontWeight: 500 }}>
                        {name}
                      </Box>
                      {" — "}
                      {why}
                    </Typography>
                  ))}
                </TableCell>
                <TableCell sx={{ verticalAlign: "top", py: 1.75, lineHeight: 1.65, fontSize: 14.5 }}>
                  {c.do}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <H>Sector fields</H>
      <P>
        A heatmap already tells you “this industry is up on volume.” These
        columns look for the phase before that: quiet buying that then expands.
      </P>
      <FieldTable rows={SECTOR_FIELDS} />

      <H>Coil fields</H>
      <P>
        A normal breakout screener asks: at the high, rising volume, closing
        strong. Those are confirmations — the move has started. Coil asks the
        inverse: near the high, volume drying up, range narrowing, money still
        coming in.
      </P>
      <FieldTable rows={COIL_FIELDS} />

      <H>Near misses</H>
      <P>
        Names that fail exactly one filter. Read them as a market diagnostic,
        not a shopping list.
      </P>
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

      <Divider sx={{ my: 4, borderColor: C.line }} />
      <Mute>
        This is a screening tool, not advice. It tells you where to look and
        where to put the alert. Position size, stop, and whether the breakout
        is worth taking are yours.
      </Mute>
    </Box>
  );
}
