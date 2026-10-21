create table if not exists public.criterios_biomecanicos (
 id uuid primary key default gen_random_uuid(),
 codigo text not null unique, grupo text not null, ordem integer not null,
 titulo text not null, texto_sugerido text not null default '', ativo boolean not null default true
);
create table if not exists public.avaliacoes_biomecanicas (
 id uuid primary key default gen_random_uuid(),
 cliente_id uuid not null references public.clientes(id),
 nivel text not null check(nivel in ('posto','estacao')),
 estrutura_id uuid not null,
 titulo text not null default 'Avaliação biomecânica',
 status text not null default 'rascunho' check(status in ('rascunho','concluida')),
 responsavel_id uuid default auth.uid(),
 data_avaliacao date not null default current_date,
 observacoes_gerais text, comentario_tecnico_geral text, plano_acao_geral text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.avaliacoes_biomecanicas_respostas (
 id uuid primary key default gen_random_uuid(),
 avaliacao_id uuid not null references public.avaliacoes_biomecanicas(id) on delete cascade,
 criterio_id uuid not null references public.criterios_biomecanicos(id),
 situacao text check(situacao in ('sim','nao','na')),
 descricao_editada text, observacoes text, comentario_tecnico text, plano_acao text,
 dados_complementares jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now(),
 unique(avaliacao_id,criterio_id)
);
create index if not exists idx_biomecanicas_estrutura on public.avaliacoes_biomecanicas(cliente_id,nivel,estrutura_id);
create index if not exists idx_biomecanicas_respostas on public.avaliacoes_biomecanicas_respostas(avaliacao_id);
alter table public.criterios_biomecanicos enable row level security;
alter table public.avaliacoes_biomecanicas enable row level security;
alter table public.avaliacoes_biomecanicas_respostas enable row level security;
create policy criterios_biomecanicos_read on public.criterios_biomecanicos for select to authenticated using (true);
create policy biomecanicas_select on public.avaliacoes_biomecanicas for select to authenticated using (exists(select 1 from public.clientes c where c.id=cliente_id and (public.eh_admin_consultoria(c.consultoria_id) or public.tem_acesso_cliente(c.id))));
create policy biomecanicas_insert on public.avaliacoes_biomecanicas for insert to authenticated with check (exists(select 1 from public.clientes c where c.id=cliente_id and public.eh_admin_consultoria(c.consultoria_id)));
create policy biomecanicas_update on public.avaliacoes_biomecanicas for update to authenticated using (exists(select 1 from public.clientes c where c.id=cliente_id and public.eh_admin_consultoria(c.consultoria_id))) with check (exists(select 1 from public.clientes c where c.id=cliente_id and public.eh_admin_consultoria(c.consultoria_id)));
create policy biomecanicas_respostas_select on public.avaliacoes_biomecanicas_respostas for select to authenticated using (exists(select 1 from public.avaliacoes_biomecanicas a where a.id=avaliacao_id));
create policy biomecanicas_respostas_insert on public.avaliacoes_biomecanicas_respostas for insert to authenticated with check (exists(select 1 from public.avaliacoes_biomecanicas a join public.clientes c on c.id=a.cliente_id where a.id=avaliacao_id and public.eh_admin_consultoria(c.consultoria_id)));
create policy biomecanicas_respostas_update on public.avaliacoes_biomecanicas_respostas for update to authenticated using (exists(select 1 from public.avaliacoes_biomecanicas a join public.clientes c on c.id=a.cliente_id where a.id=avaliacao_id and public.eh_admin_consultoria(c.consultoria_id))) with check (exists(select 1 from public.avaliacoes_biomecanicas a join public.clientes c on c.id=a.cliente_id where a.id=avaliacao_id and public.eh_admin_consultoria(c.consultoria_id)));
grant select on public.criterios_biomecanicos to authenticated;
grant select,insert,update on public.avaliacoes_biomecanicas,public.avaliacoes_biomecanicas_respostas to authenticated;
create or replace function public.validar_vinculo_biomecanico() returns trigger language plpgsql security invoker as $$
begin
 if not exists (
 select 1 from public.postos_trabalho p join public.instalacoes i on i.id=p.instalacao_id join public.plantas pl on pl.id=i.planta_id
 where pl.cliente_id=new.cliente_id and ((new.nivel='posto' and p.id=new.estrutura_id) or (new.nivel='estacao' and exists(select 1 from public.estacoes_trabalho e where e.id=new.estrutura_id and e.posto_id=p.id)))
 ) then raise exception 'Posto ou estação não pertence ao cliente selecionado'; end if;
 return new;
end $$;
create trigger trg_validar_vinculo_biomecanico before insert or update of cliente_id,nivel,estrutura_id on public.avaliacoes_biomecanicas for each row execute function public.validar_vinculo_biomecanico();