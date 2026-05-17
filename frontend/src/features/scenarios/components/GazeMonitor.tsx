interface Props {
  facePresent: boolean;
  awaySeconds: number;
}

export function GazeMonitor({ facePresent, awaySeconds }: Props) {
  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-2 right-2 z-[9999] bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none font-mono">
      {facePresent ? "FACE" : "AWAY"} | {awaySeconds}s
    </div>
  );
}
