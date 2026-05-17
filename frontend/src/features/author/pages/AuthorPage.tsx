import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDraftScenario, usePublishScenario } from "../hooks";
import type { AuthorRequest, Complexity, SkillDomain } from "../types";
import type { Scenario } from "@/features/scenarios/types";

const SKILL_DOMAINS: SkillDomain[] = [
  "communication",
  "money",
  "time",
  "social",
  "practical",
];

const COMPLEXITY_LEVELS: { value: Complexity; label: string; description: string }[] = [
  { value: "low", label: "Low", description: "Short, very explicit" },
  { value: "med", label: "Med", description: "Balanced" },
  { value: "high", label: "High", description: "Multi-step, subtle cues" },
];

function AdminGate() {
  return (
    <div className="min-h-screen bg-hoovy-bg flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl shadow-lg p-10 max-w-md text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-extrabold text-gray-800 mb-2">Parents Only</h1>
        <p className="text-gray-500 mb-6">
          This page is for parents and teachers. Add <code className="bg-gray-100 px-1 rounded">?admin=1</code> to the URL to continue.
        </p>
        <a
          href="/"
          className="inline-block bg-hoovy-blue text-white font-bold px-6 py-3 rounded-2xl hover:opacity-90 transition-opacity"
        >
          Back to Playground
        </a>
      </div>
    </div>
  );
}

interface DraftPreviewProps {
  scenario: Scenario;
  onPlay: () => void;
  onPublish: () => void;
  onDiscard: () => void;
  publishing: boolean;
  publishError: string | null;
}

function DraftPreview({ scenario, onPlay, onPublish, onDiscard, publishing, publishError }: DraftPreviewProps) {
  const firstStep = scenario.steps[0];

  return (
    <div className="mt-8 flex flex-col gap-5">
      <div className="bg-white rounded-3xl shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-hoovy-blue to-hoovy-purple text-white flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase opacity-80">Draft</p>
            <h2 className="text-xl font-extrabold">{scenario.title}</h2>
          </div>
          <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">Ready</span>
        </div>

        <div className="p-6 flex flex-col gap-5">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Context</p>
            <p className="text-gray-700">
              {scenario.steps.length} step{scenario.steps.length === 1 ? "" : "s"} ·{" "}
              {scenario.skill_domain} · difficulty {scenario.difficulty}/3
              {scenario.child_interests && (
                <>
                  {" · themed around "}
                  <span className="font-bold text-hoovy-blue">{scenario.child_interests}</span>
                </>
              )}
            </p>
          </div>

          {firstStep && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Hoovy's First Line</p>
              <p className="text-gray-800 italic">"{firstStep.teacher_prompt}"</p>
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase mb-2">All Steps</p>
            <ol className="flex flex-col gap-2">
              {scenario.steps.map((step) => (
                <li key={step.id} className="flex gap-3 items-start">
                  <span className="bg-hoovy-blue text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                    {step.order}
                  </span>
                  <span className="text-sm text-gray-700">{step.teacher_prompt}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="text-xs text-gray-400">
            Voice and images will be generated automatically when you publish.
          </div>
        </div>
      </div>

      {publishError && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-red-700 text-sm">
          {publishError}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onPlay}
          className="flex-1 bg-white border-2 border-gray-200 text-gray-700 font-bold py-4 rounded-2xl hover:border-hoovy-blue transition-colors"
        >
          Preview
        </button>
        <button
          onClick={onPublish}
          disabled={publishing}
          className="flex-[2] bg-hoovy-blue text-white font-extrabold py-4 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {publishing ? "Publishing..." : "Publish for all kids"}
        </button>
      </div>

      <button
        onClick={onDiscard}
        className="text-sm text-gray-400 hover:text-gray-600 underline"
      >
        Discard draft and start over
      </button>
    </div>
  );
}

export function AuthorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  if (searchParams.get("admin") !== "1") {
    return <AdminGate />;
  }

  const [form, setForm] = useState<AuthorRequest>({
    skill_target: "",
    child_interests: "",
    complexity: "med",
    skill_domain: "communication",
    num_steps: 3,
  });

  const draftMutation = useDraftScenario();
  const publishMutation = usePublishScenario();

  const draft = draftMutation.data;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.skill_target.trim() || !form.child_interests.trim()) return;
    publishMutation.reset();
    draftMutation.mutate(form);
  };

  const handlePublish = () => {
    if (!draft) return;
    publishMutation.mutate(
      { draft_id: draft.draft_id },
      {
        onSuccess: (scenario) => {
          navigate(`/scenario/${scenario.id}`);
        },
      },
    );
  };

  const handleDiscard = () => {
    draftMutation.reset();
    publishMutation.reset();
  };

  const handlePreview = () => {
    // For now, "Preview" means re-render the draft card. A true preview
    // (running the scenario engine against the in-memory draft) is a v2.
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-hoovy-bg p-6 md:p-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🎨</span>
            <h1 className="text-3xl font-extrabold text-gray-800">Scenario Builder</h1>
          </div>
          <p className="text-gray-500">
            Tell Hoovy what to teach and what your child loves. We'll build the scenario.
          </p>
        </div>

        {!draft && (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-md p-7 flex flex-col gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Skill Target</label>
              <input
                type="text"
                value={form.skill_target}
                onChange={(e) => setForm((f) => ({ ...f, skill_target: e.target.value }))}
                placeholder="e.g. Going to the grocery store"
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-gray-800 focus:outline-none focus:border-hoovy-blue"
                required
                minLength={3}
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Child's Interests</label>
              <input
                type="text"
                value={form.child_interests}
                onChange={(e) => setForm((f) => ({ ...f, child_interests: e.target.value }))}
                placeholder="e.g. Trains, Dinosaurs, Princesses"
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-gray-800 focus:outline-none focus:border-hoovy-blue"
                required
                minLength={1}
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Complexity Level</label>
              <div className="grid grid-cols-3 gap-2">
                {COMPLEXITY_LEVELS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, complexity: c.value }))}
                    className={`py-3 rounded-2xl font-bold border-2 transition-colors text-sm ${
                      form.complexity === c.value
                        ? "bg-hoovy-blue text-white border-hoovy-blue"
                        : "bg-white text-gray-600 border-gray-200 hover:border-hoovy-blue"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {COMPLEXITY_LEVELS.find((c) => c.value === form.complexity)?.description}
              </p>
            </div>

            <details className="text-sm">
              <summary className="cursor-pointer text-gray-500 font-bold">Advanced options</summary>
              <div className="mt-4 flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Skill Domain</label>
                  <select
                    value={form.skill_domain}
                    onChange={(e) => setForm((f) => ({ ...f, skill_domain: e.target.value as SkillDomain }))}
                    className="w-full border-2 border-gray-200 rounded-2xl px-4 py-2 capitalize"
                  >
                    {SKILL_DOMAINS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">
                    Number of Steps: <span className="text-hoovy-blue">{form.num_steps}</span>
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
                    className="w-full accent-hoovy-blue"
                  />
                </div>
              </div>
            </details>

            <button
              type="submit"
              disabled={
                draftMutation.isPending ||
                !form.skill_target.trim() ||
                !form.child_interests.trim()
              }
              className="w-full bg-hoovy-blue text-white font-extrabold py-4 rounded-2xl text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {draftMutation.isPending ? "Building draft..." : "Build Draft"}
            </button>
          </form>
        )}

        {draftMutation.isPending && (
          <div className="mt-8 bg-white rounded-3xl shadow-md p-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-hoovy-blue to-hoovy-purple flex items-center justify-center animate-bounce text-3xl">
              🤖
            </div>
            <div className="text-center">
              <p className="font-extrabold text-gray-800 text-lg">Cooking up a draft...</p>
              <p className="text-gray-500 text-sm mt-1">
                Hoovy is thinking. This may take up to 60 seconds.
              </p>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-hoovy-blue animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {draftMutation.isError && (
          <div className="mt-8 bg-white rounded-3xl shadow-md p-7 border-2 border-red-200">
            <div className="text-4xl mb-3">😔</div>
            <h2 className="font-extrabold text-gray-800 text-lg mb-1">Draft failed</h2>
            <p className="text-red-600 text-sm mb-4">
              {draftMutation.error?.message ?? "Something went wrong. Try again."}
            </p>
            <button
              onClick={() => draftMutation.reset()}
              className="bg-hoovy-blue text-white font-bold px-6 py-3 rounded-2xl hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          </div>
        )}

        {draft && (
          <DraftPreview
            scenario={draft.scenario}
            onPlay={handlePreview}
            onPublish={handlePublish}
            onDiscard={handleDiscard}
            publishing={publishMutation.isPending}
            publishError={publishMutation.error?.message ?? null}
          />
        )}
      </div>
    </div>
  );
}
