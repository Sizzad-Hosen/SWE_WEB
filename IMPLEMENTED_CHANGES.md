# Implemented Changes

## Project repair

- Added `index.ts`
- Added `app.json`
- Added `tsconfig.json`
- Added `expo-env.d.ts`
- Added `.env.example`
- Added `.gitignore`
- Added `typecheck` npm script

## Reliability

- Supabase imports no longer crash the app when `.env` is missing.
- Student creation automatically falls back to a persistent local profile.
- Parent Supabase client is import-safe in offline mode.
- Remote chapter loading is skipped when Supabase is not configured.

## Learning experience

- Rebuilt `আমার পরিচয়` as a complete interactive lesson.
- Added resumable lesson sessions in AsyncStorage.
- Added activity completion requirements and disabled Next state.
- Added Bangla narration, hints, retry feedback, recording, matching and scoring.

## Supabase curriculum foundation

- Remote Supabase curriculum is the release default.
- Removed silent fallback to `curriculum.ts` when Supabase is unavailable.
- Added visible loading, permission, configuration, and empty-content states.
- Added read-only RLS policies for published curriculum rows.
- Added adapters for story, image, audio, video, flashcard, matching, and quiz
  activity types.
- Supports final quiz questions whose `activity_id` is temporarily empty.

## Phase 1 — Parent authentication foundation

- Added reliable parent session restore and auth-state handling.
- Added Forgot Password and secure password-reset deep-link screens.
- Kept parent and anonymous child Supabase sessions isolated.
- Added a repeatable Supabase migration for parent profile repair, role checks,
  duplicate-request prevention, and link lookup indexes.
- Added `PHASE1_SETUP.md` with the exact Supabase and Android test steps.
