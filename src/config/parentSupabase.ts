import AsyncStorage from '../web/async-storage';
import { createClient } from '@supabase/supabase-js';

import { env, isSupabaseConfigured } from './env';

const supabaseUrl = env.SUPABASE_URL || 'https://offline-placeholder.supabase.co';
const supabaseAnonKey = env.SUPABASE_ANON_KEY || 'offline-placeholder-anon-key';

// Parent authentication uses a different storage key from the anonymous
// child session, so both sessions can safely exist on the same device.
export const parentSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    storageKey: 'shishu-shikha-parent-auth-v1',
    autoRefreshToken: isSupabaseConfigured,
    persistSession: isSupabaseConfigured,
    detectSessionInUrl: false,
  },
});
