import { describe, expect, it } from "vitest";
import { buildPeople, pluralExercises } from "./people";

function progressRow(userId: string, exerciseName: string) {
  return { user_id: userId, exercise_name: exerciseName };
}

function profile(id: string, username: string, displayName: string | null = null) {
  return { id, username, display_name: displayName };
}

describe("buildPeople", () => {
  it("возвращает пустой список без входных данных", () => {
    expect(buildPeople([], [])).toEqual([]);
  });

  it("считает количество упражнений у каждого", () => {
    const people = buildPeople(
      [
        progressRow("u1", "Жим штанги лёжа"),
        progressRow("u1", "Присед с гантели на одной ноге"),
        progressRow("u2", "Жим штанги лёжа"),
      ],
      [profile("u1", "viktor", "Виктор"), profile("u2", "anna", "Анна")],
    );

    expect(people).toEqual([
      { userId: "u1", username: "viktor", displayName: "Виктор", exerciseCount: 2 },
      { userId: "u2", username: "anna", displayName: "Анна", exerciseCount: 1 },
    ]);
  });

  it("не считает одно упражнение дважды", () => {
    const people = buildPeople(
      [progressRow("u1", "Жим штанги лёжа"), progressRow("u1", "Жим штанги лёжа")],
      [profile("u1", "viktor", "Виктор")],
    );

    expect(people).toHaveLength(1);
    expect(people[0].exerciseCount).toBe(1);
  });

  it("выкидывает профили без открытого прогресса", () => {
    const people = buildPeople(
      [progressRow("u1", "Жим штанги лёжа")],
      [profile("u1", "viktor", "Виктор"), profile("u2", "maria", "Мария")],
    );

    expect(people.map((person) => person.userId)).toEqual(["u1"]);
  });

  it("откатывается на username, если имени нет", () => {
    const people = buildPeople(
      [progressRow("u1", "Жим штанги лёжа")],
      [profile("u1", "viktor", null), profile("u2", "anna", "   ")],
    );

    expect(people.map((person) => person.displayName)).toEqual(["viktor"]);
  });

  it("сортирует по количеству упражнений, затем по имени", () => {
    const people = buildPeople(
      [
        progressRow("u1", "Жим штанги лёжа"),
        progressRow("u2", "Жим штанги лёжа"),
        progressRow("u3", "Жим штанги лёжа"),
      ],
      [
        profile("u1", "viktor", "Ярослав"),
        profile("u2", "anna", "Анна"),
        profile("u3", "ivan", "Пётр"),
      ],
    );

    expect(people.map((person) => person.displayName)).toEqual(["Анна", "Пётр", "Ярослав"]);
  });

  it("переживает прогресс без профиля", () => {
    const people = buildPeople([progressRow("u1", "Жим штанги лёжа")], []);

    expect(people).toEqual([]);
  });
});

describe("pluralExercises", () => {
  it("склоняет по последней цифре", () => {
    expect(pluralExercises(1)).toBe("упражнение");
    expect(pluralExercises(2)).toBe("упражнения");
    expect(pluralExercises(5)).toBe("упражнений");
  });

  it("учитывает исключения для 11–14", () => {
    expect(pluralExercises(11)).toBe("упражнений");
    expect(pluralExercises(12)).toBe("упражнений");
    expect(pluralExercises(14)).toBe("упражнений");
  });

  it("учитывает хвост из двух цифр", () => {
    expect(pluralExercises(21)).toBe("упражнение");
    expect(pluralExercises(101)).toBe("упражнение");
    expect(pluralExercises(111)).toBe("упражнений");
    expect(pluralExercises(112)).toBe("упражнений");
  });
});
