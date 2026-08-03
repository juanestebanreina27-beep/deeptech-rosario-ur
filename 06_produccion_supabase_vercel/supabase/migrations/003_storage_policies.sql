-- DeepTech Rosario — Storage bucket policies
-- Crear bucket privado "application-files" en Dashboard si no existe, luego ejecutar esto.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'application-files',
  'application-files',
  false,
  20971520, -- 20 MB
  array['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'application/zip']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path esperado: {user_id}/{application_id}/{filename}

create policy storage_app_files_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'application-files'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_staff()
    )
  );

create policy storage_app_files_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'application-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy storage_app_files_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'application-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy storage_app_files_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'application-files'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_staff()
    )
  );
