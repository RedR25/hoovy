import { http } from "@/shared/api/http";
import type { Scenario } from "@/features/scenarios/types";
import type { AuthorRequest } from "./types";

export const authorApi = {
  authorScenario: async (req: AuthorRequest): Promise<Scenario> => {
    const { data } = await http.post<Scenario>("/author/scenario", req);
    return data;
  },
};
