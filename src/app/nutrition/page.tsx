import { AppShell } from "@/components/app-shell";
import { SupabaseMissingNotice } from "@/components/supabase-missing-notice";
import { requireProfile } from "@/lib/current-user";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { NutritionForm } from "./form";

export const dynamic = "force-dynamic";

export default async function NutritionPage() {
  if (!isSupabaseConfigured()) {
    return <SupabaseMissingNotice />;
  }

  const { username, displayName } = await requireProfile();

  return (
    <AppShell username={username} displayName={displayName}>
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Калории и КБЖУ</h1>
          <p className="text-sm text-muted-foreground">
            Расчёт по формуле Миффлина-Сан Жеора. Данные никуда не сохраняются.
          </p>
        </section>

        <NutritionForm />
      </div>
    </AppShell>
  );
}
