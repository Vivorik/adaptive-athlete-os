"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { AuthState } from "./auth-state";

const NOT_CONFIGURED =
  "Supabase не настроен. Укажи NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY в .env.local и перезапусти dev-сервер.";

function resolveNext(formData: FormData) {
  const raw = formData.get("next");
  const value = typeof raw === "string" ? raw : "";

  return value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return null;
  }

  return { email, password };
}

export async function signIn(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { error: NOT_CONFIGURED, message: null };
  }

  const credentials = readCredentials(formData);

  if (!credentials) {
    return { error: "Введите email и пароль.", message: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    return { error: `Не удалось войти: ${error.message}`, message: null };
  }

  redirect(resolveNext(formData));
}

export async function signUp(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { error: NOT_CONFIGURED, message: null };
  }

  const credentials = readCredentials(formData);

  if (!credentials) {
    return { error: "Введите email и пароль.", message: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(credentials);

  if (error) {
    return { error: `Не удалось зарегистрироваться: ${error.message}`, message: null };
  }

  if (data.session) {
    redirect(resolveNext(formData));
  }

  return {
    error: null,
    message: "Аккаунт создан. Подтвердите email, чтобы войти.",
  };
}

export async function signOut() {
  if (!isSupabaseConfigured()) {
    redirect("/auth");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/auth");
}
