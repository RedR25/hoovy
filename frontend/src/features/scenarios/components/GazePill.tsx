import { useState } from "react";
import type { GazeStatus } from "@/features/scenarios/hooks/useGaze";

interface Props {
  status: GazeStatus;
  hasSample: boolean;
  facePresent: boolean;
  awaySeconds: number;
  errorMessage: string | null;
}

interface PillLook {
  border: string;
  text: string;
  bg: string;
  dot: string;
  label: string;
  tooltip: string;
}

function lookFor(
  status: GazeStatus,
  hasSample: boolean,
  facePresent: boolean,
  awaySeconds: number,
  errorMessage: string | null,
): PillLook {
  if (status === "denied") {
    return {
      border: "border-red-400",
      text: "text-red-700",
      bg: "bg-red-50",
      dot: "bg-red-500",
      label: "Cam blocked",
      tooltip: "Camera permission denied. Click the lock icon in the address bar → Camera → Allow, then refresh.",
    };
  }
  if (status === "failed") {
    return {
      border: "border-red-400",
      text: "text-red-700",
      bg: "bg-red-50",
      dot: "bg-red-500",
      label: "Failed",
      tooltip: `Face tracker failed to start: ${errorMessage ?? "unknown error"}`,
    };
  }
  if (status === "pending" || !hasSample) {
    return {
      border: "border-gray-300",
      text: "text-gray-500",
      bg: "bg-gray-50",
      dot: "bg-gray-400 animate-pulse",
      label: "Loading…",
      tooltip: "Loading the face tracker. Allow the camera prompt if it appears. First detection takes a few seconds.",
    };
  }
  if (facePresent) {
    return {
      border: "border-green-400",
      text: "text-green-700",
      bg: "bg-green-50",
      dot: "bg-green-500 animate-pulse",
      label: "Watching",
      tooltip: "Face detected. The kid is in front of the camera.",
    };
  }
  return {
    border: "border-yellow-400",
    text: "text-yellow-700",
    bg: "bg-yellow-50",
    dot: "bg-yellow-500 animate-pulse",
    label: `Away ${awaySeconds}s`,
    tooltip: "No face detected. The kid may have walked away or turned their head.",
  };
}

export function GazePill({ status, hasSample, facePresent, awaySeconds, errorMessage }: Props) {
  const [open, setOpen] = useState(false);
  const look = lookFor(status, hasSample, facePresent, awaySeconds, errorMessage);

  return (
    <div className="relative">
      <button
        type="button"
        title={look.tooltip}
        onClick={() => setOpen((v) => !v)}
        className={[
          "flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border-2 cursor-pointer hover:opacity-90 transition-opacity",
          look.border,
          look.text,
          look.bg,
        ].join(" ")}
      >
        <span className={["w-2 h-2 rounded-full", look.dot].join(" ")} />
        <span>{look.label}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-30 w-72 rounded-2xl bg-white border border-gray-200 shadow-lg p-3 text-xs">
          <p className="font-bold text-gray-800 mb-1">Face presence · {status}</p>
          <p className="text-gray-600 leading-relaxed">{look.tooltip}</p>
          <p className="mt-2 text-gray-700">
            This signal is binary: face visible or not. We don't try to track
            where on the screen the kid is looking — that wasn't reliable enough
            to trust.
          </p>
          {errorMessage && (
            <p className="mt-2 text-red-600 font-mono break-words">
              {errorMessage}
            </p>
          )}
          <hr className="my-2 border-gray-200" />
          <ul className="text-gray-600 leading-relaxed space-y-1">
            <li><b>pending</b> — loading tracker / waiting on camera</li>
            <li><b>tracking</b> — face detected (or recently was)</li>
            <li><b>denied</b> — camera permission blocked</li>
            <li><b>failed</b> — tracker error</li>
          </ul>
        </div>
      )}
    </div>
  );
}
