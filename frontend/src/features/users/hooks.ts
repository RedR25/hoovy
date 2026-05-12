import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi, type RegisterPayload } from "@/features/users/api";

const KEYS = {
  me: ["users", "me"] as const,
};

export const useMe = (enabled = true) =>
  useQuery({
    queryKey: KEYS.me,
    queryFn: usersApi.me,
    enabled,
  });

export const useRegister = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegisterPayload) => usersApi.register(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.me }),
  });
};
