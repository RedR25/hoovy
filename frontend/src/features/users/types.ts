import { z } from "zod";

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().nullable(),
  role: z.string().default("parent"),
  is_active: z.boolean(),
  created_at: z.string(),
});

export type User = z.infer<typeof userSchema>;

export const tokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.literal("bearer"),
});

export type TokenResponse = z.infer<typeof tokenResponseSchema>;
