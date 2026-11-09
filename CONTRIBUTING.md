# Como fazer alterações

1. Leia `README.md` e o documento da área afetada em `docs/`.
2. Crie uma alteração pequena, com propósito claro. Edite as fontes em `src/`, incluindo as telas em `src/html/`; não corrija diretamente `index.html`, `app.js` ou `style.css`, que são gerados.
3. Preserve nomes de tabelas, IDs, datas financeiras e vínculos. Se mudar uma regra, atualize a documentação e os cenários que demonstram o comportamento esperado.
4. Execute `npm run format`, `npm run build` e `npm run verify`.
5. Confira os fluxos afetados em tela larga e celular. Para mudanças visuais, verifique também tema escuro, teclado e privacidade.
6. Entregue fontes, arquivos gerados, documentação e testes correspondentes juntos.

## Convenções

- Use `const` quando o valor não é reatribuído, `let` nos demais casos e chaves nos blocos de controle.
- Use nomes descritivos em inglês no código e português nas mensagens para o usuário.
- Coloque cálculos e validações independentes de tela em `domain/`. Forneça conta, período e listas explicitamente quando fizerem parte da regra.
- Trate rejeições assíncronas. Não anuncie sucesso antes de a transação terminar.
- Escape textos inseridos em HTML e proteja células exportadas para CSV.
- Explique decisões financeiras e limitações em comentários. Evite comentários que apenas descrevem uma instrução evidente.
- Não acrescente dependências de execução só para resolver organização. As ferramentas atuais são dependências de desenvolvimento.

Prettier e ESLint definem o padrão verificável deste projeto. Ajustes dessas configurações precisam de motivo claro e aplicação consistente.

## Versionamento

O projeto está preparado para Git com `.gitignore` e `.gitattributes`. Se ainda não houver um repositório, o responsável pode iniciá-lo com `git init` e registrar a base. Não publique dados financeiros, cópias pessoais, `node_modules/` ou resultados de testes. `package-lock.json`, fontes, testes e arquivos gerados devem acompanhar o código.

As cópias de código em `backups/` ficam fora do versionamento. O histórico Git complementa essas cópias, mas nenhum dos dois substitui o backup financeiro exportado.

## Testes

Os testes unitários usam o executor nativo do Node. Os testes de navegador usam Playwright/Chromium e montam seus arquivos em `test-results/e2e/<suite>/site/`. Cada contexto de navegador começa isolado, com dados fictícios. Capturas e resultados ficam nessa pasta ignorada pelo Git.

As suítes `core` e `reports-installments` simulam eventos de reconhecimento de voz. A suíte `cloud` intercepta os módulos do Firebase e suas chamadas com dados em memória. Testes reais de microfone, credenciais e regras de acesso devem ser descritos separadamente quando realizados.

Em Linux, o Chromium pode precisar de bibliotecas do sistema. A instalação oficial é `npx playwright install --with-deps chromium --only-shell`, quando o responsável pelo ambiente permitir instalar essas bibliotecas.
