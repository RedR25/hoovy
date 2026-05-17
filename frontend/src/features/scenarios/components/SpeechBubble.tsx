interface Props {
  text: string;
  /**
   * Playback progress, 0..1. When provided, reveal is locked to actual audio
   * position (passed from useAudioOut.currentTime / duration in ScenarioPage).
   * When omitted, the bubble shows full text immediately.
   */
  progress?: number;
}

export function SpeechBubble({ text, progress }: Props) {
  const t = text ?? "";
  const visible =
    progress === undefined || progress >= 1
      ? t.length
      : Math.max(0, Math.min(t.length, Math.floor(progress * t.length)));
  const done = visible >= t.length;

  return (
    <div className="relative bg-white rounded-3xl shadow-md px-6 py-4 text-gray-800 font-semibold text-lg leading-relaxed max-w-prose min-h-[3.5rem]">
      {t.slice(0, visible)}
      {!done && (
        <span className="inline-block w-0.5 h-5 bg-hoovy-purple align-middle ml-0.5 animate-pulse" />
      )}
      <span className="absolute left-[-12px] top-6 w-0 h-0 border-y-8 border-y-transparent border-r-[12px] border-r-white" />
    </div>
  );
}
