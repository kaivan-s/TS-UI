import { useEffect, useRef, useState } from "react";
import { motion, useInView, useSpring, useTransform } from "motion/react";

export default function NumberTicker({ value, suffix = "", prefix = "", className, delay = 0.2 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const spring = useSpring(0, { mass: 0.8, stiffness: 70, damping: 15 });
  const display = useTransform(spring, (v) => `${prefix}${Math.round(v).toLocaleString()}${suffix}`);

  useEffect(() => {
    if (isInView) {
      const t = setTimeout(() => spring.set(value), delay * 1000);
      return () => clearTimeout(t);
    }
  }, [isInView, value, spring, delay]);

  return <motion.span ref={ref} className={className}>{display}</motion.span>;
}
