# Verificação da atualização

As verificações foram executadas em navegador Chromium isolado, com contas e dados de teste. Os fontes e os testes acompanham o projeto. Dependências instaladas, navegador de teste, contas fictícias e capturas intermediárias não entram no pacote entregue.

## Reproduzir

Com Node.js 24.15 ou superior, execute `npm ci`, `npm run test:install` e `npm run verify`. Os resultados do navegador ficam em `test-results/`, ignorados pelo Git. Nenhum teste acessa os dados pessoais do navegador de uso diário.

A verificação inclui Prettier, ESLint, 21 testes unitários e de arquitetura, conferência dos arquivos gerados e seis suítes de navegador. Estas suítes cobrem abertura normal sem globais de teste, migração e uso geral, relatórios/parcelas, gerenciamento, saldos e sincronização simulada.

O teste da nuvem usa contas fictícias e um adaptador Supabase simulado. A conexão com o projeto real é conferida após configurar e publicar o site.

## Fluxos conferidos

- Migração do banco da versão anterior, preservando conta, hash da senha, sessão e lançamentos.
- Prévia por texto e fala simulada; edição e confirmação explícita antes de salvar.
- Valores brasileiros com vírgula e separador de milhar.
- Mensalidades no fim do mês e parcelamento com soma exata dos centavos.
- Pagamento vinculado ao extrato, edição, filtros, busca e exclusão com desfazer.
- Persistência após recarregar, cancelamento de ocorrência e encerramento de recorrência.
- Geração de backup JSON, validação e restauração por mesclagem.
- Relatórios de seis meses, tabela acessível e privacidade dos valores.
- Layouts de computador e celular, incluindo 320 px; temas claro e escuro.
- Abertura direta do HTML, sem exigir um servidor local.
- Composição do HTML em arquivos separados por tela, navegação e diálogo, preservando a marcação existente; detecção de fragmentos ausentes, caminhos externos e inclusões circulares durante a geração.
- Uso normal com criação de conta, lançamento e reabertura sem expor os antigos globais internos.
- Seleção de mês sem deslocar o gráfico, navegação repetida de períodos nos dois sentidos, retorno ao mês atual e controle por teclado.
- Relatórios de 6/12 meses, totais do período e exportação CSV do intervalo exibido, inclusive em telas de 320 px.
- Reconhecimento da frase “comprei um PS5 por 2800 em 5x”, quantidade por extenso, valor de parcela, modelos com números e centavos.
- Parcelamento no campo geral com prévia editável, cartão opcional, primeira parcela paga, vencimentos no fim do mês e persistência após reabrir.
- Rejeição de quantidade inválida e total inconsistente; falha ao salvar sem parcelas parciais nem perda da prévia.
- Saldo total acumulado até hoje e saldo do mês selecionado exibidos separadamente; navegação mensal preservando o total atual, com previsão independente por mês.
- Pagamentos retroativos, edição direta de contas pagas, antecipação com desconto e datas de pagamento separadas do vencimento.
- Estorno parcial e total, edição de estorno, cancelamento de pendências com preservação do histórico e efeitos corretos em receitas/despesas.
- Identificadores únicos para novas contas, compatibilidade com contas antigas e nomes com acentos sem colisão com sublinhados.
- Restauração rejeitando referências inválidas e estornos excessivos; importação entre contas remapeando pagamentos e estornos sem sobrescrever a origem.
- Login por e-mail, isolamento de contas, persistência da sessão escolhida e fila de sincronização com exclusões entre navegadores em um Supabase simulado.

## Limites desta verificação

Os eventos da fala foram simulados. O conteúdo do arquivo de backup foi conferido diretamente no arquivo gerado pelo navegador.
