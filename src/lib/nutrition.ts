export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type NutritionGoal = "cut" | "maintain" | "bulk";

export const SEXES: Sex[] = ["male", "female"];
export const ACTIVITY_LEVELS: ActivityLevel[] = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
];
export const NUTRITION_GOALS: NutritionGoal[] = ["cut", "maintain", "bulk"];

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Минимальная — сидячая работа, нет тренировок",
  light: "Низкая — 1–3 тренировки в неделю",
  moderate: "Средняя — 3–5 тренировок в неделю",
  active: "Высокая — 6–7 тренировок в неделю",
  very_active: "Очень высокая — 2 тренировки в день или физическая работа",
};

export const GOAL_LABELS: Record<NutritionGoal, string> = {
  cut: "Снижение жира",
  maintain: "Поддержание формы",
  bulk: "Набор массы",
};

export const INPUT_LIMITS = {
  weightKg: { min: 30, max: 300 },
  heightCm: { min: 120, max: 230 },
  age: { min: 14, max: 100 },
} as const;

export type MacroInput = {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
  activityLevel: ActivityLevel;
  goal: NutritionGoal;
};

export type MacroResult = {
  bmr: number;
  tdee: number;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  proteinPerKg: number;
  fatShareOfCalories: number;
};

const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const;

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const CALORIE_ADJUSTMENT: Record<NutritionGoal, number> = {
  cut: -0.2,
  maintain: 0,
  bulk: 0.15,
};

const PROTEIN_PER_KG: Record<NutritionGoal, number> = {
  cut: 2.2,
  maintain: 1.8,
  bulk: 2.0,
};

const FAT_SHARE = 0.25;

function assertInRange(label: string, value: number, range: { min: number; max: number }) {
  if (!Number.isFinite(value) || value < range.min || value > range.max) {
    throw new RangeError(
      `${label}: ожидалось число от ${range.min} до ${range.max}, получено ${value}`,
    );
  }
}

export function calculateBmr(weightKg: number, heightCm: number, age: number, sex: Sex) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;

  return sex === "male" ? base + 5 : base - 161;
}

export function calculateMacros(input: MacroInput): MacroResult {
  assertInRange("weightKg", input.weightKg, INPUT_LIMITS.weightKg);
  assertInRange("heightCm", input.heightCm, INPUT_LIMITS.heightCm);
  assertInRange("age", input.age, INPUT_LIMITS.age);

  const bmr = calculateBmr(input.weightKg, input.heightCm, input.age, input.sex);
  const tdee = bmr * ACTIVITY_FACTORS[input.activityLevel];
  const calories = Math.round(tdee * (1 + CALORIE_ADJUSTMENT[input.goal]));

  const proteinG = Math.min(
    Math.round(input.weightKg * PROTEIN_PER_KG[input.goal]),
    Math.floor(calories / KCAL_PER_GRAM.protein),
  );
  const afterProtein = calories - proteinG * KCAL_PER_GRAM.protein;

  const desiredFatG = Math.round((calories * FAT_SHARE) / KCAL_PER_GRAM.fat);
  const maxFatG = Math.max(0, Math.floor(afterProtein / KCAL_PER_GRAM.fat));
  const fatG = Math.max(0, Math.min(desiredFatG, maxFatG));

  const carbsG = Math.max(
    0,
    Math.round((afterProtein - fatG * KCAL_PER_GRAM.fat) / KCAL_PER_GRAM.carbs),
  );

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories,
    proteinG,
    fatG,
    carbsG,
    proteinPerKg: PROTEIN_PER_KG[input.goal],
    fatShareOfCalories: FAT_SHARE,
  };
}
