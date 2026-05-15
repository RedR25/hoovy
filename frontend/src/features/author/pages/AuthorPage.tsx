import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthorScenario } from "../hooks";
import { ScenarioCard } from "@/features/scenarios/components/ScenarioCard";
import type { AuthorRequest, SkillDomain } from "../types";
import type { ScenarioSummary } from "@/features/scenarios/types";

const SKILL_DOMAINS: SkillDomain[] = [
  "communication",
  "money",
  "time",
  "social",
  "practical",
];

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Easy",
  2: "Medium",
  3: "Hard",
};

function AdminGate() {
  return (
    <div className="min-h-screen bg-hoovy-bg flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl shadow-lg p-10 max-w-md text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-extrabold text-gray-800 mb-2">Admin Only</h1>
        <p className="text-gray-500 mb-6">
          This page is for teachers and administrators. Add <code className="bg-gray-100 px-1 rounded">?admin=1</code> to the URL to continue.
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

export function AuthorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Gate: require ?admin=1
  if (searchParams.get("admin") !== "1") {
    return <AdminGate />;
  }

  const [form, setForm] = useState<AuthorRequest>({
    skill_domain: "communication",
    brief: "",
    difficulty: 1,
    num_steps: 3,
    language: "en",
  });

  const { mutate, isPending, isSuccess, isError, data, error, reset } = useAuthorScenario();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brief.trim()) return;
    mutate(form);
  };

  // Map generated Scenario to ScenarioSummary shape for ScenarioCard
  const generatedSummary: ScenarioSummary | null = data
    ? {
        id: data.id,
        title: data.title,
        title_vi: data.title_vi,
        skill_domain: data.skill_domain,
        difficulty: data.difficulty,
        thumbnail_url: data.thumbnail_url,
        estimated_minutes: data.estimated_minutes,
        language: data.language,
      }
    : null;

  return (
    <div className="min-h-screen bg-hoovy-bg p-6 md:p-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🎨</span>
            <h1 className="text-3xl font-extrabold text-gray-800">Scenario Author</h1>
          </div>
          <p className="text-gray-500">
            Describe a skill in one sentence. Hoovy will generate a complete learning scenario.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-md p-7 flex flex-col gap-6">
          {/* Skill Domain */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Skill Domain</label>
            <select
              value={form.skill_domain}
              onChange={(e) => setForm((f) => ({ ...f, skill_domain: e.target.value as SkillDomain }))}
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-gray-800 font-semibold focus:outline-none focus:border-hoovy-blue capitalize"
            >
              {SKILL_DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Brief */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Brief Description
            </label>
            <textarea
              value={form.brief}
              onChange={(e) => setForm((f) => ({ ...f, brief: e.target.value }))}
              placeholder="e.g. Teach kid to say goodbye politely to grandma"
              rows={2}
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-gray-800 resize-none focus:outline-none focus:border-hoovy-blue"
              required
              minLength={3}
              maxLength={500}
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Difficulty:{" "}
              <span className="text-hoovy-blue">{DIFFICULTY_LABELS[form.difficulty]}</span>
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={1}
              value={form.difficulty}
              onChange={(e) =>
                setForm((f) => ({ ...f, difficulty: Number(e.target.value) as 1 | 2 | 3 }))
              }
              className="w-full accent-hoovy-blue"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Easy</span>
              <span>Medium</span>
              <span>Hard</span>
            </div>
          </div>

          {/* Number of Steps */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Number of Steps:{" "}
              <span className="text-hoovy-blue">{form.num_steps}</span>
            </label>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={form.num_steps}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  num_steps: Number(e.target.value) as 1 | 2 | 3 | 4 | 5,
                }))
              }
              className="w-full accent-hoovy-blue"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Language</label>
            <div className="flex gap-3">
              {(["en", "vi"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, language: lang }))}
                  className={`flex-1 py-2 rounded-2xl font-bold border-2 transition-colors ${
                    form.language === lang
                      ? "bg-hoovy-blue text-white border-hoovy-blue"
                      : "bg-white text-gray-600 border-gray-200 hover:border-hoovy-blue"
                  }`}
                >
                  {lang === "en" ? "English" : "Vietnamese"}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending || !form.brief.trim()}
            className="w-full bg-hoovy-blue text-white font-extrabold py-4 rounded-2xl text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Generating..." : "Generate Scenario"}
          </button>
        </form>

        {/* Loading state */}
        {isPending && (
          <div className="mt-8 bg-white rounded-3xl shadow-md p-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-hoovy-blue to-hoovy-purple flex items-center justify-center animate-bounce text-3xl">
              🤖
            </div>
            <div className="text-center">
              <p className="font-extrabold text-gray-800 text-lg">Cooking up a scenario...</p>
              <p className="text-gray-500 text-sm mt-1">
                Gemma is thinking. This may take up to 60 seconds.
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

        {/* Error state */}
        {isError && (
          <div className="mt-8 bg-white rounded-3xl shadow-md p-7 border-2 border-red-200">
            <div className="text-4xl mb-3">😔</div>
            <h2 className="font-extrabold text-gray-800 text-lg mb-1">Generation failed</h2>
            <p className="text-red-600 text-sm mb-4">
              {error?.message ?? "Something went wrong. Try again or simplify your brief."}
            </p>
            <button
              onClick={reset}
              className="bg-hoovy-blue text-white font-bold px-6 py-3 rounded-2xl hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Success state */}
        {isSuccess && generatedSummary && data && (
          <div className="mt-8 flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎉</span>
              <h2 className="font-extrabold text-gray-800 text-xl">Scenario Created!</h2>
            </div>

            <ScenarioCard
              scenario={generatedSummary}
              onClick={() => navigate(`/scenario/${data.id}`)}
            />

            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/scenario/${data.id}`)}
                className="flex-1 bg-hoovy-blue text-white font-extrabold py-4 rounded-2xl text-lg hover:opacity-90 transition-opacity"
              >
                Play Now
              </button>
              <button
                onClick={reset}
                className="flex-1 bg-white border-2 border-gray-200 text-gray-700 font-bold py-4 rounded-2xl hover:border-hoovy-blue transition-colors"
              >
                Create Another
              </button>
            </div>

            {/* Step preview */}
            <div className="bg-white rounded-3xl shadow-md p-5">
              <h3 className="font-extrabold text-gray-700 mb-3">
                {data.steps.length} steps generated:
              </h3>
              <ol className="flex flex-col gap-2">
                {data.steps.map((step) => (
                  <li key={step.id} className="flex gap-3 items-start">
                    <span className="bg-hoovy-blue text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                      {step.order}
                    </span>
                    <span className="text-sm text-gray-700">{step.teacher_prompt}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
