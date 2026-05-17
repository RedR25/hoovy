import { useNavigate } from "react-router-dom";
import { SceneBackdrop } from "@/components/ui/SceneBackdrop";
import { HoovyMascot } from "@/components/ui/HoovyMascot";
import { BottomNav } from "@/components/ui/BottomNav";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { Emoji3D } from "@/components/ui/Emoji3D";
import type { Emoji3DName } from "@/components/ui/Emoji3D";

interface SkillFocus {
  name: string;
  pct: number;
  color: string;
  trackBorder: string;
}

const MOCK = {
  activities_completed: 24,
  stars_earned: 48,
  time_spent: "3h 25m",
  skill_focus: [
    { name: "Communication",        pct: 75, color: "bg-hoovy-purple", trackBorder: "border-hoovy-purple" },
    { name: "Social Interaction",   pct: 60, color: "bg-hoovy-pink",   trackBorder: "border-hoovy-pink" },
    { name: "Emotional Regulation", pct: 80, color: "bg-hoovy-green",  trackBorder: "border-hoovy-green" },
    { name: "Money",                pct: 45, color: "bg-hoovy-orange", trackBorder: "border-hoovy-orange" },
    { name: "Time",                 pct: 55, color: "bg-hoovy-sky",    trackBorder: "border-hoovy-sky" },
  ] as SkillFocus[],
};

// 3D stat card: white face, thick colored border, solid offset shadow
type StatTone = "green" | "yellow" | "blue";
const STAT_TONE: Record<StatTone, { border: string; shadow: string }> = {
  green:  { border: "border-hoovy-green",  shadow: "shadow-[0_6px_0_#2A9038]" },
  yellow: { border: "border-hoovy-yellow", shadow: "shadow-[0_6px_0_#D98A1C]" },
  blue:   { border: "border-hoovy-sky",    shadow: "shadow-[0_6px_0_#1C86D9]" },
};

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: Emoji3DName;
  tone: StatTone;
}) {
  const t = STAT_TONE[tone];
  return (
    <div className={`bg-white rounded-3xl px-2 py-4 flex flex-col items-center gap-1 border-[5px] ${t.border} ${t.shadow}`}>
      <div className="text-[10px] font-extrabold text-hoovy-navy/55 uppercase tracking-wide text-center leading-tight min-h-[24px] px-1">
        {label}
      </div>
      <div className="text-2xl font-extrabold text-hoovy-navy" style={{ fontFamily: 'Fredoka' }}>{value}</div>
      <Emoji3D name={icon} size={32} />
    </div>
  );
}

function SkillBar({ skill }: { skill: SkillFocus }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-extrabold text-hoovy-navy">{skill.name}</span>
        <span className="text-hoovy-navy/60 font-extrabold">{skill.pct}%</span>
      </div>
      <div className={`h-4 bg-hoovy-cream rounded-full overflow-hidden border-[2px] ${skill.trackBorder}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${skill.color}`}
          style={{ width: `${skill.pct}%`, boxShadow: "inset 0 2px 0 rgba(255,255,255,0.4)" }}
        />
      </div>
    </div>
  );
}

export function ProgressPage() {
  const navigate = useNavigate();

  return (
    <SceneBackdrop variant="rainbow" scenery={false}>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-4 pt-6 pb-3 flex items-center gap-3 max-w-md w-full mx-auto">
          <button
            onClick={() => navigate("/episodes")}
            className="w-12 h-12 rounded-full bg-white border-[4px] border-white shadow-[0_5px_0_rgba(0,0,0,0.1)] flex items-center justify-center text-hoovy-skyDeep active:translate-y-[5px] active:!shadow-none transition-all"
            aria-label="Back"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="flex-1 text-center text-xl font-extrabold text-hoovy-navy" style={{ fontFamily: 'Fredoka' }}>
            Growth &amp; Progress
          </h1>
          <ScoreBadge score={12} />
        </header>

        {/* Mascot + rainbow + greeting */}
        <section className="relative max-w-md w-full mx-auto px-6 pt-2 pb-4">
          <div className="absolute top-0 right-0 w-56 h-32 pointer-events-none opacity-95">
            <Rainbow />
          </div>

          <div className="flex items-end gap-3 relative z-10">
            <div className="relative">
              <HoovyMascot size={140} speaking pose="cheer" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-24 h-2 rounded-full bg-black/15 blur" />
            </div>
            <div className="bg-white rounded-3xl px-4 py-3 mb-3 relative border-[4px] border-hoovy-pink shadow-[0_5px_0_#D93D55]">
              <p className="text-sm font-extrabold text-hoovy-navy leading-tight">
                Great job!
              </p>
              <p className="text-sm font-extrabold text-hoovy-pink leading-tight">
                Keep going!
              </p>
              <span className="absolute -left-3 bottom-3 w-0 h-0 border-y-8 border-y-transparent border-r-[10px] border-r-hoovy-pink" />
            </div>
          </div>
        </section>

        {/* Main content card — pb-28 leaves room for the fixed BottomNav */}
        <section className="max-w-md w-full mx-auto px-4 pb-28 flex-1">
          <div className="bg-white rounded-3xl p-5 flex flex-col gap-5 border-[6px] border-white shadow-[0_8px_0_rgba(0,0,0,0.06)]">
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Activities Completed" value={MOCK.activities_completed} icon="check" tone="green" />
              <StatCard label="Stars Earned" value={MOCK.stars_earned} icon="star" tone="yellow" />
              <StatCard label="Time Spent" value={MOCK.time_spent} icon="alarm" tone="blue" />
            </div>

            <div>
              <h3 className="font-extrabold text-hoovy-navy mb-3" style={{ fontFamily: 'Fredoka' }}>Skill Focus Areas</h3>
              <div className="flex flex-col gap-3">
                {MOCK.skill_focus.map((s) => (
                  <SkillBar key={s.name} skill={s} />
                ))}
              </div>
            </div>

            <p className="text-[10px] text-hoovy-navy/40 text-center">
              Numbers shown are demo data.
            </p>
          </div>
        </section>

        <BottomNav />
      </div>
    </SceneBackdrop>
  );
}

function Rainbow() {
  return (
    <svg viewBox="0 0 200 100" className="w-full h-full">
      <path d="M10 100 A90 90 0 0 1 190 100" fill="none" stroke="#FF4766" strokeWidth="10" />
      <path d="M22 100 A78 78 0 0 1 178 100" fill="none" stroke="#FF9800" strokeWidth="10" />
      <path d="M34 100 A66 66 0 0 1 166 100" fill="none" stroke="#FFD833" strokeWidth="10" />
      <path d="M46 100 A54 54 0 0 1 154 100" fill="none" stroke="#3CB84B" strokeWidth="10" />
      <path d="M58 100 A42 42 0 0 1 142 100" fill="none" stroke="#47C2FF" strokeWidth="10" />
      <path d="M70 100 A30 30 0 0 1 130 100" fill="none" stroke="#A877FF" strokeWidth="10" />
    </svg>
  );
}
