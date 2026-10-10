import { cn } from "../../lib/utils.js";

export default function BorderBeam({
  size = 200,
  duration = 8,
  delay = 0,
  color = "rgba(142,180,196,0.6)",
  className,
}) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]", className)}>
      <div
        className="absolute inset-[-2px] animate-border-beam rounded-[inherit]"
        style={{
          background: `conic-gradient(from 0deg, transparent 0%, transparent 75%, ${color} 85%, transparent 100%)`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
        }}
      />
      <div className="absolute inset-[1px] rounded-[inherit] bg-[inherit]" />
    </div>
  );
}
