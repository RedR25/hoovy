import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { kidsApi } from "./api";
import type { CreateKidPayload, Kid } from "./types";

const ACTIVE_KID_STORAGE_KEY = "hoovy.active_kid_id";

export function useMyKids() {
  return useQuery<Kid[]>({
    queryKey: ["kids", "mine"],
    queryFn: () => kidsApi.list(),
  });
}

export function useCreateKid() {
  const qc = useQueryClient();
  return useMutation<Kid, Error, CreateKidPayload>({
    mutationFn: (p) => kidsApi.create(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kids", "mine"] });
    },
  });
}

export function useDeleteKid() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => kidsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kids", "mine"] });
    },
  });
}

export function useActiveKid() {
  const [activeKidId, setActiveKidIdState] = useState<string | null>(() =>
    localStorage.getItem(ACTIVE_KID_STORAGE_KEY),
  );

  // Sync across tabs / re-renders.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACTIVE_KID_STORAGE_KEY) {
        setActiveKidIdState(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setActiveKidId = useCallback((id: string | null) => {
    if (id) {
      localStorage.setItem(ACTIVE_KID_STORAGE_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_KID_STORAGE_KEY);
    }
    setActiveKidIdState(id);
  }, []);

  return { activeKidId, setActiveKidId };
}
