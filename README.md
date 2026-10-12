# Portal NR-17

Plataforma SaaS para consultorias responsáveis por avaliações ergonômicas e laudos relacionados à NR-17.

## Módulo 01 — Cadastro de consultorias

- Cadastro realizado exclusivamente pelo administrador central.
- Consultorias vinculadas a usuários por perfis.
- Isolamento de dados entre consultorias via Supabase RLS.
- Estados do cadastro: pendente, ativa, suspensa e inativa.

## Arquitetura

- Front-end: Next.js, React e TypeScript (a implementar).
- Banco e autenticação: Supabase, projeto `portal-nr17`, região `sa-east-1`.
- Deploy: Vercel (a configurar).

## Segurança

Não salvar credenciais, chaves secretas ou dados reais de clientes neste repositório. A definição de administrador central deve ser feita em `app_metadata` por processo privilegiado, nunca pelo cadastro público.

## Estado

Estrutura inicial do banco criada. Interface, autenticação e deploy pendentes.
