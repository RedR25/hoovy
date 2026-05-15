import type { SkillDomain } from "@/features/scenarios/types";

export type { SkillDomain };

export interface AuthorRequest {
  skill_domain: SkillDomain;
  brief: string;
  difficulty: 1 | 2 | 3;
  num_steps: 1 | 2 | 3 | 4 | 5;
  language: "en" | "vi";
}
