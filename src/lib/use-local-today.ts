"use client";

import { useSyncExternalStore } from "react";
import { localTodayKey } from "@/lib/streak";

/** Пересчитываем раз в минуту, чтобы вкладка, перешедшая полночь, обновила дату. */
function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, 60_000);

  return () => clearInterval(timer);
}

function getSnapshot() {
  return localTodayKey() as string | null;
}

function getServerSnapshot() {
  return null;
}

/**
 * Локальная дата пользователя.
 *
 * Сервер не знает часовой пояс пользователя, поэтому на сервере значение `null`,
 * а после гидрации — реальная локальная дата. Так разметка сервера и клиента
 * совпадает и не нужен эффект с setState.
 */
export function useLocalToday() {
  const today = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return { today, ready: today !== null };
}
