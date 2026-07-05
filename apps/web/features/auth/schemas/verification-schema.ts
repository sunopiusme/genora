import { z } from "zod";

export const VERIFICATION_CODE_LENGTH = 6;

export const verificationSchema = z.object({
  code: z
    .string()
    .regex(
      new RegExp(`^\\d{${VERIFICATION_CODE_LENGTH}}$`),
      "Введите 6‑значный код из письма",
    ),
});

export type VerificationFormValues = z.infer<typeof verificationSchema>;
