"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import { SignupSchema, LoginSchema, type AuthFormState } from "@/lib/definitions";
import { checkRateLimit } from "@/lib/rate-limit";
import { redirect } from "next/navigation";

async function getIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

export async function signup(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const validated = SignupSchema.safeParse(raw);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { email, password } = validated.data;

  const ip = await getIp();
  const limit = checkRateLimit(`signup:${ip}`);
  if (!limit.allowed) {
    return { errors: { general: ["Too many attempts. Please wait a minute."] } };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { errors: { email: ["An account with this email already exists."] } };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash },
  });

  await createSession(user.id, user.email);
  return { success: true };
}

export async function login(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const validated = LoginSchema.safeParse(raw);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { email, password } = validated.data;

  const ip = await getIp();
  const limit = checkRateLimit(`login:${ip}:${email}`);
  if (!limit.allowed) {
    return { errors: { general: ["Too many attempts. Please wait a minute."] } };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    // No account, or Google-only account with no password set
    return { errors: { general: ["Invalid email or password."] } };
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    return { errors: { general: ["Invalid email or password."] } };
  }

  await createSession(user.id, user.email);
  return { success: true };
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/");
}
