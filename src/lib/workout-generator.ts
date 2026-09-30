import { EXERCISES, type Exercise, type MuscleGroup, type Equipment, type Difficulty } from "./exercise-catalog";

export type Goal = "strength" | "hypertrophy" | "endurance";
export type EquipmentMode = "gym" | "home";
export type Experience = "beginner" | "intermediate" | "advanced";

export const GOALS: Goal[] = ["strength", "hypertrophy", "endurance"];
export const EQUIPMENT_MODES: EquipmentMode[] = ["gym", "home"];
export const EXPERIENCE_LEVELS: Experience[] = ["beginner", "intermediate", "advanced"];
export const DAYS_PER_WEEK_RANGE = { min: 2, max: 6 } as const;

export type GenerateWorkoutParams = {
  goal: Goal;
  daysPerWeek: number;
  equipment: EquipmentMode;
  experience: Experience;
};

export type PrescribedExercise = {
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  difficulty: Difficulty;
  isCompound: boolean;
  sets: number;
  reps: number;
  restSeconds: number;
};

export type WorkoutDay = {
  dayNumber: number;
  focus: MuscleGroup[];
  exercises: PrescribedExercise[];
};

export type WorkoutPlan = {
  goal: Goal;
  daysPerWeek: number;
  experience: Experience;
  equipment: EquipmentMode;
  volumeFactor: number;
  days: WorkoutDay[];
};

const HOME_EQUIPMENT: Equipment[] = ["dumbbell", "bodyweight", "band", "kettlebell"];

const DIFFICULTY_RANK: Record<Difficulty, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

const MAX_EXERCISES_PER_GROUP_PER_DAY = 2;

const TARGET_EXERCISES_PER_DAY: Record<Goal, number> = {
  strength: 5,
  hypertrophy: 6,
  endurance: 5,
};

const SPLITS: Record<number, MuscleGroup[][]> = {
  2: [
    ["full_body", "core"],
    ["full_body", "core"],
  ],
  3: [
    ["chest", "shoulders", "arms"],
    ["back", "arms"],
    ["legs", "core"],
  ],
  4: [
    ["chest", "shoulders", "arms"],
    ["back", "arms"],
    ["legs", "core"],
    ["full_body", "core"],
  ],
  5: [
    ["chest", "shoulders"],
    ["back"],
    ["legs"],
    ["arms", "core"],
    ["full_body", "core"],
  ],
  6: [
    ["chest", "shoulders"],
    ["back"],
    ["legs"],
    ["chest", "arms"],
    ["back", "shoulders"],
    ["legs", "core"],
  ],
};

type RepScheme = {
  compoundSets: number;
  compoundReps: number;
  isolationSets: number;
  isolationReps: number;
  restSeconds: number;
};

const REP_SCHEMES: Record<Goal, RepScheme> = {
  strength: { compoundSets: 5, compoundReps: 5, isolationSets: 3, isolationReps: 8, restSeconds: 180 },
  hypertrophy: { compoundSets: 4, compoundReps: 8, isolationSets: 3, isolationReps: 12, restSeconds: 105 },
  endurance: { compoundSets: 3, compoundReps: 12, isolationSets: 2, isolationReps: 15, restSeconds: 60 },
};

const VOLUME_FACTORS: Record<Experience, number> = {
  beginner: 0.8,
  intermediate: 1,
  advanced: 1.2,
};

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createRandom(seed: number) {
  let state = seed;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function buildPool(equipment: EquipmentMode, experience: Experience) {
  const allowedEquipment = equipment === "home" ? HOME_EQUIPMENT : null;
  const maxDifficulty = DIFFICULTY_RANK[experience];

  return EXERCISES.filter(
    (exercise) =>
      (allowedEquipment === null || allowedEquipment.includes(exercise.equipment)) &&
      DIFFICULTY_RANK[exercise.difficulty] <= maxDifficulty,
  );
}

function pickForDay(
  focus: MuscleGroup[],
  pool: Exercise[],
  random: () => number,
  target: number,
) {
  const taken = new Set<string>();
  const perGroupCount = new Map<MuscleGroup, number>();
  const selected: Exercise[] = [];

  const compoundsByGroup = new Map<MuscleGroup, Exercise[]>();
  const isolationsByGroup = new Map<MuscleGroup, Exercise[]>();

  for (const group of focus) {
    const groupPool = pool.filter((exercise) => exercise.muscleGroup === group);

    compoundsByGroup.set(
      group,
      shuffle(
        groupPool.filter((exercise) => exercise.isCompound),
        random,
      ),
    );
    isolationsByGroup.set(
      group,
      shuffle(
        groupPool.filter((exercise) => !exercise.isCompound),
        random,
      ),
    );
  }

  const takeFrom = (group: MuscleGroup, poolForGroup: Exercise[]) => {
    const next = poolForGroup.find((exercise) => !taken.has(exercise.name));

    if (!next) {
      return false;
    }

    taken.add(next.name);
    perGroupCount.set(group, (perGroupCount.get(group) ?? 0) + 1);
    selected.push(next);

    return true;
  };

  for (let round = 0; round < 2 && selected.length < target; round += 1) {
    for (const group of focus) {
      if (selected.length >= target) {
        break;
      }

      if ((perGroupCount.get(group) ?? 0) >= MAX_EXERCISES_PER_GROUP_PER_DAY) {
        continue;
      }

      const order =
        round === 0
          ? [compoundsByGroup, isolationsByGroup]
          : [isolationsByGroup, compoundsByGroup];

      for (const pools of order) {
        if (takeFrom(group, pools.get(group) ?? [])) {
          break;
        }
      }
    }
  }

  const leftovers = shuffle(
    pool.filter((exercise) => !taken.has(exercise.name)),
    random,
  );

  for (const exercise of leftovers) {
    if (selected.length >= target) {
      break;
    }

    if ((perGroupCount.get(exercise.muscleGroup) ?? 0) >= MAX_EXERCISES_PER_GROUP_PER_DAY) {
      continue;
    }

    taken.add(exercise.name);
    perGroupCount.set(exercise.muscleGroup, (perGroupCount.get(exercise.muscleGroup) ?? 0) + 1);
    selected.push(exercise);
  }

  return selected;
}

function scaleSets(baseSets: number, volumeFactor: number) {
  return Math.max(1, Math.round(baseSets * volumeFactor));
}

export function isWorkoutPlan(value: unknown): value is WorkoutPlan {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const plan = value as Partial<WorkoutPlan>;

  return (
    GOALS.includes(plan.goal as Goal) &&
    EQUIPMENT_MODES.includes(plan.equipment as EquipmentMode) &&
    EXPERIENCE_LEVELS.includes(plan.experience as Experience) &&
    Number.isInteger(plan.daysPerWeek) &&
    Array.isArray(plan.days)
  );
}

export function generateWorkout(params: GenerateWorkoutParams): WorkoutPlan {
  const { goal, daysPerWeek, equipment, experience } = params;

  if (!Number.isInteger(daysPerWeek) || daysPerWeek < DAYS_PER_WEEK_RANGE.min || daysPerWeek > DAYS_PER_WEEK_RANGE.max) {
    throw new RangeError(
      `daysPerWeek должен быть целым числом от ${DAYS_PER_WEEK_RANGE.min} до ${DAYS_PER_WEEK_RANGE.max}, получено: ${daysPerWeek}`,
    );
  }

  const split = SPLITS[daysPerWeek];
  const scheme = REP_SCHEMES[goal];
  const volumeFactor = VOLUME_FACTORS[experience];
  const pool = buildPool(equipment, experience);
  const random = createRandom(hashString(`${goal}|${daysPerWeek}|${equipment}|${experience}`));

  const days: WorkoutDay[] = split.map((focus, dayIndex) => {
    const selected = pickForDay(focus, pool, random, TARGET_EXERCISES_PER_DAY[goal]);

    const exercises: PrescribedExercise[] = selected.map((exercise) => ({
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
      difficulty: exercise.difficulty,
      isCompound: exercise.isCompound,
      sets: scaleSets(exercise.isCompound ? scheme.compoundSets : scheme.isolationSets, volumeFactor),
      reps: exercise.isCompound ? scheme.compoundReps : scheme.isolationReps,
      restSeconds: scheme.restSeconds,
    }));

    return {
      dayNumber: dayIndex + 1,
      focus,
      exercises,
    };
  });

  return { goal, daysPerWeek, experience, equipment, volumeFactor, days };
}
