import { cn } from "../../lib/utils.js";

export function RetroGrid({ className }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden [perspective:200px]", className)}>
      <div className="absolute inset-0 [transform:rotateX(35deg)]">
        <div
          className="animate-grid-move"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(142,180,196,0.06) 1px, transparent 0),
              linear-gradient(to bottom, rgba(142,180,196,0.06) 1px, transparent 0)
            `,
            backgroundSize: "60px 60px",
            backgroundRepeat: "repeat",
            position: "absolute",
            inset: "-50%",
            width: "200%",
            height: "200%",
          }}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#050506] via-[#050506]/80 to-transparent" />
    </div>
  );
}

export function BackgroundBeams() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="animate-beam absolute h-[1px] w-[300px] opacity-20"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(142,180,196,0.6), transparent)",
            top: `${15 + i * 14}%`,
            left: "-300px",
            animationDelay: `${i * 2.4}s`,
            animationDuration: `${8 + i * 1.5}s`,
          }}
        />
      ))}
    </div>
  );
}
