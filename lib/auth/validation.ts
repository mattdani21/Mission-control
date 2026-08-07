import { z } from "zod";

// Shared Zod schemas for every auth boundary (route handlers + Credentials
// provider). Single source of truth so signup and sign-in enforce the same
// email/password rules.

// Trim before the email-format check (zod 4 validates format before any
// transforms, so z.email().trim() would reject whitespace-padded input).
export const emailSchema = z.string().trim().pipe(z.email("Enter a valid email address."));

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[A-Za-z]/, "Password must contain at least one letter.")
  .regex(/[0-9]/, "Password must contain at least one number.");

export const signupSchema = z.object({
  email: emailSchema,
  name: z
    .string()
    .trim()
    .max(100, "Name must be at most 100 characters.")
    .optional(),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Missing reset token."),
  password: passwordSchema,
});
