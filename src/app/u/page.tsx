import type { Metadata } from "next";
import Link from "next/link";
import { TrendingUp, Users } from "lucide-react";
import { SupabaseMissingNotice } from "@/components/supabase-missing-notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchPeople, pluralExercises } from "@/lib/people";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Другие атлеты — Cheat sheet for bodybuilders",
};

export default async function PeoplePage() {
  if (!isSupabaseConfigured()) {
    return <SupabaseMissingNotice />;
  }

  const supabase = await createClient();
  const people = await fetchPeople(supabase);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3 sm:flex-nowrap sm:gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <Users className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight">Другие атлеты</h1>
            <p className="text-xs text-muted-foreground">
              Те, кто открыл свой прогресс. Нажми, чтобы увидеть упражнения, вес и повторения.
            </p>
          </div>
        </div>

        <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
          <Link href="/dashboard">В приложение</Link>
        </Button>
      </header>

      {people.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Пока никто не поделился прогрессом. Открой хотя бы одно упражнение в разделе «Прогресс» — и здесь
            появишься ты.
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {people.map((person) => (
            <li key={person.userId}>
              <Link
                href={`/u/${person.username}`}
                className="flex h-full items-center justify-between gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{person.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">@{person.username}</p>
                </div>

                <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
                  <TrendingUp className="size-4" />
                  {person.exerciseCount} {pluralExercises(person.exerciseCount)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
