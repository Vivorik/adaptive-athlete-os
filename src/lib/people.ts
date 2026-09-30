import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveDisplayName } from "./display-name";

export type Person = {
  userId: string;
  username: string;
  displayName: string;
  exerciseCount: number;
};

type PublicProgressRow = {
  user_id: string;
  exercise_name: string;
};

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
};

/** «1 упражнение», «2 упражнения», «5 упражнений». */
export function pluralExercises(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return "упражнение";
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "упражнения";
  }

  return "упражнений";
}

/**
 * Собирает каталог из плоских строк прогресса и профилей. В каталог попадают
 * только те, у кого есть хотя бы одна открытая запись, поэтому скрывшие всё
 * упражнения из списка исчезают сами.
 */
export function buildPeople(rows: PublicProgressRow[], profiles: ProfileRow[]): Person[] {
  const counts = new Map<string, number>();
  const seen = new Set<string>();

  for (const row of rows) {
    const key = `${row.user_id}\u0000${row.exercise_name}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
  }

  const people: Person[] = [];

  for (const profile of profiles) {
    const exerciseCount = counts.get(profile.id);
    if (!exerciseCount) {
      continue;
    }

    const displayName = resolveDisplayName(profile.display_name, profile.username);
    if (!displayName) {
      continue;
    }

    people.push({
      userId: profile.id,
      username: profile.username,
      displayName,
      exerciseCount,
    });
  }

  return people.sort(
    (a, b) => b.exerciseCount - a.exerciseCount || a.displayName.localeCompare(b.displayName, "ru"),
  );
}

/**
 * Два запроса вместо джойна: у exercise_progress нет прямого FK на profiles,
 * оба ссылаются на auth.users, поэтому PostgREST не может встроить профиль.
 *
 * Чтение идёт через anon-ключ с RLS, поэтому строки приходят уже только с
 * is_public = true. Подсчёт упражнений делается в памяти: пока атлетов десятки,
 * этого хватает, а при росте агрегацию надо будет унести во view или RPC.
 */
export async function fetchPeople(supabase: SupabaseClient): Promise<Person[]> {
  const { data: progress, error: progressError } = await supabase
    .from("exercise_progress")
    .select("user_id, exercise_name")
    .eq("is_public", true);

  if (progressError) {
    return [];
  }

  const rows = (progress ?? []) as PublicProgressRow[];
  if (rows.length === 0) {
    return [];
  }

  const userIds = [...new Set(rows.map((row) => row.user_id))];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .in("id", userIds);

  if (profilesError) {
    return [];
  }

  return buildPeople(rows, (profiles ?? []) as ProfileRow[]);
}
