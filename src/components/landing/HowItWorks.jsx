import { useRef } from "react";
import { motion, useInView } from "motion/react";

const STAGES = [
  {
    num: "01",
    meta: "20:30 IST · EOD INGEST",
    count: "2,200+",
    unit: "NSE equities",
    title: "Raw market ingest",
    desc: "After market close, we pull OHLCV, delivery volume, turnover, and quarterly filings across the full NSE universe.",
    spec: ["Bhavcopy + delivery %", " Corporate filings & earnings"],
    bar: "100%",
  },
  {
    num: "02",
    meta: "STAGE 2 · ROTATION",
    count: "40+",
    unit: "Sectors scored",
    title: "Sector flow ranking",
    desc: "Names are grouped by industry to measure breadth and turnover — marking sectors as crossing, breaking out, or pulling back.",
    spec: ["Breadth & money flow", "Leaders vs laggards"],
    bar: "58%",
  },
  {
    num: "03",
    meta: "STAGE 3 · COMPRESSION",
    count: "~45",
    unit: "Tight bases",
    title: "Coiled base & quality filter",
    desc: "Within sectors that are moving, we screen for tight price contraction near highs, dried-up volume, and the published numbers.",
    spec: ["Range & volume dry-up", "PE, growth & promoter check"],
    bar: "24%",
  },
  {
    num: "04",
    meta: "08:30 IST · YOUR DESK",
    count: "8–15",
    unit: "Names that passed",
    title: "On the desk before the bell",
    desc: "Review charts, fundamentals, and upcoming earnings dates in one place. Bookmark a shortlist. The log keeps every name, whether it triggered or not.",
    spec: ["Charts + Watchlist sync", "Persistent outcome log"],
    bar: "9%",
    highlight: true,
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className="mx-auto max-w-6xl">
      {/* Top funnel bar */}
      <div className="mb-6 hidden items-center justify-between rounded-xl border border-white/[0.06] bg-[#141519] px-5 py-3 md:flex">
        <div className="flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7dba96]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#8e8a83]">
            Nightly reduction pipeline
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-[#8e8a83]">
          <span className="text-[#eeeae3]">2,200+</span>
          <span className="text-white/20">→</span>
          <span className="text-[#eeeae3]">40+ sectors</span>
          <span className="text-white/20">→</span>
          <span className="text-[#eeeae3]">~45 bases</span>
          <span className="text-white/20">→</span>
          <span className="rounded bg-[rgba(142,180,196,0.12)] px-2 py-0.5 text-[#8eb4c4]">
            8–15 that passed
          </span>
        </div>
      </div>

      {/* 4-column pipeline grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {STAGES.map((s, i) => (
          <motion.div
            key={s.num}
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-colors ${
              s.highlight
                ? "border-[#8eb4c4]/30 bg-[#161920]"
                : "border-white/[0.07] bg-[#16171c]/90 hover:border-white/[0.14]"
            }`}
          >
            <div>
              {/* Step header */}
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.16em] text-[#8e8a83]/70">
                  {s.meta}
                </span>
                <span className="font-mono text-xs text-[#8eb4c4]">{s.num}</span>
              </div>

              {/* Funnel metric readout */}
              <div className="mb-4 rounded-xl border border-white/[0.05] bg-[#121317] p-3">
                <div className="flex items-baseline justify-between">
                  <span
                    className="font-mono text-2xl font-semibold tracking-tight"
                    style={{ color: s.highlight ? "#8eb4c4" : "#eeeae3" }}
                  >
                    {s.count}
                  </span>
                  <span className="font-mono text-[10px] text-[#8e8a83]/70">{s.unit}</span>
                </div>
                {/* Funnel narrowing bar */}
                <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={isInView ? { width: s.bar } : {}}
                    transition={{ duration: 0.7, delay: 0.25 + i * 0.12, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{
                      background: s.highlight ? "#8eb4c4" : "rgba(238,234,227,0.35)",
                    }}
                  />
                </div>
              </div>

              {/* Title + description */}
              <h3
                className="text-base font-semibold text-[#eeeae3]"
                style={{ letterSpacing: "-0.015em" }}
              >
                {s.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#8e8a83]">{s.desc}</p>
            </div>

            {/* Bottom spec lines */}
            <div className="mt-5 space-y-1.5 border-t border-white/[0.05] pt-3">
              {s.spec.map((line) => (
                <div
                  key={line}
                  className="flex items-center gap-2 font-mono text-[10.5px] text-[#8e8a83]/80"
                >
                  <span className="h-1 w-1 rounded-full bg-[#8eb4c4]/60" />
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
