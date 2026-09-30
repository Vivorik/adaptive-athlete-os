"use client";

import { useActionState } from "react";
import { signIn, signUp } from "./actions";
import { initialAuthState } from "./auth-state";

type AuthFormProps = {
  mode: "signin" | "signup";
  nextPath: string;
  notice: string | null;
};

export function AuthForm({ mode, nextPath, notice }: AuthFormProps) {
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction, isPending] = useActionState(action, initialAuthState);

  const isSignIn = mode === "signin";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={nextPath} />

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Email</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="athlete@example.com"
          className="rounded-md border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Пароль</span>
        <input
          type="password"
          name="password"
          autoComplete={isSignIn ? "current-password" : "new-password"}
          minLength={6}
          required
          placeholder="минимум 6 символов"
          className="rounded-md border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
        />
      </label>

      {state.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      {notice && !state.error ? (
        <p className="rounded-md bg-neutral-100 px-3 py-2 text-sm text-neutral-700">{notice}</p>
      ) : null}

      {state.message ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "Отправка..." : isSignIn ? "Войти" : "Создать аккаунт"}
      </button>
    </form>
  );
}
