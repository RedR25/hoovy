import { http } from "@/shared/api/http";
import { kidSchema, type CreateKidPayload, type Kid } from "./types";

export const kidsApi = {
  list: async (): Promise<Kid[]> => {
    const { data } = await http.get("/kids");
    return kidSchema.array().parse(data);
  },

  create: async (payload: CreateKidPayload): Promise<Kid> => {
    const { data } = await http.post("/kids", payload);
    return kidSchema.parse(data);
  },

  delete: async (kid_id: string): Promise<void> => {
    await http.delete(`/kids/${kid_id}`);
  },
};
