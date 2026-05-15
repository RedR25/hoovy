import { useMutation } from "@tanstack/react-query";
import { authorApi } from "./api";
import type { AuthorRequest } from "./types";
import type { Scenario } from "@/features/scenarios/types";

export function useAuthorScenario() {
  return useMutation<Scenario, Error, AuthorRequest>({
    mutationFn: (req) => authorApi.authorScenario(req),
  });
}
