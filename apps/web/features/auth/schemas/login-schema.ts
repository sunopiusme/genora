import { z } from "zod";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const loginSchema = z.object({
  email: z.string().trim().regex(emailPattern, "Введите корректный email"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
