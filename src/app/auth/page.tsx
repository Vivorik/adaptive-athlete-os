import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { AuthForm } from "./form";

type AuthPageProps = {
  searchParams: Promise<{ mode?: string; next?: string }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const { mode, next } = await searchParams;
  const nextPath = next && next.startsWith("/") ? next : "/dashboard";

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();

    if (data?.claims) {
      redirect(nextPath);
    }
  }

  const isSignIn = mode !== "signup";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Cheat sheet for bodybuilders</h1>
        <p className="text-sm text-neutral-600">
          {isSignIn ? "Войдите в аккаунт" : "Создайте аккаунт"}
        </p>
      </header>

      {!isSupabaseConfigured() ? (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Supabase не настроен: впишите ключи в .env.local и перезапустите dev-сервер.
        </p>
      ) : null}

      <AuthForm
        mode={isSignIn ? "signin" : "signup"}
        nextPath={nextPath}
        notice={isSupabaseConfigured() ? null : "После настройки страница заработает без перезагрузки кода."}
      />

      <p className="text-sm text-neutral-600">
        {isSignIn ? "Нет аккаунта? " : "Уже есть аккаунт? "}
        <a
          className="underline underline-offset-4"
          href={isSignIn ? "/auth?mode=signup" : "/auth?mode=signin"}
        >
          {isSignIn ? "Зарегистрироваться" : "Войти"}
        </a>
      </p>
    </main>
  );
}
