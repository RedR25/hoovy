import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDraftScenario, usePublishScenario } from "../hooks";
import type { AuthorRequest, Complexity, SkillDomain } from "../types";
import type { Scenario } from "@/features/scenarios/types";
import { SceneBackdrop } from "@/components/ui/SceneBackdrop";
import { BottomNav } from "@/components/ui/BottomNav";
import { Hoovy3DButton } from "@/components/ui/Hoovy3DButton";
import { Emoji3D } from "@/components/ui/Emoji3D";
import { HoovyMascot } from "@/components/ui/HoovyMascot";

const SKILL_DOMAINS: SkillDomain[] = [
  "communication",
  "money",
  "time",
  "social",
  "practical",
];

const COMPLEXITY_LEVELS: { value: Complexity; label: string; description: string }[] = [
  { value: "low",  label: "Low",    description: "Short, very explicit" },
  { value: "med",  label: "Medium", description: "Balanced" },
  { value: "high", label: "High",   description: "Multi-step, subtle cues" },
];

interface DraftPreviewProps {
  scenario: Scenario;
  onEdit: () => void;
  onPublish: () => void;
  publishing: boolean;
  publishError: string | null;
}

function DraftPreview({ scenario, onEdit, onPublish, publishing, publishError }: DraftPreviewProps) {
  const firstStep = scenario.steps[0];

  return (
    <div className="bg-hoovy-cream rounded-3xl p-5 border-[5px] border-white shadow-[0_8px_0_rgba(0,0,0,0.06)] flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-hoovy-navy truncate" style={{ fontFamily: "Fredoka" }}>
          Draft: {scenario.title}
        </h2>
        <span className="text-[10px] font-extrabold text-white bg-hoovy-green px-3 py-1.5 rounded-full border-[3px] border-white shadow-[0_3px_0_#2A9038] uppercase tracking-wide">
          Ready
        </span>
      </div>

      <div className="bg-white rounded-2xl p-4 flex gap-3 items-start border-[3px] border-hoovy-sky/30">
        <div className="w-9 h-9 rounded-full bg-hoovy-sky flex items-center justify-center flex-shrink-0 border-[3px] border-white shadow-[0_3px_0_#1C86D9]">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2z" />
            <path d="M22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-extrabold text-hoovy-navy mb-1">Context</p>
          <p className="text-sm text-hoovy-navy/80 leading-snug">
            {scenario.steps.length} step{scenario.steps.length === 1 ? "" : "s"} · {scenario.skill_domain} · difficulty {scenario.difficulty}/3
            {scenario.child_interests && (
              <> · themed around <span className="font-bold text-hoovy-skyDeep">{scenario.child_interests}</span></>
            )}
          </p>
        </div>
      </div>

      {firstStep && (
        <div className="bg-white rounded-2xl p-4 flex gap-3 items-start border-[3px] border-hoovy-yellow/40">
          <div className="w-9 h-9 rounded-full bg-hoovy-yellow flex items-center justify-center flex-shrink-0 border-[3px] border-white shadow-[0_3px_0_#D98A1C]">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold text-hoovy-navy mb-1">Hoovy's Line</p>
            <p className="text-sm text-hoovy-navy/80 italic leading-snug">"{firstStep.teacher_prompt}"</p>
          </div>
        </div>
      )}

      {scenario.steps.length > 1 && (
        <details className="bg-white/70 rounded-2xl p-3 border-[3px] border-hoovy-navy/10">
          <summary className="text-xs font-extrabold text-hoovy-navy cursor-pointer">
            All {scenario.steps.length} steps
          </summary>
          <ol className="mt-3 flex flex-col gap-2">
            {scenario.steps.map((step) => (
              <li key={step.id} className="flex gap-2 items-start">
                <span className="bg-hoovy-sky text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">{step.order}</span>
                <span className="text-xs text-hoovy-navy/80">{step.teacher_prompt}</span>
              </li>
            ))}
          </ol>
        </details>
      )}

      {publishError && (
        <div className="bg-hoovy-pink/10 border-[3px] border-hoovy-pink rounded-2xl p-3 text-hoovy-pinkDeep text-xs font-bold">
          {publishError}
        </div>
      )}

      <div className="flex-1" />

      <div className="flex items-center justify-end gap-3 pt-1">
        <button
          onClick={onEdit}
          className="px-5 py-2.5 rounded-full bg-white text-hoovy-navy font-extrabold text-sm border-[3px] border-hoovy-navy/15 shadow-[0_3px_0_rgba(0,0,0,0.1)] active:translate-y-[3px] active:!shadow-none transition-all"
        >
          Edit
        </button>
        <button
          onClick={onPublish}
          disabled={publishing}
          className="px-5 py-2.5 rounded-full bg-hoovy-navy text-white font-extrabold text-sm border-[3px] border-hoovy-navy shadow-[0_4px_0_#0F1A2B] active:translate-y-[4px] active:!shadow-none transition-all disabled:opacity-50"
        >
          {publishing ? "Publishing..." : "Save & Publish"}
        </button>
      </div>
    </div>
  );
}

function EmptyDraftSlot({ isPending, isError, errorMessage, onRetry }: {
  isPending: boolean;
  isError: boolean;
  errorMessage?: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="bg-hoovy-cream rounded-3xl p-6 border-[5px] border-white shadow-[0_8px_0_rgba(0,0,0,0.06)] h-full flex flex-col items-center justify-center text-center gap-4 min-h-[420px]">
      {isPending ? (
        <>
          <HoovyMascot size={120} speaking pose="cheer" />
          <p className="font-extrabold text-hoovy-navy text-lg" style={{ fontFamily: "Fredoka" }}>Cooking up a draft...</p>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-hoovy-sky animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </>
      ) : isError ? (
        <>
          <div className="text-5xl">😔</div>
          <p className="font-extrabold text-hoovy-navy" style={{ fontFamily: "Fredoka" }}>Draft failed</p>
          <p className="text-xs text-hoovy-pinkDeep font-bold max-w-xs">{errorMessage ?? "Something went wrong."}</p>
          <Hoovy3DButton variant="pink" size="sm" onClick={onRetry}>Try again</Hoovy3DButton>
        </>
      ) : (
        <>
          <HoovyMascot size={140} speaking />
          <p className="font-extrabold text-hoovy-navy text-base" style={{ fontFamily: "Fredoka" }}>
            Draft will appear here
          </p>
          <p className="text-xs text-hoovy-navy/60 font-bold max-w-xs">
            Fill the left panel and tap <span className="text-hoovy-skyDeep">Generate</span> to build a new learning module.
          </p>
        </>
      )}
    </div>
  );
}

function AuthorContent() {
  const navigate = useNavigate();
  const [form, setForm] = useState<AuthorRequest>({
    skill_target: "Going to the grocery store",
    child_interests: "Trains",
    complexity: "low",
    skill_domain: "communication",
    num_steps: 3,
  });

  const draftMutation = useDraftScenario();
  const publishMutation = usePublishScenario();
  const draft = draftMutation.data;

  const canGenerate =
    !draftMutation.isPending &&
    form.skill_target.trim().length >= 3 &&
    form.child_interests.trim().length >= 1;

  const handleGenerate = () => {
    if (!canGenerate) return;
    publishMutation.reset();
    draftMutation.mutate(form);
  };

  const handlePublish = () => {
    if (!draft) return;
    publishMutation.mutate(
      { draft_id: draft.draft_id },
      { onSuccess: (scenario) => navigate(`/scenario/${scenario.id}`) },
    );
  };

  const handleEdit = () => {
    draftMutation.reset();
    publishMutation.reset();
  };

  return (
    <SceneBackdrop variant="meadow">
      <div className="min-h-dvh flex flex-col">
        {/* Header card */}
        <header className="px-4 pt-4 max-w-5xl w-full mx-auto">
          <div className="bg-white rounded-3xl px-5 py-4 flex items-center gap-4 border-[5px] border-white shadow-[0_6px_0_rgba(0,0,0,0.08)]">
            <button
              onClick={() => navigate("/episodes")}
              className="w-11 h-11 rounded-full bg-hoovy-purple flex items-center justify-center text-white border-[3px] border-white shadow-[0_4px_0_#8A4FCC] active:translate-y-[4px] active:!shadow-none transition-all flex-shrink-0"
              aria-label="Back"
              title="Back to Episodes"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-extrabold text-hoovy-navy leading-tight" style={{ fontFamily: "Fredoka" }}>
                Scenario Builder
              </h1>
              <p className="text-xs font-extrabold text-hoovy-navy/55">Create new learning modules.</p>
            </div>
            <Hoovy3DButton
              variant="blue"
              size="md"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="flex-shrink-0"
            >
              <span className="inline-flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3-8 3 8 8 3-8 3-3 8-3-8-8-3z" />
                </svg>
                {draftMutation.isPending ? "Generating..." : "Generate"}
              </span>
            </Hoovy3DButton>
          </div>
        </header>

        {/* Two-column body */}
        <main className="flex-1 px-4 pt-4 pb-28 max-w-5xl w-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* LEFT: AI Prompt */}
            <section className="bg-white rounded-3xl p-5 border-[5px] border-white shadow-[0_8px_0_rgba(0,0,0,0.06)] flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Emoji3D name="sparkles" size={22} />
                <h2 className="text-lg font-extrabold text-hoovy-navy" style={{ fontFamily: "Fredoka" }}>AI Prompt</h2>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-hoovy-navy mb-1.5">Skill Target</label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.skill_target}
                    onChange={(e) => setForm((f) => ({ ...f, skill_target: e.target.value }))}
                    placeholder="e.g. Going to the grocery store"
                    className="w-full bg-white border-[3px] border-hoovy-navy/15 rounded-full px-4 py-2.5 pr-10 text-sm font-bold text-hoovy-navy placeholder:text-hoovy-navy/30 focus:outline-none focus:border-hoovy-sky transition-colors"
                    minLength={3}
                    maxLength={200}
                  />
                  <svg viewBox="0 0 24 24" className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-hoovy-navy/40 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-hoovy-navy mb-1.5">Child's Interests</label>
                <input
                  type="text"
                  value={form.child_interests}
                  onChange={(e) => setForm((f) => ({ ...f, child_interests: e.target.value }))}
                  placeholder="e.g. Trains, Dinosaurs, Princesses"
                  className="w-full bg-white border-[3px] border-hoovy-navy/15 rounded-full px-4 py-2.5 text-sm font-bold text-hoovy-navy placeholder:text-hoovy-navy/30 focus:outline-none focus:border-hoovy-sky transition-colors"
                  minLength={1}
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-hoovy-navy mb-1.5">Complexity Level</label>
                <div className="flex gap-2">
                  {COMPLEXITY_LEVELS.map((c) => {
                    const active = form.complexity === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, complexity: c.value }))}
                        className={[
                          "flex-1 py-2 rounded-full font-extrabold text-sm border-[3px] transition-all",
                          "active:translate-y-[3px] active:!shadow-none",
                          active
                            ? "bg-hoovy-green text-white border-white shadow-[0_4px_0_#2A9038]"
                            : "bg-white text-hoovy-navy/60 border-hoovy-navy/10 shadow-[0_3px_0_rgba(0,0,0,0.06)] hover:text-hoovy-navy",
                        ].join(" ")}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <details className="text-sm mt-1">
                <summary className="cursor-pointer text-xs font-extrabold text-hoovy-navy/60 hover:text-hoovy-navy">
                  Advanced options
                </summary>
                <div className="mt-3 flex flex-col gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-hoovy-navy/70 mb-1">Skill Domain</label>
                    <select
                      value={form.skill_domain}
                      onChange={(e) => setForm((f) => ({ ...f, skill_domain: e.target.value as SkillDomain }))}
                      className="w-full bg-white border-[3px] border-hoovy-navy/15 rounded-full px-4 py-2 text-sm font-bold text-hoovy-navy capitalize focus:outline-none focus:border-hoovy-sky"
                    >
                      {SKILL_DOMAINS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-hoovy-navy/70 mb-1">
                      Number of Steps: <span className="text-hoovy-skyDeep">{form.num_steps}</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={form.num_steps}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, num_steps: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 }))
                      }
                      className="w-full accent-hoovy-sky"
                    />
                  </div>
                </div>
              </details>
            </section>

            {/* RIGHT: Draft Preview */}
            <section>
              {draft ? (
                <DraftPreview
                  scenario={draft.scenario}
                  onEdit={handleEdit}
                  onPublish={handlePublish}
                  publishing={publishMutation.isPending}
                  publishError={publishMutation.error?.message ?? null}
                />
              ) : (
                <EmptyDraftSlot
                  isPending={draftMutation.isPending}
                  isError={draftMutation.isError}
                  errorMessage={draftMutation.error?.message}
                  onRetry={() => draftMutation.reset()}
                />
              )}
            </section>
          </div>
        </main>

        <BottomNav />
      </div>
    </SceneBackdrop>
  );
}

export function AuthorPage() {
  return <AuthorContent />;
}
