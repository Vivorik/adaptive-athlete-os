import { describe, expect, it } from "vitest";
import { addDays, calculateStreak, isDateKey, toDateKey } from "@/lib/streak";

const TODAY = "2026-03-15";

describe("addDays", () => {
  it("прибавляет и отнимает дни", () => {
    expect(addDays("2026-03-15", 1)).toBe("2026-03-16");
    expect(addDays("2026-03-15", -1)).toBe("2026-03-14");
  });

  it("переходит через границу месяца", () => {
    expect(addDays("2026-03-31", 1)).toBe("2026-04-01");
  });

  it("переходит через границу года", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("учитывает високосный год", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
});

describe("toDateKey", () => {
  it("возвращает дату в формате ГГГГ-ММ-ДД", () => {
    expect(toDateKey(new Date(2026, 2, 15))).toBe("2026-03-15");
  });

  it("использует локальное время, а не UTC", () => {
    // Полночь по местному времени: toISOString() отдала бы уже следующий день.
    expect(toDateKey(new Date(2026, 2, 15, 0, 0, 0))).toBe("2026-03-15");
    expect(toDateKey(new Date(2026, 2, 15, 23, 59, 59))).toBe("2026-03-15");
  });

  it("дополняет месяц и день нулями", () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("isDateKey", () => {
  it("принимает корректные даты", () => {
    expect(isDateKey("2026-03-15")).toBe(true);
    expect(isDateKey("2028-02-29")).toBe(true);
  });

  it("отклоняет несуществующие даты", () => {
    expect(isDateKey("2026-02-30")).toBe(false);
    expect(isDateKey("2027-02-29")).toBe(false);
  });

  it("отклоняет мусор и не-строки", () => {
    expect(isDateKey("")).toBe(false);
    expect(isDateKey("15.03.2026")).toBe(false);
    expect(isDateKey("2026-3-5")).toBe(false);
    expect(isDateKey(null)).toBe(false);
    expect(isDateKey(20260315)).toBe(false);
  });
});

describe("calculateStreak", () => {
  it("считает серию, заканчивающуюся сегодня", () => {
    expect(calculateStreak(["2026-03-15", "2026-03-14", "2026-03-13"], TODAY)).toBe(3);
  });

  it("не обнуляет серию, если сегодняшнего чекина ещё нет", () => {
    expect(calculateStreak(["2026-03-14", "2026-03-13"], TODAY)).toBe(2);
  });

  it("обнуляется, если пропущено больше одного дня", () => {
    expect(calculateStreak(["2026-03-13", "2026-03-12"], TODAY)).toBe(0);
  });

  it("возвращает 0 без чек-инов", () => {
    expect(calculateStreak([], TODAY)).toBe(0);
  });

  it("останавливается на первом пропуске", () => {
    expect(calculateStreak(["2026-03-15", "2026-03-14", "2026-03-12", "2026-03-11"], TODAY)).toBe(2);
  });

  it("не считает два раза один и тот же день", () => {
    expect(calculateStreak(["2026-03-15", "2026-03-15", "2026-03-14"], TODAY)).toBe(2);
  });

  it("не зависит от порядка и лишних будущих дат", () => {
    expect(calculateStreak(["2026-03-13", "2026-03-15", "2026-03-14", "2026-04-01"], TODAY)).toBe(3);
  });

  it("игнорирует некорректные значения", () => {
    expect(calculateStreak(["2026-03-15", "мусор", "2026-02-30", null as never, "2026-03-14"], TODAY)).toBe(2);
  });

  it("считает серию через границу месяца", () => {
    expect(calculateStreak(["2026-03-01", "2026-02-28"], "2026-03-01")).toBe(2);
  });
});
