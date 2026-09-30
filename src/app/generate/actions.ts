"use server";

import { requireUser } from "@/lib/current-user";
import { buildPlanName } from "@/lib/labels";
import {
  analyzeReadiness,
  applyReadiness,
  isEmptyCheckin,
  type CheckinSnapshot,
} from "@/lib/readiness";
import { addDays, isDateKey } from "@/lib/streak";
import {
  EQUIPMENT_MODES,
  EXPERIENCE_LEVELS,
  GOALS,
  generateWorkout,
  type EquipmentMode,
  type Experience,
  type Goal,
} from "@/lib/workout-generator";
import { initialGenerateState, type GenerateState } from "./state";

type CheckinRow = {
  date: string;
  sleep_hours: number | null;
  energy: number | null;
  soreness: CheckinSnapshot["soreness"];
};

/**
 * Чек-ин за сегодня по локальной дате клиента. Если сегодняшнего нет, берём
 * вчерашний: он всё ещё объясняет самочувствие перед тренировкой.
 */
async function findRelevantCheckin(supabase: Awaited<ReturnType<typeof requireUser>>["supabase"], today: string) {
  const candidates = [today, addDays(today, -1)];

  const { data } = await supabase
    .from("checkins")
    .select("date, sleep_hours, energy, soreness")
    .in("date", candidates)
    .order("date", { ascending: false })
    .limit(1);

  const row = (data ?? [])[0] as CheckinRow | undefined;

  if (!row || !isDateKey(row.date)) {
    return null;
  }

  return {
    date: row.date,
    sleep_hours: row.sleep_hours,
    energy: row.energy,
    soreness: row.soreness ?? null,
  } satisfies CheckinSnapshot;
}

function readParams(formData: FormData) {
  const goal = String(formData.get("goal") ?? "");
  const equipment = String(formData.get("equipment") ?? "");
  const experience = String(formData.get("experience") ?? "");
  const daysPerWeek = Number(formData.get("daysPerWeek"));

  if (!GOALS.includes(goal as Goal)) {
    return null;
  }

  if (!EQUIPMENT_MODES.includes(equipment as EquipmentMode)) {
    return null;
  }

  if (!EXPERIENCE_LEVELS.includes(experience as Experience)) {
    return null;
  }

  if (!Number.isInteger(daysPerWeek) || daysPerWeek < 2 || daysPerWeek > 6) {
    return null;
  }

  return {
    goal: goal as Goal,
    equipment: equipment as EquipmentMode,
    experience: experience as Experience,
    daysPerWeek,
  };
}

function readDate(formData: FormData) {
  const raw = String(formData.get("date") ?? "");

  return isDateKey(raw) ? raw : null;
}

export async function generateAction(
  _prevState: GenerateState,
  formData: FormData,
): Promise<GenerateState> {
  const params = readParams(formData);

  if (!params) {
    return {
      ...initialGenerateState,
      error: "Проверь параметры: цель, инвентарь, опыт и от 2 до 6 тренировок в неделю.",
    };
  }

  const { supabase, user } = await requireUser();
  const basePlan = generateWorkout(params);

  // Дату присылает браузер: сервер не знает часовой пояс пользователя.
  const today = readDate(formData);
  const checkin = today ? await findRelevantCheckin(supabase, today) : null;
  const readiness = analyzeReadiness(checkin);
  const plan = isEmptyCheckin(checkin) ? basePlan : applyReadiness(basePlan, readiness);
  const adaptedFor = isEmptyCheckin(checkin) ? null : checkin?.date ?? null;
  const intent = String(formData.get("intent") ?? "generate");

  const state: GenerateState = {
    plan,
    readiness,
    adaptedFor,
    error: null,
    savedMessage: null,
  };

  if (intent !== "save") {
    return state;
  }

  const { error } = await supabase.from("workouts").insert({
    user_id: user.id,
    name: buildPlanName(params),
    goal: params.goal,
    payload: plan,
  });

  if (error) {
    return { ...state, error: `Не удалось сохранить: ${error.message}` };
  }

  return { ...state, savedMessage: "Тренировка сохранена в профиль." };
}
