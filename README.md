# NCTB Kids Web

NCTB Kids is a React 19 + Vite web application converted from the original
React Native project. The student, lesson, parent, progress, donation, settings,
and admin experiences use browser-rendered React components while retaining the
existing UI values, feature services, curriculum, and Supabase schema.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production build

```bash
npm run build
npm run preview
```

The deployable static site is generated in `dist/web`.

## Shared Supabase database

The web application connects to the same Supabase project, tables, migrations,
RLS policies, and public anon key used by the previous app. No second database
or copied schema is created.

1. Copy `.env.example` to `.env`.
2. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to the
   existing project values.
3. Keep `EXPO_PUBLIC_USE_REMOTE_CURRICULUM=true` for deployed builds.
4. Add the deployed website origin to Supabase Authentication redirect URLs.

The existing `supabase/migrations` directory remains the database source of
truth. Only the public anon key belongs in the browser; never expose a
`service_role` key.

## Web replacements

- React DOM replaces the native renderer.
- Browser history replaces the native stack runtime.
- `localStorage` replaces AsyncStorage and SecureStore for browser sessions.
- Web Speech and HTML video replace Expo speech/video modules.
- The existing Supabase student, parent, and admin clients retain separate
  session keys while using the same database.
