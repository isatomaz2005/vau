-- Vau · banco de dados (Supabase / Postgres)
-- Rode este arquivo inteiro no SQL Editor do Supabase (Dashboard > SQL Editor > New query).

-- ─────────────────────────────────────────────
-- Tabelas
-- ─────────────────────────────────────────────

create table if not exists public.relatos (
  id uuid primary key default gen_random_uuid(),
  bairro text not null,
  lat double precision not null,
  lng double precision not null,
  referencia text not null default '',          -- "Rua X, perto do mercado"
  nivel text not null check (nivel in ('passavel', 'perigoso', 'intransitavel')),
  descricao text not null default '',
  foto_url text,
  status text not null default 'novo' check (status in ('novo', 'confirmado', 'descartado', 'resolvido')),
  autor text not null,                           -- id anônimo do aparelho
  ainda_assim int not null default 0,            -- "ainda está assim" (confirmações da comunidade)
  ja_baixou int not null default 0,              -- "já baixou"
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.avisos (
  id uuid primary key default gen_random_uuid(),
  bairro text not null,
  nivel text not null check (nivel in ('atencao', 'alerta', 'emergencia')),
  mensagem text not null check (char_length(mensagem) between 5 and 280),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  encerrado_em timestamptz
);

create index if not exists relatos_bairro_idx on public.relatos (bairro, criado_em desc);
create index if not exists avisos_bairro_idx on public.avisos (bairro, ativo);

-- Mantém atualizado_em em dia
create or replace function public.tocar_atualizado_em() returns trigger
language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end $$;

drop trigger if exists relatos_tocar on public.relatos;
create trigger relatos_tocar before update on public.relatos
for each row execute function public.tocar_atualizado_em();

-- ─────────────────────────────────────────────
-- Segurança (RLS)
-- Morador (app, anônimo): lê tudo, cria relato, vota pela função votar().
-- Liderança (web, logada): muda status de relatos e emite/encerra avisos.
-- ─────────────────────────────────────────────

alter table public.relatos enable row level security;
alter table public.avisos enable row level security;

drop policy if exists "todos leem relatos" on public.relatos;
create policy "todos leem relatos" on public.relatos for select using (true);

drop policy if exists "qualquer um relata" on public.relatos;
create policy "qualquer um relata" on public.relatos for insert
  with check (status = 'novo' and ainda_assim = 0 and ja_baixou = 0);

drop policy if exists "lideranca atualiza relatos" on public.relatos;
create policy "lideranca atualiza relatos" on public.relatos for update
  to authenticated using (true) with check (true);

drop policy if exists "todos leem avisos" on public.avisos;
create policy "todos leem avisos" on public.avisos for select using (true);

drop policy if exists "lideranca cria avisos" on public.avisos;
create policy "lideranca cria avisos" on public.avisos for insert
  to authenticated with check (true);

drop policy if exists "lideranca encerra avisos" on public.avisos;
create policy "lideranca encerra avisos" on public.avisos for update
  to authenticated using (true) with check (true);

-- Voto da comunidade sem dar permissão de update geral ao app
create or replace function public.votar(p_relato uuid, p_tipo text)
returns public.relatos
language plpgsql security definer set search_path = public as $$
declare r public.relatos;
begin
  if p_tipo = 'ainda_assim' then
    update relatos set ainda_assim = ainda_assim + 1 where id = p_relato returning * into r;
  elsif p_tipo = 'ja_baixou' then
    update relatos set ja_baixou = ja_baixou + 1 where id = p_relato returning * into r;
  else
    raise exception 'tipo de voto inválido';
  end if;
  return r;
end $$;

grant execute on function public.votar(uuid, text) to anon, authenticated;

-- ─────────────────────────────────────────────
-- Tempo real: app e web escutam mudanças nestas tabelas
-- ─────────────────────────────────────────────

do $$
begin
  begin
    alter publication supabase_realtime add table public.relatos;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.avisos;
  exception when duplicate_object then null;
  end;
end $$;

-- ─────────────────────────────────────────────
-- Fotos (Storage)
-- ─────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

drop policy if exists "qualquer um envia foto" on storage.objects;
create policy "qualquer um envia foto" on storage.objects for insert
  with check (bucket_id = 'fotos');

drop policy if exists "todos veem fotos" on storage.objects;
create policy "todos veem fotos" on storage.objects for select
  using (bucket_id = 'fotos');
