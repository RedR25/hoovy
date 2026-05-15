import { http } from "@/shared/api/http";
import type { Scenario, ScenarioSummary } from "@/features/scenarios/types";

export const scenariosApi = {
  list: async (): Promise<ScenarioSummary[]> => {
    const { data } = await http.get<ScenarioSummary[]>("/api/v1/scenarios");
    return data;
  },
  get: async (id: string): Promise<Scenario> => {
    const { data } = await http.get<Scenario>(`/api/v1/scenarios/${id}`);
    return data;
  },
};
