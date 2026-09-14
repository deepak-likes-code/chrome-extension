import React from "react";

interface Props {
  minutes: number;
  seconds: number;
  progress?: number; // 0..1
}

const R = 137;
const C = 2 * Math.PI * R;

const FocusTimerRing: React.FC<Props> = ({ minutes, seconds, progress = 0.32 }) => {
  const label = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return (
    <div className="focus-timer-ring relative h-[300px] w-[300px]">
      <svg viewBox="0 0 300 300" className="h-full w-full -rotate-90">
        <circle cx="150" cy="150" r={R} fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="4" />
        <circle
          cx="150"
          cy="150"
          r={R}
          fill="none"
          stroke="url(#focusGrad)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - progress)}
        />
        <defs>
          <linearGradient id="focusGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A7F3D0" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="focus-timer-value text-[66px] font-light tracking-[-0.055em] text-white leading-none">{label}</div>
        <div className="mt-3 text-[11px] font-medium uppercase text-white/60" style={{ letterSpacing: "0.4em" }}>
          Focus
        </div>
      </div>
      {/* head dot */}
      <div
        className="absolute h-3 w-3 rounded-full bg-white shadow"
        style={{
          left: `calc(50% + ${R * Math.sin(progress * Math.PI * 2)}px - 6px)`,
          top: `calc(50% - ${R * Math.cos(progress * Math.PI * 2)}px - 6px)`,
        }}
      />
    </div>
  );
};

export default FocusTimerRing;
