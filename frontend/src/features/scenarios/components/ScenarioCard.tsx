import type { ScenarioSummary, SkillDomain } from "@/features/scenarios/types";
import { Emoji3D } from "@/components/ui/Emoji3D";
import type { Emoji3DName } from "@/components/ui/Emoji3D";

// Domain → scene gradient + hero emoji used ONLY when there's no thumbnail.
const RECIPE: Record<
  SkillDomain,
  { bg: string; hero: Emoji3DName; extras?: Emoji3DName[] }
> = {
  communication: { bg: "from-[#A3E5FF] to-[#47C2FF]", hero: "wave",      extras: ["smile"] },
  social:        { bg: "from-[#FFE0EB] to-[#FF7EB3]", hero: "handshake", extras: ["sparkles"] },
  money:         { bg: "from-[#DFFFE3] to-[#59D968]", hero: "shop",      extras: ["moneyBag"] },
  time:          { bg: "from-[#FFF8B3] to-[#FFD833]", hero: "clock",     extras: ["sun"] },
  practical:     { bg: "from-[#F0E4FF] to-[#A877FF]", hero: "house",     extras: ["tree"] },
};

interface Props {
  scenario: ScenarioSummary;
  onClick: (id: string) => void;
}

function TriStar({ filled, total = 3, size = 18 }: { filled: number; total?: number; size?: number }) {
  return (
    <div className="flex items-center justify-center gap-1">
      {Array.from({ length: total }).map((_, i) => {
        const isOn = i < filled;
        return (
          <svg key={i} viewBox="0 0 24 24" width={size} height={size}>
            <polygon
              points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"
              fill={isOn ? "#FFD833" : "#FFFFFF"}
              stroke={isOn ? "#D98A1C" : "#D1D5DB"}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </div>
  );
}

export function ScenarioCard({ scenario, onClick }: Props) {
  const r = RECIPE[scenario.skill_domain];

  return (
    <button
      onClick={() => onClick(scenario.id)}
      className={[
        "group w-full text-left bg-white rounded-3xl p-2 pb-3 flex flex-col gap-2",
        "border-[5px] border-white",
        "shadow-[0_8px_0_rgba(0,0,0,0.08),0_4px_14px_rgba(0,0,0,0.06)]",
        "active:translate-y-[6px] active:!shadow-none transition-all duration-100",
      ].join(" ")}
    >
      {/* Illustration — fills the top of the card */}
      <div
        className={`relative w-full aspect-square rounded-2xl overflow-hidden bg-gradient-to-br ${r.bg}`}
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
            <div
              className="absolute top-2 right-2 w-6 h-6 rounded-full"
              style={{
                background: "linear-gradient(135deg,#FFF599,#FFD833)",
                boxShadow: "inset -2px -2px 5px #FF9800",
              }}
            />
            {/* curved hill foreground */}
            <svg
              viewBox="0 0 100 50"
              preserveAspectRatio="none"
              className="absolute bottom-0 left-0 right-0 w-full h-1/3"
            >
              <path
                d="M0 30 Q25 10 50 25 Q75 40 100 20 L100 50 L0 50 Z"
                fill="rgba(255,255,255,0.45)"
              />
            </svg>
            {/* hero emoji centered */}
            <div className="absolute inset-0 flex items-center justify-center transition-transform group-hover:scale-105">
              <Emoji3D name={r.hero} size={92} />
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

      {/* Title centered */}
      <h2 className="text-center font-extrabold text-base text-hoovy-navy leading-tight px-1 line-clamp-1 pt-0.5">
        {scenario.title}
      </h2>

      {/* Tri-color stars centered */}
      <TriStar filled={scenario.difficulty} total={3} size={18} />
    </button>
  );
}
