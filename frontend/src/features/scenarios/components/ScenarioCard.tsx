import type { ScenarioSummary, SkillDomain } from "@/features/scenarios/types";
import { StarBar } from "@/components/ui/StarBar";
import { Emoji3D } from "@/components/ui/Emoji3D";
import type { Emoji3DName } from "@/components/ui/Emoji3D";

// Domain → border color + scene gradient + hero emoji
const RECIPE: Record<
  SkillDomain,
  { border: string; shadow: string; bg: string; hero: Emoji3DName; extras?: Emoji3DName[] }
> = {
  communication: {
    border: "border-hoovy-sky",
    shadow: "shadow-[0_8px_0_#1C86D9]",
    bg: "from-[#A3E5FF] to-[#47C2FF]",
    hero: "wave",
    extras: ["smile"],
  },
  social: {
    border: "border-hoovy-pinkSoft",
    shadow: "shadow-[0_8px_0_#D93D55]",
    bg: "from-[#FFE0EB] to-[#FF7EB3]",
    hero: "handshake",
    extras: ["sparkles"],
  },
  money: {
    border: "border-hoovy-greenLight",
    shadow: "shadow-[0_8px_0_#2A9038]",
    bg: "from-[#DFFFE3] to-[#59D968]",
    hero: "shop",
    extras: ["moneyBag"],
  },
  time: {
    border: "border-hoovy-yellow",
    shadow: "shadow-[0_8px_0_#FF9800]",
    bg: "from-[#FFF8B3] to-[#FFD833]",
    hero: "clock",
    extras: ["sun"],
  },
  practical: {
    border: "border-hoovy-purple",
    shadow: "shadow-[0_8px_0_#8A4FCC]",
    bg: "from-[#F0E4FF] to-[#A877FF]",
    hero: "house",
    extras: ["tree"],
  },
};

interface Props {
  scenario: ScenarioSummary;
  onClick: (id: string) => void;
}

export function ScenarioCard({ scenario, onClick }: Props) {
  const r = RECIPE[scenario.skill_domain];

  return (
    <button
      onClick={() => onClick(scenario.id)}
      className={[
        "group w-full text-left bg-white rounded-3xl p-3 pb-4 flex flex-col gap-3",
        "border-[6px]", r.border, r.shadow,
        "active:translate-y-[6px] active:!shadow-none transition-all duration-100",
      ].join(" ")}
    >
      {/* Thumbnail composition */}
      <div
        className={`relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br ${r.bg}`}
      >
        {scenario.thumbnail_url ? (
          <img
            src={scenario.thumbnail_url}
            alt={scenario.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
          />
        ) : (
          <>
            {/* sun */}
            <div className="absolute top-2 right-2 w-6 h-6 rounded-full"
                 style={{ background: "linear-gradient(135deg,#FFF599,#FFD833)",
                          boxShadow: "inset -2px -2px 5px #FF9800" }} />
            {/* curved hill foreground */}
            <svg viewBox="0 0 100 50" preserveAspectRatio="none"
                 className="absolute bottom-0 left-0 right-0 w-full h-1/3">
              <path d="M0 30 Q25 10 50 25 Q75 40 100 20 L100 50 L0 50 Z" fill="rgba(255,255,255,0.45)" />
            </svg>
            {/* hero emoji centered */}
            <div className="absolute inset-0 flex items-center justify-center transition-transform group-hover:scale-105">
              <Emoji3D name={r.hero} size={86} />
            </div>
            {r.extras?.[0] && (
              <div className="absolute bottom-2 left-2"><Emoji3D name={r.extras[0]} size={28} /></div>
            )}
            {r.extras?.[1] && (
              <div className="absolute top-2 left-2"><Emoji3D name={r.extras[1]} size={22} /></div>
            )}
          </>
        )}
        {/* glossy top highlight */}
        <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
      </div>

      {/* Title */}
      <h2 className="font-extrabold text-base text-hoovy-navy leading-tight px-1 line-clamp-2 min-h-[2.5rem]">
        {scenario.title}
      </h2>

      {/* Rating */}
      <div className="px-1 flex items-center justify-between">
        <StarBar filled={scenario.difficulty} total={3} size="sm" />
        <span className="text-[10px] font-bold text-hoovy-navy/40 uppercase">
          {scenario.estimated_minutes}m
        </span>
      </div>
    </button>
  );
}
