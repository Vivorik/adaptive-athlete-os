import { AppShell } from "@/components/app-shell";
import { SupabaseMissingNotice } from "@/components/supabase-missing-notice";
import { requireProfile } from "@/lib/current-user";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchProgressEntries } from "@/lib/progress-data";
import { ProgressForm } from "./form";
import { ProgressList } from "./list";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  if (!isSupabaseConfigured()) {
    return <SupabaseMissingNotice />;
  }

  const { supabase, username } = await requireProfile();
  const entries = await fetchProgressEntries(supabase);

  return (
    <AppShell username={username}>
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Прогресс</h1>
          <p className="text-sm text-muted-foreground">
            Личный рекорд по каждому упражнению и то, с чем ты работаешь сейчас.
          </p>
        </section>

        <ProgressForm />
        <ProgressList entries={entries} />
      </div>
    </AppShell>
  );
}
