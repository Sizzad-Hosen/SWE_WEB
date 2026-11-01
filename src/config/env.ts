const publicEnv = import.meta.env;

export const env = {
  API_BASE_URL: publicEnv.EXPO_PUBLIC_API_BASE_URL ?? publicEnv.VITE_API_BASE_URL ?? '',
  SUPABASE_URL: publicEnv.EXPO_PUBLIC_SUPABASE_URL ?? publicEnv.VITE_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: publicEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? publicEnv.VITE_SUPABASE_ANON_KEY ?? '',
  USE_REMOTE_CURRICULUM:
    publicEnv.EXPO_PUBLIC_USE_REMOTE_CURRICULUM !== 'false',
  PRIVACY_POLICY_URL:
    publicEnv.EXPO_PUBLIC_PRIVACY_POLICY_URL ?? '',
  ACCOUNT_DELETION_URL:
    publicEnv.EXPO_PUBLIC_ACCOUNT_DELETION_URL ?? '',
  PASSWORD_RESET_REDIRECT_URL:
    publicEnv.EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL ?? window.location.origin,
};

export const isBackendConfigured = Boolean(env.API_BASE_URL);
export const isSupabaseConfigured = Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
