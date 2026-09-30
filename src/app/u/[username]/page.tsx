import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Dumbbell, User } from "lucide-react";
import { WorkoutPlanView } from "@/components/workout-plan-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WORKOUT_GOAL_LABELS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { isWorkoutPlan } from "@/lib/workout-generator";

type PublicProfile = { id: string; username: string; created_at: string };
type PublicWorkout = { id: string; name: string; goal: string; created_at: string; payload: unknown };

async function getPublicProfile(username: string) {
  const supabase = await createClient();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, username, created_at")
    .eq("username", username)
    .maybeSingle();

  const profile = profileData as PublicProfile | null;

  if (!profile) {
    return null;
  }

  const { data: workoutsData } = await supabase
    .from("workouts")
    .select("id, name, goal, created_at, payload")
    .eq("user_id", profile.id)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  return { profile, workouts: (workoutsData ?? []) as PublicWorkout[] };
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
  const result = await getPublicProfile(username);

  if (!result) {
    notFound();
  }

  const { profile, workouts } = result;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted">
            <User className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{profile.username}</h1>
            <p className="text-xs text-muted-foreground">
              В проекте с {new Date(profile.created_at).toLocaleDateString("ru-RU")}
            </p>
          </div>
        </div>

        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">В приложение</Link>
        </Button>
      </header>

      {workouts.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Этот профиль пока не поделился публичными тренировками.
          </CardContent>
        </Card>
      ) : (
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
      )}
    </div>
  );
}
