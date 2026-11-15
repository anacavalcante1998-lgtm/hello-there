import "@tanstack/react-start/server-only";

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { Database, Profile } from "./library-types";

export type LibraryServerConfig = {
  supabaseUrl: string;
  publishableKey: string;
};

export type LibraryServerSession = {
  client: SupabaseClient<Database>;
  user: User;
  profile: Pick<Profile, "id" | "role" | "full_name">;
};

/** Cria um cliente isolado por chamada, sempre no escopo do JWT do usuário. */
export function createLibraryServerClient(
  accessToken: string,
  config: LibraryServerConfig,
): SupabaseClient<Database> {
  if (!accessToken.trim()) throw new Error("Token de sessão obrigatório.");
  if (!config.supabaseUrl || !config.publishableKey) {
    throw new Error("Configuração pública do Supabase ausente no servidor.");
  }

  return createClient<Database>(config.supabaseUrl, config.publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}

export async function requireLibrarySession(
  accessToken: string,
  config: LibraryServerConfig,
): Promise<LibraryServerSession> {
  const client = createLibraryServerClient(accessToken, config);
  const { data, error } = await client.auth.getUser(accessToken);

  if (error || !data.user) throw new Error("Sessão inválida ou expirada.");

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError || !profile) throw new Error("Perfil da biblioteca indisponível.");

  return { client, user: data.user, profile };
}

export async function requireLibraryAdmin(
  accessToken: string,
  config: LibraryServerConfig,
): Promise<LibraryServerSession> {
  const session = await requireLibrarySession(accessToken, config);
  if (session.profile.role !== "admin") {
    throw new Error("Acesso restrito a administradores da biblioteca.");
  }
  return session;
}
