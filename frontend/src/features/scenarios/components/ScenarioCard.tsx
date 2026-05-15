import type { ScenarioSummary, SkillDomain } from "@/features/scenarios/types";

const domainColors: Record<SkillDomain, string> = {
  communication: "bg-hoovy-blue text-white",
  money: "bg-hoovy-green text-white",
  time: "bg-hoovy-orange text-white",
  social: "bg-hoovy-purple text-white",
  practical: "bg-hoovy-pink text-white",
};

interface Props {
  scenario: ScenarioSummary;
  onClick: (id: string) => void;
}

export function ScenarioCard({ scenario, onClick }: Props) {
  const dots = Array.from({ length: 3 }, (_, i) => i < scenario.difficulty);

  return (
    <button
      onClick={() => onClick(scenario.id)}
      className="w-full text-left bg-white rounded-3xl shadow-md hover:shadow-lg transition-shadow p-5 flex flex-col gap-3 border-2 border-transparent hover:border-hoovy-blue active:scale-95 transition-transform"
    >
      {/* Thumbnail placeholder */}
      <div className="w-full h-36 rounded-2xl bg-gradient-to-br from-hoovy-bg to-purple-100 flex items-center justify-center text-5xl">
        {scenario.thumbnail_url ? (
          <img
            src={scenario.thumbnail_url}
            alt={scenario.title}
            className="w-full h-full object-cover rounded-2xl"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          "🎓"
        )}
      </div>

      {/* Title */}
      <h2 className="font-extrabold text-lg text-gray-800 leading-tight">
        {scenario.title}
      </h2>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${domainColors[scenario.skill_domain]}`}
        >
          {scenario.skill_domain}
        </span>

        {/* Difficulty dots */}
        <span className="flex gap-1 items-center" aria-label={`Difficulty ${scenario.difficulty} of 3`}>
          {dots.map((filled, i) => (
            <span
              key={i}
              className={`w-3 h-3 rounded-full ${filled ? "bg-hoovy-yellow" : "bg-gray-200"}`}
            />
          ))}
        </span>

        <span className="ml-auto text-xs text-gray-500 font-semibold">
          {scenario.estimated_minutes} min
        </span>
      </div>
    </button>
  );
}
