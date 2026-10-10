import { motion } from "motion/react";

const MESSAGES = [
  { type: "command", text: "/today" },
  { type: "bot", text: "📊 Market today – 09 Oct\n\n🔵 CROSSING (strong flow):\n• BANKS — 4 new names\n• AUTO — 2 add-ons\n\n🟢 BREAKOUT:\n• CHEMICAL — 3 triggers\n• PHARMA — 1 follow-through" },
  { type: "command", text: "/delivery RELIANCE" },
  { type: "bot", text: "📦 RELIANCE delivery\n\nDel %: 62.4% (▲ rising 3d)\nDel vs avg: 1.8× above\nPrice trend: +2.1% this week\n\n✅ Smart money accumulating" },
  { type: "command", text: "/setups" },
  { type: "bot", text: "🎯 Premium setups\n\n• HDFCBANK — Coil near ATH, 12d tight\n• INFY — Volume dry-up, base forming\n• TITAN — Sector thrust + quiet base" },
];

export default function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[300px]">
      {/* Phone frame */}
      <div className="rounded-[2.5rem] border border-white/10 bg-[#141519] p-3 shadow-2xl shadow-black/50">
        {/* Notch */}
        <div className="mx-auto mb-2 h-5 w-24 rounded-full bg-black" />
        {/* Screen */}
        <div className="h-[420px] overflow-hidden rounded-[2rem] bg-[#18191e] px-3 py-4">
          {/* Header */}
          <div className="mb-3 flex items-center gap-2 border-b border-white/5 pb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(142,180,196,0.15)]">
              <span className="text-xs">📈</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-[#eeeae3]">Morrow Desk Bot</div>
              <div className="text-[10px] text-[#8e8a83]">@nse_circuit_bot</div>
            </div>
          </div>
          {/* Messages */}
          <div className="flex flex-col gap-2.5">
            {MESSAGES.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.8 + i * 0.5, duration: 0.4, ease: "easeOut" }}
                className={
                  msg.type === "command"
                    ? "ml-auto max-w-[85%] rounded-xl rounded-br-sm bg-[rgba(142,180,196,0.18)] px-3 py-1.5"
                    : "mr-auto max-w-[90%] rounded-xl rounded-bl-sm bg-white/[0.04] px-3 py-2"
                }
              >
                <pre className="whitespace-pre-wrap font-sans text-[10px] leading-[1.5] text-[#eeeae3]/90">
                  {msg.text}
                </pre>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      {/* Glow behind phone */}
      <div className="absolute -inset-10 -z-10 rounded-full bg-[rgba(142,180,196,0.06)] blur-3xl" />
    </div>
  );
}
