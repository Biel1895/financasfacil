# FinançasFácil — versão atualizada

Abra `index.html` e clique em **Entrar** para acessar sua conta. Você também pode abrir `login.html` diretamente. Mantenha os arquivos do projeto juntos e use o mesmo navegador e a mesma conta para acessar seus lançamentos.

## O que mudou

- **Início:** resumo do mês, próximos vencimentos e últimos lançamentos.
- **Lançamentos:** extrato agrupado por dia, busca, filtros, edição e exclusão com opção de desfazer.
- **Contas:** vencimentos avulsos, contas mensais e compras parceladas; filtros de contas a vencer, atrasadas e pagas/recebidas.
- **Relatórios:** comparação com o mês anterior, períodos de 6 ou 12 meses, totais do período, exportação CSV, tabela acessível e distribuição por categoria.
- Interface adaptada ao celular, navegação inferior, botão de novo lançamento, tema automático/claro/escuro e opção de ocultar valores.

Na tela **Início**, o cartão **Saldo total hoje** soma os lançamentos confirmados de todos os meses até a data atual. O quadro **Saldo do mês**, logo abaixo, mostra somente o resultado do mês selecionado. Trocar o mês atualiza o resumo mensal, sem alterar o saldo total de hoje.

Os dois valores consideram estornos e a preferência de descontar ou separar os aportes. Contas pendentes, parcelas ainda não pagas e lançamentos com data futura não entram no saldo total de hoje. O valor é calculado a partir do histórico registrado no sistema, sem consulta a saldo bancário. A previsão continua apresentando o resultado de cada mês separadamente.

## Pagamentos em outro mês e edição

Ao clicar em **Pagar** ou **Recebi**, escolha a data em que o dinheiro realmente saiu ou entrou. O vencimento original fica preservado. O resumo e o filtro **Pagas / recebidas** usam a data efetiva do pagamento, inclusive quando o vencimento pertence a outro mês.

Você pode editar lançamentos comuns, pagamentos, estornos e contas pendentes, pagas ou canceladas. Toque no registro e ajuste os campos. Uma conta paga permite corrigir separadamente seu vencimento, a data da movimentação e o valor efetivamente pago. Alterações em pagamentos mantêm os vínculos com a conta correspondente.

## Estornar, cancelar ou antecipar

- **Estornar:** abra um lançamento e escolha **Estornar lançamento**. Informe o valor devolvido e a data. O original fica no histórico e o estorno fica vinculado a ele. A devolução reduz a movimentação original; um reembolso de despesa não é contado como um novo salário ou outra receita. Estornos parciais e a edição de estornos são permitidos, respeitando o valor original.
- **Cancelar uma compra:** em **Contas → Compras e recorrências → Gerenciar**, escolha **Cancelar compra / programação**. As parcelas pendentes são canceladas e o histórico pago permanece. Marque a opção de estornar pagamentos somente se o dinheiro já foi devolvido; ela começa desmarcada.
- **Antecipar:** abra **Gerenciar → Antecipar parcelas**, escolha quais parcelas deseja quitar, informe a data e eventual desconto total. O desconto é distribuído em centavos, mantendo o total exato. As parcelas saem da previsão de pendências futuras, e o pagamento aparece no mês informado.
- **Editar a compra:** antes de haver pagamentos ou cancelamentos, é possível recalcular total, quantidade e primeiro vencimento. Depois disso, valores e datas podem ser ajustados individualmente, preservando o histórico já registrado. Descrição e categoria continuam editáveis para a compra inteira.

Lançamentos com estornos não podem ser reduzidos abaixo do valor já devolvido. A data do estorno não pode ser anterior ao original. Essas validações evitam que a edição deixe o histórico inconsistente.

## Previsão dos próximos meses

Em **Contas**, a previsão de 6 ou 12 meses combina as movimentações registradas e os vencimentos ainda pendentes. Cada mês mostra entradas, saídas, aportes, valores ainda a pagar e seu próprio resultado. Contas canceladas ou já antecipadas não são somadas como compromissos futuros.

A previsão não carrega saldo anterior, não adivinha salário e não estima gastos que você ainda não registrou ou programou. Pendências vencidas são sinalizadas separadamente; não são transferidas automaticamente para um novo mês.

## Texto e áudio

Escolha **Novo lançamento → Digitar** e escreva ou use o botão **Usar microfone** na mesma tela. Para preencher os campos manualmente, escolha **Preencher**. Texto e áudio geram uma prévia: confira descrição, valor, data, tipo e categoria e clique em **Confirmar**. Nada é registrado antes dessa confirmação. Para falar, autorize o microfone quando o navegador solicitar; o reconhecimento depende do suporte e das permissões do navegador e pode exigir internet.

A categoria **Lazer & Viagens** também reconhece os registros e backups antigos que usavam o nome **Lazer & Restaurantes**.

## Relatórios e navegação por mês

No gráfico **Como seu dinheiro se movimenta**, tocar em um mês seleciona os detalhes desse mês sem mover o período exibido. Assim, os meses seguintes continuam disponíveis. As setas junto ao intervalo avançam ou voltam um período inteiro; o seletor alterna entre 6 e 12 meses. **Mês atual** retorna ao período atual sem precisar recarregar a página. As setas do seletor geral continuam avançando ou voltando mês a mês.

Acima do gráfico aparecem os totais de receitas, despesas, investimentos e saldo do período. Abaixo, o resumo do mês selecionado e uma tabela com os valores. **Exportar período** gera um CSV somente dos meses exibidos. No celular, o gráfico de 12 meses pode ser deslizado na horizontal sem deslocar o restante da página.

## Compra parcelada por texto ou áudio

No campo geral de **Novo lançamento → Digitar**, escreva ou fale, por exemplo:

- “Comprei um PS5 por 2800 em 5x”.
- “Comprei um notebook por 5.999,99 em 10 parcelas”.
- “Comprei uma cadeira em 5x de 560”.

O sistema apresenta uma prévia da compra parcelada, e não uma despesa única com o total. Confira ou altere descrição, total, quantidade de parcelas, primeiro vencimento, categoria e cartão opcional. Abra **Conferir as parcelas** para ver a divisão e os vencimentos. O número do modelo do produto, como PS5 ou TV 55, não é tratado como valor quando o total está indicado com “por”.

Depois de confirmar, as parcelas aparecem em **Contas**. Por padrão, ficam pendentes e o total não é descontado do saldo. Se a primeira já foi paga, marque essa opção na prévia: somente o valor dessa primeira parcela será lançado. Também é possível misturar uma compra parcelada e um gasto comum na mesma mensagem, separando-os por ponto e vírgula. Nada é salvo antes da confirmação.

## Mensalidades e parcelas

Em **Contas → Agendar conta**, escolha **Todo mês** ou **Compra parcelada**. Em parcelamentos, informe o **valor total da compra**. Os centavos são distribuídos para que a soma das parcelas corresponda exatamente ao total. O limite é de 120 parcelas.

Mensalidades são preparadas com antecedência de pelo menos 12 meses e a agenda se estende ao navegar pelos meses. Um vencimento no dia 31 é ajustado ao último dia dos meses mais curtos; os meses seguintes voltam ao dia original. O sistema precisa estar aberto para gerar novas ocorrências; não envia notificações fora do navegador.

Uma conta pendente não altera o saldo. Ao confirmar **Pagar** ou **Recebi**, o sistema cria o lançamento na data do pagamento/recebimento. É possível editar uma ocorrência, remover somente uma parcela ou encerrar os próximos vencimentos sem excluir o histórico pago.

## Backup e recuperação dos dados

Abra **Dados e preferências → Exportar backup**. O JSON inclui lançamentos, contas e recorrências; não inclui senhas ou a sessão da conta. **Restaurar backup** faz a validação antes de gravar e mescla o arquivo com a conta atual. IDs iguais são atualizados; os demais registros são mantidos. Uma cópia local é feita antes da restauração.

A versão atual do backup é 3 e inclui os vínculos de pagamentos, antecipações e estornos. Os formatos antigos continuam aceitos quando consistentes. A restauração rejeita, antes de alterar os registros, pagamentos sem lançamento correspondente, estornos sem original ou acima do valor original, parcelas faltantes/repetidas e referências inválidas. Ao importar em outra conta, os identificadores e vínculos são adaptados para preservar os dados da conta de origem.

As contas novas recebem identificadores internos únicos. Nomes como “joão” e “jo_o” não apontam mais automaticamente para a mesma conta. Contas antigas mantêm seu identificador, sua senha e seus lançamentos.

Até sete cópias locais são mantidas, uma no primeiro uso com dados de cada dia, além das cópias anteriores às restaurações. Elas podem ser baixadas no mesmo painel. Essas cópias ficam no navegador: para se proteger contra limpeza do navegador ou perda do aparelho, exporte um arquivo para outro local.

O extrato CSV pode ser aberto em uma planilha. Os backups só são gerados/exportados enquanto o sistema está aberto.

## Salvamento e nuvem

Os dados são gravados no aparelho antes de aparecer a confirmação. O indicador distingue salvamento, modo local, alterações aguardando envio e sincronização concluída. Quando a nuvem está ativa, as alterações são colocadas numa fila persistente e reenviadas após a reconexão; exclusões também são propagadas.

O arquivo `config.js` da raiz ativa o **modo local** por padrão. Para sincronizar entre aparelhos, siga o [guia de publicação no Vercel com Supabase](docs/PUBLICAR.md).

## Voltar à versão anterior do sistema

O backup dos arquivos anteriores está na pasta `backups/versao-antes-melhorias-20261104` do projeto original. Os três arquivos anteriores foram preservados antes das alterações.

Nessa pasta, abra **ABRIR-VERSAO-ANTERIOR.html** para executar a interface anterior com compatibilidade para o banco atualizado. Consulte `COMO-RESTAURAR.txt` antes de substituir arquivos. O backup do código e o backup dos seus lançamentos são coisas separadas; exporte seus dados antes de trocar de versão.

Versões anteriores não compreendem todos os novos vínculos de estornos nem a identificação das contas novas. Para dados que já usam esses recursos, utilize esta versão atual. As cópias dos arquivos preservam o código anterior; não são cópias dos lançamentos do navegador.
