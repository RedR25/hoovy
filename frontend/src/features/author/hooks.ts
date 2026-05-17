import { useMutation } from "@tanstack/react-query";
import { authorApi } from "./api";
import type { AuthorRequest, DraftResponse, PublishRequest } from "./types";
import type { Scenario } from "@/features/scenarios/types";

export function useDraftScenario() {
  return useMutation<DraftResponse, Error, AuthorRequest>({
    mutationFn: (req) => authorApi.draft(req),
  });
}

export function usePublishScenario() {
  return useMutation<Scenario, Error, PublishRequest>({
    mutationFn: (req) => authorApi.publish(req),
  });
}
