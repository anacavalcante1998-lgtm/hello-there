import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./library-types";

let browserClient: SupabaseClient<Database> | undefined;

function getPublicSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY para conectar o Supabase.",
    );
  }

  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
      (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY),
  );
}

export function getSupabaseClient(): SupabaseClient<Database> {
  const { url, key } = getPublicSupabaseConfig();
  const isBrowser = typeof window !== "undefined";

  if (isBrowser && browserClient) return browserClient;

  const client = createClient<Database>(url, key, {
    auth: {
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
      detectSessionInUrl: isBrowser,
    },
  });

  if (isBrowser) browserClient = client;
  return client;
}
