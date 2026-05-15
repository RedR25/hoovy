interface Props {
  gazePosition: { x: number; y: number } | null;
  currentlyOnScreen: boolean;
  offScreenSeconds: number;
}

export function GazeMonitor({ gazePosition, currentlyOnScreen, offScreenSeconds }: Props) {
  if (!import.meta.env.DEV) return null;
  if (!gazePosition) return null;

  return (
    <>
      {/* Gaze dot */}
      <div
        className="fixed z-[9999] w-4 h-4 rounded-full bg-red-500/70 pointer-events-none"
        style={{
          left: gazePosition.x - 8,
          top: gazePosition.y - 8,
          transform: "none",
        }}
      />
      {/* HUD */}
      <div className="fixed bottom-2 right-2 z-[9999] bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none font-mono">
        {currentlyOnScreen ? "ON" : "OFF"} | {offScreenSeconds}s off
      </div>
    </>
  );
}
