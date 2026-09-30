import { AppShell } from "@/components/app-shell";
import { requireProfile } from "@/lib/current-user";
import { GenerateForm } from "./form";

export default async function GeneratePage() {
  const { username } = await requireProfile();

  return (
    <AppShell username={username}>
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Генератор тренировок</h1>
          <p className="text-sm text-muted-foreground">
            Соберём программу из 46 упражнений под цель, инвентарь и уровень подготовки. Если есть
            свежий чек-ин, нагрузка подстроится под сон, энергию и крепатуру.
          </p>
        </section>

        <GenerateForm />
      </div>
    </AppShell>
  );
}
