import { describe, expect, it } from "vitest";
import { EXERCISES } from "@/lib/exercise-catalog";
import {
  analyzeReadiness,
  applyReadiness,
  getSoreGroups,
  isEmptyCheckin,
  type CheckinSnapshot,
} from "@/lib/readiness";
import { generateWorkout } from "@/lib/workout-generator";

const baseCheckin: CheckinSnapshot = {
  date: "2026-03-15",
  sleep_hours: 8,
  energy: 4,
  soreness: {},
};

const basePlan = generateWorkout({
  goal: "hypertrophy",
  daysPerWeek: 4,
  equipment: "gym",
  experience: "beginner",
});

function totalSets(plan: typeof basePlan) {
  return plan.days.reduce(
    (sum, day) => sum + day.exercises.reduce((daySum, exercise) => daySum + exercise.sets, 0),
    0,
  );
}

describe("getSoreGroups", () => {
  it("возвращает группы с крепатурой от 3", () => {
    expect(getSoreGroups({ chest: 3, back: 2, legs: 5 })).toEqual(["chest", "legs"]);
  });

  it("пусто при отсутствии болей", () => {
    expect(getSoreGroups(null)).toEqual([]);
    expect(getSoreGroups({})).toEqual([]);
    expect(getSoreGroups({ chest: 0 })).toEqual([]);
  });
});

describe("analyzeReadiness", () => {
  it("без чек-ина даёт базовую нагрузку", () => {
    const readiness = analyzeReadiness(null);

    expect(readiness.level).toBe("high");
    expect(readiness.volumeFactor).toBe(1);
  });

  it("хороший сон и энергия повышают объём", () => {
    const readiness = analyzeReadiness(baseCheckin);

    expect(readiness.volumeFactor).toBeGreaterThan(1);
    expect(readiness.level).toBe("high");
  });

  it("мало сна снижает объём", () => {
    const readiness = analyzeReadiness({ ...baseCheckin, sleep_hours: 4 });

    expect(readiness.volumeFactor).toBeLessThan(1);
    expect(readiness.reasons.join(" ")).toContain("Сон");
  });

  it("низкая энергия снижает объём сильнее всего", () => {
    const readiness = analyzeReadiness({ ...baseCheckin, energy: 1 });

    expect(readiness.level).toBe("low");
    expect(readiness.reasons.join(" ")).toContain("Энергия");
  });

  it("крепатура попадает в soreGroups", () => {
    const readiness = analyzeReadiness({ ...baseCheckin, soreness: { legs: 5 } });

    expect(readiness.soreGroups).toEqual(["legs"]);
    expect(readiness.reasons.join(" ")).toContain("крепатура");
  });

  it("не опускает объём ниже 0.6 и не поднимает выше 1.15", () => {
    const worst = analyzeReadiness({
      date: "2026-03-15",
      sleep_hours: 0,
      energy: 1,
      soreness: { chest: 5, back: 5, legs: 5, shoulders: 5, arms: 5, core: 5, full_body: 5 },
    });
    const best = analyzeReadiness({ ...baseCheckin, sleep_hours: 12, energy: 5 });

    expect(worst.volumeFactor).toBeGreaterThanOrEqual(0.6);
    expect(best.volumeFactor).toBeLessThanOrEqual(1.15);
  });

  it("всегда объясняет решение", () => {
    expect(analyzeReadiness(baseCheckin).reasons.length).toBeGreaterThan(0);
  });
});

describe("applyReadiness", () => {
  it("не увеличивает объём выше исходного при плохом чек-ине", () => {
    const readiness = analyzeReadiness({ ...baseCheckin, sleep_hours: 4, energy: 2 });
    const adapted = applyReadiness(basePlan, readiness);

    expect(totalSets(adapted)).toBeLessThan(totalSets(basePlan));
  });

  it("сохраняет хотя бы один подход у каждого упражнения", () => {
    const readiness = analyzeReadiness({
      date: "2026-03-15",
      sleep_hours: 1,
      energy: 1,
      soreness: { chest: 5, back: 5, legs: 5, shoulders: 5, arms: 5, core: 5, full_body: 5 },
    });
    const adapted = applyReadiness(basePlan, readiness);

    for (const day of adapted.days) {
      for (const exercise of day.exercises) {
        expect(exercise.sets).toBeGreaterThanOrEqual(1);
        expect(exercise.reps).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("не превышает 30 подходов в день", () => {
    const readiness = analyzeReadiness({ ...baseCheckin, sleep_hours: 12, energy: 5 });

    for (const day of applyReadiness(basePlan, readiness).days) {
      const sets = day.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);

      expect(sets).toBeLessThanOrEqual(30);
    }
  });

  it("не выбрасывает упражнения при умеренной готовности", () => {
    const adapted = applyReadiness(basePlan, analyzeReadiness(baseCheckin));

    expect(adapted.days.map((day) => day.exercises.length)).toEqual(
      basePlan.days.map((day) => day.exercises.length),
    );
  });

  it("режет болезненную группу относительно базового плана", () => {
    // Энергия и сон на максимуме, поэтому общего снижения нет: любое
    // уменьшение в болезненной группе вызвано именно крепатурой.
    const readiness = analyzeReadiness({
      ...baseCheckin,
      sleep_hours: 8,
      energy: 5,
      soreness: { legs: 5 },
    });
    const adapted = applyReadiness(basePlan, readiness);

    const groupSets = (plan: typeof basePlan, group: string) =>
      plan.days.reduce(
        (sum, day) =>
          sum +
          day.exercises
            .filter((exercise) => exercise.muscleGroup === group)
            .reduce((inner, exercise) => inner + exercise.sets, 0),
        0,
      );

    expect(groupSets(adapted, "legs")).toBeLessThan(groupSets(basePlan, "legs"));
  });

  it("не меняет названия упражнений", () => {
    const adapted = applyReadiness(basePlan, analyzeReadiness(baseCheckin));
    const original = basePlan.days.flatMap((day) => day.exercises.map((exercise) => exercise.name));
    const result = adapted.days.flatMap((day) => day.exercises.map((exercise) => exercise.name));

    for (const name of original) {
      expect(EXERCISES.some((exercise) => exercise.name === name)).toBe(true);
    }

    expect(result).toEqual(expect.arrayContaining(original));
  });

  it("не мутирует исходный план", () => {
    const before = JSON.stringify(basePlan);

    applyReadiness(basePlan, analyzeReadiness({ ...baseCheckin, energy: 1 }));

    expect(JSON.stringify(basePlan)).toBe(before);
  });
});

describe("isEmptyCheckin", () => {
  it("пустой чек-ин без заполненных полей", () => {
    expect(isEmptyCheckin(null)).toBe(true);
    expect(
      isEmptyCheckin({ date: "2026-03-15", sleep_hours: null, energy: null, soreness: {} }),
    ).toBe(true);
  });

  it("непустой, если есть хоть одно значение", () => {
    expect(
      isEmptyCheckin({ date: "2026-03-15", sleep_hours: 8, energy: null, soreness: {} }),
    ).toBe(false);
  });
});
