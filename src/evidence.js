/**
 * What each list has historically been worth.
 *
 * Method (algo_audit.py, Nov 2026):
 *   - Cash bhavcopy Oct 2023 – Nov 2026; coil results span Aug 2024 – Oct 2026
 *     (200-session warmup for the 200-EMA).
 *   - Entry at the next open; excess vs that day's mean liquid stock; one
 *     signal per symbol per horizon. The headline "beat the typical stock"
 *     figure uses the same-day median, matching the earlier strips.
 *   - Cooldown of one signal per symbol per 20 sessions so a name sitting in
 *     a list for weeks is not counted every day.
 *
 * These are backtest base rates, not a live record.
 */

export const EVIDENCE_WINDOW = "Aug 2024 – Oct 2026";
export const MOVERS_WINDOW = "Mar – Sep 2026";

export const BASE_RATES = {
  setups: { n: 512, winRate: 0.61, meanExcess20: 0.0176, meanExcess40: 0.0328 },
  coils: { n: 4713, winRate: 0.56, meanExcess20: 0.0055, meanExcess40: 0.0123 },
};

/**
 * How basing episodes resolved. Re-derived from the shipped episodes.py
 * definition on the longer window; horizon is the 20-session resolution
 * window rather than a fixed forward return, so these are not comparable
 * to BASE_RATES above.
 */
export const EPISODE_RATES = {
  n: 942,
  brokeOut: 0.569,
  heldAfterBreakout: 0.45,
  brokeDown: 0.218,
  stale: 0.213,
  sessionsToBreakout: 6,
  sessionsToBreakdown: 10,
  heldOnHeavyVolume: 0.52,
  heldOnLightVolume: 0.41,
  shareOfBreakoutsHeavy: 0.36,
};

const METHOD = (n, avg20, avg40) =>
  `Backtest over ${EVIDENCE_WINDOW}: ${n.toLocaleString("en-IN")} names, ` +
  `each counted once per 20 sessions, measured against the same session's ` +
  `all-stock median. Average excess vs the mean stock: +${(avg20 * 100).toFixed(1)}% ` +
  `at 20 sessions, +${(avg40 * 100).toFixed(1)}% at 40. Has tended to play out ` +
  `over 4–8 weeks. One window, so treat it as a base rate rather than a promise.`;

export const STAT_STRIPS = {
  setups: {
    window: EVIDENCE_WINDOW,
    stats: [
      { value: "61%", label: "above the typical stock, 20 days later" },
      { value: "+1.8%", label: "avg vs the market at 20 days" },
      { value: "4–8 wks", label: "has tended to play out over" },
    ],
    tip: METHOD(512, 0.0176, 0.0328),
  },
  coils: {
    window: EVIDENCE_WINDOW,
    stats: [
      { value: "56%", label: "above the typical stock, 20 days later" },
      { value: "+0.6%", label: "avg vs the market at 20 days" },
      { value: "4–8 wks", label: "has tended to play out over" },
    ],
    tip: METHOD(4713, 0.0055, 0.0123),
  },
  episodes: {
    window: "Jun 2025 – Sep 2026",
    stats: [
      { value: "57%", label: "of bases eventually broke out" },
      { value: "45%", label: "of those held the level" },
      { value: "22%", label: "broke down instead" },
    ],
    tip:
      "1,167 basing episodes over 324 sessions, 942 of them resolved. An " +
      "episode runs from the session a base first clears all seven filters " +
      "until it breaks out, falls 7% below where it appeared, or spends 20 " +
      "sessions doing neither. Median 6 sessions to break out and 10 to " +
      "break down. Counts episodes rather than names — not comparable to the " +
      "Sector-agrees and Coils strips, which measure forward returns. A full " +
      "3-year episode replay is still pending.",
  },
  movers: {
    stats: [
      { value: "+9pp", label: "more likely to travel 3% intraday" },
      { value: "89%", label: "of sessions that held" },
      { value: "+0.0%", label: "next-day return edge" },
    ],
    tip:
      `Measured over ${MOVERS_WINDOW} on 123 scan days. The top of this ` +
      "list reached 3% above its close on the following session 9 to 11 " +
      "percentage points more often than the rest of the screen (t=13, " +
      "holding on 87–92% of sessions) — a reliable forecast of how far a " +
      "name travels. Its next-day RETURN edge measured +0.02% against the " +
      "market, p=0.73, which is indistinguishable from zero. Direction is " +
      "not forecast; distance is.",
  },
};
