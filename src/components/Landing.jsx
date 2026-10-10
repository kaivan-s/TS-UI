import { useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import { C } from "../theme.js";
import { TELEGRAM_BOT, TELEGRAM_CHANNEL } from "../config.js";
import logoIcon from "../Images/favicon.svg";

import SpotlightCard from "./landing/SpotlightCard.jsx";
import NumberTicker from "./landing/NumberTicker.jsx";
import { TextReveal, ShinyText } from "./landing/AnimatedText.jsx";
import { RetroGrid, BackgroundBeams } from "./landing/GridBeam.jsx";
import Particles from "./landing/Particles.jsx";
import PhoneMockup from "./landing/PhoneMockup.jsx";

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

/* ───── badge pill ───── */
function Badge({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1, duration: 0.5 }}
      className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-xs text-[#8e8a83]"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7dba96] opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#7dba96]" />
      </span>
      {children}
    </motion.div>
  );
}

/* ───── floating orbs (retained, re-done in tailwind) ───── */
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
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

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
        <Particles quantity={50} className="z-0" />
        <BackgroundBeams />
        <Orb className="h-[600px] w-[600px] -left-[5%] -top-[10%]" color="rgba(142,180,196,0.12)" />
        <Orb className="h-[500px] w-[500px] left-[60%] top-[20%]" color="rgba(125,186,150,0.09)" />
        <Orb className="h-[400px] w-[400px] left-[70%] top-[60%]" color="rgba(180,168,210,0.07)" />
        <RetroGrid />

        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="relative z-10 flex flex-col items-center text-center">
          <Badge>Updated post-market daily</Badge>

          {/* Logo */}
          <motion.img
            src={logoIcon}
            alt="Morrow Desk"
            className="mb-6 h-20 w-20 rounded-2xl"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          />

          {/* Headline */}
          <TextReveal delay={0.3}>
            <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl" style={{ letterSpacing: "-0.04em", lineHeight: 1.05 }}>
              Morrow Desk
            </h1>
          </TextReveal>

          {/* Tagline */}
          <TextReveal delay={0.5}>
            <p className="mt-4 max-w-md text-lg text-[#8e8a83] sm:text-xl">
              Find stocks setting up.{" "}
              <ShinyText>Before they move.</ShinyText>
            </p>
          </TextReveal>

          {/* CTA buttons */}
          <TextReveal delay={0.7}>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
              <motion.button
                onClick={() => navigate("/login")}
                className="rounded-xl bg-[#eeeae3] px-8 py-3.5 text-base font-semibold text-[#0a0a0b] transition-colors hover:bg-[#d4d0c8]"
                whileHover={{ y: -3, boxShadow: "0 15px 40px -10px rgba(238,234,227,0.3)" }}
                whileTap={{ scale: 0.97 }}
              >
                Get started free
              </motion.button>
              <motion.a
                href={TELEGRAM_BOT}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-2 rounded-xl border border-white/10 px-6 py-3 text-sm text-[#8e8a83] transition-colors hover:border-white/20 hover:text-[#eeeae3]"
                whileHover={{ y: -2 }}
              >
                <span>📲</span> Try on Telegram
              </motion.a>
            </div>
          </TextReveal>

          {/* Sub-text */}
          <TextReveal delay={0.9}>
            <p className="mt-4 text-xs text-white/20">
              NSE · Free tier included · No credit card
            </p>
          </TextReveal>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-white/20"
          >
            <span className="text-[10px] uppercase tracking-widest">Scroll</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════
          PROBLEM SECTION
         ════════════════════════════════════════════════ */}
      <section className="relative px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <ScrollReveal>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl" style={{ letterSpacing: "-0.03em" }}>
              Pattern recognition looks simple.
              <span className="mt-1 block text-[#8e8a83]">The math isn't.</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-[#8e8a83] sm:text-base">
              Identifying a real setup requires layering dozens of conditions — volume, money flow,
              delivery, sector timing, breadth.{" "}
              <span className="text-[#eeeae3]">We run the math on 2,000+ stocks every night.</span>{" "}
              You wake up to what passed.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FEATURES — Spotlight cards
         ════════════════════════════════════════════════ */}
      <section className="relative px-4 py-10">
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-3">
          {[
            {
              icon: "🔵",
              title: "Sector momentum",
              desc: "Which sectors are waking up with real institutional buying — and which names are leading the move.",
              color: "#8eb4c4",
            },
            {
              icon: "🟢",
              title: "Quiet bases",
              desc: "Stocks coiling near highs with volume dried up. The calm before the next leg up.",
              color: "#7dba96",
            },
            {
              icon: "🟡",
              title: "Outcome tracking",
              desc: "Every triggered setup gets tracked — breakout, failed, or still basing. No cherry-picking.",
              color: "#c4a46a",
            },
          ].map((feat, i) => (
            <ScrollReveal key={feat.title} delay={i * 0.12}>
              <SpotlightCard
                spotlightColor={`${feat.color}15`}
                className="h-full"
              >
                <span className="mb-3 inline-block text-2xl">{feat.icon}</span>
                <h3 className="mb-2 text-base font-semibold text-[#eeeae3]">{feat.title}</h3>
                <p className="text-sm leading-relaxed text-[#8e8a83]">{feat.desc}</p>
                <div className="mt-4 h-px w-12" style={{ background: `linear-gradient(90deg, ${feat.color}, transparent)` }} />
              </SpotlightCard>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          STATS COUNTERS
         ════════════════════════════════════════════════ */}
      <section className="relative px-4 py-20">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 sm:grid-cols-4">
          {[
            { value: 2000, suffix: "+", label: "Stocks scanned", color: "#8eb4c4" },
            { value: 40, suffix: "+", label: "Sectors tracked", color: "#7dba96" },
            { value: 365, suffix: "", label: "Days of data", color: "#c4a46a" },
            { value: 100, suffix: "%", label: "Free tier", color: "#b4a8d2" },
          ].map((stat, i) => (
            <ScrollReveal key={stat.label} delay={i * 0.08} className="text-center">
              <div className="text-3xl font-bold sm:text-4xl" style={{ color: stat.color }}>
                <NumberTicker value={stat.value} suffix={stat.suffix} delay={0.3 + i * 0.15} />
              </div>
              <div className="mt-1 text-xs text-[#8e8a83] sm:text-sm">{stat.label}</div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          TELEGRAM SHOWCASE — Phone mockup
         ════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-4 py-20">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-12 md:flex-row md:gap-16">
          {/* Text side */}
          <div className="flex-1 text-center md:text-left">
            <ScrollReveal>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-[#8e8a83]">
                📲 Also on Telegram
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl" style={{ letterSpacing: "-0.03em" }}>
                Market views in your
                <span className="block text-[#8eb4c4]">Telegram.</span>
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-[#8e8a83]">
                Get sector momentum, delivery analysis, and setup alerts right inside Telegram.
                Free commands included — premium unlocks the full channel with nightly alerts.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              <ul className="mt-6 space-y-2 text-sm text-[#8e8a83]">
                {[
                  { cmd: "/today", desc: "Sector momentum snapshot" },
                  { cmd: "/delivery", desc: "Delivery % analysis for any stock" },
                  { cmd: "/setups", desc: "Premium: curated buy setups" },
                ].map((item) => (
                  <li key={item.cmd} className="flex items-center gap-3">
                    <code className="rounded bg-white/[0.05] px-2 py-0.5 font-mono text-xs text-[#8eb4c4]">{item.cmd}</code>
                    <span>{item.desc}</span>
                  </li>
                ))}
              </ul>
            </ScrollReveal>
            <ScrollReveal delay={0.4}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={TELEGRAM_BOT}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[rgba(142,180,196,0.12)] px-5 py-2.5 text-sm font-medium text-[#8eb4c4] transition-colors hover:bg-[rgba(142,180,196,0.2)] no-underline"
                >
                  🤖 Open bot
                </a>
                <a
                  href={TELEGRAM_CHANNEL}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] px-5 py-2.5 text-sm text-[#8e8a83] transition-colors hover:border-white/20 hover:text-[#eeeae3] no-underline"
                >
                  📢 Free channel
                </a>
              </div>
            </ScrollReveal>
          </div>

          {/* Phone side */}
          <ScrollReveal delay={0.2} className="flex-shrink-0">
            <PhoneMockup />
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          PRICING PREVIEW
         ════════════════════════════════════════════════ */}
      <section className="relative px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <ScrollReveal>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl" style={{ letterSpacing: "-0.03em" }}>
              Simple pricing
            </h2>
            <p className="mt-3 text-sm text-[#8e8a83]">
              Free tier for market views. Premium for the setups that matter.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <div className="mx-auto mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
              {/* Free card */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-left">
                <div className="mb-4 text-sm font-medium text-[#8e8a83]">Free</div>
                <div className="text-3xl font-bold text-[#eeeae3]">₹0</div>
                <div className="mb-5 text-xs text-[#8e8a83]">forever</div>
                <ul className="space-y-2 text-sm text-[#8e8a83]">
                  {["Sector scans", "Coiled bases list", "Delivery analysis", "3 bot queries/day"].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="text-[#7dba96]">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate("/login")}
                  className="mt-6 w-full rounded-lg border border-white/10 bg-transparent py-2.5 text-sm font-medium text-[#eeeae3] transition-colors hover:bg-white/[0.05]"
                >
                  Start free
                </button>
              </div>

              {/* Premium card */}
              <div className="relative rounded-2xl border border-[rgba(142,180,196,0.2)] bg-[rgba(142,180,196,0.04)] p-6 text-left">
                <div className="absolute -top-3 right-4 rounded-full bg-[#8eb4c4] px-3 py-0.5 text-[10px] font-semibold text-[#050506]">
                  POPULAR
                </div>
                <div className="mb-4 text-sm font-medium text-[#8eb4c4]">Premium</div>
                <div className="text-3xl font-bold text-[#eeeae3]">₹299<span className="text-base font-normal text-[#8e8a83]">/mo</span></div>
                <div className="mb-5 text-xs text-[#8e8a83]">or ₹1,999/year (save 44%)</div>
                <ul className="space-y-2 text-sm text-[#8e8a83]">
                  {["Everything in Free", "Curated buy setups", "Outcome tracking", "Telegram premium channel", "Unlimited bot access"].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="text-[#8eb4c4]">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate("/pricing")}
                  className="mt-6 w-full rounded-lg bg-[#8eb4c4] py-2.5 text-sm font-semibold text-[#050506] transition-colors hover:bg-[#a0c4d2]"
                >
                  Upgrade to Premium
                </button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FINAL CTA
         ════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-4 py-24">
        <div className="absolute inset-0 bg-gradient-to-t from-[#050506] via-transparent to-[#050506]" />
        <Orb className="h-[500px] w-[500px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" color="rgba(142,180,196,0.06)" />
        <div className="relative z-10 mx-auto max-w-xl text-center">
          <ScrollReveal>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl" style={{ letterSpacing: "-0.03em" }}>
              Ready to find what&apos;s setting up?
            </h2>
            <p className="mt-3 text-sm text-[#8e8a83]">
              Join traders who check Morrow Desk before the market opens.
            </p>
            <motion.button
              onClick={() => navigate("/login")}
              className="mt-8 rounded-xl bg-[#eeeae3] px-10 py-4 text-base font-semibold text-[#0a0a0b] transition-colors hover:bg-[#d4d0c8]"
              whileHover={{ y: -3, boxShadow: "0 15px 40px -10px rgba(238,234,227,0.3)" }}
              whileTap={{ scale: 0.97 }}
            >
              Get started — it&apos;s free
            </motion.button>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.04] px-4 py-8 text-center">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <span className="text-xs text-[#8e8a83]/60">Indian equities · Post-market updates</span>
          <div className="flex gap-4 text-xs text-[#8e8a83]/40">
            <Link to="/terms" className="transition-colors hover:text-[#8e8a83] no-underline" style={{ color: "inherit" }}>Terms</Link>
            <Link to="/privacy" className="transition-colors hover:text-[#8e8a83] no-underline" style={{ color: "inherit" }}>Privacy</Link>
            <Link to="/guide" className="transition-colors hover:text-[#8e8a83] no-underline" style={{ color: "inherit" }}>Guide</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
