begin;

alter table public.students
alter column recovery_code set not null;

create unique index if not exists
students_recovery_code_unique_idx
on public.students (upper(trim(recovery_code)));

drop function if exists
public.restore_student_by_recovery_code(text);

create or replace function
public.restore_student_by_recovery_code(
  p_student_code text,
  p_recovery_code text
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_student_id uuid;
begin
  if v_user_id is null then
    raise exception 'Login required.';
  end if;

  if nullif(trim(coalesce(p_student_code, '')), '') is null
     or nullif(trim(coalesce(p_recovery_code, '')), '') is null then
    raise exception 'Student ID and recovery code are required.';
  end if;

  select s.id
  into v_student_id
  from public.students s
  where upper(trim(s.student_code))
        = upper(trim(p_student_code))
    and upper(trim(s.recovery_code))
        = upper(trim(p_recovery_code))
  limit 1;

  if v_student_id is null then
    raise exception
      'Student ID or recovery code is incorrect.';
  end if;

  delete from public.student_access sa
  where sa.student_id = v_student_id
    and sa.access_type =
      'child_device'::public.student_access_type
    and sa.user_id <> v_user_id;

  insert into public.student_access (
    student_id,
    user_id,
    access_type
  )
  select
    v_student_id,
    v_user_id,
    'child_device'::public.student_access_type
  where not exists (
    select 1
    from public.student_access sa
    where sa.student_id = v_student_id
      and sa.user_id = v_user_id
      and sa.access_type =
        'child_device'::public.student_access_type
  );

  return v_student_id;
end;
$function$;

revoke all
on function public.restore_student_by_recovery_code(text, text)
from public;

grant execute
on function public.restore_student_by_recovery_code(text, text)
to authenticated;

commit;