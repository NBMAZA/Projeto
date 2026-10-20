-- Portal NR-17 | Etapa 1: catalogos de cargos e atividades por cliente
-- MIGRACAO PROPOSTA: revisar em ambiente de testes antes de aplicar.
-- Nao altera nem remove atividades_trabalho, postos_trabalho ou avaliacoes existentes.
create table if not exists public.cargos_cliente (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  codigo text,
  nome text not null check (length(btrim(nome)) between 1 and 200),
  cbo varchar(6) check (cbo is null or cbo ~ '^[0-9]{6}$'),
  descricao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, cliente_id)
);
create unique index if not exists cargos_cliente_codigo_unique
  on public.cargos_cliente(cliente_id, lower(btrim(codigo)))
  where codigo is not null and btrim(codigo) <> '';

create table if not exists public.catalogo_atividades (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  nome text not null check (length(btrim(nome)) between 1 and 200),
  descricao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, cliente_id)
);
create unique index if not exists catalogo_atividades_nome_unique
  on public.catalogo_atividades(cliente_id, lower(btrim(nome)));

create table if not exists public.cargo_atividades (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  cargo_id uuid not null,
  atividade_id uuid not null,
  created_at timestamptz not null default now(),
  foreign key (cargo_id, cliente_id) references public.cargos_cliente(id, cliente_id) on delete cascade,
  foreign key (atividade_id, cliente_id) references public.catalogo_atividades(id, cliente_id) on delete cascade,
  unique (cargo_id, atividade_id)
);
-- Permissoes limitadas aos administradores ativos da consultoria vinculada ao cliente.
-- O perfil da coordenadora sera incorporado quando sua identidade/permissoes forem implementadas.
alter table public.cargos_cliente enable row level security;
alter table public.catalogo_atividades enable row level security;
alter table public.cargo_atividades enable row level security;

create policy "cargos_acesso_consultoria" on public.cargos_cliente
  for all to authenticated
  using (exists (select 1 from public.clientes c join public.usuarios_consultoria uc
    on uc.consultoria_id=c.consultoria_id
    where c.id=cliente_id and uc.usuario_id=(select auth.uid())
      and uc.ativo=true and uc.perfil='admin_consultoria'))
  with check (exists (select 1 from public.clientes c join public.usuarios_consultoria uc
    on uc.consultoria_id=c.consultoria_id
    where c.id=cliente_id and uc.usuario_id=(select auth.uid())
      and uc.ativo=true and uc.perfil='admin_consultoria'));
create policy "atividades_catalogo_acesso_consultoria" on public.catalogo_atividades
  for all to authenticated
  using (exists (select 1 from public.clientes c join public.usuarios_consultoria uc
    on uc.consultoria_id=c.consultoria_id
    where c.id=cliente_id and uc.usuario_id=(select auth.uid())
      and uc.ativo=true and uc.perfil='admin_consultoria'))
  with check (exists (select 1 from public.clientes c join public.usuarios_consultoria uc
    on uc.consultoria_id=c.consultoria_id
    where c.id=cliente_id and uc.usuario_id=(select auth.uid())
      and uc.ativo=true and uc.perfil='admin_consultoria'));
create policy "cargo_atividades_acesso_consultoria" on public.cargo_atividades
  for all to authenticated
  using (exists (select 1 from public.clientes c join public.usuarios_consultoria uc
    on uc.consultoria_id=c.consultoria_id
    where c.id=cliente_id and uc.usuario_id=(select auth.uid())
      and uc.ativo=true and uc.perfil='admin_consultoria'))
  with check (exists (select 1 from public.clientes c join public.usuarios_consultoria uc
    on uc.consultoria_id=c.consultoria_id
    where c.id=cliente_id and uc.usuario_id=(select auth.uid())
      and uc.ativo=true and uc.perfil='admin_consultoria'));
