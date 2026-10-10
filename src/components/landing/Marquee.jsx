import { cn } from "../../lib/utils.js";

const ITEMS = [
  { name: "HDFCBANK", change: "+2.1%", up: true },
  { name: "RELIANCE", change: "+1.4%", up: true },
  { name: "INFY", change: "+3.2%", up: true },
  { name: "TITAN", change: "-0.8%", up: false },
  { name: "TCS", change: "+1.7%", up: true },
  { name: "ICICIBANK", change: "+2.5%", up: true },
  { name: "BAJFINANCE", change: "-1.2%", up: false },
  { name: "SBIN", change: "+1.9%", up: true },
  { name: "BHARTIARTL", change: "+0.6%", up: true },
  { name: "LT", change: "+2.8%", up: true },
  { name: "ITC", change: "+1.1%", up: true },
  { name: "KOTAKBANK", change: "-0.3%", up: false },
  { name: "AXISBANK", change: "+2.4%", up: true },
  { name: "MARUTI", change: "+1.6%", up: true },
  { name: "SUNPHARMA", change: "+3.5%", up: true },
];

function TickerRow({ reverse = false }) {
  const items = reverse ? [...ITEMS].reverse() : ITEMS;
  return (
    <div className={cn("flex gap-4", reverse ? "animate-marquee-reverse" : "animate-marquee")}>
      {[...items, ...items].map((item, i) => (
        <div
          key={i}
          className="flex shrink-0 items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-1.5"
        >
          <span className="font-mono text-xs font-medium text-[#eeeae3]/70">{item.name}</span>
          <span className={cn("font-mono text-[11px] font-medium", item.up ? "text-[#7dba96]" : "text-[#c87a7a]")}>
            {item.change}
          </span>
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
