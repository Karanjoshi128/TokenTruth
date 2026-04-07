import { z } from "zod";

export const SignupSchema = z.object({
  email: z.string().email("Please enter a valid email.").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password too long."),
});

export const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email.").trim().toLowerCase(),
  password: z.string().min(1, "Password is required."),
});

export type AuthFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
        general?: string[];
      };
      success?: boolean;
    }
  | undefined;
