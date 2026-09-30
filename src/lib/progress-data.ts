import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProgressEntry } from "./progress";

type ProgressRow = {
  id: string;
  exercise_name: string;
  max_reps: number;
  max_weight_kg: number;
  work_reps: number;
  work_weight_kg: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export const PROGRESS_COLUMNS =
  "id, exercise_name, max_reps, max_weight_kg, work_reps, work_weight_kg, is_public, created_at, updated_at";

function toProgressEntry(row: ProgressRow): ProgressEntry {
  return {
    id: row.id,
    exerciseName: row.exercise_name,
    maxReps: row.max_reps,
    maxWeightKg: Number(row.max_weight_kg),
    workReps: row.work_reps,
    workWeightKg: Number(row.work_weight_kg),
    isPublic: row.is_public,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Чтение идёт через anon-ключ с RLS, поэтому здесь нет service_role: чужие
 * строки приходят только с is_public = true.
 */
export async function fetchProgressEntries(supabase: SupabaseClient): Promise<ProgressEntry[]> {
  const { data, error } = await supabase
    .from("exercise_progress")
    .select(PROGRESS_COLUMNS)
    .order("exercise_name", { ascending: true });

  if (error) {
    return [];
  }

  return ((data ?? []) as ProgressRow[]).map(toProgressEntry);
}

export async function fetchPublicProgress(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProgressEntry[]> {
  const { data, error } = await supabase
    .from("exercise_progress")
    .select(PROGRESS_COLUMNS)
    .eq("user_id", userId)
    .eq("is_public", true)
    .order("exercise_name", { ascending: true });

  if (error) {
    return [];
  }

  return ((data ?? []) as ProgressRow[]).map(toProgressEntry);
}
