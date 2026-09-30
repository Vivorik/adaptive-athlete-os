import { AppShell } from "@/components/app-shell";
import { requireProfile } from "@/lib/current-user";
import { NutritionForm } from "./form";

export default async function NutritionPage() {
  const { username } = await requireProfile();

  return (
    <AppShell username={username}>
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
