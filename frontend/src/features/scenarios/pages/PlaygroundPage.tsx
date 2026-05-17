import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useScenariosList } from "@/features/scenarios/hooks";
import { ScenarioCard } from "@/features/scenarios/components/ScenarioCard";

export function PlaygroundPage() {
  const navigate = useNavigate();
  const { data: scenarios, isLoading, isError } = useScenariosList();
  const [isMockMode, setIsMockMode] = useState(false);

  // Check whether backend is running in mock mode once on mount.
  useEffect(() => {
    axios
      .get<{ mock_ai?: boolean }>("/api/v1/health")
      .then((res) => {
        if (res.data.mock_ai === true) setIsMockMode(true);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-hoovy-bg px-4 py-8 font-friendly">
      {/* Mock mode banner */}
      {isMockMode && (
        <div className="fixed top-3 right-3 z-50 bg-yellow-300 text-yellow-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
          DEMO MOCK MODE — AI responses are canned.
        </div>
      )}

      {/* Header */}
      <header className="text-center mb-10">
        <h1 className="text-5xl font-extrabold text-hoovy-purple tracking-tight">
          Hoovy
        </h1>
        <p className="mt-2 text-lg text-gray-500 font-semibold">
          Pick a scenario to start.
        </p>
      </header>

      {/* States */}
      {isLoading && (
        <div className="flex justify-center mt-20">
          <div className="w-12 h-12 rounded-full border-4 border-hoovy-blue border-t-transparent animate-spin" />
        </div>
      )}

      {isError && (
        <p className="text-center text-red-500 font-semibold mt-10">
          Could not load scenarios. Make sure the backend is running.
        </p>
      )}

      {!isLoading && !isError && scenarios && scenarios.length === 0 && (
        <p className="text-center text-gray-400 font-semibold mt-10">
          No scenarios found yet.
        </p>
      )}

      {!isLoading && !isError && scenarios && scenarios.length > 0 && (
        <main className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-5">
          {scenarios.map((s) => (
            <ScenarioCard
              key={s.id}
              scenario={s}
              onClick={(id) => {
                // Fire-and-forget: warm Kokoro + Gemma while the kid is still
                // on this page so the first record→eval call doesn't pay the
                // cold-start cost (~10–15s).
                axios.post("/api/v1/warmup").catch(() => {});
                // The click itself feeds WebGazer (via its global click listener)
                // as a calibration sample — the kid was looking at the card.
                navigate(`/scenario/${id}`);
              }}
            />
          ))}
        </main>
      )}
    </div>
  );
}
