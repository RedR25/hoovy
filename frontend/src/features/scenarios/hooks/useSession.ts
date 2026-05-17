import { useEffect, useRef, useState } from "react";
import axios from "axios";
import type { SessionRead } from "@/features/scenarios/types";

interface UseSessionReturn {
  sessionId: string | null;
  isReady: boolean;
  error: string | null;
}

export function useSession(scenarioId: string): UseSessionReturn {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createdIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!scenarioId) return;

    axios
      .post<SessionRead>("/api/v1/sessions", {
        scenario_id: scenarioId,
        language: "en",
      })
      .then((res) => {
        createdIdRef.current = res.data.id;
        setSessionId(res.data.id);
        setIsReady(true);
      })
      .catch(() => {
        setError("Could not start session");
        setIsReady(true);
      });

    return () => {
      if (createdIdRef.current) {
        // fire-and-forget
        axios
          .post(`/api/v1/sessions/${createdIdRef.current}/end`)
          .catch(() => {});
      }
    };
  }, [scenarioId]);

  return { sessionId, isReady, error };
}
