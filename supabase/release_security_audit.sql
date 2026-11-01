-- Read-only deployment audit for NCTB Kids.
-- This script does not alter tables, policies, functions, or data.

-- 1. Every student-facing public table should have RLS enabled.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'profiles',
    'students',
    'student_access',
    'parent_link_requests',
    'chapters',
    'lesson_activities',
    'quiz_questions',
    'quiz_options',
    'chapter_progress',
    'activity_attempts',
    'staff_assignments',
    'donations'
  )
order by c.relname;

-- 2. Review the exact policies granted to anon/authenticated users.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles',
    'students',
    'student_access',
    'parent_link_requests',
    'chapters',
    'lesson_activities',
    'quiz_questions',
    'quiz_options',
    'chapter_progress',
    'activity_attempts',
    'staff_assignments',
    'donations'
  )
order by tablename, policyname;

-- 3. SECURITY DEFINER functions need explicit authorization checks and a
-- fixed search_path. Inspect every function returned here.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer,
  p.proconfig as function_settings
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'create_student_profile',
    'complete_chapter',
    'request_parent_link',
    'respond_parent_link',
    'get_student_report'
  )
order by p.proname;

-- 4. Confirm which app roles can execute each RPC.
select
  routine_schema,
  routine_name,
  grantee,
  privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in (
    'create_student_profile',
    'complete_chapter',
    'request_parent_link',
    'respond_parent_link',
    'get_student_report'
  )
  and grantee in ('anon', 'authenticated', 'PUBLIC')
order by routine_name, grantee;
