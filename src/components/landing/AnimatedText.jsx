import { motion } from "motion/react";
import { cn } from "../../lib/utils.js";

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

export function LetterPull({ text, className, delay = 0 }) {
  const letters = text.split("");
  return (
    <span className={cn("inline-flex overflow-hidden", className)}>
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: 0.5,
            delay: delay + i * 0.04,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="inline-block"
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </span>
  );
}

export function GradientText({ children, className }) {
  return (
    <span
      className={cn(
        "animate-gradient-shift bg-[linear-gradient(90deg,#eeeae3,#8eb4c4,#7dba96,#c4a46a,#eeeae3)] bg-[length:300%_100%] bg-clip-text text-transparent",
        className,
      )}
    >
      {children}
    </span>
  );
}

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

export function TypeWriter({ words, className }) {
  return (
    <span className={cn("relative inline-block", className)}>
      {words.map((word, i) => (
        <motion.span
          key={word}
          className="absolute left-0"
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [10, 0, 0, -10],
            filter: ["blur(4px)", "blur(0px)", "blur(0px)", "blur(4px)"],
          }}
          transition={{
            duration: 3,
            delay: i * 3,
            repeat: Infinity,
            repeatDelay: (words.length - 1) * 3,
            ease: "easeInOut",
          }}
        >
          {word}
        </motion.span>
      ))}
      <span className="invisible">{words.reduce((a, b) => a.length > b.length ? a : b)}</span>
    </span>
  );
}
