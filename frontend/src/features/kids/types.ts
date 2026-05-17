import { z } from "zod";

export const kidSchema = z.object({
  id: z.string().uuid(),
  parent_user_id: z.string().uuid(),
  display_name: z.string(),
  avatar_emoji: z.string(),
  dob: z.string().nullable(),
  created_at: z.string(),
});

export type Kid = z.infer<typeof kidSchema>;

export interface CreateKidPayload {
  display_name: string;
  avatar_emoji?: string;
  dob?: string | null;
}
