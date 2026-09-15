/**
 * What each list has historically been worth.
 *
 * These exist so the tables can state a measured number instead of hedging
 * about what they are not. Method, so the numbers can be defended:
 *
 *   - Every scan date from 18 Jun 2025 to 11 Sep 2026 (324 cached sessions,
 *     114 of them usable once the 200-day indicators have warmed up).
 *   - De-duplicated to each name's FIRST qualifying session. Pooling every
 *     flag-day counts a name once per session it stays qualified, which
 *     inflates the sample roughly tenfold and skews it toward names that
 *     never resolved.
 *   - Excess return is measured against the same session's all-stock MEDIAN,
 *     and reported as a median. Means are useless here: the mean of a
 *     right-skewed return distribution sits about +1.4% above its median at
 *     20 sessions for any list at all, flat across every turnover decile, so
 *     a mean-based number makes a worthless screen look good.
 *
 * Caveats worth keeping in mind before quoting these anywhere harder: it is
 * one 15-month window, and forward windows on nearby dates overlap, so these
 * are backtest figures rather than a live record.
 */

export const EVIDENCE_WINDOW = "Jun 2025 – Sep 2026";

export const BASE_RATES = {
  setups: { n: 151, winRate: 0.662, medianExcess: 0.0367 },
  coils: { n: 377, winRate: 0.592, medianExcess: 0.017 },
};

const METHOD = (n) =>
  `Backtest over ${EVIDENCE_WINDOW}: ${n} names, each counted once on the day it first qualified, measured against the same session's all-stock median. One window, so treat it as a base rate rather than a promise.`;

/**
 * Stat strips, keyed by the list they describe.
 *
 * `movers` is shaped differently on purpose. The momentum score was measured
 * three ways at three horizons and has no return edge — ranking by it made
 * the list measurably worse than taking every qualifying name. What it does
 * predict, very reliably, is how far a name travels intraday. So the strip
 * states the thing that held up and the thing that did not, rather than
 * quietly dropping the second.
 */
export const STAT_STRIPS = {
  setups: {
    stats: [
      { value: "66%", label: "beat the market over 20 days" },
      { value: "+3.7%", label: "median excess return" },
      { value: 151, label: "names measured" },
    ],
    tip: METHOD(151),
  },
  coils: {
    stats: [
      { value: "59%", label: "beat the market over 20 days" },
      { value: "+1.7%", label: "median excess return" },
      { value: 377, label: "names measured" },
    ],
    tip: METHOD(377),
  },
  movers: {
    stats: [
      { value: "+9pp", label: "more likely to travel 3% intraday" },
      { value: "89%", label: "of sessions that held" },
      { value: "+0.0%", label: "next-day return edge" },
    ],
    tip:
      `Measured over ${EVIDENCE_WINDOW} on 114 scan days. The top of this ` +
      "list reached 3% above its close on the following session 9 to 11 " +
      "percentage points more often than the rest of the screen (t=13, " +
      "holding on 87–92% of sessions) — a reliable forecast of how far a " +
      "name travels. Its next-day RETURN edge measured +0.02% against the " +
      "market, p=0.73, which is indistinguishable from zero. Direction is " +
      "not forecast; distance is.",
  },
};
