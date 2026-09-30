import { AppShell } from "@/components/app-shell";
import { requireProfile } from "@/lib/current-user";
import { CheckinForm } from "./form";

export default async function CheckinPage() {
  const { username } = await requireProfile();

  return (
    <AppShell username={username}>
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
