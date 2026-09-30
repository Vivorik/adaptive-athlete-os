const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_KEY_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Ключ даты по локальному времени браузера пользователя, а не по UTC.
 * `toISOString()` здесь нельзя: в UTC+10 вечерние чаек-ины уезжали бы на следующий день.
 */
export function toDateKey(date: Date) {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Арифметика по календарным дням через UTC-полночь: не ломается о переход на летнее время.
 */
export function addDays(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  date.setUTCDate(date.getUTCDate() + days);

  const nextYear = String(date.getUTCFullYear()).padStart(4, "0");
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getUTCDate()).padStart(2, "0");

  return `${nextYear}-${nextMonth}-${nextDay}`;
}

export function calculateStreak(checkinDates: string[], todayKey: string) {
  const dates = new Set(checkinDates.filter(isDateKey));
  let cursor = todayKey;

  if (!dates.has(cursor)) {
    cursor = addDays(cursor, -1);

    if (!dates.has(cursor)) {
      return 0;
    }
  }

  let streak = 0;

  while (dates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

/**
 * Ключ локального «сегодня» для вызова в браузере. На сервере не имеет смысла:
 * сервер не знает часовой пояс пользователя.
 */
export function localTodayKey() {
  return toDateKey(new Date());
}
