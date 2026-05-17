import { useState } from "react";
import axios from "axios";
import type { EvaluateResponse } from "@/features/scenarios/types";

interface EvaluateChoiceArgs {
  sessionId: string;
  scenarioId: string;
  stepId: string;
  attempt: number;
  choiceId: string;
}

interface UseEvaluateChoiceReturn {
  evaluateChoice: (args: EvaluateChoiceArgs) => Promise<EvaluateResponse>;
  isEvaluating: boolean;
  error: string | null;
}

export function useEvaluateChoice(): UseEvaluateChoiceReturn {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evaluateChoice = async (
    args: EvaluateChoiceArgs,
  ): Promise<EvaluateResponse> => {
    setIsEvaluating(true);
    setError(null);
    try {
      const res = await axios.post<EvaluateResponse>(
        "/api/v1/evaluate/choice",
        {
          session_id: args.sessionId,
          scenario_id: args.scenarioId,
          step_id: args.stepId,
          attempt_number: args.attempt,
          choice_id: args.choiceId,
        },
      );
      return res.data;
    } catch {
      const msg = "Choice evaluation failed. Please try again.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsEvaluating(false);
    }
  };

  return { evaluateChoice, isEvaluating, error };
}
