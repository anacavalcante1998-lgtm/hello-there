import { getSupabaseClient, isSupabaseConfigured } from "./supabase";
import type { Profile } from "./library-types";

export type LibraryIdentity = {
  id: string;
  email: string | undefined;
  profile: Pick<Profile, "id" | "role" | "full_name">;
};

export async function getLibraryIdentity(): Promise<LibraryIdentity | null> {
  if (!isSupabaseConfigured()) {
    throw new Error("Configure o Supabase para acessar a biblioteca.");
  }

  const client = getSupabaseClient();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) return null;

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);
  if (!profile) throw new Error("O perfil da biblioteca não foi encontrado.");

  return { id: user.id, email: user.email, profile };
}

export async function signInWithPassword(email: string, password: string) {
  if (!isSupabaseConfigured()) {
    throw new Error("Configure o Supabase para acessar a biblioteca.");
  }

  const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function signOut() {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) throw new Error(error.message);
}
