import { describe, expect, it } from "vitest";
import { EXERCISES, MUSCLE_GROUPS } from "./exercise-catalog";
import { groupExercisesByMuscle } from "./labels";
import { formatWeight, getExerciseName, isWorkoutWeight, parseProgressForm } from "./progress";

const EXERCISE = EXERCISES[0].name;

function form(values: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.append(key, value);
  }

  return formData;
}

const VALID = {
  exerciseName: EXERCISE,
  weightKind: "external",
  maxReps: "10",
  maxWeight: "80",
  workReps: "8",
  workWeight: "70",
};

describe("parseProgressForm", () => {
  it("разбирает корректную форму", () => {
    expect(parseProgressForm(form(VALID))).toEqual({
      exerciseName: EXERCISE,
      maxReps: 10,
      maxWeightKg: 80,
      workReps: 8,
      workWeightKg: 70,
    });
  });

  it("округляет вес до двух знаков", () => {
    const parsed = parseProgressForm(form({ ...VALID, maxWeight: "62.555", workWeight: "60" }));
    expect(parsed.maxWeightKg).toBe(62.56);
  });

  it("отвергает упражнение не из каталога", () => {
    expect(() => parseProgressForm(form({ ...VALID, exerciseName: "Подъём на носки вверх ногами" }))).toThrow(
      /Выбери упражнение/,
    );
  });

  it("требует упражнение", () => {
    expect(() => parseProgressForm(form({ ...VALID, exerciseName: "" }))).toThrow(/Выбери упражнение/);
  });

  it("запрещает рабочие повторы выше рекорда", () => {
    expect(() => parseProgressForm(form({ ...VALID, workReps: "12" }))).toThrow(
      /не могут быть больше личного рекорда/,
    );
  });

  it("запрещает рабочий вес выше рекорда", () => {
    expect(() => parseProgressForm(form({ ...VALID, workWeight: "90" }))).toThrow(
      /Рабочий вес не может быть больше/,
    );
  });

  it("разрешает рабочие веса, равные рекорду", () => {
    const parsed = parseProgressForm(form({ ...VALID, workWeight: "80" }));
    expect(parsed.workWeightKg).toBe(80);
  });

  it("обнуляет вес для bodyweight и band", () => {
    for (const weightKind of ["bodyweight", "band"]) {
      const parsed = parseProgressForm(
        form({ ...VALID, weightKind, maxWeight: "50", workWeight: "40" }),
      );
      expect(parsed.maxWeightKg).toBe(0);
      expect(parsed.workWeightKg).toBe(0);
    }
  });

  it("отвергает дробные повторы", () => {
    expect(() => parseProgressForm(form({ ...VALID, maxReps: "10.5" }))).toThrow(/целым числом/);
  });

  it("отвергает нулевые и отрицательные повторы", () => {
    expect(() => parseProgressForm(form({ ...VALID, maxReps: "0" }))).toThrow(/целым числом/);
    expect(() => parseProgressForm(form({ ...VALID, workReps: "-3" }))).toThrow(/целым числом/);
  });

  it("отвергает повторы выше лимита", () => {
    expect(() => parseProgressForm(form({ ...VALID, maxReps: "101" }))).toThrow(/целым числом/);
  });

  it("требует вес для внешнего отягощения", () => {
    expect(() => parseProgressForm(form({ ...VALID, maxWeight: "" }))).toThrow(/Заполни вес/);
  });

  it("отвергает вес выше лимита", () => {
    expect(() => parseProgressForm(form({ ...VALID, maxWeight: "1001" }))).toThrow(/Вес должен быть/);
  });
});

describe("isWorkoutWeight", () => {
  it("узнаёт только bodyweight и band", () => {
    expect(isWorkoutWeight("bodyweight")).toBe(true);
    expect(isWorkoutWeight("band")).toBe(true);
    expect(isWorkoutWeight("barbell")).toBe(false);
  });
});

describe("getExerciseName", () => {
  it("находит упражнение каталога", () => {
    expect(getExerciseName(EXERCISE)).toBe(EXERCISE);
  });

  it("возвращает null для неизвестного", () => {
    expect(getExerciseName("Нет такого")).toBeNull();
  });
});

describe("formatWeight", () => {
  it("склоняет десятичную запятую", () => {
    expect(formatWeight(62.5)).toBe("62,5 кг");
  });

  it("показывает прочерк для нуля", () => {
    expect(formatWeight(0)).toBe("—");
  });
});

describe("groupExercisesByMuscle", () => {
  const groups = groupExercisesByMuscle();

  it("не теряет ни одного упражнения каталога", () => {
    expect(groups.flatMap((group) => group.exercises)).toHaveLength(EXERCISES.length);
  });

  it("не оставляет пустых групп", () => {
    expect(groups.every((group) => group.exercises.length > 0)).toBe(true);
  });

  it("группирует только по мышце из MUSCLE_GROUPS", () => {
    for (const group of groups) {
      expect(MUSCLE_GROUPS).toContain(group.group);
      for (const exercise of group.exercises) {
        expect(exercise.muscleGroup).toBe(group.group);
      }
    }
  });
});
