# NCTB Kids Web Deployment

## Build

```bash
npm ci
npm run build
```

Deploy the contents of `dist/web` to any static host such as Vercel,
Cloudflare Pages, Netlify, or an ordinary web server.

## Environment variables

Configure these values in the hosting provider before building:

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_USE_REMOTE_CURRICULUM=true
EXPO_PUBLIC_PRIVACY_POLICY_URL
EXPO_PUBLIC_ACCOUNT_DELETION_URL
EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL=https://your-domain.example
EXPO_PUBLIC_API_BASE_URL=
```

The `EXPO_PUBLIC_` names are intentionally retained so the website connects to
the same Supabase configuration as the existing app. `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` are also accepted as optional web-only aliases.

## Supabase configuration

- Do not create a separate web database.
- Keep using the migrations under `supabase/migrations`.
- Add the production domain and any preview domains to Authentication redirect
  URLs in the existing Supabase project.
- Use only the public anon key in the web build.
- Keep Row Level Security enabled; parent and admin access continues to be
  checked by the existing roles and policies.

## Static host routing

The application uses hash-based screen URLs, so it works on static hosting
without custom rewrite rules. Serve `index.html` at the site root and retain the
generated asset directory structure.
