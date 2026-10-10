import { useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import { TELEGRAM_BOT, TELEGRAM_CHANNEL } from "../config.js";
import logoIcon from "../Images/favicon.svg";

import SpotlightCard from "./landing/SpotlightCard.jsx";
import NumberTicker from "./landing/NumberTicker.jsx";
import { TextReveal, LetterPull, GradientText, ShinyText, TypeWriter } from "./landing/AnimatedText.jsx";
import { RetroGrid } from "./landing/GridBeam.jsx";
import Particles from "./landing/Particles.jsx";
import PhoneMockup from "./landing/PhoneMockup.jsx";
import Marquee from "./landing/Marquee.jsx";
import BorderBeam from "./landing/BorderBeam.jsx";
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

/* ───── badge pill with live dot ───── */
function Badge({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, filter: "blur(8px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ delay: 0.1, duration: 0.6 }}
      className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-xs text-[#8e8a83] backdrop-blur-sm"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7dba96] opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#7dba96]" />
      </span>
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

/* ───── floating orbs ───── */
function Orb({ className, color }) {
  return (
    <div
      className={`absolute rounded-full blur-[80px] opacity-30 animate-float ${className}`}
      style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <div className="min-h-screen bg-[#050506] text-[#eeeae3]">

      {/* ── Disclaimer banner ── */}
      <div className="relative z-20 border-b border-[rgba(196,164,106,0.15)] bg-[rgba(196,164,106,0.06)] px-4 py-1.5 text-center">
        <span className="text-[11px] text-white/50">
          Not SEBI registered. Not financial advice. This is a screening tool — all decisions are yours.{" "}
          <Link to="/terms" className="text-[#8eb4c4] no-underline hover:underline">Terms</Link>
          {" · "}
          <Link to="/privacy" className="text-[#8eb4c4] no-underline hover:underline">Privacy</Link>
        </span>
      </div>

      {/* ════════════════════════════════════════════════
          HERO SECTION
         ════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
        {/* Background layers */}
        <Particles quantity={70} connectLines className="z-[1]" />
        <Orb className="h-[600px] w-[600px] -left-[5%] -top-[10%]" color="rgba(142,180,196,0.14)" />
        <Orb className="h-[500px] w-[500px] left-[60%] top-[15%]" color="rgba(125,186,150,0.10)" />
        <Orb className="h-[400px] w-[400px] left-[75%] top-[55%]" color="rgba(180,168,210,0.08)" />
        <Orb className="h-[350px] w-[350px] left-[10%] top-[60%]" color="rgba(196,164,106,0.06)" />
        <RetroGrid />

        <motion.div style={{ opacity: heroOpacity, scale: heroScale, y: heroY }} className="relative z-10 flex flex-col items-center text-center">
          <Badge>Updated post-market · 2,000+ stocks</Badge>

          {/* Logo with glow */}
          <motion.div
            className="relative mb-8"
            initial={{ opacity: 0, scale: 0.3, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.2 }}
          >
            <img src={logoIcon} alt="Morrow Desk" className="relative z-10 h-20 w-20 rounded-2xl" />
            <div className="absolute inset-0 animate-pulse-glow rounded-2xl" />
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-[rgba(142,180,196,0.08)] blur-2xl" />
          </motion.div>

          {/* Headline with letter animation */}
          <div className="overflow-hidden">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-8xl" style={{ letterSpacing: "-0.045em", lineHeight: 1 }}>
              <LetterPull text="Morrow Desk" delay={0.4} />
            </h1>
          </div>

          {/* Tagline with rotating words */}
          <TextReveal delay={0.9}>
            <p className="mt-5 max-w-lg text-lg text-[#8e8a83] sm:text-xl md:text-2xl">
              Find stocks{" "}
              <TypeWriter
                words={["setting up", "coiling tight", "about to move", "with real flow"]}
                className="text-[#eeeae3]"
              />
            </p>
          </TextReveal>

          {/* Sub-tagline */}
          <TextReveal delay={1.2}>
            <p className="mt-2 text-sm text-white/25">
              <ShinyText>Before they move.</ShinyText>
            </p>
          </TextReveal>

          {/* CTA buttons */}
          <TextReveal delay={1.4}>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <GlowButton onClick={() => navigate("/login")}>
                Get started free
              </GlowButton>
              <motion.a
                href={TELEGRAM_BOT}
                target="_blank"
                rel="noopener"
                className="group flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-6 py-3 text-sm text-[#8e8a83] backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/[0.04] hover:text-[#eeeae3] no-underline"
                whileHover={{ y: -2 }}
              >
                <span className="transition-transform group-hover:scale-110">📲</span> Try on Telegram
              </motion.a>
            </div>
          </TextReveal>

          <TextReveal delay={1.6}>
            <p className="mt-5 flex items-center gap-3 text-[11px] text-white/15">
              <span>NSE</span>
              <span className="h-3 w-px bg-white/10" />
              <span>Free tier included</span>
              <span className="h-3 w-px bg-white/10" />
              <span>No credit card</span>
            </p>
          </TextReveal>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 2.5 }}
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2 text-white/20"
          >
            <span className="text-[9px] uppercase tracking-[0.2em]">Scroll</span>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════
          STOCK MARQUEE TICKER
         ════════════════════════════════════════════════ */}
      <Marquee />

      {/* ════════════════════════════════════════════════
          PROBLEM SECTION
         ════════════════════════════════════════════════ */}
      <section className="relative px-4 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <ScrollReveal>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl" style={{ letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Pattern recognition looks simple.
              <span className="mt-2 block">
                <GradientText>The math isn't.</GradientText>
              </span>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-[#8e8a83] sm:text-base">
              Identifying a real setup requires layering dozens of conditions — volume, money flow,
              delivery, sector timing, breadth.{" "}
              <span className="text-[#eeeae3]">We run the math on 2,000+ stocks every night.</span>{" "}
              You wake up to what passed.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          DASHBOARD PREVIEW — 3D perspective
         ════════════════════════════════════════════════ */}
      <section className="relative px-4 py-10">
        <DashboardPreview />
      </section>

      <Divider />

      {/* ════════════════════════════════════════════════
          FEATURES — Spotlight cards
         ════════════════════════════════════════════════ */}
      <section className="relative px-4 py-20">
        <ScrollReveal>
          <p className="mb-2 text-center text-xs font-medium uppercase tracking-widest text-[#8eb4c4]/60">
            What you get
          </p>
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight sm:text-4xl" style={{ letterSpacing: "-0.03em" }}>
            Three lenses on the market
          </h2>
        </ScrollReveal>
        <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-3">
          {[
            {
              icon: "🔵",
              title: "Sector momentum",
              desc: "Which sectors are waking up with real institutional buying — and which names are leading the move.",
              color: "#8eb4c4",
              detail: "Tracks CROSSING, BREAKOUT, and PULLBACK states across 40+ sectors",
            },
            {
              icon: "🟢",
              title: "Quiet bases",
              desc: "Stocks coiling near highs with volume dried up. The calm before the next leg up.",
              color: "#7dba96",
              detail: "Filters for tight range, low relative volume, and proximity to highs",
            },
            {
              icon: "🟡",
              title: "Outcome tracking",
              desc: "Every triggered setup gets tracked — breakout, failed, or still basing. No cherry-picking.",
              color: "#c4a46a",
              detail: "Full transparency: triggered → outcome for every flagged setup",
            },
          ].map((feat, i) => (
            <ScrollReveal key={feat.title} delay={i * 0.12}>
              <SpotlightCard
                spotlightColor={`${feat.color}18`}
                className="group h-full"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-xl transition-colors group-hover:border-white/10 group-hover:bg-white/[0.05]">
                  {feat.icon}
                </div>
                <h3 className="mb-2 text-base font-semibold text-[#eeeae3]">{feat.title}</h3>
                <p className="text-sm leading-relaxed text-[#8e8a83]">{feat.desc}</p>
                <div className="mt-4 h-px w-16" style={{ background: `linear-gradient(90deg, ${feat.color}60, transparent)` }} />
                <p className="mt-3 text-[11px] leading-relaxed text-[#8e8a83]/50">{feat.detail}</p>
              </SpotlightCard>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          STATS COUNTERS
         ════════════════════════════════════════════════ */}
      <section className="relative px-4 py-20">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.015] p-8 sm:p-12">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { value: 2000, suffix: "+", label: "Stocks scanned nightly", color: "#8eb4c4" },
              { value: 40, suffix: "+", label: "Sectors tracked", color: "#7dba96" },
              { value: 365, suffix: "", label: "Days of history", color: "#c4a46a" },
              { value: 100, suffix: "%", label: "Free tier available", color: "#b4a8d2" },
            ].map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 0.08} className="text-center">
                <div className="text-3xl font-bold sm:text-4xl md:text-5xl" style={{ color: stat.color }}>
                  <NumberTicker value={stat.value} suffix={stat.suffix} delay={0.3 + i * 0.15} />
                </div>
                <div className="mt-2 text-[11px] text-[#8e8a83] sm:text-xs">{stat.label}</div>
              </ScrollReveal>
            ))}
          </div>
          <BorderBeam duration={10} color="rgba(142,180,196,0.25)" />
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          HOW IT WORKS — step flow
         ════════════════════════════════════════════════ */}
      <section className="relative px-4 py-20">
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
          TELEGRAM SHOWCASE — Phone mockup
         ════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-4 py-24">
        <Orb className="h-[500px] w-[500px] -left-[10%] top-[20%]" color="rgba(142,180,196,0.06)" />
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-12 md:flex-row md:gap-20">
          {/* Text side */}
          <div className="relative z-10 flex-1 text-center md:text-left">
            <ScrollReveal>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-[#8e8a83]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8eb4c4] opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#8eb4c4]" />
                </span>
                Also on Telegram
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl" style={{ letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                Market views in
                <span className="block text-[#8eb4c4]">your Telegram.</span>
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-[#8e8a83] sm:text-base">
                Get sector momentum, delivery analysis, and setup alerts right inside Telegram.
                Free commands included — premium unlocks the full channel.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              <ul className="mt-7 space-y-3 text-sm text-[#8e8a83]">
                {[
                  { cmd: "/today", desc: "Sector momentum snapshot", free: true },
                  { cmd: "/delivery", desc: "Delivery % for any stock", free: true },
                  { cmd: "/setups", desc: "Curated buy setups", free: false },
                ].map((item) => (
                  <li key={item.cmd} className="flex items-center gap-3">
                    <code className="rounded-md bg-white/[0.05] px-2.5 py-1 font-mono text-xs text-[#8eb4c4]">{item.cmd}</code>
                    <span className="flex-1">{item.desc}</span>
                    {!item.free && <span className="rounded-full bg-[rgba(142,180,196,0.1)] px-2 py-0.5 text-[9px] text-[#8eb4c4]">Premium</span>}
                  </li>
                ))}
              </ul>
            </ScrollReveal>
            <ScrollReveal delay={0.4}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <motion.a
                  href={TELEGRAM_BOT}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[rgba(142,180,196,0.12)] px-5 py-2.5 text-sm font-medium text-[#8eb4c4] transition-all hover:bg-[rgba(142,180,196,0.2)] hover:shadow-lg hover:shadow-[rgba(142,180,196,0.1)] no-underline"
                  whileHover={{ y: -2, scale: 1.02 }}
                >
                  🤖 Open bot
                </motion.a>
                <motion.a
                  href={TELEGRAM_CHANNEL}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] px-5 py-2.5 text-sm text-[#8e8a83] transition-all hover:border-white/20 hover:text-[#eeeae3] no-underline"
                  whileHover={{ y: -2 }}
                >
                  📢 Free channel
                </motion.a>
              </div>
            </ScrollReveal>
          </div>

          {/* Phone side */}
          <ScrollReveal delay={0.2} className="flex-shrink-0">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <PhoneMockup />
            </motion.div>
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          PRICING PREVIEW
         ════════════════════════════════════════════════ */}
      <section className="relative px-4 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <ScrollReveal>
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[#8eb4c4]/60">Pricing</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ letterSpacing: "-0.03em" }}>
              Simple, transparent pricing
            </h2>
            <p className="mt-3 text-sm text-[#8e8a83]">
              Free tier for market views. Premium for the setups that matter.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <div className="mx-auto mt-12 grid max-w-2xl gap-5 sm:grid-cols-2">
              {/* Free card */}
              <div className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 text-left transition-colors hover:border-white/10 hover:bg-white/[0.03]">
                <div className="mb-1 text-sm font-medium text-[#8e8a83]">Free</div>
                <div className="text-4xl font-bold text-[#eeeae3]">₹0</div>
                <div className="mb-6 text-xs text-[#8e8a83]">forever</div>
                <ul className="space-y-2.5 text-sm text-[#8e8a83]">
                  {["Sector scans", "Coiled bases list", "Delivery analysis", "3 bot queries/day"].map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#7dba96]/10 text-[10px] text-[#7dba96]">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Premium card */}
              <div className="relative rounded-2xl border border-[rgba(142,180,196,0.2)] bg-[rgba(142,180,196,0.04)] p-7 text-left animate-pulse-glow">
                <div className="absolute -top-3 right-4 rounded-full bg-[#8eb4c4] px-3 py-0.5 text-[10px] font-bold text-[#050506]">
                  POPULAR
                </div>
                <div className="mb-1 text-sm font-medium text-[#8eb4c4]">Premium</div>
                <div className="text-4xl font-bold text-[#eeeae3]">₹299<span className="text-base font-normal text-[#8e8a83]">/mo</span></div>
                <div className="mb-6 text-xs text-[#8e8a83]">or ₹1,999/year (save 44%)</div>
                <ul className="space-y-2.5 text-sm text-[#8e8a83]">
                  {["Everything in Free", "Curated buy setups", "Outcome tracking", "Telegram premium channel", "Unlimited bot access"].map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#8eb4c4]/10 text-[10px] text-[#8eb4c4]">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <BorderBeam duration={8} color="rgba(142,180,196,0.35)" />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FINAL CTA
         ════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-4 py-28">
        <div className="absolute inset-0 bg-gradient-to-t from-[#050506] via-transparent to-[#050506]" />
        <Particles quantity={30} color="142,180,196" className="z-0 opacity-30" />
        <Orb className="h-[600px] w-[600px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" color="rgba(142,180,196,0.08)" />
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <ScrollReveal>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl" style={{ letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Ready to find
              <span className="block">
                <GradientText>what&apos;s setting up?</GradientText>
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm text-[#8e8a83] sm:text-base">
              Join traders who check Morrow Desk before the market opens.
            </p>
            <div className="mt-10">
              <GlowButton onClick={() => navigate("/login")}>
                Get started — it&apos;s free
              </GlowButton>
            </div>
            <p className="mt-5 text-[11px] text-white/15">
              No credit card required · Free plan available
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.04] px-4 py-10 text-center">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <img src={logoIcon} alt="" className="h-5 w-5 rounded opacity-40" />
            <span className="text-xs text-[#8e8a83]/50">Indian equities · Post-market updates</span>
          </div>
          <div className="flex gap-5 text-xs text-[#8e8a83]/30">
            <Link to="/terms" className="transition-colors hover:text-[#8e8a83] no-underline" style={{ color: "inherit" }}>Terms</Link>
            <Link to="/privacy" className="transition-colors hover:text-[#8e8a83] no-underline" style={{ color: "inherit" }}>Privacy</Link>
            <Link to="/guide" className="transition-colors hover:text-[#8e8a83] no-underline" style={{ color: "inherit" }}>Guide</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
