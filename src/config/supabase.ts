import AsyncStorage from '../web/async-storage';
import { createClient } from '@supabase/supabase-js';

import { env, isSupabaseConfigured } from './env';

// A harmless placeholder keeps local/offline mode import-safe. Services check
// isSupabaseConfigured before making a network request.
const supabaseUrl = env.SUPABASE_URL || 'https://offline-placeholder.supabase.co';
const supabaseAnonKey = env.SUPABASE_ANON_KEY || 'offline-placeholder-anon-key';

export { isSupabaseConfigured };

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: isSupabaseConfigured,
    persistSession: isSupabaseConfigured,
    detectSessionInUrl: false,
  },
});
