"use server";

import { requireUser } from "@/lib/current-user";
import { MUSCLE_GROUP_LABELS } from "@/lib/labels";
import { addDays, isDateKey, localTodayKey } from "@/lib/streak";
import type { MuscleGroup } from "@/lib/exercise-catalog";
import type { CheckinState } from "./state";

function readSoreness(formData: FormData) {
  const raw = String(formData.get("soreness") ?? "").trim();

  if (!raw) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return null;
  }

  const soreness: Record<string, number> = {};
  let hasEntry = false;

  for (const [group, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (!(group in MUSCLE_GROUP_LABELS)) {
      return null;
    }

    if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 5) {
      return null;
    }

    soreness[group] = value;
    hasEntry = true;
  }

  return hasEntry ? (soreness as Partial<Record<MuscleGroup, number>>) : null;
}

function readScale(formData: FormData, field: string, min: number, max: number) {
  const value = Number(formData.get(field));

  if (!Number.isInteger(value) || value < min || value > max) {
    return null;
  }

  return value;
}

function readSleepHours(formData: FormData) {
  const value = Number(formData.get("sleepHours"));

  if (!Number.isFinite(value) || value < 0 || value > 24) {
    return null;
  }

  return Math.round(value * 2) / 2;
}

function readDate(formData: FormData) {
  const raw = String(formData.get("date") ?? "");

  if (!isDateKey(raw)) {
    return null;
  }

  // Страховка от рассинхронизации часов: не даём записать чек-ин «из будущего».
  if (raw > addDays(localTodayKey(), 1)) {
    return null;
  }

  return raw;
}

export async function saveCheckinAction(
  _prevState: CheckinState,
  formData: FormData,
): Promise<CheckinState> {
  const { supabase, user } = await requireUser();

  const date = readDate(formData);
  const sleepHours = readSleepHours(formData);
  const energy = readScale(formData, "energy", 1, 5);
  const soreness = readSoreness(formData);

  if (date === null || sleepHours === null || energy === null || soreness === null) {
    return {
      error: "Обнови страницу: не удалось определить дату. Значения: сон 0–24 часа, энергия 1–5, крепатура 0–5.",
      savedMessage: null,
    };
  }

  const notes = String(formData.get("notes") ?? "").trim().slice(0, 500);

  const { error } = await supabase.from("checkins").upsert(
    {
      user_id: user.id,
      date,
      sleep_hours: sleepHours,
      energy,
      soreness,
      notes: notes || null,
    },
    { onConflict: "user_id,date" },
  );

  if (error) {
    return { error: `Не удалось сохранить чек-ин: ${error.message}`, savedMessage: null };
  }

  return { error: null, savedMessage: `Чек-ин за ${date} сохранён.` };
}
