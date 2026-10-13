import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const TABS = [
  { id: "setups", label: "Setups", count: 14 },
  { id: "sectors", label: "Sectors", count: 6 },
  { id: "fundamentals", label: "Fundamentals" },
  { id: "results", label: "Results", count: 38 },
];

const SETUPS_ROWS = [
  { sym: "DIXON", base: "16d tight · 1.3%", vol: "0.42×", trend: "↑↑", state: "ACTING" },
  { sym: "HAL", base: "12d tight · 1.6%", vol: "0.38×", trend: "↑↑", state: "ACTING" },
  { sym: "POLYCAB", base: "19d tight · 1.1%", vol: "0.51×", trend: "↑", state: "ACTING" },
  { sym: "TRENT", base: "11d tight · 1.8%", vol: "0.47×", trend: "↑↑", state: "WATCHING" },
  { sym: "CUMMINSIND", base: "14d tight · 1.4%", vol: "0.35×", trend: "↑", state: "ACTING" },
];

const SECTORS_ROWS = [
  { name: "CAPITAL GOODS", state: "BREAKOUT", flow: "+₹842 Cr", leaders: "HAL · BEL · SIEMENS" },
  { name: "PRIVATE BANKS", state: "CROSSING", flow: "+₹615 Cr", leaders: "HDFCBANK · ICICIBANK" },
  { name: "CONSUMER DURABLES", state: "BREAKOUT", flow: "+₹390 Cr", leaders: "DIXON · VOLTAS" },
  { name: "PHARMA", state: "PULLBACK", flow: "+₹184 Cr", leaders: "SUNPHARMA · LUPIN" },
  { name: "AUTO ANCILLARIES", state: "CROSSING", flow: "+₹276 Cr", leaders: "UNOMINDA · ENDURANCE" },
];

const FUNDAMENTALS_ROWS = [
  { sym: "DIXON", mcap: "₹89.4K Cr", pe: "68.2x", rev: "+38.4%", pat: "+47.1%", trend: "↑↑" },
  { sym: "POLYCAB", mcap: "₹84.2K Cr", pe: "24.6x", rev: "+26.4%", pat: "+38.1%", trend: "↑↑" },
  { sym: "HAL", mcap: "₹3.1L Cr", pe: "34.1x", rev: "+18.2%", pat: "+29.0%", trend: "↑" },
  { sym: "CUMMINSIND", mcap: "₹1.0L Cr", pe: "41.8x", rev: "+21.7%", pat: "+31.5%", trend: "↑" },
  { sym: "TRENT", mcap: "₹2.4L Cr", pe: "92.0x", rev: "+44.2%", pat: "+52.8%", trend: "↑↑" },
];

const RESULTS_DAYS = [
  { day: "Mon 26", items: ["ICICIBANK"] },
  { day: "Tue 27", items: ["MFSL", "SONABLW"] },
  { day: "Wed 28", active: true, items: ["LT", "HINDUNILVR", "ADANIPORTS"], more: "+8" },
  { day: "Thu 29", items: ["COALINDIA", "DABUR"], more: "+14" },
  { day: "Fri 30", items: ["NAVINFLUOR", "MARICO"] },
];

const DRAWER_CANDLES = [
  { o: 30, c: 36, h: 39, l: 27, up: true },
  { o: 36, c: 34, h: 38, l: 31, up: false },
  { o: 34, c: 42, h: 45, l: 33, up: true },
  { o: 42, c: 40, h: 44, l: 38, up: false },
  { o: 40, c: 43, h: 45, l: 39, up: true },
  { o: 43, c: 42, h: 44, l: 40, up: false },
  { o: 42, c: 44, h: 45, l: 41, up: true },
  { o: 44, c: 43, h: 45, l: 42, up: false },
  { o: 43, c: 44, h: 46, l: 42, up: true },
  { o: 44, c: 60, h: 63, l: 43, up: true },
  { o: 60, c: 72, h: 75, l: 58, up: true },
  { o: 72, c: 70, h: 74, l: 68, up: false },
  { o: 70, c: 82, h: 86, l: 69, up: true },
  { o: 82, c: 88, h: 91, l: 80, up: true },
];

export default function DashboardPreview() {
  const [tab, setTab] = useState("setups");

  return (
    <div className="relative mx-auto max-w-6xl">
      <div className="overflow-hidden rounded-2xl border border-white/[0.09] bg-[#131418] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.85)]">
        {/* Top app bar */}
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#17181d] px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-white/[0.12]" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/[0.12]" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/[0.12]" />
            </div>
            <span className="h-3.5 w-px bg-white/[0.08]" />
            <div className="flex items-center gap-1">
              {TABS.map((t) => {
                const active = tab === t.id;
                return (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setTab(t.id)}
                    onKeyDown={(e) => e.key === "Enter" && setTab(t.id)}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                      active
                        ? "bg-white/[0.08] text-[#eeeae3]"
                        : "text-[#8e8a83] hover:text-[#eeeae3]"
                    }`}
                  >
                    <span>{t.label}</span>
                    {t.count != null && (
                      <span
                        className={`rounded px-1 font-mono text-[10px] ${
                          active ? "bg-[#8eb4c4]/20 text-[#8eb4c4]" : "bg-white/[0.04] text-[#8e8a83]/70"
                        }`}
                      >
                        {t.count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="hidden items-center gap-2 font-mono text-[11px] text-[#8e8a83]/70 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7dba96]" />
            <span>NSE</span>
          </div>
        </div>

        {/* Workspace body: Left table + Right stock drawer */}
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left 8 cols */}
          <div className="border-b border-white/[0.06] p-4 lg:col-span-8 lg:border-b-0 lg:border-r">
            <AnimatePresence mode="wait">
              {tab === "setups" && (
                <motion.div
                  key="setups"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden rounded-xl border border-white/[0.05] bg-[#111215]"
                >
                  <div className="grid grid-cols-12 border-b border-white/[0.05] bg-white/[0.02] px-3.5 py-2 font-mono text-[10px] uppercase tracking-wider text-[#8e8a83]/70">
                    <span className="col-span-3">Stock</span>
                    <span className="col-span-4">Base</span>
                    <span className="col-span-2 text-right">Vol</span>
                    <span className="col-span-1 text-center">EPS</span>
                    <span className="col-span-2 text-right">State</span>
                  </div>
                  {SETUPS_ROWS.map((r, i) => (
                    <div
                      key={r.sym}
                      className={`grid grid-cols-12 items-center px-3.5 py-2.5 text-xs ${
                        i === 0 ? "bg-[rgba(142,180,196,0.06)]" : ""
                      } ${i < SETUPS_ROWS.length - 1 ? "border-b border-white/[0.03]" : ""}`}
                    >
                      <span className="col-span-3 font-mono font-semibold text-[#eeeae3]">{r.sym}</span>
                      <span className="col-span-4 font-mono text-[11px] text-[#8e8a83]">{r.base}</span>
                      <span className="col-span-2 text-right font-mono text-[11px] text-[#8e8a83]">{r.vol}</span>
                      <span className="col-span-1 text-center font-mono text-xs text-[#7dba96]">{r.trend}</span>
                      <div className="col-span-2 text-right">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 font-mono text-[10px] ${
                            r.state === "ACTING"
                              ? "bg-[rgba(125,186,150,0.12)] text-[#7dba96]"
                              : "bg-[rgba(196,164,106,0.12)] text-[#c4a46a]"
                          }`}
                        >
                          {r.state}
                        </span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {tab === "sectors" && (
                <motion.div
                  key="sectors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden rounded-xl border border-white/[0.05] bg-[#111215]"
                >
                  <div className="grid grid-cols-12 border-b border-white/[0.05] bg-white/[0.02] px-3.5 py-2 font-mono text-[10px] uppercase tracking-wider text-[#8e8a83]/70">
                    <span className="col-span-4">Sector</span>
                    <span className="col-span-2">State</span>
                    <span className="col-span-2 text-right">Flow</span>
                    <span className="col-span-4 text-right">Leaders</span>
                  </div>
                  {SECTORS_ROWS.map((r, i) => (
                    <div
                      key={r.name}
                      className={`grid grid-cols-12 items-center px-3.5 py-2.5 text-xs ${
                        i < SECTORS_ROWS.length - 1 ? "border-b border-white/[0.03]" : ""
                      }`}
                    >
                      <span className="col-span-4 font-mono font-medium text-[#eeeae3]">{r.name}</span>
                      <span
                        className="col-span-2 font-mono text-[11px]"
                        style={{
                          color:
                            r.state === "BREAKOUT"
                              ? "#7dba96"
                              : r.state === "CROSSING"
                              ? "#8eb4c4"
                              : "#c4a46a",
                        }}
                      >
                        {r.state}
                      </span>
                      <span className="col-span-2 text-right font-mono text-[11px] text-[#7dba96]">{r.flow}</span>
                      <span className="col-span-4 truncate text-right font-mono text-[10.5px] text-[#8e8a83]">
                        {r.leaders}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}

              {tab === "fundamentals" && (
                <motion.div
                  key="fundamentals"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden rounded-xl border border-white/[0.05] bg-[#111215]"
                >
                  <div className="grid grid-cols-12 border-b border-white/[0.05] bg-white/[0.02] px-3.5 py-2 font-mono text-[10px] uppercase tracking-wider text-[#8e8a83]/70">
                    <span className="col-span-3">Symbol</span>
                    <span className="col-span-2 text-right">Mkt Cap</span>
                    <span className="col-span-2 text-right">P/E</span>
                    <span className="col-span-2 text-right">Rev YoY</span>
                    <span className="col-span-2 text-right">PAT YoY</span>
                    <span className="col-span-1 text-right">EPS</span>
                  </div>
                  {FUNDAMENTALS_ROWS.map((r, i) => (
                    <div
                      key={r.sym}
                      className={`grid grid-cols-12 items-center px-3.5 py-2.5 text-xs ${
                        i < FUNDAMENTALS_ROWS.length - 1 ? "border-b border-white/[0.03]" : ""
                      }`}
                    >
                      <span className="col-span-3 font-mono font-semibold text-[#eeeae3]">{r.sym}</span>
                      <span className="col-span-2 text-right font-mono text-[11px] text-[#8e8a83]">{r.mcap}</span>
                      <span className="col-span-2 text-right font-mono text-[11px] text-[#eeeae3]">{r.pe}</span>
                      <span className="col-span-2 text-right font-mono text-[11px] text-[#7dba96]">{r.rev}</span>
                      <span className="col-span-2 text-right font-mono text-[11px] text-[#7dba96]">{r.pat}</span>
                      <span className="col-span-1 text-right font-mono text-xs text-[#7dba96]">{r.trend}</span>
                    </div>
                  ))}
                </motion.div>
              )}

              {tab === "results" && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="grid grid-cols-5 gap-2"
                >
                  {RESULTS_DAYS.map((d) => (
                    <div
                      key={d.day}
                      className={`min-h-[172px] rounded-xl border p-2.5 ${
                        d.active
                          ? "border-[#8eb4c4]/50 bg-[rgba(142,180,196,0.06)]"
                          : "border-white/[0.05] bg-[#111215]"
                      }`}
                    >
                      <div className="mb-2 font-mono text-[10.5px] font-medium text-[#8e8a83]">
                        {d.day}
                      </div>
                      <div className="space-y-1.5">
                        {d.items.map((sym) => (
                          <div
                            key={sym}
                            className="truncate rounded bg-white/[0.05] px-1.5 py-1 font-mono text-[10px] text-[#eeeae3]"
                          >
                            {sym}
                          </div>
                        ))}
                        {d.more && (
                          <div className="pt-0.5 font-mono text-[10px] text-[#8eb4c4]">{d.more}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right 4 cols: Stock Drawer preview */}
          <div className="bg-[#111215]/70 p-4 lg:col-span-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-[#eeeae3]">DIXON</span>
                <span className="rounded bg-[rgba(125,186,150,0.12)] px-1.5 py-0.5 font-mono text-[10px] text-[#7dba96]">
                  +4.8%
                </span>
              </div>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#8eb4c4">
                <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
              </svg>
            </div>

            {/* Mini Candlestick chart */}
            <div className="mt-3 rounded-xl border border-white/[0.05] bg-[#141519] p-3">
              <div className="relative flex h-24 items-end gap-1">
                {DRAWER_CANDLES.map((c, i) => {
                  const top = 100 - Math.max(c.o, c.c);
                  const body = Math.max(Math.abs(c.c - c.o), 4);
                  const wickTop = 100 - c.h;
                  const wickH = c.h - c.l;
                  const col = c.up ? "#7dba96" : "rgba(238,234,227,0.28)";
                  return (
                    <div key={i} className="relative h-full flex-1">
                      <div
                        className="absolute left-1/2 w-px -translate-x-1/2"
                        style={{ top: `${wickTop}%`, height: `${wickH}%`, background: col, opacity: 0.6 }}
                      />
                      <div
                        className="absolute inset-x-0.5 rounded-[1px]"
                        style={{ top: `${top}%`, height: `${body}%`, background: col }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Drawer key numbers */}
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {[
                { k: "Mkt Cap", v: "₹89.4K" },
                { k: "PAT YoY", v: "+47.1%", good: true },
                { k: "Deliv", v: "64.2%" },
              ].map((s) => (
                <div
                  key={s.k}
                  className="rounded-lg border border-white/[0.04] bg-white/[0.015] px-2 py-1.5"
                >
                  <div className="font-mono text-[9px] uppercase text-[#8e8a83]/60">{s.k}</div>
                  <div
                    className="mt-0.5 font-mono text-[11px] font-medium"
                    style={{ color: s.good ? "#7dba96" : "#eeeae3" }}
                  >
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
