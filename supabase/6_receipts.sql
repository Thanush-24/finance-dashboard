-- =============================================================
-- Bill/receipt uploads
-- =============================================================
-- Private storage bucket for uploaded receipt images. Files are stored
-- under a per-user folder ({user_id}/{filename}) so RLS on
-- storage.objects can scope access the same way every other table in
-- this app does — a user can only read/write objects inside their own
-- folder.
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "receipts_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "receipts_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "receipts_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- receipt_path stores the storage object path, not a public URL — the
-- bucket is private, so the app generates a short-lived signed URL on
-- demand whenever a receipt needs to be viewed.
alter table public.transactions
  add column if not exists receipt_path text;
