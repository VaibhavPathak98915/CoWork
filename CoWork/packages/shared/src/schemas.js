import { z } from "zod";
import { localDate } from "./dates.js";

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

/** Booking creation. Shared so the modal and the service agree on the rules. */
export const DURATIONS = ["1 Hour", "Half Day", "Full Day", "Monthly"];

export const createBookingSchema = z.object({
  spaceId: z.string().min(1, "Pick a space"),
  plan: z.string().trim().min(1, "Pick a plan").max(60),
  duration: z.enum(DURATIONS),
  startsOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date")
    // A booking in the past is almost always a typo, and it would quietly skew
    // every "today" figure on the dashboard.
    .refine((d) => d >= localDate(), "Date can't be in the past"),
  seats: z.number().int().min(1, "At least 1 seat").max(50, "Too many seats").default(1),
});
