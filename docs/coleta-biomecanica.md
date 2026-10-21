# Módulo — Coleta Biomecânica (proposta técnica)
Status: em desenvolvimento; não publicar em produção sem homologação.

## Escopo
Vincular avaliação a um posto de trabalho ou estação de trabalho já cadastrado, respeitando a hierarquia cliente → planta → instalação → posto → estação. Uma avaliação registra data, responsável, situação (rascunho/concluída), observações gerais, comentário técnico geral e plano de ação geral. Permitir histórico de reavaliações.

## Fatores (17) — documento fornecido
1. Postura predominante
2. Levantamento e transporte manual de cargas
3. Posturas incômodas ou pouco confortáveis por longos períodos
4. Trabalho com esforço físico intenso
5. Frequente ação de puxar e empurrar cargas
6. Uso frequente de escadas
7. Frequente execução de movimentos repetitivos
8. Manuseio de ferramentas e/ou objetos pesados por períodos prolongados / pega pobre
9. Compressão de partes do corpo por superfícies rígidas ou com quinas
10. Exigência de flexões de coluna vertebral frequentes
11. Elevações frequentes de membros superiores
12. Exposição a vibração de corpo inteiro por tempo prolongado
13. Exposição a vibração localizada por tempo prolongado
14. Uso frequente de pedais
15. Uso frequente de alavancas
16. Exigência de uso frequente de força, pressão, preensão, flexão, extensão ou torção dos segmentos corporais
17. Trabalho intensivo com teclado e outros dispositivos de entrada de dados

## UX
Interface compacta, agrupada por posturas, esforços/cargas, movimentos, contato/vibração e entrada de dados. Resposta por fator: pendente, sim, não, não se aplica. Descrição técnica sugerida, porém editável; textos do documento são exemplos de condições observadas, não constatações universais. Nunca inferir automaticamente risco ou conformidade apenas da seleção. Campos opcionais por fator: observações, comentário técnico, plano de ação. Campos gerais equivalentes aos da Avaliação do Mobiliário. Postura predominante pode ter percentuais em pé/sentado e pausas, sem presumir distribuição fixa. Evitar referência normativa automática não verificada.

## Persistência planejada
- criterios_biomecanicos: id, codigo, grupo, ordem, titulo, texto_sugerido, ativo, versao
- avaliacoes_biomecanicas: id, cliente_id, nivel ('posto'|'estacao'), estrutura_id, titulo, status, responsavel_id, data_avaliacao, observacoes_gerais, comentario_tecnico_geral, plano_acao_geral, created_at, updated_at
- avaliacoes_biomecanicas_respostas: id, avaliacao_id, criterio_id, situacao, descricao_editada, observacoes, comentario_tecnico, plano_acao, dados_complementares, updated_at

Antes de migrar: definir chaves estrangeiras, restrições de vínculo, índices, políticas RLS isoladas por consultoria e privilégios mínimos. Não executar DDL sem revisão. Reutilizar padrões existentes da avaliação do mobiliário.
