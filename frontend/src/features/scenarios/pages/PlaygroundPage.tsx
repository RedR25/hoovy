import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useScenariosList } from "@/features/scenarios/hooks";
import { ScenarioCard } from "@/features/scenarios/components/ScenarioCard";
import { SceneBackdrop } from "@/components/ui/SceneBackdrop";
import { BottomNav } from "@/components/ui/BottomNav";
import { ScoreBadge } from "@/components/ui/ScoreBadge";

export function PlaygroundPage() {
  const navigate = useNavigate();
  const { data: scenarios, isLoading, isError } = useScenariosList();
  const [isMockMode, setIsMockMode] = useState(false);

  useEffect(() => {
    axios
      .get<{ mock_ai?: boolean }>("/api/v1/health")
      .then((res) => res.data.mock_ai === true && setIsMockMode(true))
      .catch(() => {});
  }, []);

  return (
    <SceneBackdrop variant="meadow">
      <div className="min-h-screen flex flex-col">
        {isMockMode && (
          <div className="fixed top-3 right-3 z-50 bg-hoovy-yellow text-hoovy-navy text-[10px] font-extrabold px-3 py-1.5 rounded-full border-[3px] border-hoovy-yellowDeep shadow-[0_3px_0_#D98A1C]">
            DEMO MOCK MODE
          </div>
        )}

        {/* Header bar with back, title, score */}
        <header className="px-4 pt-6 pb-4 flex items-center gap-3 max-w-md w-full mx-auto relative z-10">
          <button
            onClick={() => navigate("/")}
            className="w-12 h-12 rounded-full bg-white border-[4px] border-white shadow-[0_5px_0_rgba(0,0,0,0.15)] flex items-center justify-center text-hoovy-skyDeep active:translate-y-[5px] active:!shadow-none transition-all flex-shrink-0"
            aria-label="Back"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1
            className="flex-1 text-center text-2xl font-extrabold text-hoovy-navy"
            style={{
              fontFamily: "Fredoka",
              textShadow: "0 2px 0 rgba(255,255,255,0.7)",
            }}
          >
            My Episodes
          </h1>
          <ScoreBadge score={12} />
        </header>

        {/* Cards — pb-28 leaves room for the fixed BottomNav */}
        <main className="flex-1 px-4 pb-28 max-w-md w-full mx-auto relative z-10">
          {isLoading && (
            <div className="flex justify-center mt-20">
              <div className="w-12 h-12 rounded-full border-4 border-hoovy-sky border-t-transparent animate-spin" />
            </div>
          )}

          {isError && (
            <p className="text-center text-hoovy-pinkDeep font-extrabold mt-10">
              Could not load episodes. Make sure the backend is running.
            </p>
          )}

          {!isLoading && !isError && scenarios && scenarios.length === 0 && (
            <p className="text-center text-hoovy-navy/50 font-bold mt-10">No episodes yet.</p>
          )}

          {!isLoading && !isError && scenarios && scenarios.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {scenarios.map((s) => (
                <ScenarioCard
                  key={s.id}
                  scenario={s}
                  onClick={(id) => {
                    axios.post("/api/v1/warmup").catch(() => {});
                    navigate(`/scenario/${id}`);
                  }}
                />
              ))}
            </div>
          )}
        </main>

        <BottomNav />
      </div>
    </SceneBackdrop>
  );
}
