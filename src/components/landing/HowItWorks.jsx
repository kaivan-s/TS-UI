import { useRef } from "react";
import { motion, useInView } from "motion/react";

const STEPS = [
  {
    num: "01",
    title: "We scan 2,000+ stocks",
    desc: "Every evening after market close, our engine runs volume, delivery, money flow, and breadth analysis across the full NSE universe.",
    icon: "🔍",
  },
  {
    num: "02",
    title: "Sectors get ranked",
    desc: "Stocks are grouped by sector. We identify which sectors have real institutional flow — not just price moves, but money commitment.",
    icon: "📊",
  },
  {
    num: "03",
    title: "Setups surface",
    desc: "Stocks coiling near highs with drying volume get flagged. When sector + base + flow align, it becomes a setup.",
    icon: "🎯",
  },
  {
    num: "04",
    title: "You check tomorrow's plan",
    desc: "Open the app or Telegram before market hours. See exactly which setups passed the filter — and what to watch.",
    icon: "✅",
  },
];

function StepCard({ step, index }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex gap-5"
    >
      {/* Connector line */}
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: index * 0.15 + 0.2 }}
          className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-lg transition-colors group-hover:border-[rgba(142,180,196,0.3)] group-hover:bg-[rgba(142,180,196,0.06)]"
        >
          {step.icon}
        </motion.div>
        {index < STEPS.length - 1 && (
          <motion.div
            initial={{ scaleY: 0 }}
            animate={isInView ? { scaleY: 1 } : {}}
            transition={{ duration: 0.5, delay: index * 0.15 + 0.4 }}
            className="mt-1 h-full w-px origin-top bg-gradient-to-b from-white/10 to-transparent"
          />
        )}
      </div>
      {/* Content */}
      <div className="pb-10">
        <span className="mb-1 block font-mono text-[10px] font-medium uppercase tracking-widest text-[#8eb4c4]/60">
          Step {step.num}
        </span>
        <h3 className="mb-2 text-lg font-semibold text-[#eeeae3]">{step.title}</h3>
        <p className="max-w-sm text-sm leading-relaxed text-[#8e8a83]">{step.desc}</p>
      </div>
    </motion.div>
  );
}

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-lg">
      {STEPS.map((step, i) => (
        <StepCard key={step.num} step={step} index={i} />
      ))}
    </div>
  );
}
