# FinançasFácil no GitHub e no Vercel

Use o plano Free do Supabase. Crie um projeto chamado `financasfacil` na sua conta para separar esses lançamentos dos outros projetos. O plano inclui 500 MB de banco por projeto e pode pausar após uma semana de pouca atividade. [Plano gratuito do Supabase](https://supabase.com/pricing).

## Criar o banco e o seu acesso

1. No painel do Supabase, crie o projeto e abra **SQL Editor → New query**.
2. Cole o conteúdo inteiro de [`supabase/schema.sql`](../supabase/schema.sql) e clique em **Run**. O script cria a tabela do FinançasFácil e limita leitura e gravação ao dono de cada registro. [Regras de acesso por linha](https://supabase.com/docs/guides/database/postgres/row-level-security).
3. Em **Authentication → Users**, crie seu primeiro usuário com e-mail e senha e confirme o usuário no painel. Mantenha **Email** habilitado. **Allow new users to sign up** controla se o formulário **Criar conta** aceita novos usuários. Mantenha a entrada anônima desativada. [Configuração de autenticação](https://supabase.com/docs/guides/auth/general-configuration).
4. Em **Connect** ou **Settings → API Keys**, copie a URL do projeto e a chave **Publishable**, que começa com `sb_publishable_`. Guarde senha, chave Secret e `service_role` fora do código e do GitHub. [Chaves públicas e privadas do Supabase](https://supabase.com/docs/guides/getting-started/api-keys).

## Publicar o site

1. Envie a pasta do projeto para um repositório no GitHub. Os arquivos em `src`, `scripts`, `assets`, `supabase` e `vercel.json` fazem parte do projeto. Guarde arquivos de dados pessoais fora do repositório.
2. No Vercel, selecione **Add New → Project** e importe o repositório. A configuração em `vercel.json` instala as dependências, gera o site e publica os arquivos de uso e as imagens de `dist/`. [Importar repositório no Vercel](https://vercel.com/docs/git).
3. Adicione `FF_SUPABASE_URL` e `FF_SUPABASE_PUBLISHABLE_KEY` em **Environment Variables**, com a URL e a chave do passo anterior. Aplique pelo menos ao ambiente **Production**. Clique em **Deploy**. Se já fez um deploy, publique novamente para aplicar as variáveis.
4. Abra o endereço `.vercel.app` e entre com o e-mail e a senha que você criou em **Authentication → Users**. Faça um lançamento de teste. Abra o site em outro navegador com a mesma conta e confira se ele aparece. O Vercel Hobby é gratuito para projetos pessoais. [Vercel Hobby](https://vercel.com/docs/plans/hobby).

## Primeira entrada e compartilhamento

Comece os novos lançamentos diretamente na conta online. Em um projeto Supabase novo, ela abre com o histórico vazio.

O ícone da aba e a capa de compartilhamento estão em `assets/`. A publicação usa o domínio de produção do Vercel para montar o endereço da imagem. Se as variáveis de sistema estiverem desativadas ou você quiser usar um domínio específico, defina `FF_SITE_URL` com o endereço HTTPS completo da página inicial e publique novamente. [Variáveis de sistema do Vercel](https://vercel.com/docs/environment-variables/system-environment-variables).

O site sincroniza ao entrar, ao gravar, quando a conexão volta e quando você retorna à aba. Em **Configurações**, **Tentar sincronizar** força uma atualização. Com a sessão aberta, alterações feitas sem conexão ficam na fila deste aparelho. Use o endereço publicado e a mesma conta em cada aparelho.

## Ativar cadastro, e-mails e login social

Em **Authentication → URL Configuration** do Supabase, coloque a página inicial de produção em **Site URL** e **Redirect URLs**. Use o endereço completo com HTTPS e a barra final, como `https://financasfacil.vercel.app/`. Abra os links de confirmação e recuperação no mesmo navegador em que você iniciou o pedido. [URLs de retorno do Supabase](https://supabase.com/docs/guides/auth/redirect-urls).

A página inicial apresenta os recursos e as modalidades mensal e anual previstas. **Entrar** abre `login.html`. Os retornos do Supabase continuam usando o endereço inicial e são encaminhados para a tela de acesso. Os cartões de planos são informativos.

Para cadastro pelo site, habilite **Allow new users to sign up** e mantenha **Confirm email** ligado. Para enviar confirmação e recuperação a pessoas fora da sua equipe do Supabase, configure **Custom SMTP** no painel. O remetente padrão só entrega para endereços autorizados da equipe e tem limite de envio. [Envio de e-mails pelo Supabase](https://supabase.com/docs/guides/auth/auth-smtp).

**Google**

1. No Supabase, abra o provedor **Google** em **Authentication → Sign In / Providers** e copie a URL de callback exibida.
2. No Google Cloud, configure a tela de consentimento e crie um cliente OAuth do tipo **Web application**. Em **Authorized redirect URIs**, adicione a URL de callback do Supabase. Se a tela de consentimento estiver em teste, adicione sua conta Google como usuária de teste.
3. Cole o **Client ID** e o **Client Secret** no provedor Google do Supabase e habilite-o. [Configuração do Google com Supabase](https://supabase.com/docs/guides/auth/social-sign-in/auth-google).
4. Em **Environment Variables** do Vercel, adicione `FF_AUTH_GOOGLE` com valor `true` para **Production** e faça o redeploy.

**Apple**

1. No Apple Developer, configure **Sign in with Apple** para a web com um **Services ID** associado a um **App ID** principal. Use a URL de callback fornecida no provedor Apple do Supabase como retorno. [Configuração no Apple Developer](https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web/).
2. Coloque o **Services ID** e o segredo da Apple no provedor do Supabase. O segredo do fluxo web precisa ser renovado a cada seis meses. [Configuração da Apple com Supabase](https://supabase.com/docs/guides/auth/social-sign-in/auth-apple).
3. Em **Environment Variables** do Vercel, adicione `FF_AUTH_APPLE` com valor `true` para **Production** e faça o redeploy.

As variáveis do Vercel mostram os botões. As credenciais dos provedores ficam no Supabase. Para acessar seu histórico com um provedor social, use o mesmo e-mail confirmado da conta existente. O recurso **Ocultar Meu E-mail** da Apple pode usar outro endereço e abrir uma conta separada. [Vinculação de contas](https://supabase.com/docs/guides/auth/auth-identity-linking).
