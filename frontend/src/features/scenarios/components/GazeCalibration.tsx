import { useState } from "react";

const TARGETS = [
  { id: "tl", label: "Top left", style: { top: "10%", left: "10%" } },
  { id: "tr", label: "Top right", style: { top: "10%", right: "10%" } },
  { id: "c", label: "Center", style: { top: "50%", left: "50%", transform: "translate(-50%,-50%)" } },
  { id: "bl", label: "Bottom left", style: { bottom: "10%", left: "10%" } },
  { id: "br", label: "Bottom right", style: { bottom: "10%", right: "10%" } },
] as const;

const TOTAL = TARGETS.length;

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

export function GazeCalibration({ onComplete, onSkip }: Props) {
  const [clicked, setClicked] = useState<Set<string>>(new Set());

  function handleClick(id: string) {
    const next = new Set(clicked);
    next.add(id);
    setClicked(next);
    if (next.size >= TOTAL) {
      localStorage.setItem("hoovy_gaze_calibrated", "true");
      onComplete();
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-indigo-950/95 flex flex-col items-center justify-center gap-6 font-friendly">
      {/* Instruction */}
      <div className="text-center px-6 max-w-sm">
        <p className="text-white text-2xl font-extrabold mb-2">Look here and click!</p>
        <p className="text-indigo-200 text-sm leading-relaxed">
          Click each dot so the app can learn where your eyes are. We use your
          camera <span className="font-bold">only on this device</span> — video
          never leaves your device.
        </p>
        <p className="text-indigo-300 text-xs mt-2">
          {clicked.size}/{TOTAL} dots clicked
        </p>
      </div>

      {/* Targets */}
      {TARGETS.map((t) => {
        const done = clicked.has(t.id);
        return (
          <button
            key={t.id}
            aria-label={t.label}
            onClick={() => handleClick(t.id)}
            style={t.style}
            className={[
              "absolute w-12 h-12 rounded-full border-4 transition-all duration-200",
              done
                ? "bg-green-400 border-green-200 scale-90 cursor-default"
                : "bg-yellow-400 border-yellow-200 hover:scale-110 active:scale-95 animate-pulse",
            ].join(" ")}
          />
        );
      })}

      {/* Skip */}
      <button
        onClick={onSkip}
        className="absolute bottom-8 text-indigo-300 text-sm underline hover:text-white transition-colors"
      >
        Skip for now
      </button>
    </div>
  );
}
