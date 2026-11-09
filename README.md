# FinançasFácil IA

Controle financeiro pessoal em JavaScript, HTML e CSS. Inclui lançamentos por texto, voz ou formulário, parcelas, recorrências, estornos, previsão e relatórios.

## Usar o sistema

Abra `index.html` para ver a página inicial e clique em **Entrar**. Para ir direto ao acesso, abra `login.html`. Mantenha os arquivos gerados, `config.js` e a pasta `assets/` juntos. O uso normal dispensa Node.js. Consulte [LEIA-ME.md](LEIA-ME.md).

Mantenha a pasta original, o navegador e a conta para continuar usando os dados existentes. Uma cópia do código não contém os registros financeiros guardados pelo navegador; exporte também o backup JSON pelo sistema.

## Desenvolver

Requisito: **Node.js 24.15 ou superior**, com npm. Os comandos funcionam no PowerShell e em outros terminais, a partir desta pasta.

```sh
npm ci
npm run build
npm run check
```

Na primeira execução dos testes de navegador:

```sh
npm run test:install
npm run verify
```

`npm ci` instala as versões registradas em `package-lock.json`. Os testes de navegador usam uma cópia isolada da aplicação e contas fictícias; não abrem o histórico pessoal do usuário.

## Comandos

| Comando                | Finalidade                                                         |
| ---------------------- | ------------------------------------------------------------------ |
| `npm run format`       | Formatar fontes, testes e documentos.                              |
| `npm run format:check` | Conferir a formatação sem alterar arquivos.                        |
| `npm run lint`         | Apontar problemas e padrões inconsistentes em JavaScript.          |
| `npm test`             | Testar regras financeiras, interpretação e limites de arquitetura. |
| `npm run build`        | Gerar as duas páginas, seus scripts e estilos.                     |
| `npm run build:check`  | Verificar se os arquivos gerados correspondem às fontes atuais.    |
| `npm run check`        | Formatação, análise, testes unitários e conferência da geração.    |
| `npm run test:e2e`     | Executar os fluxos completos no Chromium.                          |
| `npm run verify`       | Executar todas as verificações anteriores.                         |

Para um fluxo específico: `npm run test:e2e -- balances`.
Outras opções: `startup`, `core`, `reports-installments`, `management` e `cloud`.

## Onde alterar

```text
src/
  html/            Estrutura principal, telas, navegação e diálogos.
  css/             Estilos separados por área da interface.
  js/
    domain/          Cálculos, datas, validação de registros e interpretação de texto.
    state/           Estado da sessão e seleção do período.
    infrastructure/ IndexedDB, credenciais, eventos internos e limites de espera.
    data/            Gravações atômicas, fila de alterações e cópias locais.
    services/        Autenticação e sincronização opcionais com Supabase.
    application/     Login, edição, importação e operações financeiras.
    ui/              Telas, diálogos, relatórios e reconhecimento de voz.
    testing/         Adaptador ativado pelos testes de navegador.
    main.js          Inicialização e ligação dos componentes.
scripts/           Geração e execução das suítes de navegador.
tests/unit/        Testes independentes de navegador.
tests/e2e/         Cenários de uso e preparação das cópias isoladas.
tests/fixtures/    Versão anterior usada no teste de compatibilidade.
docs/              Arquitetura, regras financeiras e persistência.
assets/            Ícone da aba, ícone do iPhone e capa de compartilhamento.
backups/           Cópias de versões anteriores do código.
```

**Edite `src/` e `config.js`.** A página pública está em `src/html/index.html` e usa `src/css/landing.css`. Os cartões mensal e anual estão nessa página.

`src/html/login.html` reúne a tela de acesso e o painel financeiro. As telas ficam em `src/html/screens/`, os diálogos em `src/html/dialogs/` e a navegação em `src/html/layout/`. A geração produz os dois HTMLs completos para abertura direta no navegador.

## Antes de alterar regras

Leia [Arquitetura](docs/ARQUITETURA.md), [Regras financeiras](docs/REGRAS-FINANCEIRAS.md), [Dados e backup](docs/DADOS-E-BACKUP.md) e [Contribuição](CONTRIBUTING.md).

Para usar em vários aparelhos, siga o [guia de publicação no Vercel com Supabase](docs/PUBLICAR.md). O arquivo `config.js` da raiz ativa o modo local por padrão. Os testes de sincronização usam um serviço simulado. Consulte [VALIDACAO.md](VALIDACAO.md) para o escopo da validação.
