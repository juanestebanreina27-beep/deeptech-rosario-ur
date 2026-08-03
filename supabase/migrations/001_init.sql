-- DeepTech U. Rosario — schema producción (motor_v1)
-- Ejecutar en Supabase SQL Editor o via CLI contra proyecto remoto (NO requiere Postgres local).

create extension if not exists "pgcrypto";

-- Roles de aplicación (claim en app_metadata o tabla profiles)
create type public.app_role as enum ('postulante', 'evaluador', 'admin');
create type public.application_status as enum (
  'draft',
  'submitted',
  'discarded',
  'scored',
  'under_review',
  'accepted',
  'waitlisted',
  'rejected',
  'archived'
);
create type public.tipo_postulacion as enum (
  'desarrollo_tecnologico',
  'desarrollo_tecnologico_salud',
  'adaptacion_tecnologica'
);
create type public.ai_job_status as enum ('pending', 'running', 'ready', 'failed', 'skipped');

-- Perfiles (1:1 con auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  document_id text,
  phone text,
  role public.app_role not null default 'postulante',
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.calls (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  year int not null,
  opens_at timestamptz,
  closes_at timestamptz,
  is_active boolean not null default true,
  rules_version text not null default 'motor_v1',
  created_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  call_id uuid references public.calls (id),
  user_id uuid not null references public.profiles (id) on delete cascade,
  status public.application_status not null default 'draft',
  tipo_postulacion public.tipo_postulacion,
  sector_id int,
  faculty_id int,
  anos_operacion_comercial numeric(6,2),
  current_step int not null default 1,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index applications_user_id_idx on public.applications (user_id);
create index applications_status_idx on public.applications (status);

-- Respuestas del formulario (variable_key canónica motor_v1)
create table public.application_answers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  variable_key text not null,
  value_text text,
  value_number numeric,
  value_option text,
  score_points numeric,
  score_label text,
  is_optional_skipped boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (application_id, variable_key)
);

create table public.application_files (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  variable_key text,
  storage_path text not null,
  filename text not null,
  mime text,
  size_bytes bigint,
  uploaded_at timestamptz not null default now()
);

create table public.discard_results (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  rules_version text not null default 'motor_v1',
  passed boolean not null,
  failed_rules jsonb not null default '[]'::jsonb,
  evaluated_at timestamptz not null default now()
);

create table public.score_results (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  rules_version text not null default 'motor_v1',
  block_equipo numeric,
  block_modelo numeric,
  block_innovacion numeric,
  total_0_1 numeric,
  total_0_100 numeric,
  line_items jsonb not null default '[]'::jsonb,
  computed_at timestamptz not null default now()
);

create table public.irl_assessments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  dimension_code text not null,
  applies boolean not null default true,
  self_level int,
  self_justification text,
  ia_suggested_level int,
  ia_rationale text,
  final_level int,
  unique (application_id, dimension_code)
);

-- Informes IA (opcionales; sin API key → skipped)
create table public.ai_reports (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  kind text not null default 'diagnostico',
  status public.ai_job_status not null default 'pending',
  provider text,
  model text,
  prompt_version text,
  content_json jsonb,
  content_md text,
  error text,
  tokens_in int,
  tokens_out int,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles (id),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- Trigger: crear profile al signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'postulante'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: rol actual
create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('evaluador', 'admin')
  );
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.calls enable row level security;
alter table public.applications enable row level security;
alter table public.application_answers enable row level security;
alter table public.application_files enable row level security;
alter table public.discard_results enable row level security;
alter table public.score_results enable row level security;
alter table public.irl_assessments enable row level security;
alter table public.ai_reports enable row level security;
alter table public.audit_logs enable row level security;

-- profiles
create policy profiles_select_own_or_staff on public.profiles
  for select using (id = auth.uid() or public.is_staff());
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid());

-- calls: lectura autenticada; escritura admin (vía service role en admin panel)
create policy calls_select_auth on public.calls
  for select to authenticated using (true);

-- applications
create policy applications_select on public.applications
  for select using (user_id = auth.uid() or public.is_staff());
create policy applications_insert_own on public.applications
  for insert with check (user_id = auth.uid());
create policy applications_update_own_draft on public.applications
  for update using (
    (user_id = auth.uid() and status = 'draft')
    or public.is_staff()
  );

-- answers / files: dueño o staff
create policy answers_all_own on public.application_answers
  for all using (
    exists (
      select 1 from public.applications a
      where a.id = application_id
        and (a.user_id = auth.uid() or public.is_staff())
    )
  )
  with check (
    exists (
      select 1 from public.applications a
      where a.id = application_id
        and (a.user_id = auth.uid() or public.is_staff())
    )
  );

create policy files_all_own on public.application_files
  for all using (
    exists (
      select 1 from public.applications a
      where a.id = application_id
        and (a.user_id = auth.uid() or public.is_staff())
    )
  )
  with check (
    exists (
      select 1 from public.applications a
      where a.id = application_id
        and (a.user_id = auth.uid() or public.is_staff())
    )
  );

create policy discard_select on public.discard_results
  for select using (
    exists (
      select 1 from public.applications a
      where a.id = application_id
        and (a.user_id = auth.uid() or public.is_staff())
    )
  );

create policy score_select on public.score_results
  for select using (
    exists (
      select 1 from public.applications a
      where a.id = application_id
        and (a.user_id = auth.uid() or public.is_staff())
    )
  );

create policy irl_select on public.irl_assessments
  for select using (
    exists (
      select 1 from public.applications a
      where a.id = application_id
        and (a.user_id = auth.uid() or public.is_staff())
    )
  );

create policy irl_write_own on public.irl_assessments
  for all using (
    exists (
      select 1 from public.applications a
      where a.id = application_id
        and (a.user_id = auth.uid() or public.is_staff())
    )
  )
  with check (
    exists (
      select 1 from public.applications a
      where a.id = application_id
        and (a.user_id = auth.uid() or public.is_staff())
    )
  );

create policy ai_reports_select on public.ai_reports
  for select using (
    exists (
      select 1 from public.applications a
      where a.id = application_id
        and (a.user_id = auth.uid() or public.is_staff())
    )
  );

create policy audit_staff on public.audit_logs
  for select using (public.is_staff());

-- Storage bucket (crear también en Dashboard: name = application-files, private)
-- Policies de storage se configuran en Dashboard o con storage.objects

comment on table public.applications is 'Postulaciones DeepTech — producto real motor_v1';
