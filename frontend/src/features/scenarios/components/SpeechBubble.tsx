import { useEffect, useRef, useState } from "react";

interface Props {
  text: string;
  /** Total reveal time in ms. If omitted, defaults to ~35 ms per character. */
  durationMs?: number;
}

export function SpeechBubble({ text, durationMs }: Props) {
  const [visible, setVisible] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Clear previous timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setVisible(0);

    if (!text) return;

    const totalMs = durationMs ?? text.length * 35;
    const perChar = totalMs / text.length;

    for (let i = 1; i <= text.length; i++) {
      const t = setTimeout(() => setVisible(i), perChar * i);
      timersRef.current.push(t);
    }

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [text, durationMs]);

  const done = visible >= text.length;

  return (
    <div className="relative bg-white rounded-3xl shadow-md px-6 py-4 text-gray-800 font-semibold text-lg leading-relaxed max-w-prose min-h-[3.5rem]">
      {text.slice(0, visible)}
      {!done && (
        <span className="inline-block w-0.5 h-5 bg-hoovy-purple align-middle ml-0.5 animate-pulse" />
      )}
      {/* Tail pointing left toward the teacher avatar */}
      <span className="absolute left-[-12px] top-6 w-0 h-0 border-y-8 border-y-transparent border-r-[12px] border-r-white" />
    </div>
  );
}
