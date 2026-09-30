import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveDisplayName } from "./display-name";

export type ProfileSummary = {
  username: string;
  displayName: string | null;
};

/**
 * Читает профиль пользователя. Миграция 003 добавляет display_name, но
 * приложение обязано пережить её отсутствие: запрос с несуществующим
 * столбцом падает, поэтому при ошибке повторяем выборку только с username.
 */
export async function fetchOwnProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    const { data: legacy } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .maybeSingle();

    return {
      username: legacy?.username ?? null,
      displayName: resolveDisplayName(null, legacy?.username),
    };
  }

  const username = data?.username ?? null;

  return {
    username,
    displayName: resolveDisplayName(data?.display_name, username),
  };
}

export type PublicProfileSummary = ProfileSummary & {
  id: string;
  created_at: string;
};

export async function fetchPublicProfileByUsername(
  supabase: SupabaseClient,
  username: string,
): Promise<PublicProfileSummary | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, created_at")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    const { data: legacy } = await supabase
      .from("profiles")
      .select("id, username, created_at")
      .eq("username", username)
      .maybeSingle();

    if (!legacy) {
      return null;
    }

    return {
      id: legacy.id,
      username: legacy.username,
      displayName: resolveDisplayName(null, legacy.username),
      created_at: legacy.created_at,
    };
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    username: data.username,
    displayName: resolveDisplayName(data.display_name, data.username),
    created_at: data.created_at,
  };
}
