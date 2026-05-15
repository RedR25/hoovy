import { useState } from "react";
import axios from "axios";
import type { EvaluateResponse } from "@/features/scenarios/types";

interface EvaluateArgs {
  sessionId: string;
  scenarioId: string;
  stepId: string;
  attempt: number;
  blob: Blob;
  mimeType: string;
}

interface UseEvaluateReturn {
  evaluate: (args: EvaluateArgs) => Promise<EvaluateResponse>;
  isEvaluating: boolean;
  error: string | null;
}

export function useEvaluate(): UseEvaluateReturn {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evaluate = async (args: EvaluateArgs): Promise<EvaluateResponse> => {
    setIsEvaluating(true);
    setError(null);

    const ext = args.mimeType.includes("webm")
      ? "webm"
      : args.mimeType.includes("ogg")
        ? "ogg"
        : args.mimeType.includes("mp4")
          ? "mp4"
          : "wav";

    const file = new File([args.blob], `response.${ext}`, { type: args.mimeType });
    const form = new FormData();
    form.append("session_id", args.sessionId);
    form.append("scenario_id", args.scenarioId);
    form.append("step_id", args.stepId);
    form.append("attempt_number", String(args.attempt));
    form.append("audio", file);

    try {
      const res = await axios.post<EvaluateResponse>("/api/v1/evaluate", form);
      return res.data;
    } catch (err) {
      const msg = "Evaluation failed. Please try again.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsEvaluating(false);
    }
  };

  return { evaluate, isEvaluating, error };
}
