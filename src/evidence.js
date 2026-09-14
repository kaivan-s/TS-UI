/**
 * What each list has historically been worth.
 *
 * These exist so the tables can state a measured base rate instead of
 * hedging about what they are not. Method, so the numbers can be defended:
 *
 *   - Every scan date from 18 Jun 2025 to 11 Sep 2026 (320 sessions).
 *   - De-duplicated to each name's FIRST qualifying session. Pooling every
 *     flag-day counts a name once per session it stays qualified, which
 *     inflates the sample roughly tenfold and skews it toward names that
 *     never resolved.
 *   - 20-day forward return measured in excess of the same session's
 *     all-stock median, so market drift is not counted as edge.
 *
 * Caveats worth keeping in mind before quoting these anywhere harder:
 * it is one 15-month window, and forward windows on nearby dates overlap,
 * so these are backtest figures rather than a live track record.
 */

export const EVIDENCE_WINDOW = "Jun 2025 – Sep 2026";

export const BASE_RATES = {
  setups: { n: 151, winRate: 0.662, medianExcess: 0.0367 },
  coils: { n: 377, winRate: 0.592, medianExcess: 0.017 },
};

/** "66% beat the market over the next 20 days, median +3.7%" */
export function baseRateText(key) {
  const r = BASE_RATES[key];
  if (!r) return "";
  return (
    `${Math.round(r.winRate * 100)}% of these beat the market over the ` +
    `next 20 days, median +${(r.medianExcess * 100).toFixed(1)}%`
  );
}

/** "measured on 151 names, Jun 2025 – Sep 2026" */
export function baseRateSource(key) {
  const r = BASE_RATES[key];
  if (!r) return "";
  return `Backtest over ${EVIDENCE_WINDOW}: ${r.n} names, each counted once on the day it first qualified, measured against the same session's all-stock median. One window, so treat it as a base rate rather than a promise.`;
}
