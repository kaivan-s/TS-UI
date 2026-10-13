import { motion } from "motion/react";

export default function GlowButton({ children, onClick, className = "" }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{ border: "1px solid rgba(238,234,227,0.9)" }}
      className={`group inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-[#eeeae3] px-7 py-3.5 text-sm font-semibold tracking-tight text-[#111215] shadow-[0_1px_0_0_rgba(255,255,255,0.4)_inset,0_12px_30px_-10px_rgba(238,234,227,0.25)] transition-colors duration-200 hover:bg-[#e2ddd4] ${className}`}
    >
      <span>{children}</span>
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        className="transition-transform duration-200 group-hover:translate-x-0.5"
      >
        <path
          d="M3.5 8h9M8.5 4l4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.button>
  );
}
