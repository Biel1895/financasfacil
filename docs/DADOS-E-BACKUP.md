# Persistência, identidade e backup

## Banco existente

O banco continua sendo `FinancasFacilMultiDeviceDB`, versão **4**. Esta organização do código não muda a versão, os nomes das tabelas, os identificadores das contas ou o formato dos registros.

| Tabela                | Chave        | Conteúdo                                        |
| --------------------- | ------------ | ----------------------------------------------- |
| `movimentacoes`       | `id`         | Lançamentos e estornos.                         |
| `usuarios_cache`      | `accountKey` | Identificação e verificador local de senha.     |
| `sessao_ativa`        | `key`        | Sessão e preferências.                          |
| `exclusoes_pendentes` | `id`         | Marcadores legados de exclusão.                 |
| `contas_programadas`  | `id`         | Vencimentos e vínculos de pagamento.            |
| `regras_recorrentes`  | `id`         | Compras parceladas e recorrências.              |
| `fila_sincronizacao`  | `id`         | Operações ainda não confirmadas pela nuvem.     |
| `copias_diarias`      | `id`         | Cópias locais, limitadas às sete mais recentes. |

Qualquer futura alteração de esquema precisa de migração explícita, teste com banco anterior e recuperação documentada. Não apague e recrie o banco para resolver uma atualização.

## Identidade e gravação

Novas contas recebem identidade interna própria; o identificador de login normalizado é separado. Contas antigas conservam a identidade usada pelos registros e pelo verificador de senha. Não reaplique a normalização antiga como forma de criar a identidade de novas contas.

`DB.commit` só informa sucesso quando a transação inteira conclui. O repositório grava também a fila de sincronização na mesma transação. Operações compostas, como antecipação ou parcelamento, devem continuar atômicas.

## Exportar e restaurar dados

O backup JSON atual usa `application: 'FinancasFacil'` e `schemaVersion: 3`. Inclui `transactions`, `bills` e `rules`, sem senha. A importação aceita formatos antigos compatíveis e valida antes de gravar:

- tipos, valores, datas e identificadores;
- existência e unicidade dos pagamentos vinculados;
- parcelas completas e sem repetições;
- estornos com original e limites coerentes.

Restaurar é uma mesclagem. Ao importar em outra conta, os identificadores e todas as referências são remapeados para preservar os registros da conta anterior. Antes da restauração é criada uma cópia local. Não altere esses vínculos com substituições parciais.

## Código e dados são cópias diferentes

`backups/antes-organizacao-...` preserva os arquivos do programa antes desta alteração. As cópias financeiras continuam no navegador ou no JSON exportado. Copiar a pasta do programa não transporta automaticamente o IndexedDB.

Para voltar ao código anterior, feche as abas e copie os arquivos daquela versão para a pasta original, preservando uma cópia da versão atual. Trocar a origem, o caminho local ou o navegador pode mudar o armazenamento acessível. A compatibilidade do código anterior desta entrega é testada; versões muito antigas podem não compreender estornos ou os identificadores novos.

## Nuvem e limites atuais

O build para o Vercel gera a configuração pública em `dist/config.js`. A tabela `ff_finance_records` separa os registros por identificador da conta do Supabase e usa regras de acesso por linha. O aplicativo verifica a sessão do Supabase antes de abrir os dados online e salva alterações pendentes no IndexedDB. Em cada registro, o banco compara o horário da alteração e a revisão para preservar a versão mais recente. Exclusões ficam representadas por uma revisão sem conteúdo.

O histórico local pode ser levado à conta online pela exportação e importação do JSON. O procedimento de configuração está no [guia de publicação](PUBLICAR.md).
