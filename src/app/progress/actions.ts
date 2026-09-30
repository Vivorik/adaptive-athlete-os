"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/current-user";
import { getExerciseName, parseProgressForm } from "@/lib/progress";
import type { ProgressState } from "./state";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isProgressTarget(id: string, exerciseName: string) {
  return UUID_PATTERN.test(id) && getExerciseName(exerciseName) !== null;
}

export async function saveProgressAction(
  _prevState: ProgressState,
  formData: FormData,
): Promise<ProgressState> {
  const { supabase, user } = await requireUser();

  let parsed;

  try {
    parsed = parseProgressForm(formData);
  } catch (cause) {
    return {
      error: cause instanceof RangeError ? cause.message : "Не удалось разобрать данные.",
      savedMessage: null,
      savedExerciseName: null,
    };
  }

  // is_public намеренно не берём из формы: публичность переключается отдельно
  // и не должна молча сбрасываться при перезаписи цифр.
  const { error } = await supabase.from("exercise_progress").upsert(
    {
      user_id: user.id,
      exercise_name: parsed.exerciseName,
      max_reps: parsed.maxReps,
      max_weight_kg: parsed.maxWeightKg,
      work_reps: parsed.workReps,
      work_weight_kg: parsed.workWeightKg,
    },
    { onConflict: "user_id,exercise_name" },
  );

  if (error) {
    return {
      error: `Не удалось сохранить прогресс: ${error.message}`,
      savedMessage: null,
      savedExerciseName: null,
    };
  }

  revalidatePath("/progress");

  return {
    error: null,
    savedMessage: `«${parsed.exerciseName}» обновлён.`,
    savedExerciseName: parsed.exerciseName,
  };
}

export async function setProgressVisibilityAction(id: string, exerciseName: string, isPublic: boolean) {
  const { supabase, user } = await requireUser();

  if (!isProgressTarget(id, exerciseName)) {
    return;
  }

  const { error } = await supabase
    .from("exercise_progress")
    .update({ is_public: isPublic, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return;
  }

  revalidatePath("/progress");
  revalidatePath(`/u/${user.user_metadata?.username ?? ""}`);
}

export async function deleteProgressAction(id: string, exerciseName: string) {
  const { supabase, user } = await requireUser();

  if (!isProgressTarget(id, exerciseName)) {
    return;
  }

  await supabase.from("exercise_progress").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/progress");
  revalidatePath(`/u/${user.user_metadata?.username ?? ""}`);
}
