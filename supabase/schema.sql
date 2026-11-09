begin;

create table if not exists public.ff_finance_records (
  owner_id uuid not null references auth.users (id) on delete cascade,
  entity text not null check (entity in ('tx', 'bills', 'rules')),
  record_id text not null check (record_id ~ '^[a-zA-Z0-9_-]{1,96}$'),
  updated_ms bigint not null check (updated_ms between 0 and 9007199254740991),
  revision text not null check (char_length(revision) between 1 and 96),
  payload jsonb check (payload is null or jsonb_typeof(payload) = 'object'),
  primary key (owner_id, entity, record_id)
);

alter table public.ff_finance_records enable row level security;
revoke all on public.ff_finance_records from public, anon, authenticated;
grant select, insert, update on public.ff_finance_records to authenticated;

drop policy if exists ff_owner on public.ff_finance_records;
create policy ff_owner on public.ff_finance_records
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- A revisão mais recente prevalece mesmo se outro aparelho enviar uma fila antiga.
-- Um payload NULL registra a exclusão sem perder a revisão que a originou.
create or replace function public.ff_keep_latest_revision()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.updated_ms, new.revision) <= (old.updated_ms, old.revision) then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists ff_latest_revision on public.ff_finance_records;
create trigger ff_latest_revision
  before update on public.ff_finance_records
  for each row execute function public.ff_keep_latest_revision();

revoke all on function public.ff_keep_latest_revision() from public, anon, authenticated;

commit;
