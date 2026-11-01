begin;

create or replace function
public.recover_linked_child(
  p_student_id uuid,
  p_new_child_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_parent_user_id uuid := auth.uid();
begin
  if v_parent_user_id is null then
    raise exception 'Parent login is required.';
  end if;

  if p_student_id is null
     or p_new_child_user_id is null then
    raise exception
      'Student and child device information are required.';
  end if;

  if p_new_child_user_id = v_parent_user_id then
    raise exception
      'Parent session cannot be used as a child device session.';
  end if;

  if not exists (
    select 1
    from public.student_access sa
    where sa.student_id = p_student_id
      and sa.user_id = v_parent_user_id
      and sa.access_type =
        'parent'::public.student_access_type
  ) then
    raise exception
      'You do not have parent access to this student.';
  end if;

  if not exists (
    select 1
    from public.students s
    where s.id = p_student_id
  ) then
    raise exception 'Student was not found.';
  end if;

  -- One anonymous child session should control only one
  -- child profile on the current device.
  delete from public.student_access sa
  where sa.user_id = p_new_child_user_id
    and sa.access_type =
      'child_device'::public.student_access_type
    and sa.student_id <> p_student_id;

  -- Recovery moves the child profile to the new device.
  -- Parent access rows are never removed.
  delete from public.student_access sa
  where sa.student_id = p_student_id
    and sa.access_type =
      'child_device'::public.student_access_type
    and sa.user_id <> p_new_child_user_id;

  insert into public.student_access (
    student_id,
    user_id,
    access_type
  )
  select
    p_student_id,
    p_new_child_user_id,
    'child_device'::public.student_access_type
  where not exists (
    select 1
    from public.student_access sa
    where sa.student_id = p_student_id
      and sa.user_id =
        p_new_child_user_id
      and sa.access_type =
        'child_device'::public.student_access_type
  );

  return p_student_id;
end;
$function$;

revoke all
on function
public.recover_linked_child(uuid, uuid)
from public;

grant execute
on function
public.recover_linked_child(uuid, uuid)
to authenticated;

commit;