-- NCTB Kids Phase 1
-- Parent authentication and secure child-link foundation.
-- Run once in Supabase Dashboard -> SQL Editor.

begin;

-- Repair permanent auth users that were created before the profile trigger.
insert into public.profiles (id, role, display_name)
select
  u.id,
  'parent'::public.app_role,
  nullif(trim(coalesce(u.raw_user_meta_data ->> 'display_name', '')), '')
from auth.users u
where coalesce(u.is_anonymous, false) = false
  and not exists (
    select 1
    from public.profiles p
    where p.id = u.id
  );

-- Every future permanent signup receives a parent profile. Anonymous child
-- sessions stay profile-free and only receive child_device access.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(new.is_anonymous, false) = false then
    insert into public.profiles (id, role, display_name)
    values (
      new.id,
      'parent'::public.app_role,
      nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '')
    )
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Keep only the newest pending request for each parent/child pair before
-- adding the race-condition guard.
with ranked_requests as (
  select
    r.id,
    row_number() over (
      partition by r.student_id, r.parent_user_id
      order by r.created_at desc, r.id desc
    ) as request_rank
  from public.parent_link_requests r
  where r.status = 'pending'::public.link_request_status
)
update public.parent_link_requests r
set
  status = 'cancelled'::public.link_request_status,
  responded_at = now()
from ranked_requests ranked
where r.id = ranked.id
  and ranked.request_rank > 1;

create unique index if not exists parent_link_one_pending_pair_idx
on public.parent_link_requests (student_id, parent_user_id)
where status = 'pending'::public.link_request_status;

create index if not exists student_access_user_type_idx
on public.student_access (user_id, access_type, student_id);

create index if not exists parent_link_parent_status_idx
on public.parent_link_requests (parent_user_id, status, created_at desc);

create index if not exists parent_link_student_status_idx
on public.parent_link_requests (student_id, status, created_at desc);

-- Only a real parent/admin profile may create a child-link request.
create or replace function public.request_parent_link(p_student_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_parent_id uuid := (select auth.uid());
  v_is_anonymous boolean;
  v_student_id uuid;
  v_request_id uuid;
begin
  if v_parent_id is null then
    raise exception 'Parent must sign in first.';
  end if;

  select coalesce(u.is_anonymous, false)
    into v_is_anonymous
  from auth.users u
  where u.id = v_parent_id;

  if coalesce(v_is_anonymous, true) then
    raise exception 'A permanent parent account is required.';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = v_parent_id
      and p.role in (
        'parent'::public.app_role,
        'admin'::public.app_role
      )
  ) then
    raise exception 'This account does not have parent access.';
  end if;

  select s.id
    into v_student_id
  from public.students s
  where upper(s.student_code) = upper(trim(p_student_code));

  if v_student_id is null then
    raise exception 'Student ID was not found.';
  end if;

  if exists (
    select 1
    from public.student_access sa
    where sa.student_id = v_student_id
      and sa.user_id = v_parent_id
      and sa.access_type = 'parent'::public.student_access_type
  ) then
    raise exception 'This child is already linked to your account.';
  end if;

  select r.id
    into v_request_id
  from public.parent_link_requests r
  where r.student_id = v_student_id
    and r.parent_user_id = v_parent_id
    and r.status = 'pending'::public.link_request_status
    and r.expires_at > now()
  order by r.created_at desc
  limit 1;

  if v_request_id is not null then
    return v_request_id;
  end if;

  update public.parent_link_requests r
  set
    status = 'expired'::public.link_request_status,
    responded_at = now()
  where r.student_id = v_student_id
    and r.parent_user_id = v_parent_id
    and r.status = 'pending'::public.link_request_status
    and r.expires_at <= now();

  insert into public.parent_link_requests (student_id, parent_user_id)
  values (v_student_id, v_parent_id)
  returning id into v_request_id;

  return v_request_id;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;
revoke all on function public.request_parent_link(text) from public, anon;
grant execute on function public.request_parent_link(text) to authenticated;

commit;
