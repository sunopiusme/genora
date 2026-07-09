import { z } from "zod";

export const chatRequestSchema = z.object({
  prompt: z.string().trim().min(1).max(8000),
  modelId: z.string().min(1).max(64),
  levelId: z.string().min(1).max(32),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
