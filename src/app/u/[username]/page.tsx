import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Dumbbell, TrendingUp, User } from "lucide-react";
import { WorkoutPlanView } from "@/components/workout-plan-view";
import { SupabaseMissingNotice } from "@/components/supabase-missing-notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchPublicProfileByUsername } from "@/lib/profiles";
import { WORKOUT_GOAL_LABELS } from "@/lib/labels";
import { fetchPublicProgress } from "@/lib/progress-data";
import { formatProgressReps, formatWeight } from "@/lib/progress";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { isWorkoutPlan } from "@/lib/workout-generator";

export const dynamic = "force-dynamic";

type PublicWorkout = { id: string; name: string; goal: string; created_at: string; payload: unknown };

async function getPublicProfile(username: string) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const profile = await fetchPublicProfileByUsername(supabase, username);

  if (!profile) {
    return null;
  }

  const { data: workoutsData } = await supabase
    .from("workouts")
    .select("id, name, goal, created_at, payload")
    .eq("user_id", profile.id)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  const progress = await fetchPublicProgress(supabase, profile.id);

  return { profile, workouts: (workoutsData ?? []) as PublicWorkout[], progress };
}

type PublicProfilePageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({
  params,
}: PublicProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const { profile } = (await getPublicProfile(username)) ?? { profile: null };

  return {
    title: profile ? `${profile.username} — Cheat sheet for bodybuilders` : "Профиль не найден",
  };
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { username } = await params;

  if (!isSupabaseConfigured()) {
    return <SupabaseMissingNotice />;
  }

  const result = await getPublicProfile(username);

  if (!result) {
    notFound();
  }

  const { profile, workouts, progress } = result;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3 sm:flex-nowrap sm:gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <User className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight">
              {profile.displayName ?? profile.username}
            </h1>
            <p className="text-xs text-muted-foreground">
              @{profile.username} · в проекте с{" "}
              {new Date(profile.created_at).toLocaleDateString("ru-RU")}
            </p>
          </div>
        </div>

        <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
          <Link href="/dashboard">В приложение</Link>
        </Button>
      </header>

      {progress.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <TrendingUp className="size-4" />
            Прогресс
          </h2>

          <ul className="flex flex-col divide-y rounded-lg border">
            {progress.map((entry) => (
              <li key={entry.id} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:gap-6">
                <span className="min-w-0 flex-1 font-medium">{entry.exerciseName}</span>
                <span className="text-sm text-muted-foreground">
                  Рекорд: {formatProgressReps(entry.maxReps)} · {formatWeight(entry.maxWeightKg)}
                </span>
                <span className="text-sm text-muted-foreground">
                  Сейчас: {formatProgressReps(entry.workReps)} · {formatWeight(entry.workWeightKg)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {workouts.length === 0 && progress.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Этот профиль пока ничего не поделил.
          </CardContent>
        </Card>
      ) : null}

      {workouts.length > 0 ? (
        <div className="flex flex-col gap-8">
          {workouts.map((workout) => (
            <section key={workout.id} className="flex flex-col gap-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <Dumbbell className="size-4" />
                    {workout.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {WORKOUT_GOAL_LABELS[workout.goal as keyof typeof WORKOUT_GOAL_LABELS] ??
                      workout.goal}
                    {" · "}
                    {new Date(workout.created_at).toLocaleDateString("ru-RU")}
                  </p>
                </CardContent>
              </Card>

              {isWorkoutPlan(workout.payload) ? (
                <WorkoutPlanView plan={workout.payload} />
              ) : (
                <p className="text-sm text-muted-foreground">Данные программы недоступны.</p>
              )}
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
