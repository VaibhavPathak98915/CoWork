import { z } from "zod";

/**
 * Shared by the auth service and the React sign-up form, so the rules the user is
 * shown and the rules the server enforces cannot drift apart.
 */
export const ROLES = ["User", "Admin", "Staff"];

const email = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address")
  .toLowerCase();

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200, "Password is too long");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email,
  password,
  // SECURITY: self-assigned roles are fine for this demo but must become an
  // invite/promotion flow before this is exposed to real users — anyone can
  // currently register as Admin.
  role: z.enum(ROLES).default("User"),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});
