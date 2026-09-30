import { EXERCISES } from "./exercise-catalog";

export const PROGRESS_LIMITS = {
  reps: { min: 1, max: 100 },
  weightKg: { min: 0, max: 1000 },
} as const;

export type ProgressEntry = {
  id: string;
  exerciseName: string;
  maxReps: number;
  maxWeightKg: number;
  workReps: number;
  workWeightKg: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

export function getExerciseName(value: string) {
  return EXERCISES.find((exercise) => exercise.name === value)?.name ?? null;
}

function parseIntInRange(value: FormDataEntryValue | null, min: number, max: number) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new RangeError("Заполни число.");
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new RangeError(`Значение должно быть целым числом от ${min} до ${max}.`);
  }

  return parsed;
}

function parseWeight(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new RangeError("Заполни вес.");
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < PROGRESS_LIMITS.weightKg.min || parsed > PROGRESS_LIMITS.weightKg.max) {
    throw new RangeError(
      `Вес должен быть числом от ${PROGRESS_LIMITS.weightKg.min} до ${PROGRESS_LIMITS.weightKg.max} кг.`,
    );
  }

  return Math.round(parsed * 100) / 100;
}

export type ParsedProgress = {
  exerciseName: string;
  maxReps: number;
  maxWeightKg: number;
  workReps: number;
  workWeightKg: number;
};

/**
 * Разбирает форму прогресса. Максимум — личный рекорд, рабочие веса не могут
 * его превышать: иначе строка «сейчас столько, рекорд столько» вводит в
 * заблуждение. Вес обязателен всегда; для упражнений без отягощения вводится 0.
 */
export function parseProgressForm(formData: FormData): ParsedProgress {
  const rawName = formData.get("exerciseName");
  const exerciseName = typeof rawName === "string" ? getExerciseName(rawName) : null;

  if (!exerciseName) {
    throw new RangeError("Выбери упражнение из списка.");
  }

  const maxReps = parseIntInRange(
    formData.get("maxReps"),
    PROGRESS_LIMITS.reps.min,
    PROGRESS_LIMITS.reps.max,
  );
  const workReps = parseIntInRange(
    formData.get("workReps"),
    PROGRESS_LIMITS.reps.min,
    PROGRESS_LIMITS.reps.max,
  );

  if (workReps > maxReps) {
    throw new RangeError("Рабочие повторы не могут быть больше личного рекорда.");
  }

  const maxWeightKg = parseWeight(formData.get("maxWeight"));
  const workWeightKg = parseWeight(formData.get("workWeight"));

  if (workWeightKg > maxWeightKg) {
    throw new RangeError("Рабочий вес не может быть больше веса в рекорде.");
  }

  return { exerciseName, maxReps, maxWeightKg, workReps, workWeightKg };
}

export function formatWeight(weightKg: number) {
  if (weightKg === 0) {
    return "—";
  }

  return `${String(weightKg).replace(".", ",")} кг`;
}

export function formatProgressReps(reps: number) {
  return `${reps} ${reps === 1 ? "повтор" : "повторений"}`;
}
