export function num(v, d = 2) {
  if (v == null || Number.isNaN(Number(v))) return "—";
  return Number(v).toFixed(d);
}

export function pct(v, d = 1) {
  if (v == null || Number.isNaN(Number(v))) return "—";
  return `${(Number(v) * 100).toFixed(d)}%`;
}

export function signed(v, d = 2) {
  if (v == null || Number.isNaN(Number(v))) return "—";
  const n = Number(v);
  const s = n > 0 ? "+" : "";
  return s + n.toFixed(d);
}

/** Momentum score from the saved field, or from "Momentum score 0.95:" in why. */
export function predScore(row) {
  if (row?.score != null && row.score !== "") {
    const n = Number(row.score);
    if (!Number.isNaN(n)) return n;
  }
  const m = String(row?.why || "").match(/(?:momentum\s+)?score\s+(\d+(?:\.\d+)?)/i);
  return m ? Number(m[1]) : null;
}

export function byScoreDesc(a, b) {
  return (predScore(b) ?? -1) - (predScore(a) ?? -1);
}

/** Day-high vs scan price. Prefer this over LTP gain for "how far it ran". */
export function reachedGain(row) {
  if (row?.gain_from_high != null && !Number.isNaN(Number(row.gain_from_high))) {
    return Number(row.gain_from_high);
  }
  const high = row?.day_high ?? row?.next_high ?? row?.tom_outcomes?.[0]?.next_high;
  const scan = row?.price_at_scan;
  if (high != null && scan && Number(scan) > 0) {
    return Number(high) / Number(scan) - 1;
  }
  return null;
}

/** Next-session close vs scan price — where the move settled. */
export function closeGain(row) {
  const close = row?.next_close ?? row?.tom_outcomes?.[0]?.next_close;
  const scan = row?.price_at_scan;
  if (close != null && scan && Number(scan) > 0) {
    return Number(close) / Number(scan) - 1;
  }
  return null;
}

export function reachedLabel(row) {
  const g = reachedGain(row);
  if (g == null) return null;
  const n = (g * 100).toFixed(1);
  return `Reached ${g >= 0 ? "+" : ""}${n}%`;
}

export function fmtDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!d) return iso;
  return `${d}-${m}-${y}`;
}
