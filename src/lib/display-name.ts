export const DISPLAY_NAME_LIMITS = { min: 2, max: 40 } as const;

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/g;
const REPEATED_SPACES = /\s+/g;

/**
 * Приводит имя к виду, в котором его не стыдно показать в профиле: обрезает
 * края, схлопывает пробелы, выкидывает управляющие символы. Возвращает null,
 * если после нормализации имя слишком короткое или слишком длинное.
 */
export function normalizeDisplayName(raw: unknown): string | null {
  if (typeof raw !== "string") {
    return null;
  }

  const normalized = raw
    .replace(CONTROL_CHARACTERS, " ")
    .replace(REPEATED_SPACES, " ")
    .trim();

  if (
    normalized.length < DISPLAY_NAME_LIMITS.min ||
    normalized.length > DISPLAY_NAME_LIMITS.max
  ) {
    return null;
  }

  return normalized;
}

/** Имя для приветствия: введённое пользователем, иначе его username. */
export function resolveDisplayName(
  displayName: string | null | undefined,
  username: string | null | undefined,
): string | null {
  return normalizeDisplayName(displayName) ?? (username ? username.trim() || null : null);
}

/** «Иван Петров» → «Иван», чтобы приветствие не превращалось в простыню. */
export function firstName(name: string): string {
  return name.split(" ")[0] ?? name;
}
