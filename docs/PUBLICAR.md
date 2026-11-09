# FinançasFácil no GitHub e no Vercel

Use o plano Free do Supabase. Crie um projeto chamado `financasfacil` na sua conta para separar esses lançamentos dos outros projetos. O plano inclui 500 MB de banco por projeto e pode pausar após uma semana de pouca atividade. [Plano gratuito do Supabase](https://supabase.com/pricing).

## Criar o banco e o seu acesso

1. No painel do Supabase, crie o projeto e abra **SQL Editor → New query**.
2. Cole o conteúdo inteiro de [`supabase/schema.sql`](../supabase/schema.sql) e clique em **Run**. O script cria a tabela do FinançasFácil e limita leitura e gravação ao dono de cada registro. [Regras de acesso por linha](https://supabase.com/docs/guides/database/postgres/row-level-security).
3. Em **Authentication → Users**, crie um usuário com seu e-mail e uma senha forte. Confirme o usuário no painel. Em **Authentication → Sign In / Providers**, mantenha e-mail habilitado e desative **Allow new users to sign up** para restringir o acesso aos usuários que você cadastrar. Mantenha a entrada anônima desativada. [Configuração de autenticação](https://supabase.com/docs/guides/auth/general-configuration).
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
