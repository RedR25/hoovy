/**
 * 3D-rendered emoji from Microsoft Fluent Emoji (MIT licensed).
 *
 * Folders fall into two URL shapes:
 *   - Most: assets/{Folder}/3D/{file}_3d.png
 *   - Hands & people: assets/{Folder}/Default/3D/{file}_3d_default.png
 *                     (also Dark/Light/Medium variants — we always use Default)
 *
 * Map entries set `skin: true` for the second shape.
 */
const BASE =
  "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets";

type Entry = { folder: string; file: string; skin?: boolean };

const NAMES: Record<string, Entry> = {
  // Objects / scenery — direct 3D folder
  star:            { folder: "Star",                       file: "star" },
  trophy:          { folder: "Trophy",                     file: "trophy" },
  alarm:           { folder: "Alarm clock",                file: "alarm_clock" },
  clock:           { folder: "Three oclock",               file: "three_oclock" },
  check:           { folder: "Check mark button",          file: "check_mark_button" },
  rainbow:         { folder: "Rainbow",                    file: "rainbow" },
  sparkles:        { folder: "Sparkles",                   file: "sparkles" },
  microphone:      { folder: "Microphone",                 file: "microphone" },
  speech:          { folder: "Speech balloon",             file: "speech_balloon" },
  thoughtBubble:   { folder: "Thought balloon",            file: "thought_balloon" },
  bird:            { folder: "Bird",                       file: "bird" },
  babyChick:       { folder: "Front-facing baby chick",    file: "front-facing_baby_chick" },
  cookie:          { folder: "Cookie",                     file: "cookie" },
  juice:           { folder: "Glass of milk",              file: "glass_of_milk" },
  shop:            { folder: "Convenience store",          file: "convenience_store" },
  schoolBuilding:  { folder: "School",                     file: "school" },
  house:           { folder: "House",                      file: "house" },
  tree:            { folder: "Deciduous tree",             file: "deciduous_tree" },
  sun:             { folder: "Sun",                        file: "sun" },
  cloud:           { folder: "Cloud",                      file: "cloud" },
  bookHearts:      { folder: "Books",                      file: "books" },
  partyPopper:     { folder: "Party popper",               file: "party_popper" },
  train:           { folder: "Locomotive",                 file: "locomotive" },
  station:         { folder: "Station",                    file: "station" },
  moneyBag:        { folder: "Money bag",                  file: "money_bag" },
  // Faces — direct 3D folder (no skin variants)
  smile:           { folder: "Smiling face with smiling eyes", file: "smiling_face_with_smiling_eyes" },
  grin:            { folder: "Grinning face",              file: "grinning_face" },
  sad:             { folder: "Crying face",                file: "crying_face" },
  angry:           { folder: "Angry face",                 file: "angry_face" },
  pleadingFace:    { folder: "Pleading face",              file: "pleading_face" },
  thinking:        { folder: "Thinking face",              file: "thinking_face" },
  // Hands & people — skin tone variant (Default)
  wave:            { folder: "Waving hand",                file: "waving_hand",   skin: true },
  thumbsUp:        { folder: "Thumbs up",                  file: "thumbs_up",     skin: true },
  thumbsDown:      { folder: "Thumbs down",                file: "thumbs_down",   skin: true },
  babyBoy:         { folder: "Boy",                        file: "boy",           skin: true },
  babyGirl:        { folder: "Girl",                       file: "girl",          skin: true },
  // Handshake doesn't have skin tone variants per repo
  handshake:       { folder: "Handshake",                  file: "handshake" },
};

export type Emoji3DName =
  | "star" | "trophy" | "alarm" | "clock" | "check" | "rainbow" | "sparkles"
  | "microphone" | "speech" | "thoughtBubble" | "bird" | "babyChick"
  | "cookie" | "juice" | "shop" | "schoolBuilding" | "house" | "tree"
  | "sun" | "cloud" | "bookHearts" | "partyPopper" | "train" | "station"
  | "moneyBag" | "smile" | "grin" | "sad" | "angry" | "pleadingFace"
  | "thinking" | "wave" | "thumbsUp" | "thumbsDown" | "babyBoy" | "babyGirl"
  | "handshake";

const FALLBACK: Record<Emoji3DName, string> = {
  star: "⭐", trophy: "🏆", alarm: "⏰", clock: "🕒", check: "✅",
  rainbow: "🌈", sparkles: "✨", microphone: "🎤", speech: "💬",
  thoughtBubble: "💭", bird: "🐦", babyChick: "🐤", cookie: "🍪", juice: "🥛",
  shop: "🏪", schoolBuilding: "🏫", house: "🏠", tree: "🌳", sun: "☀️",
  cloud: "☁️", bookHearts: "📚", partyPopper: "🎉", train: "🚂", station: "🚉",
  moneyBag: "💰", smile: "😊", grin: "😀", sad: "😢", angry: "😠",
  pleadingFace: "🥺", thinking: "🤔", wave: "👋", thumbsUp: "👍",
  thumbsDown: "👎", babyBoy: "👦", babyGirl: "👧", handshake: "🤝",
};

interface Props {
  name: Emoji3DName;
  size?: number;
  className?: string;
  alt?: string;
}

export function Emoji3D({ name, size = 32, className = "", alt = "" }: Props) {
  const entry = NAMES[name];
  const folder = encodeURIComponent(entry.folder);
  const url = entry.skin
    ? `${BASE}/${folder}/Default/3D/${entry.file}_3d_default.png`
    : `${BASE}/${folder}/3D/${entry.file}_3d.png`;
  return (
    <span
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.85, lineHeight: 1 }}
      aria-label={alt || name}
    >
      <img
        src={url}
        width={size}
        height={size}
        alt={alt || name}
        loading="lazy"
        draggable={false}
        style={{ width: size, height: size, display: "block" }}
        onError={(e) => {
          const img = e.currentTarget;
          const span = img.parentElement;
          if (span) span.textContent = FALLBACK[name];
        }}
      />
    </span>
  );
}
