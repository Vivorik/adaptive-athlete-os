import { describe, expect, it } from "vitest";
import {
  ACTIVITY_LEVELS,
  INPUT_LIMITS,
  NUTRITION_GOALS,
  SEXES,
  calculateBmr,
  calculateMacros,
  type ActivityLevel,
  type MacroInput,
  type NutritionGoal,
  type Sex,
} from "@/lib/nutrition";

const BASE: MacroInput = {
  weightKg: 80,
  heightCm: 180,
  age: 30,
  sex: "male",
  activityLevel: "moderate",
  goal: "maintain",
};

const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const;

describe("calculateBmr: формула Миффлина-Сан Жеора", () => {
  it("для мужчины: 10×вес + 6.25×рост − 5×возраст + 5", () => {
    expect(calculateBmr(80, 180, 30, "male")).toBeCloseTo(10 * 80 + 6.25 * 180 - 5 * 30 + 5, 5);
  });

  it("для женщины: 10×вес + 6.25×рост − 5×возраст − 161", () => {
    expect(calculateBmr(60, 165, 28, "female")).toBeCloseTo(
      10 * 60 + 6.25 * 165 - 5 * 28 - 161,
      5,
    );
  });

  it("женщине даёт на 166 ккал меньше мужчины при тех же данных", () => {
    const male = calculateBmr(70, 175, 30, "male");
    const female = calculateBmr(70, 175, 30, "female");

    expect(male - female).toBeCloseTo(166, 5);
  });

  it("растёт с массой тела и падает с возрастом", () => {
    expect(calculateBmr(90, 180, 30, "male")).toBeGreaterThan(calculateBmr(70, 180, 30, "male"));
    expect(calculateBmr(80, 180, 50, "male")).toBeLessThan(calculateBmr(80, 180, 25, "male"));
  });
});

describe("calculateMacros: калории", () => {
  it("поддержание равно TDEE", () => {
    const result = calculateMacros(BASE);

    expect(result.calories).toBe(result.tdee);
  });

  it("дефицит срезает 20% от TDEE", () => {
    const maintain = calculateMacros({ ...BASE, goal: "maintain" });
    const cut = calculateMacros({ ...BASE, goal: "cut" });

    expect(cut.calories).toBe(Math.round(maintain.tdee * 0.8));
  });

  it("профицит добавляет 15% к TDEE", () => {
    const maintain = calculateMacros({ ...BASE, goal: "maintain" });
    const bulk = calculateMacros({ ...BASE, goal: "bulk" });

    expect(bulk.calories).toBe(Math.round(maintain.tdee * 1.15));
  });

  it("идёт в порядке дефицит < поддержание < профицит", () => {
    const calories = NUTRITION_GOALS.map((goal) => calculateMacros({ ...BASE, goal }).calories);

    expect(calories[0]).toBeLessThan(calories[1]);
    expect(calories[1]).toBeLessThan(calories[2]);
  });

  it("больше активности — больше калорий", () => {
    const calories = ACTIVITY_LEVELS.map(
      (activityLevel) => calculateMacros({ ...BASE, activityLevel }).calories,
    );

    for (let index = 1; index < calories.length; index += 1) {
      expect(calories[index]).toBeGreaterThan(calories[index - 1]);
    }
  });
});

describe("calculateMacros: белок, жиры, углеводы", () => {
  it("белок считается по граммам на кг в зависимости от цели", () => {
    const cut = calculateMacros({ ...BASE, goal: "cut" });
    const maintain = calculateMacros({ ...BASE, goal: "maintain" });
    const bulk = calculateMacros({ ...BASE, goal: "bulk" });

    expect(cut.proteinPerKg).toBeGreaterThan(maintain.proteinPerKg);
    expect(bulk.proteinPerKg).toBeGreaterThan(maintain.proteinPerKg);
    expect(bulk.proteinPerKg).toBeLessThan(cut.proteinPerKg);
    expect(cut.proteinG).toBe(Math.round(BASE.weightKg * cut.proteinPerKg));
    expect(maintain.proteinG).toBe(Math.round(BASE.weightKg * maintain.proteinPerKg));
  });

  it("жиры занимают примерно четверть калорий", () => {
    const result = calculateMacros(BASE);
    const fatCalories = result.fatG * KCAL_PER_GRAM.fat;

    expect(fatCalories / result.calories).toBeCloseTo(0.25, 1);
  });

  it("углеводы получают остаток калорий", () => {
    const result = calculateMacros(BASE);
    const leftover = result.calories - result.proteinG * 4 - result.fatG * 9;

    expect(result.carbsG).toBe(Math.round(leftover / 4));
  });

  it("все макросы положительные и целые", () => {
    for (const sex of SEXES) {
      for (const activityLevel of ACTIVITY_LEVELS) {
        for (const goal of NUTRITION_GOALS) {
          const result = calculateMacros({ ...BASE, sex, activityLevel, goal });

          expect(result.proteinG).toBeGreaterThan(0);
          expect(Number.isInteger(result.proteinG)).toBe(true);
          expect(result.fatG).toBeGreaterThan(0);
          expect(Number.isInteger(result.fatG)).toBe(true);
          expect(result.carbsG).toBeGreaterThan(0);
          expect(Number.isInteger(result.carbsG)).toBe(true);
        }
      }
    }
  });

  it("сумма макросов сходится с калориями по всей сетке входов", () => {
    const weights = [30, 45, 60, 80, 100, 130, 300];
    const heights = [120, 150, 180, 230];
    const ages = [14, 25, 45, 100];
    const sexes: Sex[] = ["male", "female"];
    const activityLevels: ActivityLevel[] = ACTIVITY_LEVELS;
    const goals: NutritionGoal[] = NUTRITION_GOALS;

    for (const weightKg of weights) {
      for (const heightCm of heights) {
        for (const age of ages) {
          for (const sex of sexes) {
            for (const activityLevel of activityLevels) {
              for (const goal of goals) {
                const result = calculateMacros({ weightKg, heightCm, age, sex, activityLevel, goal });
                const total =
                  result.proteinG * KCAL_PER_GRAM.protein +
                  result.carbsG * KCAL_PER_GRAM.carbs +
                  result.fatG * KCAL_PER_GRAM.fat;

                expect(Math.abs(total - result.calories)).toBeLessThanOrEqual(2);
                expect(result.carbsG).toBeGreaterThanOrEqual(0);
              }
            }
          }
        }
      }
    }
  });

  it("не даёт отрицательных углеводов на пограничных входах", () => {
    const degenerate: MacroInput = {
      weightKg: 130,
      heightCm: 120,
      age: 100,
      sex: "female",
      activityLevel: "sedentary",
      goal: "cut",
    };

    const result = calculateMacros(degenerate);
    const total = result.proteinG * 4 + result.carbsG * 4 + result.fatG * 9;

    expect(result.carbsG).toBeGreaterThanOrEqual(0);
    expect(result.fatG).toBeGreaterThanOrEqual(0);
    expect(result.proteinG).toBeGreaterThanOrEqual(0);
    expect(Math.abs(total - result.calories)).toBeLessThanOrEqual(2);
  });
});

describe("calculateMacros: детерминированность", () => {
  it("одинаковый вход даёт одинаковый результат", () => {
    expect(calculateMacros(BASE)).toEqual(calculateMacros(BASE));
  });

  it("не мутирует входной объект", () => {
    const input = { ...BASE };
    calculateMacros(input);

    expect(input).toEqual(BASE);
  });
});

describe("calculateMacros: валидация", () => {
  it.each([
    ["weightKg", 0],
    ["weightKg", 29],
    ["weightKg", 301],
    ["weightKg", Number.NaN],
  ] as const)("отклоняет %s = %s", (field, value) => {
    expect(() => calculateMacros({ ...BASE, [field]: value })).toThrow(RangeError);
  });

  it.each([
    ["heightCm", 119],
    ["heightCm", 231],
  ] as const)("отклоняет %s = %s", (field, value) => {
    expect(() => calculateMacros({ ...BASE, [field]: value })).toThrow(RangeError);
  });

  it.each([
    ["age", 13],
    ["age", 101],
  ] as const)("отклоняет %s = %s", (field, value) => {
    expect(() => calculateMacros({ ...BASE, [field]: value })).toThrow(RangeError);
  });

  it("принимает границы диапазонов", () => {
    const min = calculateMacros({
      ...BASE,
      weightKg: INPUT_LIMITS.weightKg.min,
      heightCm: INPUT_LIMITS.heightCm.min,
      age: INPUT_LIMITS.age.min,
    });
    const max = calculateMacros({
      ...BASE,
      weightKg: INPUT_LIMITS.weightKg.max,
      heightCm: INPUT_LIMITS.heightCm.max,
      age: INPUT_LIMITS.age.max,
    });

    expect(min.calories).toBeGreaterThan(0);
    expect(max.calories).toBeGreaterThan(min.calories);
  });
});
