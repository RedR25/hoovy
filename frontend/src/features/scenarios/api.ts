import { http } from "@/shared/api/http";
import type { Scenario, ScenarioSummary } from "@/features/scenarios/types";

export const scenariosApi = {
  list: async (): Promise<ScenarioSummary[]> => {
    const { data } = await http.get<ScenarioSummary[]>("/scenarios");
    return data;
  },
  get: async (id: string): Promise<Scenario> => {
    const { data } = await http.get<Scenario>(`/scenarios/${id}`);
    return data;
  },
};
