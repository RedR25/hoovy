import type { Scenario, SkillDomain } from "@/features/scenarios/types";

export type { SkillDomain };
export type Complexity = "low" | "med" | "high";

export interface AuthorRequest {
  skill_target: string;
  child_interests: string;
  complexity: Complexity;
  skill_domain: SkillDomain;
  num_steps: 1 | 2 | 3 | 4 | 5;
}

export interface DraftResponse {
  draft_id: string;
  scenario: Scenario;
}

export interface PublishRequest {
  draft_id: string;
}
