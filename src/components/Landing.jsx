import { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useInView } from "motion/react";
import { TELEGRAM_BOT } from "../config.js";
import { capture } from "../posthog.js";
import logoIcon from "../Images/favicon.svg";

import SpotlightCard from "./landing/SpotlightCard.jsx";
import Marquee from "./landing/Marquee.jsx";
import GlowButton from "./landing/GlowButton.jsx";
import HowItWorks from "./landing/HowItWorks.jsx";
import DashboardPreview from "./landing/DashboardPreview.jsx";

/* ───── scroll-animated section wrapper ───── */
function ScrollReveal({ children, className, delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ───── section divider with gradient ───── */
function Divider() {
  return (
    <div className="mx-auto my-4 h-px w-full max-w-xs bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
  );
}

/* ───── miniature UI visuals for the bento grid ───── */
function MiniCandles() {
  const candles = [
    { o: 28, c: 38, h: 42, l: 24, v: 30, up: true },
    { o: 38, c: 34, h: 41, l: 31, v: 22, up: false },
    { o: 34, c: 44, h: 48, l: 32, v: 38, up: true },
    { o: 44, c: 42, h: 46, l: 39, v: 18, up: false },
    { o: 42, c: 45, h: 48, l: 40, v: 16, up: true },
    { o: 45, c: 44, h: 47, l: 42, v: 14, up: false },
    { o: 44, c: 46, h: 48, l: 43, v: 12, up: true },
    { o: 46, c: 45, h: 48, l: 44, v: 11, up: false },
    { o: 45, c: 62, h: 66, l: 44, v: 78, up: true },
    { o: 62, c: 74, h: 78, l: 60, v: 64, up: true },
    { o: 74, c: 71, h: 76, l: 68, v: 28, up: false },
    { o: 71, c: 84, h: 88, l: 70, v: 58, up: true },
  ];
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#141519] p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-medium text-[#eeeae3]">DIXON</span>
          <span className="font-mono text-[11px] text-[#8e8a83]">1Y</span>
        </div>
        <div className="flex gap-1 font-mono text-[10px]">
          {["6M", "1Y", "2Y", "5Y"].map((p, i) => (
            <span
              key={p}
              className={`rounded px-1.5 py-0.5 ${
                i === 1 ? "bg-white/[0.08] text-[#eeeae3]" : "text-[#8e8a83]/50"
              }`}
            >
              {p}
            </span>
          ))}
        </div>
      </div>
      {/* Candles */}
      <div className="relative flex h-24 items-end gap-1.5 border-b border-white/[0.04] pb-2">
        {candles.map((c, i) => {
          const top = 100 - Math.max(c.o, c.c);
          const body = Math.max(Math.abs(c.c - c.o), 3);
          const wickTop = 100 - c.h;
          const wickH = c.h - c.l;
          const col = c.up ? "#7dba96" : "rgba(238,234,227,0.28)";
          return (
            <div key={i} className="relative flex-1 h-full">
              <div
                className="absolute left-1/2 w-px -translate-x-1/2"
                style={{ top: `${wickTop}%`, height: `${wickH}%`, background: col, opacity: 0.6 }}
              />
              <motion.div
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.03, duration: 0.35 }}
                className="absolute inset-x-0.5 rounded-[1px]"
                style={{ top: `${top}%`, height: `${body}%`, background: col, transformOrigin: "bottom" }}
              />
            </div>
          );
        })}
      </div>
      {/* Volume */}
      <div className="mt-1.5 flex h-6 items-end gap-1.5">
        {candles.map((c, i) => (
          <div
            key={i}
            className="flex-1 rounded-[1px]"
            style={{
              height: `${c.v}%`,
              background: c.up ? "rgba(125,186,150,0.35)" : "rgba(238,234,227,0.12)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function MiniFundamentals() {
  const stats = [
    { k: "Mkt Cap", v: "₹84.2K Cr" },
    { k: "P/E (TTM)", v: "24.6x", good: true },
    { k: "Promoter", v: "68.4%" },
    { k: "OPM", v: "21.8%" },
    { k: "Rev YoY", v: "+26.4%", good: true },
    { k: "PAT YoY", v: "+38.1%", good: true },
  ];
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#141519] p-3.5">
      <div className="mb-2.5 flex items-center justify-between border-b border-white/[0.05] pb-2">
        <span className="font-mono text-[11px] text-[#8e8a83]">POLYCab · Cables</span>
        <span className="rounded bg-[rgba(125,186,150,0.12)] px-1.5 py-0.5 font-mono text-[10px] text-[#7dba96]">
          ↑↑ Accelerating
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.k} className="rounded-lg border border-white/[0.04] bg-white/[0.015] px-2.5 py-1.5">
            <div className="text-[9px] uppercase tracking-wider text-[#8e8a83]/60">{s.k}</div>
            <div
              className="mt-0.5 font-mono text-xs font-medium"
              style={{ color: s.good ? "#7dba96" : "#eeeae3" }}
            >
              {s.v}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniWatchlist() {
  const items = [
    { sym: "TRENT", meta: "14d tight · 1.4% range" },
    { sym: "HAL", meta: "Aerospace · near the high" },
    { sym: "PERSISTENT", meta: "9d tight · 0.5× vol" },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#141519]">
      {items.map((it, i) => (
        <div
          key={it.sym}
          className={`flex items-center justify-between px-3.5 py-2.5 ${
            i < items.length - 1 ? "border-b border-white/[0.04]" : ""
          }`}
        >
          <div className="flex items-center gap-2.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#8eb4c4" className="opacity-80">
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
            </svg>
            <div>
              <div className="font-mono text-xs font-medium text-[#eeeae3]">{it.sym}</div>
              <div className="text-[10px] text-[#8e8a83]/60">{it.meta}</div>
            </div>
          </div>
          <span className="font-mono text-[10px] text-[#8e8a83]/70">Saved</span>
        </div>
      ))}
    </div>
  );
}

function MiniCalendar() {
  const days = [
    { d: "26", syms: [] },
    { d: "27", syms: ["MFSL"] },
    { d: "28", syms: ["LT", "HINDUNILVR"], more: "+9", active: true },
    { d: "29", syms: ["COALINDIA"], more: "+25" },
    { d: "30", syms: ["NAVINFLUOR"] },
  ];
  return (
    <div className="grid grid-cols-5 gap-1.5 rounded-xl border border-white/[0.06] bg-[#141519] p-2.5">
      {days.map((c) => (
        <div
          key={c.d}
          className={`rounded-lg border p-1.5 ${
            c.active
              ? "border-[#8eb4c4]/50 bg-[rgba(142,180,196,0.06)]"
              : "border-white/[0.04] bg-white/[0.015]"
          }`}
        >
          <div className="mb-1 font-mono text-[10px] text-[#8e8a83]/70">{c.d}</div>
          <div className="space-y-1">
            {c.syms.map((s) => (
              <div
                key={s}
                className="truncate rounded bg-white/[0.05] px-1 py-0.5 font-mono text-[9px] text-[#eeeae3]/90"
              >
                {s}
              </div>
            ))}
            {c.more && <div className="font-mono text-[9px] text-[#8eb4c4]">{c.more}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniSectors() {
  const rows = [
    { name: "CAPITAL GOODS", state: "BREAKOUT", w: "86%" },
    { name: "PRIVATE BANKS", state: "CROSSING", w: "72%" },
    { name: "DEFENCE", state: "BREAKOUT", w: "64%" },
    { name: "PHARMA", state: "PULLBACK", w: "48%" },
  ];
  return (
    <div className="space-y-2 rounded-xl border border-white/[0.06] bg-[#141519] p-3.5">
      {rows.map((r) => (
        <div key={r.name} className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-mono text-[#eeeae3]/85">{r.name}</span>
            <span className="font-mono text-[10px] text-[#8e8a83]">{r.state}</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.04]">
            <div className="h-full rounded-full bg-[#8eb4c4]/60" style={{ width: r.w }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniTracking() {
  const episodes = [
    { sym: "BEL", state: "Triggered", col: "#7dba96" },
    { sym: "CUMMINSIND", state: "Triggered", col: "#7dba96" },
    { sym: "ASTRAL", state: "Still basing", col: "#8eb4c4" },
    { sym: "LAURUSLABS", state: "Broke down", col: "#c87a7a" },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#141519]">
      <div className="grid grid-cols-3 border-b border-white/[0.05] bg-white/[0.02] px-3.5 py-1.5 font-mono text-[9.5px] uppercase tracking-wider text-[#8e8a83]/60">
        <span>Name</span>
        <span className="col-span-2">What happened</span>
      </div>
      {episodes.map((e, i) => (
        <div
          key={e.sym}
          className={`grid grid-cols-3 items-center px-3.5 py-2 text-xs ${
            i < episodes.length - 1 ? "border-b border-white/[0.03]" : ""
          }`}
        >
          <span className="font-mono font-medium text-[#eeeae3]">{e.sym}</span>
          <span className="col-span-2 font-mono text-[11px]" style={{ color: e.col }}>{e.state}</span>
        </div>
      ))}
    </div>
  );
}

function MiniTelegram() {
  const cmds = [
    { cmd: "/today", desc: "Sector momentum snapshot", tier: "Free" },
    { cmd: "/delivery HAL", desc: "Delivery & volume profile", tier: "Free" },
    { cmd: "/setups", desc: "Tonight's tight bases", tier: "Pro" },
  ];
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#141519] p-3.5">
      <div className="space-y-2">
        {cmds.map((c) => (
          <div
            key={c.cmd}
            className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-1.5"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="font-mono text-xs text-[#8eb4c4]">{c.cmd}</span>
              <span className="truncate text-[11px] text-[#8e8a83]">{c.desc}</span>
            </div>
            <span className="ml-2 font-mono text-[9.5px] uppercase tracking-wider text-[#8e8a83]/60">
              {c.tier}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 pt-1">
        <a
          href={TELEGRAM_BOT}
          target="_blank"
          rel="noopener"
          onClick={() => capture("telegram_clicked", { location: "features_bot" })}
          className="flex-1 rounded-lg border border-[#8eb4c4]/25 bg-[rgba(142,180,196,0.08)] px-3 py-1.5 text-center font-mono text-[11px] text-[#8eb4c4] no-underline transition-colors hover:bg-[rgba(142,180,196,0.14)]"
        >
          Open Bot →
        </a>
      </div>
    </div>
  );
}

/* ───── Bento feature grid ───── */
function FeatureShowcase() {
  const cards = [
    {
      tag: "CHARTS",
      metric: "6M – 5Y",
      metricLabel: "history",
      title: "Interactive candlestick & volume charts",
      desc: "Open any stock to inspect multi-year price structure and volume right beside its setup metrics.",
      span: "md:col-span-7",
      visual: <MiniCandles />,
    },
    {
      tag: "FUNDAMENTALS",
      metric: "2,000+",
      metricLabel: "companies",
      title: "Company numbers, distilled",
      desc: "PE, promoter holding, TTM revenue & profit growth, margins and earnings trend — sortable and exportable to CSV.",
      span: "md:col-span-5",
      visual: <MiniFundamentals />,
    },
    {
      tag: "WATCHLIST",
      metric: "100%",
      metricLabel: "free & synced",
      title: "One-tap personal watchlist",
      desc: "Bookmark names from any screen or drawer. Synced across devices so your shortlist is always waiting.",
      span: "md:col-span-4",
      visual: <MiniWatchlist />,
    },
    {
      tag: "RESULTS CALENDAR",
      metric: "120d",
      metricLabel: "forward window",
      title: "Earnings dates on a real calendar",
      desc: "See which companies report on each day, inside a month grid.",
      span: "md:col-span-4",
      visual: <MiniCalendar />,
    },
    {
      tag: "SECTORS & BASES",
      metric: "40+",
      metricLabel: "sectors nightly",
      title: "Sector rotation & quiet bases",
      desc: "See which sectors are crossing, breaking out, or pulling back, and which names are tight near their highs on light volume.",
      span: "md:col-span-4",
      visual: <MiniSectors />,
    },
    {
      tag: "OUTCOME TRACKING",
      metric: "365d",
      metricLabel: "audit trail",
      title: "Every flagged base stays on the record",
      desc: "Nothing is dropped after the fact. Each base is logged as triggered, still basing, or broke down.",
      span: "md:col-span-6",
      visual: <MiniTracking />,
    },
    {
      tag: "TELEGRAM BOT",
      metric: "On demand",
      metricLabel: "queries",
      title: "The same screen, inside Telegram",
      desc: "Ask the bot for a sector snapshot, a delivery read, or tonight's tight bases. Observations, not calls.",
      span: "md:col-span-6",
      visual: <MiniTelegram />,
    },
  ];

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-12">
      {cards.map((c, i) => (
        <ScrollReveal key={c.tag} delay={i * 0.06} className={c.span}>
          <SpotlightCard
            spotlightColor="rgba(238,234,227,0.05)"
            className="flex h-full flex-col justify-between border-white/[0.07] bg-[#16171c]/90 p-6 transition-colors hover:border-white/[0.14]"
          >
            <div className="mb-5">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] tracking-[0.18em] text-[#8eb4c4]">
                  {c.tag}
                </span>
                <span className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 font-mono text-[10.5px] text-[#eeeae3]/85">
                  {c.metric}{" "}
                  <span className="text-[#8e8a83]/70">{c.metricLabel}</span>
                </span>
              </div>
              <h3
                className="text-lg font-semibold text-[#eeeae3]"
                style={{ letterSpacing: "-0.02em" }}
              >
                {c.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#8e8a83] sm:text-sm">
                {c.desc}
              </p>
            </div>
            <div className="mt-auto">{c.visual}</div>
          </SpotlightCard>
        </ScrollReveal>
      ))}
    </div>
  );
}

/* ───── Pattern vs. Math anatomy illustration ───── */
function PatternMathIllustration() {
  const checks = [
    { label: "Range contraction (15d)", val: "1.2% ATR", status: "PASS", col: "#7dba96" },
    { label: "Relative volume dry-up", val: "0.38× 20d avg", status: "PASS", col: "#7dba96" },
    { label: "Distance from 52W high", val: "-1.4%", status: "PASS", col: "#7dba96" },
    { label: "Delivery accumulation", val: "64.2% (+1.8σ)", status: "PASS", col: "#7dba96" },
    { label: "Parent sector state", val: "BREAKOUT", status: "PASS", col: "#8eb4c4" },
    { label: "Quarterly EPS trend", val: "↑↑ Accelerating", status: "PASS", col: "#7dba96" },
  ];

  // Coiling price path that tightens into a flat base then breaks out
  const bars = [
    { h: 52, l: 22, c: 40, v: 65 },
    { h: 64, l: 30, c: 58, v: 72 },
    { h: 68, l: 38, c: 44, v: 54 },
    { h: 62, l: 42, c: 56, v: 46 },
    { h: 64, l: 47, c: 51, v: 38 },
    { h: 63, l: 50, c: 59, v: 32 },
    { h: 62, l: 52, c: 55, v: 26 },
    { h: 62, l: 54, c: 60, v: 21 },
    { h: 61, l: 55, c: 58, v: 18 },
    { h: 61, l: 56, c: 59, v: 15 },
    { h: 61, l: 57, c: 60, v: 14 },
    { h: 61, l: 57, c: 60, v: 12 },
    { h: 80, l: 59, c: 77, v: 88, breakout: true },
    { h: 88, l: 74, c: 85, v: 74, breakout: true },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#14151a] p-5 sm:p-6">
      {/* Top header */}
      <div className="mb-4 flex items-center justify-between border-b border-white/[0.05] pb-3">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs font-semibold text-[#eeeae3]">SETUP ANATOMY</span>
          <span className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-[#8e8a83]">
            6 / 6 conditions aligned
          </span>
        </div>
        <span className="rounded bg-[rgba(125,186,150,0.12)] px-2 py-0.5 font-mono text-[10px] font-medium text-[#7dba96]">
          PASSED FILTERS
        </span>
      </div>

      {/* Annotated compression chart */}
      <div className="relative rounded-xl border border-white/[0.05] bg-[#111215] p-4">
        {/* Resistance / pivot line */}
        <div
          className="pointer-events-none absolute left-4 right-4 border-t border-dashed border-[#8eb4c4]/40"
          style={{ top: "38%" }}
        >
          <span className="absolute -top-2.5 right-0 bg-[#111215] px-1.5 font-mono text-[9px] text-[#8eb4c4]">
            PIVOT · HIGH-TIGHT ZONE
          </span>
        </div>

        {/* Coiling bracket annotation */}
        <div
          className="pointer-events-none absolute rounded border border-white/[0.07] bg-white/[0.015]"
          style={{ left: "34%", right: "18%", top: "36%", height: "22%" }}
        >
          <span className="absolute -bottom-4 left-1.5 font-mono text-[9px] text-[#8e8a83]/70">
            volatility contraction (1.2%)
          </span>
        </div>

        {/* High-low range bars */}
        <div className="relative flex h-28 items-end gap-1.5">
          {bars.map((b, i) => {
            const top = 100 - b.h;
            const height = Math.max(b.h - b.l, 4);
            const col = b.breakout ? "#7dba96" : i >= 5 ? "#8eb4c4" : "rgba(238,234,227,0.32)";
            return (
              <div key={i} className="relative h-full flex-1">
                <motion.div
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.08 + i * 0.03, duration: 0.35 }}
                  className="absolute inset-x-1 rounded-full"
                  style={{ top: `${top}%`, height: `${height}%`, background: col }}
                />
              </div>
            );
          })}
        </div>

        {/* Volume dry-up strip */}
        <div className="mt-4 flex h-7 items-end gap-1.5 border-t border-white/[0.04] pt-1.5">
          {bars.map((b, i) => (
            <div
              key={i}
              className="flex-1 rounded-[1px]"
              style={{
                height: `${b.v}%`,
                background: b.breakout
                  ? "rgba(125,186,150,0.55)"
                  : i >= 6
                  ? "rgba(142,180,196,0.22)"
                  : "rgba(238,234,227,0.14)",
              }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between font-mono text-[9px] text-[#8e8a83]/60">
          <span>Prior swing</span>
          <span>Volume dry-up (0.38×)</span>
          <span className="text-[#7dba96]">Expansion ↑</span>
        </div>
      </div>

      {/* Multi-factor quantitative checklist */}
      <div className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {checks.map((c) => (
          <div
            key={c.label}
            className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2"
          >
            <div className="min-w-0">
              <div className="truncate text-[11px] text-[#8e8a83]">{c.label}</div>
              <div className="font-mono text-xs font-medium text-[#eeeae3]">{c.val}</div>
            </div>
            <span
              className="ml-2 shrink-0 rounded px-1.5 py-0.5 font-mono text-[9.5px]"
              style={{ background: `${c.col}1a`, color: c.col }}
            >
              {c.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───── Pricing section with billing toggle ───── */
function PricingSection({ onSelect }) {
  const [yearly, setYearly] = useState(true);

  const freeFeatures = [
    "Nightly sector momentum scans",
    "Coiled bases overview",
    "Interactive 6M–5Y candlestick charts",
    "Company fundamentals screen + CSV export",
    "Synced personal watchlist",
    "Results calendar (120-day window)",
    "3 Telegram bot queries / day",
  ];

  const proFeatures = [
    "Everything in Free, unlimited",
    "Full sector-agreed setups list",
    "Complete 365-day episode & outcome log",
    "Leaders at rest & pullback screens",
    "Sector and delivery queries in Telegram",
    "Unlimited on-demand Telegram bot queries",
    "Priority data refresh after market close",
  ];

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header + billing switch */}
      <ScrollReveal>
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-[#8eb4c4]/70">
              Pricing
            </p>
            <h2
              className="text-3xl font-bold tracking-tight sm:text-4xl"
              style={{ letterSpacing: "-0.03em" }}
            >
              Start free. Upgrade for the full lists.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-[#8e8a83]">
              The core desk — charts, fundamentals, watchlist, results calendar and sector scans — is free forever.
            </p>
          </div>

          {/* Billing cycle pill */}
          <div className="inline-flex items-center rounded-xl border border-white/[0.08] bg-[#141519] p-1">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setYearly(false)}
              onKeyDown={(e) => e.key === "Enter" && setYearly(false)}
              className={`cursor-pointer rounded-lg px-3.5 py-1.5 font-mono text-xs transition-colors ${
                !yearly ? "bg-white/[0.08] text-[#eeeae3]" : "text-[#8e8a83] hover:text-[#eeeae3]"
              }`}
            >
              Monthly
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setYearly(true)}
              onKeyDown={(e) => e.key === "Enter" && setYearly(true)}
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 font-mono text-xs transition-colors ${
                yearly ? "bg-white/[0.08] text-[#eeeae3]" : "text-[#8e8a83] hover:text-[#eeeae3]"
              }`}
            >
              <span>Yearly</span>
              <span className="rounded bg-[rgba(125,186,150,0.14)] px-1.5 py-0.5 text-[10px] text-[#7dba96]">
                -33%
              </span>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Cards */}
      <ScrollReveal delay={0.12}>
        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Free tier — 5 cols */}
          <div className="flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-[#16171c]/90 p-7 lg:col-span-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-[0.16em] text-[#8e8a83]">
                  Free Desk
                </span>
                <span className="font-mono text-[11px] text-[#8e8a83]/60">No card required</span>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-mono text-4xl font-semibold tracking-tight text-[#eeeae3]">
                  ₹0
                </span>
                <span className="font-mono text-xs text-[#8e8a83]">/ forever</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#8e8a83]">
                Full access to market breadth, charts, fundamentals, and your saved watchlist.
              </p>

              <div className="my-6 h-px w-full bg-white/[0.06]" />

              <ul className="m-0 list-none space-y-2.5 p-0 text-sm text-[#8e8a83]">
                {freeFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <span className="h-1 w-1 rounded-full bg-[#eeeae3]/40" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <div
                role="button"
                tabIndex={0}
                onClick={onSelect}
                onKeyDown={(e) => e.key === "Enter" && onSelect()}
                className="w-full cursor-pointer rounded-xl border border-white/[0.1] bg-white/[0.03] py-3 text-center text-sm font-medium text-[#eeeae3] transition-colors hover:border-white/[0.2] hover:bg-white/[0.06]"
              >
                Open free account →
              </div>
            </div>
          </div>

          {/* Pro tier — 7 cols */}
          <div className="relative flex flex-col justify-between rounded-2xl border border-[#8eb4c4]/30 bg-[#161920] p-7 lg:col-span-7">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs uppercase tracking-[0.16em] text-[#8eb4c4]">
                    Pro Desk
                  </span>
                  <span className="rounded border border-[#8eb4c4]/30 bg-[rgba(142,180,196,0.1)] px-2 py-0.5 font-mono text-[10px] text-[#8eb4c4]">
                    FULL ACCESS
                  </span>
                </div>
                <span className="font-mono text-[11px] text-[#8e8a83]">
                  {yearly ? "Billed ₹3,999 yearly" : "Billed monthly"}
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-2.5">
                <span className="font-mono text-4xl font-semibold tracking-tight text-[#eeeae3]">
                  {yearly ? "₹333" : "₹499"}
                </span>
                <span className="font-mono text-xs text-[#8e8a83]">/ month</span>
                {yearly && (
                  <span className="font-mono text-xs text-[#8e8a83]/50 line-through">₹499</span>
                )}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#8e8a83]">
                The names where sector state, a tight base, and delivery line up — plus the full outcome log.
              </p>

              <div className="my-6 h-px w-full bg-white/[0.06]" />

              <ul className="m-0 grid list-none grid-cols-1 gap-2.5 p-0 text-sm text-[#eeeae3]/90 sm:grid-cols-2">
                {proFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8eb4c4]" />
                    <span className="text-xs leading-relaxed sm:text-sm">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-5 sm:flex-row">
              <span className="font-mono text-[11px] text-[#8e8a83]">
                Cancel anytime · Instant activation
              </span>
              <GlowButton onClick={onSelect} className="w-full sm:w-auto">
                Get started with Pro
              </GlowButton>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#111215] text-[#eeeae3]">

      {/* ── Disclaimer banner ── */}
      <div className="relative z-20 border-b border-[rgba(196,164,106,0.15)] bg-[rgba(196,164,106,0.06)] px-4 py-1.5 text-center">
        <span className="text-[11px] text-white/50">
          Not SEBI registered. Not financial advice. This is a screening tool — all decisions are yours.{" "}
          <Link to="/terms" className="text-[#8eb4c4] no-underline hover:underline">Terms</Link>
          {" · "}
          <Link to="/privacy" className="text-[#8eb4c4] no-underline hover:underline">Privacy</Link>
        </span>
      </div>

      {/* ── Top Navbar ── */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#111215]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <img src={logoIcon} alt="Morrow Desk" className="h-7 w-7 rounded-lg" />
            <span className="text-sm font-semibold tracking-tight text-[#eeeae3]">
              Morrow Desk
            </span>
            <span className="hidden rounded border border-white/[0.07] bg-white/[0.02] px-1.5 py-0.5 font-mono text-[10px] text-[#8e8a83] sm:inline">
              NSE
            </span>
          </div>

          <nav className="hidden items-center gap-7 text-xs text-[#8e8a83] md:flex">
            <a href="#features" className="no-underline transition-colors hover:text-[#eeeae3]" style={{ color: "inherit" }}>
              Features
            </a>
            <a href="#pipeline" className="no-underline transition-colors hover:text-[#eeeae3]" style={{ color: "inherit" }}>
              How it works
            </a>
            <a href="#pricing" className="no-underline transition-colors hover:text-[#eeeae3]" style={{ color: "inherit" }}>
              Pricing
            </a>
            <Link to="/guide" className="no-underline transition-colors hover:text-[#eeeae3]" style={{ color: "inherit" }}>
              Guide
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              onClick={() => capture("cta_clicked", { location: "nav_signin" })}
              className="rounded-lg border border-white/[0.1] bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-[#eeeae3] no-underline transition-colors hover:border-white/[0.2] hover:bg-white/[0.06]"
            >
              Sign in →
            </Link>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════
          HERO SECTION
         ════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-4 pt-12 pb-16 sm:pt-16 sm:pb-20">
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.02] px-3 py-1 font-mono text-[11px] text-[#8e8a83]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7dba96]" />
                <span className="text-[#eeeae3]/90">EOD pipeline</span>
                <span className="text-white/15">·</span>
                <span>Updated nightly at 20:30 IST</span>
              </div>
              <h1
                className="text-3xl font-semibold tracking-tight text-[#eeeae3] sm:text-4xl md:text-5xl"
                style={{ letterSpacing: "-0.035em", lineHeight: 1.08 }}
              >
                The post-market desk for NSE.
              </h1>
              <p className="mt-2 text-sm text-[#8e8a83] sm:text-base">
                Sector rotation, quiet bases, charts &amp; fundamentals.
              </p>
            </motion.div>

            {/* Nightly funnel telemetry instead of duplicate CTA */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-3 divide-x divide-white/[0.06] rounded-xl border border-white/[0.07] bg-[#15161b]/90 px-2 py-2.5 backdrop-blur-sm"
            >
              <div className="px-3.5">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8e8a83]/70">
                  Universe
                </div>
                <div className="mt-0.5 font-mono text-sm font-semibold text-[#eeeae3]">
                  2,200+ <span className="text-[11px] font-normal text-[#8e8a83]">equities</span>
                </div>
              </div>
              <div className="px-3.5">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8e8a83]/70">
                  Breadth
                </div>
                <div className="mt-0.5 font-mono text-sm font-semibold text-[#8eb4c4]">
                  40+ <span className="text-[11px] font-normal text-[#8e8a83]">sectors</span>
                </div>
              </div>
              <div className="px-3.5">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8e8a83]/70">
                  Output
                </div>
                <div className="mt-0.5 font-mono text-sm font-semibold text-[#7dba96]">
                  8–15 <span className="text-[11px] font-normal text-[#8e8a83]">setups</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Interactive product desk */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 sm:mt-10"
          >
            <DashboardPreview />
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          STOCK MARQUEE TICKER
         ════════════════════════════════════════════════ */}
      <Marquee />

      {/* ════════════════════════════════════════════════
          PROBLEM SECTION — Pattern recognition vs. math
         ════════════════════════════════════════════════ */}
      <section className="relative px-4 py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <ScrollReveal className="lg:col-span-5">
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8eb4c4]">
              Why a quantitative screen
            </div>
            <h2
              className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
              style={{ letterSpacing: "-0.03em", lineHeight: 1.08 }}
            >
              Pattern recognition looks simple.
              <span className="mt-2 block text-[#8eb4c4]">
                The math isn&apos;t.
              </span>
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-[#8e8a83] sm:text-base">
              A name clears the screen only when several conditions line up — range contraction,
              volume dry-up, delivery accumulation, sector timing, and earnings trajectory.{" "}
              <span className="text-[#eeeae3]">We run the math on 2,000+ stocks every night.</span>{" "}
              You wake up to what passed.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.12} className="lg:col-span-7">
            <PatternMathIllustration />
          </ScrollReveal>
        </div>
      </section>

      <Divider />

      {/* ════════════════════════════════════════════════
          FEATURES — interactive showcase
         ════════════════════════════════════════════════ */}
      <section id="features" className="relative px-4 py-20">
        <ScrollReveal>
          <p className="mb-2 text-center text-xs font-medium uppercase tracking-widest text-[#8eb4c4]/60">
            What you get
          </p>
          <h2 className="mb-3 text-center text-3xl font-bold tracking-tight sm:text-4xl" style={{ letterSpacing: "-0.03em" }}>
            Everything in one desk
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-sm leading-relaxed text-[#8e8a83] sm:text-base">
            From sector rotation down to a single company&apos;s numbers — screen,
            save, chart and dig in without ever leaving Morrow Desk.
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <FeatureShowcase />
        </ScrollReveal>
      </section>

      <Divider />

      {/* ════════════════════════════════════════════════
          HOW IT WORKS — step flow
         ════════════════════════════════════════════════ */}
      <section id="pipeline" className="relative px-4 py-20">
        <ScrollReveal>
          <p className="mb-2 text-center text-xs font-medium uppercase tracking-widest text-[#8eb4c4]/60">
            How it works
          </p>
          <h2 className="mb-14 text-center text-3xl font-bold tracking-tight sm:text-4xl" style={{ letterSpacing: "-0.03em" }}>
            From raw data to your watchlist
          </h2>
        </ScrollReveal>
        <HowItWorks />
      </section>

      <Divider />

      {/* ════════════════════════════════════════════════
          PRICING PREVIEW
         ════════════════════════════════════════════════ */}
      <section id="pricing" className="relative px-4 py-24">
        <PricingSection
          onSelect={() => {
            capture("cta_clicked", { location: "pricing" });
            navigate("/login");
          }}
        />
      </section>

      {/* ════════════════════════════════════════════════
          FINAL CTA + FOOTER
         ════════════════════════════════════════════════ */}
      <footer className="relative px-4 pt-10 pb-12">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-white/[0.08] bg-[#131419]">
          {/* Top CTA band inside the footer card */}
          <div className="relative overflow-hidden border-b border-white/[0.06] bg-gradient-to-b from-white/[0.02] to-transparent p-8 sm:p-12">
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-25 blur-3xl"
              style={{ background: "radial-gradient(circle, #8eb4c4 0%, transparent 70%)" }}
            />
            <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div className="max-w-xl">
                <div className="mb-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#8eb4c4]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7dba96]" />
                  <span>Post-market nightly run</span>
                </div>
                <h2
                  className="text-2xl font-semibold tracking-tight text-[#eeeae3] sm:text-3xl md:text-4xl"
                  style={{ letterSpacing: "-0.03em", lineHeight: 1.12 }}
                >
                  Tonight&apos;s scan is ready before tomorrow&apos;s bell.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#8e8a83]">
                  Open the desk to review active sectors, coiled bases, company fundamentals, and upcoming earnings dates in one place.
                </p>
              </div>

              <div className="flex w-full flex-col items-stretch gap-2.5 sm:w-auto sm:items-end">
                <GlowButton
                  onClick={() => {
                    capture("cta_clicked", { location: "bottom" });
                    navigate("/login");
                  }}
                >
                  Open Morrow Desk
                </GlowButton>
                <span className="text-center font-mono text-[11px] text-[#8e8a83]/60 sm:text-right">
                  Free forever tier · No credit card
                </span>
              </div>
            </div>
          </div>

          {/* Middle navigation & telemetry grid */}
          <div className="grid grid-cols-1 gap-10 p-8 sm:p-12 lg:grid-cols-12">
            {/* Brand + live pipeline spec */}
            <div className="flex flex-col justify-between lg:col-span-5">
              <div>
                <div className="flex items-center gap-2.5">
                  <img src={logoIcon} alt="Morrow Desk" className="h-7 w-7 rounded-lg" />
                  <span className="text-base font-semibold tracking-tight text-[#eeeae3]">
                    Morrow Desk
                  </span>
                  <span className="rounded border border-white/[0.07] bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px] text-[#8e8a83]">
                    NSE · EOD
                  </span>
                </div>
                <p className="mt-3.5 max-w-sm text-xs leading-relaxed text-[#8e8a83]">
                  A calm post-market screening desk for Indian equities. Sector rotation,
                  coiled bases, company fundamentals, and 365-day outcome tracking.
                </p>
              </div>

              {/* Pipeline spec strip */}
              <div className="mt-6 inline-flex w-fit items-center gap-2.5 whitespace-nowrap rounded-xl border border-white/[0.06] bg-[#0e0f12]/80 px-3 py-2 font-mono text-[10.5px] text-[#8e8a83]">
                <span className="inline-flex items-center gap-1.5 text-[#eeeae3]/90">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#7dba96]" />
                  20:30 IST run
                </span>
                <span className="text-white/15">|</span>
                <span>Bhavcopy + Delivery</span>
                <span className="text-white/15">|</span>
                <span>Zero intraday noise</span>
              </div>
            </div>

            {/* Navigation columns */}
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
              {/* Column 1: Desk */}
              <div>
                <div className="mb-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8e8a83]/60">
                  The Desk
                </div>
                <ul className="m-0 list-none space-y-2.5 p-0 text-xs text-[#8e8a83]">
                  <li>
                    <a href="#features" className="no-underline transition-colors hover:text-[#eeeae3]" style={{ color: "inherit" }}>
                      Features &amp; Screens
                    </a>
                  </li>
                  <li>
                    <a href="#pipeline" className="no-underline transition-colors hover:text-[#eeeae3]" style={{ color: "inherit" }}>
                      Nightly Pipeline
                    </a>
                  </li>
                  <li>
                    <a href="#pricing" className="no-underline transition-colors hover:text-[#eeeae3]" style={{ color: "inherit" }}>
                      Plans &amp; Pricing
                    </a>
                  </li>
                  <li>
                    <Link to="/guide" className="no-underline transition-colors hover:text-[#eeeae3]" style={{ color: "inherit" }}>
                      Methodology &amp; Guide
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 2: Access & Bot */}
              <div>
                <div className="mb-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8e8a83]/60">
                  Access
                </div>
                <ul className="m-0 list-none space-y-2.5 p-0 text-xs text-[#8e8a83]">
                  <li>
                    <Link to="/login" className="no-underline transition-colors hover:text-[#eeeae3]" style={{ color: "inherit" }}>
                      Sign in to Desk →
                    </Link>
                  </li>
                  <li>
                    <Link to="/login" className="no-underline transition-colors hover:text-[#eeeae3]" style={{ color: "inherit" }}>
                      Create free account
                    </Link>
                  </li>
                  <li>
                    <a
                      href={TELEGRAM_BOT}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-1.5 no-underline transition-colors hover:text-[#eeeae3]"
                      style={{ color: "inherit" }}
                    >
                      <span>Telegram Bot</span>
                      <span className="font-mono text-[10px] text-[#8eb4c4]">↗</span>
                    </a>
                  </li>
                </ul>
              </div>

              {/* Column 3: Legal */}
              <div>
                <div className="mb-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8e8a83]/60">
                  Legal
                </div>
                <ul className="m-0 list-none space-y-2.5 p-0 text-xs text-[#8e8a83]">
                  <li>
                    <Link to="/terms" className="no-underline transition-colors hover:text-[#eeeae3]" style={{ color: "inherit" }}>
                      Terms of Use
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacy" className="no-underline transition-colors hover:text-[#eeeae3]" style={{ color: "inherit" }}>
                      Privacy Policy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom disclaimer & copyright bar */}
          <div className="flex flex-col items-start justify-between gap-3 border-t border-white/[0.06] bg-[#0e0f12]/60 px-8 py-5 text-[11px] text-[#8e8a83]/55 sm:flex-row sm:items-center sm:px-12">
            <span className="font-mono text-[11px]">
              © {new Date().getFullYear()} Morrow Desk. Built for post-market review.
            </span>
            <span>
              Not SEBI registered · Informational equity screening tool only, not investment advice.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
