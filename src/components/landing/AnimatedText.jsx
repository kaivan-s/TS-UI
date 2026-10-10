import { motion } from "motion/react";

export function TextReveal({ children, className, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function WordRotate({ words, className, duration = 3 }) {
  return (
    <motion.span className={cn("inline-block", className)}>
      {words.map((word, i) => (
        <motion.span
          key={word}
          className="absolute"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [20, 0, 0, -20],
          }}
          transition={{
            duration,
            delay: i * duration,
            repeat: Infinity,
            repeatDelay: (words.length - 1) * duration,
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}

import { cn } from "../../lib/utils.js";

export function ShinyText({ children, className }) {
  return (
    <span
      className={cn(
        "inline-flex animate-shine bg-[linear-gradient(110deg,rgba(142,180,196,0.5),45%,rgba(238,234,227,1),55%,rgba(142,180,196,0.5))] bg-[length:200%_100%] bg-clip-text text-transparent",
        className,
      )}
    >
      {children}
    </span>
  );
}
