import { isSupabaseConfigured } from '../../../config/env';
import { env } from '../../../config/env';
import { parentSupabase } from '../../../config/parentSupabase';

export type ParentUser = {
  id: string;
  name: string;
  email: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterParentPayload = {
  name: string;
  email: string;
  password: string;
};

export type RegisterParentResult = {
  user: ParentUser | null;
  requiresEmailConfirmation: boolean;
};

export type PasswordRecoverySession = {
  accessToken: string;
  refreshToken: string;
};

type ProfileRow = {
  id: string;
  role: 'parent' | 'content_creator' | 'admin';
  display_name: string | null;
};

function ensureConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error('Parent cloud service is not configured yet.');
  }
}

function throwSupabaseError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

function parseRecoverySession(url: string): PasswordRecoverySession {
  const fragment = url.includes('#') ? url.split('#')[1] : '';
  const query = url.includes('?')
    ? url.split('?')[1]?.split('#')[0] ?? ''
    : '';
  const values = new URLSearchParams(fragment || query);
  const type = values.get('type');
  const accessToken = values.get('access_token');
  const refreshToken = values.get('refresh_token');
  const errorDescription = values.get('error_description');

  if (errorDescription) {
    throw new Error(errorDescription.replace(/\+/g, ' '));
  }

  if (type && type !== 'recovery') {
    throw new Error('This link is not a password-recovery link.');
  }

  if (!accessToken || !refreshToken) {
    throw new Error('Password reset link is invalid or has expired.');
  }

  return { accessToken, refreshToken };
}

async function getParentUser(userId: string, email: string | undefined) {
  const { data, error } = await parentSupabase
    .from('profiles')
    .select('id, role, display_name')
    .eq('id', userId)
    .single();

  throwSupabaseError(error);

  const profile = data as ProfileRow;

  if (profile.role !== 'parent' && profile.role !== 'admin') {
    throw new Error('This account does not have Parent Dashboard access.');
  }

  const safeEmail = email ?? '';

  return {
    id: userId,
    name: profile.display_name ?? safeEmail.split('@')[0] ?? 'Parent',
    email: safeEmail,
  } satisfies ParentUser;
}

export const authService = {
  async login(payload: LoginPayload) {
    ensureConfigured();

    const { data, error } = await parentSupabase.auth.signInWithPassword({
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
    });

    throwSupabaseError(error);

    if (!data.user || !data.session) {
      throw new Error('Parent login session could not be created.');
    }

    try {
      return await getParentUser(data.user.id, data.user.email);
    } catch (profileError) {
      await parentSupabase.auth.signOut();
      throw profileError;
    }
  },

  async registerParent(
    payload: RegisterParentPayload
  ): Promise<RegisterParentResult> {
    ensureConfigured();

    const { data, error } = await parentSupabase.auth.signUp({
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      options: {
        data: {
          display_name: payload.name,
          account_type: 'parent',
        },
      },
    });

    throwSupabaseError(error);

    if (!data.user) {
      throw new Error('Parent account could not be created.');
    }

    if (!data.session) {
      return {
        user: null,
        requiresEmailConfirmation: true,
      };
    }

    return {
      user: await getParentUser(data.user.id, data.user.email),
      requiresEmailConfirmation: false,
    };
  },

  async me() {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await parentSupabase.auth.getSession();
    throwSupabaseError(error);

    const user = data.session?.user;

    if (!user) {
      return null;
    }

    return getParentUser(user.id, user.email);
  },

  async logout() {
    if (!isSupabaseConfigured) return;

    const { error } = await parentSupabase.auth.signOut();
    throwSupabaseError(error);
  },

  async requestPasswordReset(email: string) {
    ensureConfigured();

    const { error } = await parentSupabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: env.PASSWORD_RESET_REDIRECT_URL,
      }
    );

    throwSupabaseError(error);
  },

  async startPasswordRecovery(url: string) {
    ensureConfigured();

    const recovery = parseRecoverySession(url);
    const { data, error } = await parentSupabase.auth.setSession({
      access_token: recovery.accessToken,
      refresh_token: recovery.refreshToken,
    });

    throwSupabaseError(error);

    if (!data.user || !data.session) {
      throw new Error('Password recovery session could not be created.');
    }

    return getParentUser(data.user.id, data.user.email);
  },

  async updatePassword(password: string) {
    ensureConfigured();

    const { data, error } = await parentSupabase.auth.updateUser({
      password,
    });

    throwSupabaseError(error);

    if (!data.user) {
      throw new Error('Password could not be updated.');
    }

    return getParentUser(data.user.id, data.user.email);
  },

  onAuthStateChange(onChange: () => void) {
    const {
      data: { subscription },
    } = parentSupabase.auth.onAuthStateChange(() => {
      setTimeout(onChange, 0);
    });

    return () => subscription.unsubscribe();
  },
};
