/**
 * Страница-заглушка для случая, когда Supabase не сконфигурирован.
 * Раньше такой случай приводил к падению сборки: getSupabaseEnv() бросал
 * исключение до того, как страница успевала пометить себя динамической.
 */
export function SupabaseMissingNotice() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-4 px-4">
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-6">
        <h1 className="text-lg font-semibold text-amber-900">Supabase не настроен</h1>
        <p className="mt-2 text-sm text-amber-800">
          Приложению нужны ключи проекта Supabase, чтобы читать профиль, чек-ины и тренировки.
        </p>
        <ul className="mt-3 space-y-1 text-sm text-amber-900">
          <li>
            <code>NEXT_PUBLIC_SUPABASE_URL</code>
          </li>
          <li>
            <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>
          </li>
        </ul>
        <p className="mt-3 text-sm text-amber-800">
          Локально: впиши их в <code>.env.local</code> и перезапусти dev-сервер. На Vercel: Project →
          Settings → Environment Variables, затем пересобери деплой.
        </p>
      </div>
    </main>
  );
}
