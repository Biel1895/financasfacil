# Arquitetura e manutenção

## Fluxo de uma alteração

1. A interface recebe texto, áudio ou campos de formulário.
2. `application/` prepara a operação e solicita confirmação quando necessário.
3. `domain/` interpreta os valores, monta vencimentos e valida os vínculos.
4. `data/repository.js` serializa a gravação e atualiza os registros e a fila de sincronização numa única transação.
5. `src/js/main.js` conecta os eventos de gravação à atualização das telas, cópia local e sincronização opcional.

## Limites entre áreas

- `domain/` recebe os dados por parâmetro. Não acessa tela, conta aberta, IndexedDB ou variáveis globais. O período dos interpretadores é explícito; quando omitido, usa o período atual.
- `state/` mantém o estado compartilhado da aplicação. O armazenamento persistente continua no IndexedDB. A geração da sessão identifica trocas de conta durante tarefas assíncronas.
- `infrastructure/` implementa acesso ao navegador. O banco publica avisos sem importar componentes de interface.
- `data/` aplica as gravações e administra cópias. Publica eventos, sem decidir qual tela deve aparecer.
- `application/` coordena casos de uso. Os pequenos adaptadores de registros fornecem a conta aberta aos normalizadores do domínio.
- `services/cloud.js` usa o repositório e a fila persistente para sincronizar entidades. Não substitui a gravação local.
- `ui/` produz a interface e lida com elementos do documento. Algumas ações abrem diálogos e renderizam novamente as telas; mantenha esse acoplamento fora de `domain/`, `data/` e `infrastructure/`.

Os testes em `architecture.test.js` verificam automaticamente os limites das três primeiras áreas. Eles não substituem uma revisão das dependências de cada nova funcionalidade.

## Eventos de integração

| Evento            | Origem                      | Reação definida em `main.js`       |
| ----------------- | --------------------------- | ---------------------------------- |
| `notice`          | Armazenamento e repositório | Exibir aviso.                      |
| `save:state`      | Repositório                 | Atualizar estado de gravação.      |
| `data:changed`    | Repositório                 | Renderizar dados atualizados.      |
| `backups:changed` | Cópias locais               | Atualizar configurações.           |
| `backup:request`  | Gravação concluída          | Tentar criar cópia diária.         |
| `sync:request`    | Gravação concluída          | Agendar envio à nuvem configurada. |

Os ouvintes são internos e síncronos. Tarefas em segundo plano tratam suas próprias rejeições. Não use eventos para esconder a dependência de uma validação obrigatória: valide antes da gravação.

## Interface e estilos

O HTML de desenvolvimento é modular. `src/html/index.html` contém a estrutura geral e diretivas como `<!-- @include screens/home.html -->`. As telas ficam em `screens/`, os formulários e diálogos em `dialogs/` e as partes de navegação em `layout/`. Os caminhos das diretivas são relativos a `src/html/`.

`scripts/html.mjs` reúne os fragmentos durante a geração. Arquivos ausentes, caminhos externos e inclusões circulares interrompem a operação. O navegador recebe um `index.html` completo, sem precisar carregar fragmentos com `fetch`, preservando a abertura local e a ordem de inicialização dos elementos.

Dividir HTML facilita a manutenção; não cria uma barreira de segurança. Código de interface continua acessível no navegador. Proteção de dados, autorização na nuvem, validação e tratamento de conteúdo devem ser avaliados separadamente.

O ponto de entrada dos estilos é `src/css/main.css`. A ordem dos imports segue de base e estrutura até os estilos das telas e adaptações. Ao mover regras, considere a ordem e a especificidade dos seletores, inclusive em telas pequenas.

Os nomes do código são majoritariamente em inglês; textos para o usuário são em português. Use nomes descritivos para ações e valores financeiros. Comentários explicam regras e decisões, sem repetir cada instrução. Os contratos de transações, contas e regras estão em `domain/types.js`.

## Geração e uso local

O esbuild reúne os módulos ES em um script clássico, carregado pelo `index.html`. Isso mantém o uso por abertura direta do arquivo. O CSS também é reunido durante a geração. O processo não modifica o IndexedDB e não incorpora `config.js` ao pacote JavaScript.

Não reconstrua `app.js` concatenando textos ou substituindo trechos de código. A adaptação do microfone já está no arquivo mantido `ui/voice.js`.

## Acesso de testes

No uso normal não são criados `window.FF_STATE`, `window.FF_LocalDB` e os demais acessos antigos. O suporte dos testes define `__FF_ENABLE_TEST_API__` antes de carregar a página e ativa um adaptador explícito. Nenhum componente da aplicação depende dele. Essa chave é uma ferramenta de teste, não uma barreira de segurança.
