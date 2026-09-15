/**
 * What every number on the Scan page means, in one place.
 *
 * Tables read `label` for the column header and `help` for the hover
 * explanation, so a term is worded identically everywhere it appears and
 * only has to be corrected once.
 */

/** Column metrics, keyed by the field name the API returns. */
export const M = {
  // --- sector panel ----------------------------------------------------
  T: {
    label: "Volume",
    help: "Today's sector turnover against its own 9-day average. 1.0 is a normal day; 1.5 means it traded 50% heavier than usual.",
  },
  T_rel: {
    label: "vs peers",
    help: "The same volume ratio, divided by the middle sector that day. This cancels out market-wide busy days, so it shows whether THIS sector woke up. 1.30 and above is the bar for a crossing.",
  },
  B: {
    label: "Breadth",
    help: "Money flowing into rising stocks versus falling ones, on a scale of −1 to +1. Above +0.15 counts as clearly green rather than a coin flip.",
  },
  deliv_quality_rel: {
    label: "Delivery",
    help: "How much stock was actually taken into demat accounts, compared with other sectors that day. Above 1.0 means real buyers; below 0.80 on a heavy day means day-trade churn.",
  },
  cmf: {
    label: "Money flow",
    help: "Chaikin Money Flow — where prices close inside their daily range, weighted by volume. Positive means closing near the highs on volume, which reads as accumulation.",
  },
  cmf_rel: {
    label: "Money flow vs peers",
    help: "Money flow minus the median sector that day. In a weak market nearly everything is negative, so this is the fairer comparison.",
  },
  rs: {
    label: "Strength",
    help: "Percentile rank of the sector's 55-day return against the whole market. 95 means it is in the strongest 5%.",
  },
  rs_chg_5: {
    label: "Strength 5d",
    help: "How that strength rank has moved over the last 5 sessions. Negative means the sector is losing ground to the rest of the market.",
  },
  n_adv: {
    label: "Advancing",
    help: "How many stocks in the sector rose today, out of how many are in it. A move carried by 2 of 30 names is not a sector move.",
  },
  top_share: {
    label: "Top name",
    help: "The largest single stock's share of the sector's turnover. Above 0.50 means one company IS the sector and the signal is about that company.",
  },
  ret: {
    label: "Day return",
    help: "Turnover-weighted return of the sector for that session.",
  },
  note: {
    label: "Why",
    help: "The specific reason behind the state on the left.",
  },

  // --- coil / stock ----------------------------------------------------
  coil: {
    label: "Tightness",
    help: "0–100 score combining quieter volume, a tighter range, better money flow, stronger delivery and a longer base. It ranks names that already passed every filter — a higher number is not a stronger buy signal.",
  },
  pos_hi: {
    label: "Near high",
    help: "Where the price sits against its 85-day (roughly 4-month) high. 100% means it is sitting right at the high.",
  },
  to_trigger: {
    label: "To breakout",
    help: "How far the price still has to rise to close above the 20-day high. That close is the event to wait for — this row is not a buy at today's price.",
  },
  trigger: {
    label: "Breakout price",
    help: "The 20-day high. A close through this level on rising volume is what completes the setup.",
  },
  rsi: {
    label: "RSI",
    help: "14-day Relative Strength Index. The coil scan wants 45–68: above 45 the trend is intact, below 68 the move has not already happened.",
  },
  vol_ratio: {
    label: "Dry-up",
    help: "Average volume over the last 5 days divided by the last 20. Under 1.0 means trading has gone quiet, which is what a base looks like before it resolves.",
  },
  range20: {
    label: "20d range",
    help: "The high-to-low spread over the last 20 sessions. The scan wants 14% or tighter — a narrowing range is the one base marker that cannot be faked by churn.",
  },
  contraction: {
    label: "Contraction",
    help: "Current 20-day range against the range 20 sessions ago. Below 1.0 means the base is still tightening.",
  },
  base_days: {
    label: "Base age",
    help: "How many of the last 60 sessions the stock spent near its high. A longer base means a more established shelf.",
  },
  adj: {
    label: "Price",
    help: "Last close, adjusted for splits and bonuses so the history lines up.",
  },
  ext_ema20: {
    label: "vs 20-EMA",
    help: "How far price has stretched from its 20-day average. The scan wants within 6% — further than that and you are chasing.",
  },
  deliv_pct: {
    label: "Delivery %",
    help: "Share of the day's volume that was actually delivered rather than squared off intraday.",
  },
  deliv_quality: {
    label: "vs own norm",
    help: "Today's delivery percentage against this stock's own 60-day average. Above 1.0 means unusually genuine buying for this name.",
  },
  turnover: {
    label: "Turnover",
    help: "Value traded that session, in ₹ lakh.",
  },
  close: {
    label: "Close",
    help: "Closing price for the session, as published in the bhavcopy.",
  },
  missing: {
    label: "Fails on",
    help: "The single filter this name did not clear. Everything else about it looks like a base.",
  },

  // --- For Tom / momentum scoring -------------------------------------
  score: {
    label: "Expected range",
    help: "0–1 energy score from volume, RSI, ATR, extension from the 20-EMA and money flow. Measured over 15 months, it forecasts how FAR a name travels intraday — the top of the list reached +3% about 9pp more often, holding on 87–92% of sessions. It does not forecast direction: its next-day return edge was +0.02% (p=0.73). Read it as expected movement, not as a better buy.",
  },
  ltp: {
    label: "Price",
    help: "Last traded price at the time of the scan.",
  },
  pchange: {
    label: "Day %",
    help: "Percentage change from the previous session's close.",
  },
  kind: {
    label: "Type",
    help: "How the name qualified: 'through' broke out, 'momentum' is a strong mover, 'setup'/'near' are coils, 'potential' is watching.",
  },

  // --- Track Record ----------------------------------------------------
  trigger_price: {
    label: "Breakout",
    help: "The 20-day high at the time of the scan — the level the price had to close through.",
  },
  price_at_scan: {
    label: "Scan price",
    help: "Closing price the day the pick was logged.",
  },
  next_high: {
    label: "Next high",
    help: "Highest price reached in the session after the scan. This is what 'Reached' measures.",
  },
  next_close: {
    label: "Next close",
    help: "Closing price in the session after the scan. Determines the raw gain/loss.",
  },
  reached: {
    label: "Reached",
    help: "How far the stock ran intraday the next session, measured from the scan price to the session high.",
  },
  close_pct: {
    label: "Close %",
    help: "Next-session close versus scan price — where the move settled by end of day.",
  },
  broke_out: {
    label: "Outcome",
    help: "Whether the stock closed through its breakout level on the following session.",
  },
  hit_rate: {
    label: "Hit rate",
    help: "Share of verified picks that actually broke out.",
  },
  avg_gain: {
    label: "Avg reached",
    help: "Average distance from scan price to next-session high, across all verified picks.",
  },
  avg_close: {
    label: "Avg close",
    help: "Average next-session close versus scan price.",
  },

  // --- Stock drawer ----------------------------------------------------
  vol_expand: {
    label: "Volume today",
    help: "Today's volume as a multiple of the 20-day average. Above 1 means heavier than usual.",
  },
  ema50: {
    label: "50 / 200 EMA",
    help: "Distance of the current price from the 50-day and 200-day exponential moving averages. The stock must be above both for the scan to call it an uptrend.",
  },
};

/** Sector states, in the order the scan ranks them. */
export const STATES = {
  CROSSING: {
    label: "Crossing",
    short: "Woke up today",
    help: "Turnover expanded out of a quiet stretch while breadth stayed green, and the move is broad — enough names advancing, no single stock carrying it. This is the sector waking up.",
  },
  PULLBACK: {
    label: "Pullback",
    short: "Resting after waking up",
    help: "A crossing fired in the last few sessions and the sector is now easing back on lighter turnover. This is the only neighbourhood the system will look for buys in.",
  },
  CROSSING_UNVERIFIED: {
    label: "Unverified",
    short: "Woke up, but unconfirmed",
    help: "The volume expansion is there, but either delivery quality was poor or the move was too narrow — too few advancing stocks, or one name dominating turnover.",
  },
  BASE: {
    label: "Base",
    short: "Quiet and accumulating",
    help: "Consistently green breadth and quiet turnover with money flowing in, but no expansion yet. Worth watching; nothing to act on.",
  },
  NEGLECT: {
    label: "Neglect",
    short: "Quiet and drifting down",
    help: "Turnover is below normal and the sector is steadily losing ground to the market. Quiet for the wrong reason.",
  },
  DISQUALIFIED: {
    label: "Disqualified",
    short: "Ruled out",
    help: "Failed a hard stop: money flowing out while peers hold up, heavy volume into falling stocks, expansion on poor delivery, decaying strength, or a markup that is already public.",
  },
  NONE: {
    label: "None",
    short: "Nothing happening",
    help: "No pattern the scan recognises — neither a quiet base nor an expansion.",
  },
};

/**
 * Three user-facing states over the seven the scan computes.
 *
 * The full set is machinery. A reader only needs to know whether a sector is
 * feeding the shortlist, worth following, or out — so the chip shows the
 * group and the tooltip carries the specific state behind it.
 *
 * "Acting" is exactly the set a coiled stock's sector must be in to reach
 * Setups, which is what makes the grouping explain the app rather than just
 * shorten it.
 */
export const STATE_GROUP = {
  CROSSING: "acting",
  PULLBACK: "acting",
  CROSSING_UNVERIFIED: "watching",
  BASE: "watching",
  NEGLECT: "out",
  DISQUALIFIED: "out",
  NONE: "out",
};

export const STATE_GROUPS = {
  acting: {
    label: "Acting",
    help: "Turnover expanded out of quiet with breadth holding, or the sector is resting after that expansion. A coiled stock only reaches Setups if its sector is here.",
  },
  watching: {
    label: "Watching",
    help: "Something is building — quiet accumulation, or an expansion whose width and delivery did not confirm. Worth following; nothing to act on.",
  },
  out: {
    label: "Ruled out",
    help: "Either nothing the scan recognises, quiet while losing ground, or a hard stop: money leaving, heavy volume into falling stocks, or a markup already public.",
  },
};

export const BUY_READY_HELP =
  "The sector is in a pullback AND every shape check passed: the expansion came out of genuine quiet, and every red day since has traded lighter than the crossing day. Sellers have not taken over.";

/** Short reason text for the one coil filter a near-miss failed. */
export const MISSING_REASON = {
  price: "Price under ₹20",
  trend: "Not in an uptrend",
  pos: "Not near its 4-month high",
  rsi: "RSI outside 45–68",
  ext: "Stretched from the 20-EMA",
  vol: "Volume has not dried up",
  range: "20-day range too wide",
};

/** Filter chips on the Sectors tab. */
export const FILTER_HELP = {
  acting: STATE_GROUPS.acting.help,
  watching: STATE_GROUPS.watching.help,
  out: STATE_GROUPS.out.help,
  all: "Every sector in the universe, in whatever state.",
};

/** Expected Movers filters */
export const TOM_FILTER_HELP = {
  all: "Every name that cleared the gates, whether or not it has broken out yet.",
  through: "Stocks whose live price is already above the 20-day high. A factual state, not a ranking — the break has happened and the follow-through has not been measured.",
};

/** Track Record kind categories */
export const KIND_HELP = {
  through: "Broke out: the stock closed above its 20-day high at the time of the scan.",
  momentum: "Strong mover that day — high volume and range expansion even if not yet at the breakout price.",
  setup: "Classic coil setup inside an accumulating sector.",
  near: "Very close to the breakout level but not quite through.",
  potential: "In an uptrend and coiling, but sector not yet confirmed.",
  early: "The sector surged today (CROSSING) so the setup is early — no pullback yet to buy into.",
};

/** Track Record stat card definitions */
export const STAT_HELP = {
  picks: "Number of names logged on this scan date.",
  verified: "Picks whose next-session data is now available so we can measure the outcome.",
  avg_reached: "Average distance from scan price to next-session high. Shows how far the move ran intraday.",
  avg_close: "Average next-session close versus scan price. Shows where the move settled.",
  broke_out: "Number of picks that actually closed through their breakout level the next session.",
};

/**
 * Base episode states. The label is what the reader sees; the help explains
 * what the app observed, never what to do about it — these are descriptions
 * of price and filter events, not recommendations.
 */
export const EPISODE_STATE = {
  basing: {
    label: "Basing",
    help: "Still clearing all seven coil filters. Nothing has happened yet.",
  },
  triggered: {
    label: "Broke out",
    help: "Closed above the level the base was measured at. Heavy volume means the day's turnover ran at least 1.5x its recent average.",
  },
  failed: {
    label: "Broke out, then failed",
    help: "Closed back inside the base for two straight sessions after breaking out. One dip does not count — breakouts retest the level routinely.",
  },
  broke_down: {
    label: "Broke down",
    help: "Closed 7% or more below where it was when it first appeared, without ever breaking out.",
  },
  dropped: {
    label: "Left the list",
    help: "Stopped clearing the filters for more than three sessions. Not a loss — usually volume returned or it drifted from its highs. Still watched for a late breakout.",
  },
  stale: {
    label: "Never resolved",
    help: "Twenty sessions passed with no breakout and no breakdown. The base went nowhere.",
  },
};

/** Ordering for the state filter chips: live first, then outcomes. */
export const EPISODE_ORDER = [
  "basing", "triggered", "failed", "broke_down", "dropped", "stale",
];
