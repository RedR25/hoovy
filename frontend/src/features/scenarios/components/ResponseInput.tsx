import type { MouseEvent } from "react";
import type { Choice, ResponseType } from "@/features/scenarios/types";

interface ResponseInputProps {
  responseType: ResponseType;
  choices?: Choice[];
  isRecording: boolean;
  isEvaluating: boolean;
  disabled: boolean;
  onToggle: (ev?: MouseEvent<HTMLElement>) => void;
  onChoice?: (choiceId: string, ev?: MouseEvent<HTMLElement>) => void;
}

export function ResponseInput({
  responseType,
  choices = [],
  isRecording,
  isEvaluating,
  disabled,
  onToggle,
  onChoice,
}: ResponseInputProps) {
  const label = isEvaluating
    ? "Teacher is listening..."
    : isRecording
      ? "Tap to stop"
      : "Tap to speak";

  const showMic = responseType === "voice" || responseType === "voice_or_choice";
  const showChoices =
    (responseType === "choice" || responseType === "voice_or_choice") &&
    choices.length > 0;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Evaluating overlay indicator */}
      {isEvaluating && (
        <div className="flex items-center gap-2 text-hoovy-purple font-semibold text-sm animate-pulse">
          <div className="w-3 h-3 rounded-full bg-hoovy-purple animate-ping" />
          Teacher is listening...
        </div>
      )}

      {/* Mic button */}
      {showMic && (
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={(ev) => onToggle(ev)}
            disabled={disabled || isEvaluating}
            aria-label={label}
            className={[
              "w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-lg transition-all active:scale-95",
              isRecording
                ? "bg-red-500 animate-pulse ring-4 ring-red-300"
                : "bg-hoovy-pink hover:opacity-90",
              disabled || isEvaluating
                ? "opacity-40 cursor-not-allowed"
                : "cursor-pointer",
            ].join(" ")}
          >
            {isRecording ? "⏹️" : "🎤"}
          </button>
          <p className="text-sm text-gray-500 font-semibold">{label}</p>
        </div>
      )}

      {/* Divider for voice_or_choice */}
      {responseType === "voice_or_choice" && showChoices && (
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
          or pick one
        </p>
      )}

      {/* Choice buttons */}
      {showChoices && (
        <div className="flex flex-col gap-3 w-full">
          {choices.map((choice) => (
            <button
              key={choice.id}
              disabled={disabled || isEvaluating}
              onClick={(ev) => onChoice?.(choice.id, ev)}
              className={[
                "w-full px-5 rounded-3xl border-2 font-bold text-left transition-all active:scale-95",
                "min-h-[80px] md:min-h-[100px]",
                "text-gray-800 bg-white border-gray-200",
                "hover:border-hoovy-blue hover:bg-blue-50",
                disabled || isEvaluating
                  ? "opacity-40 cursor-not-allowed"
                  : "cursor-pointer",
              ].join(" ")}
            >
              {choice.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
