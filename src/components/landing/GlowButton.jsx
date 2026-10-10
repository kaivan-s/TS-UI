import { motion } from "motion/react";

export default function GlowButton({ children, onClick, className = "" }) {
  return (
    <motion.button
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-xl px-8 py-3.5 text-base font-semibold text-[#0a0a0b] transition-all ${className}`}
      whileHover={{ y: -3, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Animated gradient border */}
      <span className="absolute inset-0 animate-glow-spin rounded-xl bg-[conic-gradient(from_0deg,#8eb4c4,#7dba96,#c4a46a,#b4a8d2,#8eb4c4)] p-[2px]">
        <span className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#eeeae3] transition-colors group-hover:bg-[#d4d0c8]" />
      </span>
      {/* Text */}
      <span className="relative z-10">{children}</span>
      {/* Hover glow */}
      <span className="absolute inset-0 -z-10 rounded-xl opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-60 bg-[conic-gradient(from_0deg,#8eb4c4,#7dba96,#c4a46a,#b4a8d2,#8eb4c4)]" />
    </motion.button>
  );
}
