# 🚀 Guia de Implantação do Supabase para o ConeQta

Toda a infraestrutura de banco de dados, autenticação, tabelas, políticas de segurança (RLS) e dados de Queimados foram programados e preparados para o seu projeto Supabase.

---

## 📋 Passo a Passo para Ativação (2 Minutos)

### 1. Criar o Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) e faça login.
2. Clique em **"New Project"**.
3. Escolha o nome (ex: `coneqta-queimados`), defina uma senha segura para o banco e selecione a região mais próxima (**South America (São Paulo) - sa-east-1**).

---

### 2. Rodar o Script SQL Completo
1. No menu lateral esquerdo do painel do Supabase, clique em **"SQL Editor"** (ícone `>_`).
2. Clique em **"New Query"**.
3. Abra o arquivo `supabase/schema.sql` gerado neste projeto, copie todo o seu conteúdo e cole no editor do Supabase.
4. Clique no botão verde **"Run"** (ou aperte `Ctrl + Enter` / `Cmd + Enter`).

Pronto! Todas as tabelas, tipos ENUM, triggers de recálculo de nota, índices de performance, políticas de segurança (RLS) e dados reais de Queimados (Vivian e Leonardo) serão criados instantaneamente.

---

### 3. Obter as Chaves de Conexão
1. No painel do Supabase, vá em **Project Settings** (ícone de engrenagem) > **API**.
2. Copie:
   - **Project URL** (ex: `https://xyzcompany.supabase.co`)
   - **Project API Keys** > `anon` / `public` (chave pública para o app)

---

### 4. Conectar ao Aplicativo
Defina as variáveis no seu ambiente ou arquivo `.env`:

```env
VITE_SUPABASE_URL="https://seu-projeto-id.supabase.co"
VITE_SUPABASE_ANON_KEY="sua-chave-anon-publica"
```

Assim que essas duas variáveis forem preenchidas, o aplicativo ativa automaticamente a sincronização em tempo real com o seu Supabase! Caso as variáveis ainda não estejam preenchidas, o app opera com fallback local seguro sem nunca travar ou emitir erros em tela.

---

## 🗄️ Estrutura das Tabelas Criadas

| Tabela | Descrição | Segurança / RLS |
| :--- | :--- | :--- |
| `profiles` | Perfis de usuários vinculados ao `auth.users` | Cada usuário gerencia seus dados |
| `producers` | Empreendedores e produtores de Queimados | Leitura pública; edição pelo dono |
| `products` | Produtos reais (hortaliças, quitutes, artesanais) | Leitura pública; edição pelo produtor |
| `orders` | Pedidos, itens, forma de entrega e pagamento | Visível apenas pelo cliente e produtor |
| `reviews` | Avaliações verificadas com recálculo automático | Leitura pública; criação autenticada |
| `stories` | Vídeos curtos com expiração de 24 horas | Leitura pública; likes e comentários |
| `story_comments` | Comentários da comunidade nos stories | Leitura pública; criação autenticada |
| `chat_messages` | Mensagens diretas entre clientes e produtores | Privado entre os participantes |
| `seals` | Selo Verde Queimados, Comércio Familiar, etc. | Leitura pública |
| `categories` | Categorias temáticas da plataforma | Leitura pública |
