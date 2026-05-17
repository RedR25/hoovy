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

// Domain palette — cycle through a few accents so adjacent tiles aren't identical.
const PALETTE = [
  { border: "border-hoovy-yellow", shadow: "shadow-[0_5px_0_#D98A1C]" },
  { border: "border-hoovy-sky",    shadow: "shadow-[0_5px_0_#1C86D9]" },
  { border: "border-hoovy-pink",   shadow: "shadow-[0_5px_0_#D93D55]" },
  { border: "border-hoovy-green",  shadow: "shadow-[0_5px_0_#2A9038]" },
  { border: "border-hoovy-purple", shadow: "shadow-[0_5px_0_#8A4FCC]" },
];

function paletteFor(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

interface Props {
  choice: Choice;
  disabled?: boolean;
  onSelect: (id: string) => void;
}

export function ChoiceTile({ choice, disabled, onSelect }: Props) {
  const emoji = pickEmoji(choice.text);
  const p = paletteFor(choice.text);

  return (
    <button
      onClick={() => onSelect(choice.id)}
      disabled={disabled}
      className={[
        "flex flex-col items-center gap-1 bg-white rounded-2xl px-3 pt-3 pb-2 min-w-[96px]",
        "border-[4px]", p.border, p.shadow,
        "active:translate-y-[5px] active:!shadow-none transition-all duration-100",
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
    >
      <Emoji3D name={emoji} size={44} />
      <span className="text-[11px] font-extrabold text-hoovy-navy text-center leading-tight max-w-[88px] truncate">
        {choice.text}
      </span>
    </button>
  );
}
