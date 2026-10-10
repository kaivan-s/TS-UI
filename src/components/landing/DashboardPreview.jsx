import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

const ROWS = [
  { sector: "BANKS", state: "CROSSING", names: 12, flow: "+₹847cr", color: "#8eb4c4" },
  { sector: "AUTO", state: "BREAKOUT", names: 6, flow: "+₹312cr", color: "#7dba96" },
  { sector: "CHEMICAL", state: "CROSSING", names: 8, flow: "+₹156cr", color: "#8eb4c4" },
  { sector: "PHARMA", state: "PULLBACK", names: 4, flow: "+₹94cr", color: "#c4a46a" },
  { sector: "IT", state: "CROSSING", names: 9, flow: "+₹523cr", color: "#8eb4c4" },
];

const COILS = [
  { name: "HDFCBANK", days: 14, range: "1.2%", vol: "0.6×" },
  { name: "INFY", days: 9, range: "2.1%", vol: "0.4×" },
  { name: "TITAN", days: 18, range: "0.9%", vol: "0.3×" },
];

export default function DashboardPreview() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [12, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0.5, 1]);

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, scale, opacity, transformPerspective: 1200 }}
      className="relative mx-auto max-w-4xl"
    >
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141519] shadow-2xl shadow-black/60">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#18191e] px-4 py-2.5">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#c87a7a]/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#c4a46a]/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#7dba96]/60" />
          </div>
          <div className="ml-4 flex-1 rounded-md bg-white/[0.04] px-3 py-1 text-center">
            <span className="font-mono text-[10px] text-white/30">morrowdesk.com/sectors</span>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-5">
          {/* Sector table — takes 3 cols */}
          <div className="sm:col-span-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#eeeae3]/80">Sector scans</span>
              <span className="font-mono text-[10px] text-[#8e8a83]/60">09 Oct</span>
            </div>
            <div className="overflow-hidden rounded-lg border border-white/[0.04]">
              {/* Header */}
              <div className="grid grid-cols-4 gap-2 border-b border-white/[0.04] bg-white/[0.02] px-3 py-1.5">
                {["Sector", "State", "Names", "Flow"].map((h) => (
                  <span key={h} className="text-[10px] font-medium uppercase tracking-wider text-[#8e8a83]/60">{h}</span>
                ))}
              </div>
              {/* Rows */}
              {ROWS.map((row, i) => (
                <motion.div
                  key={row.sector}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 + i * 0.1, duration: 0.3 }}
                  className="grid grid-cols-4 gap-2 border-b border-white/[0.02] px-3 py-2 transition-colors hover:bg-white/[0.02]"
                >
                  <span className="text-xs font-medium text-[#eeeae3]/80">{row.sector}</span>
                  <span className="text-[11px]" style={{ color: row.color }}>{row.state}</span>
                  <span className="font-mono text-xs text-[#eeeae3]/60">{row.names}</span>
                  <span className="font-mono text-xs text-[#7dba96]">{row.flow}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Coiled bases — takes 2 cols */}
          <div className="sm:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#eeeae3]/80">Coiled bases</span>
              <span className="rounded-full bg-[rgba(142,180,196,0.1)] px-2 py-0.5 text-[9px] text-[#8eb4c4]">Premium</span>
            </div>
            <div className="overflow-hidden rounded-lg border border-white/[0.04]">
              {COILS.map((c, i) => (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 + i * 0.15 }}
                  className="flex items-center justify-between border-b border-white/[0.02] px-3 py-2.5"
                >
                  <div>
                    <div className="text-xs font-semibold text-[#eeeae3]/80">{c.name}</div>
                    <div className="text-[10px] text-[#8e8a83]/60">{c.days}d tight · {c.range} range</div>
                  </div>
                  <div className="font-mono text-[10px] text-[#8e8a83]/50">vol {c.vol}</div>
                </motion.div>
              ))}
            </div>
            {/* Mini chart placeholder */}
            <div className="mt-3 flex h-16 items-end gap-[3px] rounded-lg border border-white/[0.04] bg-white/[0.01] p-2">
              {[40, 35, 45, 50, 42, 55, 60, 48, 65, 70, 62, 75, 80, 72, 85, 88, 82, 90, 95, 92].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 1.8 + i * 0.04, duration: 0.4, ease: "easeOut" }}
                  className="flex-1 rounded-sm bg-[#8eb4c4]/30"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -inset-20 -z-10 bg-[rgba(142,180,196,0.03)] blur-3xl rounded-full" />
    </motion.div>
  );
}
