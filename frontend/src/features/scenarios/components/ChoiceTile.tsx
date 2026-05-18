import type { Choice } from "@/features/scenarios/types";
import { Emoji3D } from "@/components/ui/Emoji3D";
import type { Emoji3DName } from "@/components/ui/Emoji3D";

const KEYWORD_TO_EMOJI: Array<[RegExp, Emoji3DName]> = [
  [/^(hi|hey)\b/i, "wave"],
  [/^hello\b/i, "smile"],
  [/(good ?bye|bye)\b/i, "wave"],
  [/(cookie|biscuit)/i, "cookie"],
  [/(snack|food)/i, "cookie"],
  [/(juice|drink|milk|water)/i, "juice"],
  [/(happy|smile|good|great)/i, "smile"],
  [/(sad|cry)/i, "sad"],
  [/(angry|mad)/i, "angry"],
  [/(scared|afraid|worried)/i, "pleadingFace"],
  [/(o'?clock|time|hour|minute)/i, "clock"],
  [/(train|station|locomotive)/i, "train"],
  [/(thank|please)/i, "pleadingFace"],
  [/(yes|sure|okay|ok)/i, "thumbsUp"],
  [/(no|nope|don'?t)/i, "thumbsDown"],
  [/(money|dollar|coin|pay)/i, "moneyBag"],
  [/(help)/i, "pleadingFace"],
  [/(sorry)/i, "pleadingFace"],
  [/(school|teacher|class)/i, "schoolBuilding"],
  [/(home|house)/i, "house"],
];

function pickEmoji(text: string): Emoji3DName {
  for (const [re, name] of KEYWORD_TO_EMOJI) {
    if (re.test(text)) return name;
  }
  return "thoughtBubble";
}

interface Props {
  choice: Choice;
  disabled?: boolean;
  onSelect: (id: string) => void;
}

/**
 * Cream-backed equal-width tile: big centered emoji on top, multi-line bold
 * label below. Designed to live in a `grid grid-cols-3` row — no min-width,
 * no hard truncate.
 */
export function ChoiceTile({ choice, disabled, onSelect }: Props) {
  const emoji = pickEmoji(choice.text);

  return (
    <button
      onClick={() => onSelect(choice.id)}
      disabled={disabled}
      className={[
        "flex flex-col items-center justify-start gap-1.5 w-full px-2 pt-3 pb-2",
        "rounded-2xl bg-[#FFF7EA]",
        "border-[3px] border-[#F4E4C3]",
        "shadow-[0_3px_0_rgba(0,0,0,0.06)]",
        "active:translate-y-[3px] active:!shadow-none transition-all duration-100",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-[#FFFBF3]",
      ].join(" ")}
    >
      <Emoji3D name={emoji} size={48} />
      <span className="text-[11px] font-extrabold text-hoovy-navy text-center leading-tight">
        {choice.text}
      </span>
    </button>
  );
}
