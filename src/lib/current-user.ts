import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchOwnProfile } from "@/lib/profiles";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return { supabase, user };
}

export async function requireProfile() {
  const { supabase, user } = await requireUser();
  const profile = await fetchOwnProfile(supabase, user.id);

  return { supabase, user, ...profile };
}
