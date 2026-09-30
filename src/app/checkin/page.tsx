import { AppShell } from "@/components/app-shell";
import { SupabaseMissingNotice } from "@/components/supabase-missing-notice";
import { requireProfile } from "@/lib/current-user";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { CheckinForm } from "./form";

export const dynamic = "force-dynamic";

export default async function CheckinPage() {
  if (!isSupabaseConfigured()) {
    return <SupabaseMissingNotice />;
  }

  const { username, displayName } = await requireProfile();

  return (
    <AppShell username={username} displayName={displayName}>
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Чек-ин</h1>
          <p className="text-sm text-muted-foreground">
            Дата берётся из часового пояса твоего браузера. Повторный чек-ин за тот же день
            перезапишет предыдущий.
          </p>
        </section>

        <CheckinForm />
      </div>
    </AppShell>
  );
}
