# Portal NR-17 — Estado do desenvolvimento

Atualizado em 12/10/2026.

## Serviços e repositório

- Repositório: https://github.com/NBMAZA/Projeto (branch `main`).
- Aplicação: Next.js + TypeScript.
- Supabase: projeto `ovadyypeznbfwshnfiip`, região São Paulo.
- Vercel: projeto `portal-nr17`, domínio configurado `portal-nr17.vercel.app`.
- O primeiro deploy de produção foi confirmado como **READY**. A tela de login foi visualizada funcionando.

## Implementado

- Estrutura básica da aplicação e estilos.
- Autenticação de e-mail e senha via Supabase.
- Interface inicial de administração.
- Formulário para cadastrar consultorias.
- Listagem e indicadores básicos de consultorias.
- Tabelas `public.consultorias` e `public.usuarios_consultoria`.
- RLS habilitado e políticas iniciais para administrador central e leitura por consultoria.
- Variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` cadastradas na Vercel Production.

## Autenticação: situação e pendência

O login do usuário administrador foi confirmado, porém a interface exibiu **"Conta autenticada, mas sem permissão de administrador central"**. Ainda **não foi confirmado** que o perfil administrativo foi atribuído.

A aplicação exige `auth.users.raw_app_meta_data.role = 'admin_central'`, refletido em `user.app_metadata.role`. Essa atribuição deve ser realizada somente por operador autorizado no backend/Supabase, jamais pelo cliente.

Para atualizar uma conta administrativa previamente verificada, no SQL Editor do Supabase:

```sql
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
                        || '{"role":"admin_central"}'::jsonb
WHERE email = '<EMAIL_DO_ADMINISTRADOR_VERIFICADO>'
RETURNING id, email, raw_app_meta_data;
```

Executar apenas após verificar a identidade do administrador e a conta alvo; preservar os demais metadados. Depois, sair e entrar novamente no portal para renovar o JWT. **Não foi verificada a execução desse comando.**

## Próximas etapas

1. Confirmar que o administrador central tem permissão correta e consegue acessar o dashboard.
2. Testar cadastro real de consultoria e RLS com contas de perfis distintos.
3. Validar dígitos verificadores do CNPJ e adicionar feedback de formulário.
4. Implementar edição, ativação, suspensão e auditoria de consultorias.
5. Implementar usuários e perfis de consultorias.
6. Cadastrar empresas clientes e desenvolver os módulos de AEP/AET.
7. Testar build, fluxos de autenticação, segurança multi-tenant e observabilidade antes de liberar uso real.

## Segurança

- Não versionar senhas, chaves secretas, `service_role` ou dados pessoais de clientes.
- O repositório atualmente é público: manter apenas código e documentação sem segredos.
- As políticas RLS existem, mas ainda precisam de testes com usuários reais.
- A aplicação inicial é um protótipo e não está homologada para dados de clientes.
