begin;

alter table public.parent_link_requests
add column if not exists
requested_display_name text;

create or replace function
public.request_parent_link_with_name(
  p_student_code text,
  p_display_name text
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_parent_user_id uuid := auth.uid();
  v_student_id uuid;
  v_request_id uuid;
  v_display_name text :=
    regexp_replace(
      btrim(coalesce(p_display_name, '')),
      '\s+',
      ' ',
      'g'
    );
begin
  if v_parent_user_id is null then
    raise exception
      'Parent login is required.';
  end if;

  if char_length(v_display_name) < 1
     or char_length(v_display_name) > 40 then
    raise exception
      'Child name must contain 1 to 40 characters.';
  end if;

  select s.id
  into v_student_id
  from public.students s
  where upper(s.student_code) =
    upper(btrim(coalesce(p_student_code, '')))
  limit 1;

  if v_student_id is null then
    raise exception
      'Student ID was not found.';
  end if;

  if exists (
    select 1
    from public.student_access sa
    where sa.student_id = v_student_id
      and sa.user_id = v_parent_user_id
      and sa.access_type::text = 'parent'
  ) then
    update public.students
    set
      display_name = v_display_name,
      updated_at = now()
    where id = v_student_id;

    return v_student_id;
  end if;

  select r.id
  into v_request_id
  from public.parent_link_requests r
  where r.student_id = v_student_id
    and r.parent_user_id =
      v_parent_user_id
    and r.status::text = 'pending'
    and r.expires_at > now()
  order by r.created_at desc
  limit 1;

  if v_request_id is not null then
    update public.parent_link_requests
    set
      requested_display_name =
        v_display_name,
      expires_at =
        now() + interval '7 days'
    where id = v_request_id;

    return v_request_id;
  end if;

  insert into public.parent_link_requests (
    parent_user_id,
    student_id,
    requested_display_name,
    status,
    expires_at
  )
  values (
    v_parent_user_id,
    v_student_id,
    v_display_name,
    'pending',
    now() + interval '7 days'
  )
  returning id into v_request_id;

  return v_request_id;
end;
$function$;

create or replace function
public.apply_approved_parent_child_name()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.status::text = 'approved'
     and old.status::text is distinct from
       new.status::text
     and nullif(
       btrim(new.requested_display_name),
       ''
     ) is not null then
    update public.students
    set
      display_name =
        regexp_replace(
          btrim(
            new.requested_display_name
          ),
          '\s+',
          ' ',
          'g'
        ),
      updated_at = now()
    where id = new.student_id;
  end if;

  return new;
end;
$function$;

drop trigger if exists
apply_approved_parent_child_name_trigger
on public.parent_link_requests;

create trigger
apply_approved_parent_child_name_trigger
after update of status
on public.parent_link_requests
for each row
execute function
public.apply_approved_parent_child_name();

revoke all
on function
public.request_parent_link_with_name(
  text,
  text
)
from public;

grant execute
on function
public.request_parent_link_with_name(
  text,
  text
)
to authenticated;

commit;