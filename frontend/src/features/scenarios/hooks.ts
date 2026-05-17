import { useQuery } from "@tanstack/react-query";
import { scenariosApi } from "@/features/scenarios/api";
import type { Scenario, ScenarioSummary } from "@/features/scenarios/types";

export function useScenariosList() {
  return useQuery<ScenarioSummary[]>({
    queryKey: ["scenarios"],
    queryFn: scenariosApi.list,
  });
}

export function useScenario(id: string) {
  return useQuery<Scenario>({
    queryKey: ["scenarios", id],
    queryFn: () => scenariosApi.get(id),
    enabled: Boolean(id),
  });
}
