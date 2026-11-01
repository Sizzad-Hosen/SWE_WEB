import AsyncStorage from "../web/async-storage";
import { createClient } from "@supabase/supabase-js";

import { env, isSupabaseConfigured } from "./env";

const supabaseUrl =
  env.SUPABASE_URL ||
  "https://offline-placeholder.supabase.co";
const supabaseAnonKey =
  env.SUPABASE_ANON_KEY ||
  "offline-placeholder-anon-key";

export const adminSupabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      storageKey: "nctb-kids-admin-auth-v1",
      autoRefreshToken: isSupabaseConfigured,
      persistSession: isSupabaseConfigured,
      detectSessionInUrl: false,
    },
  },
);
