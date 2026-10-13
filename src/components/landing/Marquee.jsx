import { cn } from "../../lib/utils.js";

const ITEMS = [
  "HDFCBANK", "RELIANCE", "INFY", "TITAN", "TCS", "ICICIBANK",
  "BAJFINANCE", "SBIN", "BHARTIARTL", "LT", "ITC", "KOTAKBANK",
  "AXISBANK", "MARUTI", "SUNPHARMA",
];

function TickerRow({ reverse = false }) {
  const items = reverse ? [...ITEMS].reverse() : ITEMS;
  return (
    <div className={cn("flex gap-4", reverse ? "animate-marquee-reverse" : "animate-marquee")}>
      {[...items, ...items].map((name, i) => (
        <div
          key={i}
          className="flex shrink-0 items-center rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-1.5"
        >
          <span className="font-mono text-xs font-medium text-[#eeeae3]/70">{name}</span>
        </div>
      ))}
    </div>
  );
}

export default function Marquee() {
  return (
    <div className="relative w-full overflow-hidden py-6">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-[#111215] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-[#111215] to-transparent" />
      <div className="flex flex-col gap-3">
        <TickerRow />
        <TickerRow reverse />
      </div>
    </div>
  );
}
