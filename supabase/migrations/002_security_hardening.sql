-- DeepTech Rosario — 002 Security & integrity (post-auditoría multinacional)
-- Ejecutar DESPUÉS de 001_init.sql en Supabase remoto.

-- 1) privacy_version en profiles
alter table public.profiles
  add column if not exists privacy_version text,
  add column if not exists consent_text_hash text;

-- 2) Unificar: faculty_id ya existe; añadir comentario (facultad_id deprecado en docs)
comment on column public.applications.faculty_id is 'ID de facultad (listas_desplegables). Alias lógico: facultad_id';

-- 3) Una postulación por usuario por convocatoria
create unique index if not exists applications_user_call_uidx
  on public.applications (user_id, call_id)
  where call_id is not null;

-- 4) Un resultado oficial por app + rules_version
create unique index if not exists discard_results_app_rules_uidx
  on public.discard_results (application_id, rules_version);

create unique index if not exists score_results_app_rules_uidx
  on public.score_results (application_id, rules_version);

-- 5) Checks básicos
alter table public.applications
  drop constraint if exists applications_anos_nonneg;
alter table public.applications
  add constraint applications_anos_nonneg
  check (anos_operacion_comercial is null or anos_operacion_comercial >= 0);

-- 6) Indexes de performance
create index if not exists application_answers_app_idx on public.application_answers (application_id);
create index if not exists application_files_app_idx on public.application_files (application_id);
create index if not exists discard_results_app_idx on public.discard_results (application_id);
create index if not exists score_results_app_idx on public.score_results (application_id);
create index if not exists irl_assessments_app_idx on public.irl_assessments (application_id);
create index if not exists ai_reports_app_status_idx on public.ai_reports (application_id, status);
create index if not exists applications_call_status_idx on public.applications (call_id, status);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
create unique index if not exists profiles_email_uidx on public.profiles (email);

-- 7) REVOCAR policy insegura de update total de profiles
drop policy if exists profiles_update_own on public.profiles;

-- Postulante solo actualiza campos de perfil seguros (NO role)
create policy profiles_update_own_safe on public.profiles
  for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

-- 8) Answers: solo draft (postulante) o staff
drop policy if exists answers_all_own on public.application_answers;

create policy answers_select on public.application_answers
  for select using (
    exists (
      select 1 from public.applications a
      where a.id = application_id
        and (a.user_id = auth.uid() or public.is_staff())
    )
  );

create policy answers_insert_draft on public.application_answers
  for insert with check (
    exists (
      select 1 from public.applications a
      where a.id = application_id
        and a.status = 'draft'
        and a.user_id = auth.uid()
    )
    or public.is_staff()
  );

create policy answers_update_draft on public.application_answers
  for update using (
    exists (
      select 1 from public.applications a
      where a.id = application_id
        and a.status = 'draft'
        and a.user_id = auth.uid()
    )
    or public.is_staff()
  );

create policy answers_delete_draft on public.application_answers
  for delete using (
    exists (
      select 1 from public.applications a
      where a.id = application_id
        and a.status = 'draft'
        and a.user_id = auth.uid()
    )
    or public.is_staff()
  );

-- 9) Files: misma lógica draft
drop policy if exists files_all_own on public.application_files;

create policy files_select on public.application_files
  for select using (
    exists (
      select 1 from public.applications a
      where a.id = application_id
        and (a.user_id = auth.uid() or public.is_staff())
    )
  );

create policy files_insert_draft on public.application_files
  for insert with check (
    exists (
      select 1 from public.applications a
      where a.id = application_id
        and a.status = 'draft'
        and a.user_id = auth.uid()
    )
    or public.is_staff()
  );

create policy files_delete_draft on public.application_files
  for delete using (
    exists (
      select 1 from public.applications a
      where a.id = application_id
        and a.status = 'draft'
        and a.user_id = auth.uid()
    )
    or public.is_staff()
  );

-- 10) IRL: postulante escribe solo self_* en draft; no ia_* ni final_level
drop policy if exists irl_write_own on public.irl_assessments;
drop policy if exists irl_select on public.irl_assessments;

create policy irl_select on public.irl_assessments
  for select using (
    exists (
      select 1 from public.applications a
      where a.id = application_id
        and (a.user_id = auth.uid() or public.is_staff())
    )
  );

create policy irl_insert_self_draft on public.irl_assessments
  for insert with check (
    (
      exists (
        select 1 from public.applications a
        where a.id = application_id
          and a.status = 'draft'
          and a.user_id = auth.uid()
      )
      and ia_suggested_level is null
      and ia_rationale is null
      and final_level is null
    )
    or public.is_staff()
  );

create policy irl_update_self_draft on public.irl_assessments
  for update using (
    exists (
      select 1 from public.applications a
      where a.id = application_id
        and a.status = 'draft'
        and a.user_id = auth.uid()
    )
    or public.is_staff()
  )
  with check (
    public.is_staff()
    or (
      ia_suggested_level is null
      and ia_rationale is null
      and final_level is null
    )
  );

-- 11) Resultados del motor: el cliente NO inserta (solo service role en Edge Functions)
-- (sin policy INSERT para authenticated = denegado por defecto con RLS)

-- 12) Score: ocultar a postulante si discarded (vía vista opcional; policy select refinada)
drop policy if exists score_select on public.score_results;

create policy score_select on public.score_results
  for select using (
    exists (
      select 1 from public.applications a
      where a.id = application_id
        and (
          public.is_staff()
          or (a.user_id = auth.uid() and a.status is distinct from 'discarded')
        )
    )
  );

-- 13) Función segura para que solo service role cambie roles (documental)
comment on column public.profiles.role is 'Cambiar SOLO con service_role / función admin. Nunca desde cliente.';

-- 14) applications: postulante no puede setear status distinto de draft por update directo
drop policy if exists applications_update_own_draft on public.applications;

create policy applications_update_own_draft on public.applications
  for update
  using (
    (user_id = auth.uid() and status = 'draft')
    or public.is_staff()
  )
  with check (
    public.is_staff()
    or (
      user_id = auth.uid()
      and status = 'draft'
    )
  );

-- Nota: el cambio draft→submitted/discarded/scored lo hace la Edge Function con service role.
