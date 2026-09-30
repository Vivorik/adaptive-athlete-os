import { EXERCISES, MUSCLE_GROUPS, type Equipment, type MuscleGroup } from "@/lib/exercise-catalog";
import type {
  EquipmentMode,
  Experience,
  Goal,
} from "@/lib/workout-generator";

export const WORKOUT_GOAL_LABELS: Record<Goal, string> = {
  strength: "Сила",
  hypertrophy: "Масса",
  endurance: "Выносливость",
};

export const WORKOUT_GOAL_DESCRIPTIONS: Record<Goal, string> = {
  strength: "Базовые многосуставные движения, 5 повторов, длинный отдых",
  hypertrophy: "Средние повторы, база плюс изоляция для нагрузки мышц",
  endurance: "Высокие повторы, короткий отдых, меньше общего объёма",
};

export const EXPERIENCE_LABELS: Record<Experience, string> = {
  beginner: "Новичок",
  intermediate: "Средний",
  advanced: "Продвинутый",
};

export const EQUIPMENT_MODE_LABELS: Record<EquipmentMode, string> = {
  gym: "Спортзал",
  home: "Дом (гантели, вес тела, резинки)",
};

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: "Грудь",
  back: "Спина",
  legs: "Ноги",
  shoulders: "Плечи",
  arms: "Руки",
  core: "Пресс",
  full_body: "Всё тело",
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: "штанга",
  dumbbell: "гантели",
  machine: "тренажёр",
  cable: "кроссовер",
  bodyweight: "вес тела",
  kettlebell: "гиря",
  band: "резинка",
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "новичок",
  intermediate: "средний",
  advanced: "сложное",
};

export function buildPlanName(input: {
  goal: Goal;
  daysPerWeek: number;
  equipment: EquipmentMode;
}) {
  const dayWord = input.daysPerWeek === 1 ? "день" : "дня";

  return `${WORKOUT_GOAL_LABELS[input.goal]} · ${input.daysPerWeek} ${dayWord} · ${
    EQUIPMENT_MODE_LABELS[input.equipment].split(" ")[0]
  }`;
}

/** Каталог упражнений, сгруппированный по мышечной группе, в порядке MUSCLE_GROUPS. */
export function groupExercisesByMuscle() {
  return MUSCLE_GROUPS.map((group) => ({
    group,
    label: MUSCLE_GROUP_LABELS[group],
    exercises: EXERCISES.filter((exercise) => exercise.muscleGroup === group),
  })).filter((entry) => entry.exercises.length > 0);
}
