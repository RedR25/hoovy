import { http } from "@/shared/api/http";
import type { Scenario } from "@/features/scenarios/types";
import type { AuthorRequest, DraftResponse, PublishRequest } from "./types";

export const authorApi = {
  draft: async (req: AuthorRequest): Promise<DraftResponse> => {
    const { data } = await http.post<DraftResponse>("/author/draft", req);
    return data;
  },

  publish: async (req: PublishRequest): Promise<Scenario> => {
    const { data } = await http.post<Scenario>("/author/publish", req);
    return data;
  },
};
