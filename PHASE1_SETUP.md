# Phase 1 Setup — Parent Authentication Foundation

This project now includes real parent account registration, login, persistent
session handling, email confirmation, forgot-password email, secure in-app
password reset, and role-checked child-link requests.

## 1. Apply the database migration

Open the existing Supabase project:

1. Go to **SQL Editor**.
2. Open
   `supabase/migrations/202607300001_parent_auth_foundation.sql`.
3. Copy the complete SQL file into a new query.
4. Run it once.
5. Do not run the older initial schema again.

The migration:

- repairs missing parent profiles for existing permanent users;
- keeps anonymous child sessions separate;
- prevents staff-only accounts from using the parent-link RPC;
- prevents duplicate pending parent-link requests; and
- adds indexes needed by parent/child lookups.

## 2. Allow the password-reset deep link

In Supabase Dashboard:

1. Go to **Authentication → URL Configuration**.
2. Under **Redirect URLs**, add:

   `nctbkids://reset-password`

3. Save the change.

The app already has the matching Expo scheme in `app.json`.

## 3. EAS Preview environment

Keep the existing public Supabase variables and add:

| Variable | Preview value |
| --- | --- |
| `EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL` | `nctbkids://reset-password` |

## Supabase curriculum access

Run this migration after the parent-auth migration:

```text
supabase/migrations/202607300002_public_curriculum_read.sql
```

It gives student devices read-only access to published chapters, activities,
questions, and options. Draft and archived curriculum remains hidden.

Remote curriculum is the default in release builds. Local `curriculum.ts`
lessons are shown only when this environment variable is explicitly set to
`false`:

```text
EXPO_PUBLIC_USE_REMOTE_CURRICULUM=false
```

For preview and production, keep it set to `true`.

Only the public anon key belongs in an Expo build. Never add a Supabase
`service_role` key.

## 4. Parent authentication test

Use a new test email that you can open on the same Android phone:

1. Open **Parent Area** and create an account.
2. Confirm the email if confirmation is enabled.
3. Log in and reopen the app to confirm the session is restored.
4. Log out and choose **Password ভুলে গেছেন?**
5. Open the Supabase reset email on the Android phone.
6. Confirm the link opens NCTB Kids.
7. Set a new password and log in with it.

## 5. Child-link test

1. On the child flow, note the Student ID.
2. Log in to the Parent Dashboard.
3. Send a link request using the Student ID.
4. Return to the child Subjects screen.
5. Approve the Parent Link Request.
6. Confirm the child appears in the Parent Dashboard.

Phase 1 is not complete until child recovery and cloud progress synchronization
are implemented and tested in the next development slice.
