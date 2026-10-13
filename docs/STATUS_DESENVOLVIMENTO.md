# Portal NR-17 — Estado do desenvolvimento

Atualizado em 12/10/2026. Ponto de retomada solicitado pelo usuário.

## Infraestrutura e versões
- GitHub: https://github.com/NBMAZA/Projeto — branch `main`.
- Portal: https://portal-nr17.vercel.app (Next.js 15, React 19, TypeScript, Supabase JS).
- Supabase: projeto `ovadyypeznbfwshnfiip`.
- Vercel: projeto `portal-nr17` (`prj_feEdi50IS4vlNQ7NjswI1Yj2aJwN`).
- Último deploy verificado **READY**: commit `d950081f51603f391a7e3af322107bf67c6b3e0c`, https://vercel.com/nbmaza/portal-nr17/7CkPckbnfbqxrAdWgXXU9VU8tK3j.
- Não registrar valores de chaves nem senhas no repositório público.

## Módulo 01 — Gestão de consultorias
- Tela de login com Supabase Auth e visão do administrador central.
- Formulário de cadastro de consultorias e convite por e-mail ao administrador da consultoria.
- Tabelas `public.consultorias` e `public.usuarios_consultoria` com RLS.
- Upload opcional de logotipo PNG/JPG/WebP (até 2 MB) no cadastro.
- Visualização, inclusão e substituição do logotipo de consultorias já cadastradas na listagem.
- Código principal: `app/page.tsx`, `app/api/consultorias/route.ts`.

## Módulo 02 — Clientes das consultorias
- Tabelas `public.clientes` e `public.usuarios_cliente` com políticas RLS para isolamento entre consultorias e acesso do cliente aos seus dados.
- Administrador da consultoria pode cadastrar empresas clientes e convidar administrador de cliente por e-mail.
- Campos cadastrais, operacionais e endereço; lista de clientes.
- Upload opcional de logotipo PNG/JPG/WebP (até 2 MB), inclusive inclusão/substituição em registros existentes.
- Código: `app/api/clientes/route.ts` e `app/page.tsx`.
- **Pendente:** painel específico do cliente, para consulta de documentos e relatórios AEP/AET.

## Logotipos
- Campos `logo_path` adicionados às tabelas `consultorias` e `clientes`.
- Supabase Storage: bucket privado `logos-empresas`, limite 2 MB, MIME PNG/JPEG/WebP.
- Upload autenticado e autorizado: `app/api/logos/route.ts`.
- Visualização por URL temporária respeitando leitura RLS: `app/api/logos/visualizar/route.ts`.
- Componente de listagem: `app/logo-empresa.tsx`.
- O banco guarda caminho da imagem, não os bytes.

## Confirmações e pendências
- O usuário confirmou que **o convite chegou ao administrador da consultoria**. Ainda não foi confirmado o aceite do link, definição de senha ou entrada no painel.
- **Principal pendência imediata:** atualizar o modelo de e-mail **Invite user** do Supabase para português do Brasil. O usuário informou que **não conseguiu salvar a alteração**. É preciso verificar a tela/erro no Supabase em Authentication > Email Templates > Invite user.
- Assunto proposto: `Portal NR-17 | Convite para acesso`.
- O HTML em português deve manter `{{ .ConfirmationURL }}` no href do botão de aceite.
- Essa configuração pertence ao Supabase Auth, não ao código do formulário; **não há confirmação de que tenha sido salva**.
- Testar os fluxos reais de login, convite, definição de senha, cadastro de clientes, upload e substituição de logos, visualização de logos e isolamento RLS.
- Verificar comportamento de convite em `app/page.tsx`: a tela de definição de senha depende de `invited_at` e `last_sign_in_at`; pode falhar ao aceitar convite. Corrigir e testar antes da homologação.
- Validar dígitos verificadores do CNPJ; adicionar edição de cadastros, gestão de usuários, ativação/suspensão, auditoria.
- **Não considerar o produto homologado para dados reais de clientes antes dos testes de segurança e fluxo.**

## Próximo passo ao retomar
1. Ajudar o usuário a identificar por que não conseguiu salvar o template Invite user em português, preferencialmente com captura da tela ou mensagem de erro.
2. Testar convite do administrador da consultoria, definir senha e login.
3. Testar os módulos 01/02 e os logotipos no deploy READY.
4. Prosseguir com painel do cliente e módulos de ergonomia AEP/AET.

Este documento é um checkpoint de desenvolvimento, não contém segredos ou dados pessoais.
