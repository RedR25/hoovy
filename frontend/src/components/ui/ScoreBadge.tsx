import { Emoji3D } from "@/components/ui/Emoji3D";

interface Props {
  score: number;
  className?: string;
}

export function ScoreBadge({ score, className = "" }: Props) {
  return (
    <div
      className={`inline-flex items-center gap-2 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full border-[5px] border-hoovy-yellow shadow-[0_5px_0_#FF9800] ${className}`}
    >
      <Emoji3D name="star" size={26} />
      <span className="font-extrabold text-hoovy-navy text-base pr-1">{score}</span>
    </div>
  );
}
