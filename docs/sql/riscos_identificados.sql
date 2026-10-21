-- Módulo: Registro de riscos ergonômicos identificados
-- Preparado para revisão. NÃO executar automaticamente em produção.
create table if not exists public.riscos_identificados (
 id uuid primary key default gen_random_uuid(),
 cliente_id uuid not null references public.clientes(id),
 nivel text not null check (nivel in ('posto','estacao')),
 estrutura_id uuid not null,
 origem text not null default 'coleta_biomecanica' check (origem in ('coleta_biomecanica','avaliacao_mobiliario','outra')),
 avaliacao_biomecanica_id uuid references public.avaliacoes_biomecanicas(id) on delete set null,
 criterio_codigo text,
 titulo text not null check (length(btrim(titulo)) > 0),
 descricao text not null check (length(btrim(descricao)) > 0),
 classificacao text not null default 'nao_classificado' check (classificacao in ('nao_classificado','baixo','moderado','alto','critico')),
 status text not null default 'aberto' check (status in ('aberto','em_tratamento','controlado','encerrado')),
 medidas_recomendadas text,
 plano_acao text,
 responsavel_acao text,
 prazo date,
 observacoes text,
 criado_por uuid default auth.uid(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
-- Campos de input manual conforme modelo de risco fornecido pela consultoria.
alter table public.riscos_identificados add column if not exists grupo_risco text;
alter table public.riscos_identificados add column if not exists perfil_exposicao text;
alter table public.riscos_identificados add column if not exists medidas_existentes text;
alter table public.riscos_identificados add column if not exists fundamentacao_legal text;
alter table public.riscos_identificados add column if not exists metodologia_avaliacao text;
alter table public.riscos_identificados add column if not exists probabilidade numeric;
alter table public.riscos_identificados add column if not exists severidade numeric;
alter table public.riscos_identificados add column if not exists risco_puro numeric;
alter table public.riscos_identificados add column if not exists nivel_mitigacao text;
alter table public.riscos_identificados add column if not exists classificacao_soc text;
alter table public.riscos_identificados add column if not exists conclusao_tecnica text;
alter table public.riscos_identificados add column if not exists classificacao_final text;
alter table public.riscos_identificados add column if not exists lesoes_agravos text;
create index if not exists riscos_identificados_cliente_idx on public.riscos_identificados(cliente_id,status);
create index if not exists riscos_identificados_estrutura_idx on public.riscos_identificados(nivel,estrutura_id);
alter table public.riscos_identificados enable row level security;
create policy "riscos_select" on public.riscos_identificados for select to authenticated
 using (exists (select 1 from public.clientes c where c.id=cliente_id and (public.eh_admin_consultoria(c.consultoria_id) or public.tem_acesso_cliente(c.id))));
create policy "riscos_insert" on public.riscos_identificados for insert to authenticated
 with check (exists (select 1 from public.clientes c where c.id=cliente_id and public.eh_admin_consultoria(c.consultoria_id)));
create policy "riscos_update" on public.riscos_identificados for update to authenticated
 using (exists (select 1 from public.clientes c where c.id=cliente_id and public.eh_admin_consultoria(c.consultoria_id)))
 with check (exists (select 1 from public.clientes c where c.id=cliente_id and public.eh_admin_consultoria(c.consultoria_id)));
create policy "riscos_delete" on public.riscos_identificados for delete to authenticated
 using (exists (select 1 from public.clientes c where c.id=cliente_id and public.eh_admin_consultoria(c.consultoria_id)));
grant select,insert,update,delete on public.riscos_identificados to authenticated;
-- Garante integridade do vínculo com posto ou estação, independentemente do cliente informado.
create or replace function public.validar_vinculo_risco() returns trigger language plpgsql set search_path=public as $$
begin
 if new.nivel='posto' then
  if not exists (select 1 from public.postos_trabalho p join public.instalacoes i on i.id=p.instalacao_id join public.plantas pl on pl.id=i.planta_id where p.id=new.estrutura_id and pl.cliente_id=new.cliente_id) then
   raise exception 'Posto não pertence ao cliente informado';
  end if;
 else
  if not exists (select 1 from public.estacoes_trabalho e join public.postos_trabalho p on p.id=e.posto_id join public.instalacoes i on i.id=p.instalacao_id join public.plantas pl on pl.id=i.planta_id where e.id=new.estrutura_id and pl.cliente_id=new.cliente_id) then
   raise exception 'Estação não pertence ao cliente informado';
  end if;
 end if;
 if new.avaliacao_biomecanica_id is not null and not exists
  (select 1 from public.avaliacoes_biomecanicas a where a.id=new.avaliacao_biomecanica_id and a.cliente_id=new.cliente_id and a.nivel=new.nivel and a.estrutura_id=new.estrutura_id) then
  raise exception 'Avaliação biomecânica não corresponde ao local do risco';
 end if;
 new.updated_at=now();
 return new;
end $$;
create trigger trg_validar_vinculo_risco before insert or update on public.riscos_identificados
for each row execute function public.validar_vinculo_risco();
