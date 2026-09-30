import type { MuscleGroup } from "@/lib/exercise-catalog";
import type { PrescribedExercise, WorkoutPlan } from "@/lib/workout-generator";

export type CheckinSnapshot = {
  date: string;
  sleep_hours: number | null;
  energy: number | null;
  soreness: Partial<Record<MuscleGroup, number>> | null;
};

export type ReadinessLevel = "low" | "medium" | "high";

export type Readiness = {
  level: ReadinessLevel;
  /** Множитель объёма: 0.6–1.15. */
  volumeFactor: number;
  /** Множитель повторений: на плохой день меньше повторов, но не пустые подходы. */
  repFactor: number;
  /** Что именно повлияло на решение — показываем пользователю. */
  reasons: string[];
  /** Группы с выраженной крепатурой — их нагрузку режем отдельно. */
  soreGroups: MuscleGroup[];
};

const MIN_SETS = 1;
const MAX_SETS = 6;
const MAX_DAILY_SETS = 30;

const SORE_THRESHOLD = 4;
const HIGH_SORE_THRESHOLD = 3;

/**
 * Шаг 0.05, а не 0.5: округление до половины «съедало» саму поправку
 * (1.155 превращалось в 1.0, и хороший день выглядел как нейтральный).
 */
function roundFactor(value: number) {
  return Math.round(value * 20) / 20;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getSoreGroups(
  soreness: Partial<Record<MuscleGroup, number>> | null | undefined,
): MuscleGroup[] {
  if (!soreness) {
    return [];
  }

  return (Object.entries(soreness) as [MuscleGroup, number][])
    .filter(([, level]) => level >= HIGH_SORE_THRESHOLD)
    .map(([group]) => group)
    .sort();
}

/**
 * Переводит сегодняшний чек-ин в решение по нагрузке.
 *
 * Сон и энергия снижают объём по всему дню, крепатура бьёт по конкретным группам.
 * Никогда не выходит за инварианты генератора: подходов не меньше 1 и не больше
 * ограниченного дневного бюджета.
 */
export function analyzeReadiness(checkin: CheckinSnapshot | null): Readiness {
  const reasons: string[] = [];

  if (!checkin) {
    return {
      level: "high",
      volumeFactor: 1,
      repFactor: 1,
      reasons: ["Чек-ин за сегодня не найден — берём базовую нагрузку."],
      soreGroups: [],
    };
  }

  const sleep = checkin.sleep_hours;
  const energy = checkin.energy;
  const soreGroups = getSoreGroups(checkin.soreness);

  let volumeFactor = 1;

  if (sleep !== null) {
    if (sleep < 5) {
      volumeFactor *= 0.8;
      reasons.push(`Сон ${sleep} ч — объём снижен на 20%.`);
    } else if (sleep < 6.5) {
      volumeFactor *= 0.9;
      reasons.push(`Сон ${sleep} ч — объём снижен на 10%.`);
    } else if (sleep >= 8) {
      volumeFactor *= 1.05;
      reasons.push(`Сон ${sleep} ч — объём можно поднять на 5%.`);
    }
  }

  if (energy !== null) {
    if (energy <= 2) {
      volumeFactor *= 0.75;
      reasons.push(`Энергия ${energy}/5 — объём снижен на 25%.`);
    } else if (energy === 3) {
      volumeFactor *= 0.95;
    } else {
      volumeFactor *= 1.1;
      reasons.push(`Энергия ${energy}/5 — можно добавить объём.`);
    }
  }

  for (const group of soreGroups) {
    const level = checkin.soreness?.[group] ?? 0;

    if (level >= SORE_THRESHOLD) {
      volumeFactor *= 0.9;
      reasons.push(`Сильная крепатура: ${group} — нагрузка на группу урезана.`);
    }
  }

  const clamped = roundFactor(clamp(volumeFactor, 0.6, 1.15));
  const repFactor = clamped < 0.8 ? 0.85 : 1;

  if (repFactor < 1) {
    reasons.push("Повторений в подходе меньше — держим технику вместо объёма.");
  }

  return {
    level: clamped >= 1 ? "high" : clamped >= 0.85 ? "medium" : "low",
    volumeFactor: clamped,
    repFactor,
    reasons,
    soreGroups,
  };
}

function scaleExercise(
  exercise: PrescribedExercise,
  readiness: Readiness,
): PrescribedExercise {
  const isSore = readiness.soreGroups.includes(exercise.muscleGroup);
  const factor = isSore ? readiness.volumeFactor * 0.6 : readiness.volumeFactor;
  const sets = clamp(Math.round(exercise.sets * factor), MIN_SETS, MAX_SETS);
  const reps = Math.max(1, Math.round(exercise.reps * readiness.repFactor));

  return { ...exercise, sets, reps };
}

export function applyReadiness(plan: WorkoutPlan, readiness: Readiness): WorkoutPlan {
  return {
    ...plan,
    volumeFactor: roundFactor(plan.volumeFactor * readiness.volumeFactor),
    days: plan.days.map((day) => {
      let dailySets = 0;
      const exercises: PrescribedExercise[] = [];

      for (const exercise of day.exercises) {
        const scaled = scaleExercise(exercise, readiness);

        // Дневной бюджет: не даём суммарно выйти за лимит даже при высокой готовности.
        if (dailySets + scaled.sets > MAX_DAILY_SETS) {
          const room = MAX_DAILY_SETS - dailySets;

          if (room < MIN_SETS) {
            continue;
          }

          const trimmed = { ...scaled, sets: room };

          dailySets += room;
          exercises.push(trimmed);
          continue;
        }

        dailySets += scaled.sets;
        exercises.push(scaled);
      }

      return { ...day, exercises };
    }),
  };
}

export function isEmptyCheckin(checkin: CheckinSnapshot | null) {
  if (!checkin) {
    return true;
  }

  return (
    checkin.sleep_hours === null &&
    checkin.energy === null &&
    getSoreGroups(checkin.soreness).length === 0
  );
}
