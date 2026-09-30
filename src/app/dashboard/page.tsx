import Link from "next/link";
import { ArrowRight, Dumbbell, Moon, Zap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DailyStatus } from "@/components/daily-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/current-user";
import { WORKOUT_GOAL_LABELS } from "@/lib/labels";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SupabaseMissingNotice } from "@/components/supabase-missing-notice";

export const dynamic = "force-dynamic";

type CheckinRow = { date: string; sleep_hours: number | null; energy: number | null };
type WorkoutRow = { id: string; name: string; goal: string; created_at: string };

function formatSleepHours(hours: number | null | undefined) {
  if (hours === null || hours === undefined) {
    return "—";
  }

  const rounded = Math.round(hours * 2) / 2;
  const isHalf = rounded % 1 !== 0;

  return `${isHalf ? rounded.toFixed(1).replace(".", ",") : rounded} ч`;
}

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return <SupabaseMissingNotice />;
  }

  const { supabase, user, username } = await requireProfile();

  const [checkinsResult, workoutsResult] = await Promise.all([
    supabase
      .from("checkins")
      .select("date, sleep_hours, energy")
      .order("date", { ascending: false })
      .limit(90),
    supabase
      .from("workouts")
      .select("id, name, goal, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const checkins = (checkinsResult.data ?? []) as CheckinRow[];
  const workouts = (workoutsResult.data ?? []) as WorkoutRow[];
  const latestCheckin = checkins[0] ?? null;

  return (
    <AppShell username={username}>
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Привет{username ? `, ${username}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            {user.email} · собрано {workouts.length === 5 ? "5+" : workouts.length} тренировок
          </p>
        </section>

        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/generate">
              <Dumbbell />
              Сгенерировать тренировку
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
          {latestCheckin ? (
            <p className="text-xs text-muted-foreground">
              Учтём чек-ин за {latestCheckin.date}:{" "}
              {latestCheckin.sleep_hours !== null
                ? `${String(latestCheckin.sleep_hours).replace(".", ",")} ч сна`
                : "сон не указан"}
              {latestCheckin.energy !== null ? `, энергия ${latestCheckin.energy}/5` : ""}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Сделай чек-ин — и нагрузка подстроится под самочувствие
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <DailyStatus checkinDates={checkins.map((checkin) => checkin.date)} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Moon className="size-4" />
                Сон прошлой ночью
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">
                {formatSleepHours(latestCheckin?.sleep_hours)}
              </p>
              <p className="text-xs text-muted-foreground">
                {latestCheckin ? `${latestCheckin.date}` : "нет данных"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Zap className="size-4" />
                Энергия
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">
                {latestCheckin?.energy ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">из 5</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Последние тренировки
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workouts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Пока ничего не сохранено.</p>
            ) : (
              <ul className="flex flex-col divide-y">
                {workouts.map((workout) => (
                  <li key={workout.id} className="flex items-center justify-between gap-4 py-2">
                    <span className="text-sm font-medium">{workout.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {WORKOUT_GOAL_LABELS[workout.goal as keyof typeof WORKOUT_GOAL_LABELS] ??
                        workout.goal}
                      {" · "}
                      {new Date(workout.created_at).toLocaleDateString("ru-RU")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
