begin;

-- Student devices do not need an account to read learning content. Only rows
-- that are fully published are exposed; draft and archived rows stay private.
alter table public.chapters enable row level security;
alter table public.lesson_activities enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_options enable row level security;

grant usage on schema public to anon, authenticated;
grant select on table
  public.chapters,
  public.lesson_activities,
  public.quiz_questions,
  public.quiz_options
to anon, authenticated;

drop policy if exists "curriculum_read_published_chapters"
  on public.chapters;
create policy "curriculum_read_published_chapters"
  on public.chapters
  for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "curriculum_read_published_activities"
  on public.lesson_activities;
create policy "curriculum_read_published_activities"
  on public.lesson_activities
  for select
  to anon, authenticated
  using (
    status = 'published'
    and exists (
      select 1
      from public.chapters as chapter
      where chapter.id = lesson_activities.chapter_id
        and chapter.status = 'published'
    )
  );

drop policy if exists "curriculum_read_published_questions"
  on public.quiz_questions;
create policy "curriculum_read_published_questions"
  on public.quiz_questions
  for select
  to anon, authenticated
  using (
    status = 'published'
    and exists (
      select 1
      from public.chapters as chapter
      where chapter.id = quiz_questions.chapter_id
        and chapter.status = 'published'
    )
  );

drop policy if exists "curriculum_read_published_options"
  on public.quiz_options;
create policy "curriculum_read_published_options"
  on public.quiz_options
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.quiz_questions as question
      join public.chapters as chapter
        on chapter.id = question.chapter_id
      where question.id = quiz_options.question_id
        and question.status = 'published'
        and chapter.status = 'published'
    )
  );

commit;
