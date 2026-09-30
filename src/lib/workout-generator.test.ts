import { describe, expect, it } from "vitest";
import { EXERCISES, type Equipment } from "@/lib/exercise-catalog";
import {
  DAYS_PER_WEEK_RANGE,
  EXPERIENCE_LEVELS,
  GOALS,
  generateWorkout,
  isWorkoutPlan,
  type GenerateWorkoutParams,
  type Goal,
} from "@/lib/workout-generator";

const BASE: GenerateWorkoutParams = {
  goal: "hypertrophy",
  daysPerWeek: 3,
  equipment: "gym",
  experience: "intermediate",
};

const HOME_ONLY_FORBIDDEN: Equipment[] = ["barbell", "machine", "cable"];

const EXPECTED_REPS: Record<Goal, { compound: number; isolation: number }> = {
  strength: { compound: 5, isolation: 8 },
  hypertrophy: { compound: 8, isolation: 12 },
  endurance: { compound: 12, isolation: 15 },
};

const EXPECTED_REST: Record<Goal, number> = {
  strength: 180,
  hypertrophy: 105,
  endurance: 60,
};

describe("generateWorkout: структура", () => {
  it("возвращает ровно daysPerWeek дней с нумерацией от 1", () => {
    const plan = generateWorkout(BASE);

    expect(plan.days).toHaveLength(BASE.daysPerWeek);
    expect(plan.days.map((day) => day.dayNumber)).toEqual([1, 2, 3]);
  });

  it("в каждом дне есть фокус и непустой список упражнений", () => {
    const plan = generateWorkout(BASE);

    for (const day of plan.days) {
      expect(day.focus.length).toBeGreaterThan(0);
      expect(day.exercises.length).toBeGreaterThan(0);
    }
  });

  it("поддерживает весь диапазон дней в неделю", () => {
    for (let days = DAYS_PER_WEEK_RANGE.min; days <= DAYS_PER_WEEK_RANGE.max; days += 1) {
      expect(generateWorkout({ ...BASE, daysPerWeek: days }).days).toHaveLength(days);
    }
  });

  it("в каждом дне нет повторяющихся упражнений", () => {
    for (let days = DAYS_PER_WEEK_RANGE.min; days <= DAYS_PER_WEEK_RANGE.max; days += 1) {
      const plan = generateWorkout({ ...BASE, daysPerWeek: days });

      for (const day of plan.days) {
        const names = day.exercises.map((exercise) => exercise.name);
        expect(new Set(names).size).toBe(names.length);
      }
    }
  });

  it("в день не больше 6 упражнений", () => {
    for (const goal of GOALS) {
      for (let days = DAYS_PER_WEEK_RANGE.min; days <= DAYS_PER_WEEK_RANGE.max; days += 1) {
        const plan = generateWorkout({ ...BASE, goal, daysPerWeek: days });

        for (const day of plan.days) {
          expect(day.exercises.length).toBeLessThanOrEqual(6);
        }
      }
    }
  });

  it("в день не больше 2 упражнений на одну мышечную группу", () => {
    for (const goal of GOALS) {
      const plan = generateWorkout({ ...BASE, goal, daysPerWeek: DAYS_PER_WEEK_RANGE.max });

      for (const day of plan.days) {
        const perGroup = new Map<string, number>();

        for (const exercise of day.exercises) {
          perGroup.set(exercise.muscleGroup, (perGroup.get(exercise.muscleGroup) ?? 0) + 1);
        }

        for (const count of perGroup.values()) {
          expect(count).toBeLessThanOrEqual(2);
        }
      }
    }
  });

  it("общий объём подходов за день остаётся разумным", () => {
    for (const goal of GOALS) {
      for (const experience of EXPERIENCE_LEVELS) {
        const plan = generateWorkout({ ...BASE, goal, experience, daysPerWeek: 4 });

        for (const day of plan.days) {
          const totalSets = day.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
          expect(totalSets).toBeLessThanOrEqual(30);
        }
      }
    }
  });

  it("все упражнения берутся из каталога", () => {
    const catalogNames = new Set(EXERCISES.map((exercise) => exercise.name));
    const plan = generateWorkout({ ...BASE, daysPerWeek: 6 });

    for (const day of plan.days) {
      for (const exercise of day.exercises) {
        expect(catalogNames.has(exercise.name)).toBe(true);
      }
    }
  });

  it("у всех упражнений адекватные подходы, повторы и отдых", () => {
    const plan = generateWorkout({ ...BASE, daysPerWeek: 6 });

    for (const day of plan.days) {
      for (const exercise of day.exercises) {
        expect(exercise.sets).toBeGreaterThanOrEqual(1);
        expect(exercise.reps).toBeGreaterThan(0);
        expect(exercise.restSeconds).toBeGreaterThan(0);
      }
    }
  });
});

describe("generateWorkout: детерминированность", () => {
  it("одинаковые параметры дают идентичный результат", () => {
    expect(generateWorkout(BASE)).toEqual(generateWorkout(BASE));
  });

  it("разные цели дают разные программы", () => {
    const results = GOALS.map((goal) => JSON.stringify(generateWorkout({ ...BASE, goal })));

    expect(new Set(results).size).toBe(GOALS.length);
  });

  it("разный опыт даёт разные программы", () => {
    const beginner = generateWorkout({ ...BASE, experience: "beginner" });
    const advanced = generateWorkout({ ...BASE, experience: "advanced" });

    expect(JSON.stringify(beginner.days)).not.toBe(JSON.stringify(advanced.days));
  });

  it("не мутирует каталог между вызовами", () => {
    const snapshot = JSON.stringify(EXERCISES);

    generateWorkout({ ...BASE, daysPerWeek: 6 });
    generateWorkout({ ...BASE, goal: "strength", daysPerWeek: 2 });

    expect(JSON.stringify(EXERCISES)).toBe(snapshot);
  });
});

describe("generateWorkout: правила цели", () => {
  for (const goal of GOALS) {
    it(`для цели "${goal}" соблюдает схему повторов и отдыха`, () => {
      const plan = generateWorkout({ ...BASE, goal });
      const scheme = EXPECTED_REPS[goal];

      for (const day of plan.days) {
        for (const exercise of day.exercises) {
          const expectedReps = exercise.isCompound ? scheme.compound : scheme.isolation;

          expect(exercise.reps).toBe(expectedReps);
          expect(exercise.restSeconds).toBe(EXPECTED_REST[goal]);
        }
      }
    });
  }

  it("для силы ставит 5 повторов на многосуставных", () => {
    const plan = generateWorkout({ ...BASE, goal: "strength" });
    const compounds = plan.days.flatMap((day) => day.exercises.filter((exercise) => exercise.isCompound));

    expect(compounds.length).toBeGreaterThan(0);

    for (const exercise of compounds) {
      expect(exercise.reps).toBe(5);
    }
  });

  it("для массы даёт изоляцию с большим числом повторов, чем база", () => {
    const plan = generateWorkout({ ...BASE, goal: "hypertrophy" });
    const compounds = plan.days.flatMap((day) => day.exercises.filter((exercise) => exercise.isCompound));
    const isolations = plan.days.flatMap((day) => day.exercises.filter((exercise) => !exercise.isCompound));

    expect(compounds.length).toBeGreaterThan(0);
    expect(isolations.length).toBeGreaterThan(0);

    for (const compound of compounds) {
      expect(compound.reps).toBeLessThan(isolations[0].reps);
    }
  });
});

describe("generateWorkout: инвентарь и опыт", () => {
  it("в режиме дома не предлагает спортзал", () => {
    for (let days = DAYS_PER_WEEK_RANGE.min; days <= DAYS_PER_WEEK_RANGE.max; days += 1) {
      const plan = generateWorkout({ ...BASE, equipment: "home", daysPerWeek: days });

      for (const day of plan.days) {
        for (const exercise of day.exercises) {
          expect(HOME_ONLY_FORBIDDEN).not.toContain(exercise.equipment);
        }
      }
    }
  });

  it("в режиме зала доступен весь инвентарь", () => {
    const plan = generateWorkout({ ...BASE, equipment: "gym", daysPerWeek: 6 });
    const used = new Set(plan.days.flatMap((day) => day.exercises.map((exercise) => exercise.equipment)));

    expect(used.size).toBeGreaterThan(1);
  });

  it("новичку не предлагает сложные упражнения", () => {
    const plan = generateWorkout({ ...BASE, experience: "beginner", daysPerWeek: 6 });

    for (const day of plan.days) {
      for (const exercise of day.exercises) {
        expect(exercise.difficulty).toBe("beginner");
      }
    }
  });

  it("объём растёт вместе с опытом", () => {
    const beginner = generateWorkout({ ...BASE, experience: "beginner" });
    const intermediate = generateWorkout({ ...BASE, experience: "intermediate" });
    const advanced = generateWorkout({ ...BASE, experience: "advanced" });

    const totalSets = (sets: number[]) => sets.reduce((sum, value) => sum + value, 0);
    const planSets = (plan: ReturnType<typeof generateWorkout>) =>
      totalSets(plan.days.flatMap((day) => day.exercises.map((exercise) => exercise.sets)));

    expect(planSets(beginner)).toBeLessThan(planSets(intermediate));
    expect(planSets(intermediate)).toBeLessThan(planSets(advanced));
  });

  it("экспонент влияет на объём и сохраняется в плане", () => {
    expect(generateWorkout({ ...BASE, experience: "beginner" }).volumeFactor).toBeLessThan(1);
    expect(generateWorkout({ ...BASE, experience: "intermediate" }).volumeFactor).toBe(1);
    expect(generateWorkout({ ...BASE, experience: "advanced" }).volumeFactor).toBeGreaterThan(1);
  });
});

describe("generateWorkout: сплиты по дням", () => {
  it("на 3 дня даёт грудь в первый день", () => {
    const plan = generateWorkout({ ...BASE, daysPerWeek: 3 });
    const groups = new Set(plan.days[0].exercises.map((exercise) => exercise.muscleGroup));

    expect(plan.days[0].focus).toEqual(["chest", "shoulders", "arms"]);
    expect(groups.has("chest")).toBe(true);
  });

  it("на 2 дня строит программу на всё тело", () => {
    const plan = generateWorkout({ ...BASE, daysPerWeek: 2 });

    for (const day of plan.days) {
      expect(day.focus).toEqual(["full_body", "core"]);
    }
  });

  it("включает в план ноги", () => {
    const plan = generateWorkout({ ...BASE, daysPerWeek: 6 });
    const groups = new Set(plan.days.flatMap((day) => day.exercises.map((exercise) => exercise.muscleGroup)));

    expect(groups.has("legs")).toBe(true);
  });
});

describe("generateWorkout: валидация", () => {
  it.each([1, 7, 0, -3, 2.5, Number.NaN])("отклоняет daysPerWeek = %s", (daysPerWeek) => {
    expect(() => generateWorkout({ ...BASE, daysPerWeek })).toThrow(RangeError);
  });
});

describe("isWorkoutPlan", () => {
  it("принимает результат generateWorkout", () => {
    expect(isWorkoutPlan(generateWorkout({ goal: "hypertrophy", daysPerWeek: 3, equipment: "gym", experience: "beginner" }))).toBe(true);
  });

  it("отклоняет пустой jsonb", () => {
    expect(isWorkoutPlan({})).toBe(false);
  });

  it("отклоняет null и не-объекты", () => {
    expect(isWorkoutPlan(null)).toBe(false);
    expect(isWorkoutPlan("plan")).toBe(false);
  });

  it("отклоняет неизвестные перечисления", () => {
    expect(isWorkoutPlan({ goal: "diabetes", equipment: "gym", experience: "beginner", daysPerWeek: 3, days: [] })).toBe(false);
  });
});
