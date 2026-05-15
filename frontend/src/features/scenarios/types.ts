export type ResponseType = "voice" | "choice" | "tap" | "voice_or_choice";
export type SkillDomain =
  | "communication"
  | "money"
  | "time"
  | "social"
  | "practical";

export interface Choice {
  id: string;
  text: string;
  is_correct: boolean;
}

export interface ScenarioStep {
  id: string;
  order: number;
  teacher_prompt: string;
  teacher_prompt_vi: string;
  scene_image_url: string | null;
  scene_image_prompt: string | null;
  response_type: ResponseType;
  choices: Choice[];
  voice_accepts: string[];
  hint_on_wrong: string | null;
  hint_image_url: string | null;
  praise_on_correct: string | null;
  max_attempts: number;
}

export interface Scenario {
  id: string;
  title: string;
  title_vi: string;
  skill_domain: SkillDomain;
  difficulty: number;
  thumbnail_url: string | null;
  estimated_minutes: number;
  language: string;
  steps: ScenarioStep[];
}

export interface ScenarioSummary {
  id: string;
  title: string;
  title_vi: string;
  skill_domain: SkillDomain;
  difficulty: number;
  thumbnail_url: string | null;
  estimated_minutes: number;
  language: string;
}

export interface SessionRead {
  id: string;
  scenario_id: string;
  kid_name: string | null;
  language: string;
  started_at: string;
  ended_at: string | null;
}

export interface SessionProgress {
  session_id: string;
  total: number;
  correct: number;
  accuracy: number;
  prompt_fade_rate: number;
}

export interface EvaluateResponse {
  transcript: string;
  is_correct: boolean;
  confidence: number;
  feedback: string;
  attempts_remaining: number;
  advance: boolean;
  feedback_audio_b64: string;
  hint_image_url: string | null;
}
