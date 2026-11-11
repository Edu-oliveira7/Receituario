# Receituário — Livro de Receitas Colaborativo

Caderno de receitas colaborativo desenvolvido para uma turma de estudantes de gastronomia, seguindo rigorosamente o design system **Caderno Coletivo** (`design.md`) e os layouts de interface anexados.

---

## 🚀 Arquitetura Atual: 100% Supabase (Sem Servidor Separado)

O projeto está configurado para utilizar o **Supabase** como backend completo e banco de dados:
- **Autenticação**: Supabase Auth (sessões JWT automáticas).
- **Banco de Dados**: PostgreSQL gerenciado na nuvem.
- **Segurança**: Row Level Security (RLS) no próprio PostgreSQL.
- **Deploy do Front-end**: Pode ser hospedado gratuitamente na **Vercel**, **Cloudflare Pages** ou **Netlify** com zero custo de servidor.

*(Opcionalmente, o repositório ainda preserva a pasta `/backend` com a API Django REST Framework caso alguém prefira a stack legada com Python).*

---

## 1. Como colocar no ar em 2 minutos (Deploy com Supabase)

### Passo 1: Preparar o Supabase
1. Crie uma conta gratuita em [supabase.com](https://supabase.com) e crie um projeto.
2. Acesse o **SQL Editor** no painel do Supabase.
3. Copie todo o conteúdo do arquivo `supabase/schema.sql` deste repositório, cole no editor e clique em **Run**.
   - Isso criará as tabelas, as políticas de segurança RLS, as 6 categorias oficiais (*Doces, Massas, Carnes, Lanches, Saladas, Bebidas*) e o gatilho automático que transforma o primeiro usuário cadastrado em Administrador (`is_staff = true`).

### Passo 2: Deploy Gratuito do Front-end (Vercel)
1. Suba o código para o seu repositório no GitHub.
2. Acesse [vercel.com](https://vercel.com), faça login com GitHub e clique em **Add New Project**.
3. Selecione o repositório do Receituário e defina `frontend` como **Root Directory**.
4. Na seção **Environment Variables**, adicione as duas chaves que você encontra em **Project Settings -> API** no Supabase:
   - `VITE_SUPABASE_URL`: sua URL do projeto (ex: `https://xyzcompany.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY`: sua chave pública `anon` (nunca use a `service_role` no front-end)
5. Clique em **Deploy**! Em 1 minuto seu site estará online com HTTPS gratuito (ex: `receituario.vercel.app`).

### Passo 3: Criar o Primeiro Usuário (Administrador)
1. Acesse o site publicado no navegador.
2. Clique em **Entrar na Cozinha** > **Criar conta**.
3. Cadastre a sua conta: o banco concede privilégios de **Administrador da Turma** apenas ao primeiro perfil criado.
4. Se a confirmação de e-mail estiver habilitada no Supabase, confirme o endereço e entre na conta antes de continuar.
5. Os próximos cadastros serão de alunos regulares.

## Segurança da API Django legada

Os controles abaixo se referem à API Django opcional, não ao deploy Vercel/Supabase descrito acima.

1. **Autoria Inviolável**: No endpoint `POST /api/recipes/`, qualquer campo `author`, `author_id` ou `user_id` enviado pelo cliente é explicitamente ignorado. O autor é sempre injetado via `request.user`.
2. **Permissão de Objeto (`IsOwnerOrAdmin`)**:
   - Um aluno comum só pode editar (`PUT`/`PATCH`) ou excluir (`DELETE`) as receitas cujo `author == request.user`.
   - Tentativas de alterar receitas de outros alunos resultam imediatamente em `403 Forbidden`.
   - O administrador da turma (`is_staff=True`) possui acesso total para moderar, editar, ocultar ou excluir.
3. **Rotas Administrativas Protegidas**:
   - `/api/admin/overview/`, `/api/admin/recipes/` e `/api/admin/users/` exigem privilégios de staff; qualquer aluno comum recebe `403 Forbidden`.
4. **Proteção de Credenciais**:
   - Autenticação via JWT guardado em cookies `httpOnly` (`SameSite=Lax`, `Secure` em produção).
   - Senhas passam por validação de tamanho mínimo (8 caracteres).
   - Throttling (rate limiting) ativo nos endpoints de login e cadastro para prevenir ataques de força bruta.

---

## 3. Configuração do Banco de Dados (Supabase ou MySQL)

### Opção 1: Supabase (PostgreSQL Cloud Gratuito — Recomendado)
1. Crie uma conta gratuita em [supabase.com](https://supabase.com) e crie um novo projeto.
2. Acesse o **SQL Editor** no painel do Supabase.
3. Copie e cole o conteúdo do arquivo `supabase/schema.sql` e clique em **RUN**.
   - Isso criará as tabelas `categories`, `recipes`, `recipe_ingredients`, `recipe_steps`, `profiles` e as políticas de segurança RLS (Row Level Security).
4. No menu **Project Settings -> Database -> Connection string -> URI**, copie a string PostgreSQL:
   ```env
   DATABASE_URL="postgresql://postgres.seu-projeto:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"
   ```
5. No menu **Project Settings -> API**, copie as chaves do front-end:
   ```env
   VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
   VITE_SUPABASE_ANON_KEY="eyJhbGciOi..."
   ```

### Opção 2: MySQL Local (se preferir)
No seu terminal MySQL ou phpMyAdmin:

```sql
CREATE DATABASE receituario_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'receituario_user'@'localhost' IDENTIFIED BY 'sua_senha_forte_do_mysql';
GRANT ALL PRIVILEGES ON receituario_db.* TO 'receituario_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## 4. Como Executar o Back-end (Django)

### Passo 1: Criar e ativar o ambiente virtual

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
```

### Passo 2: Instalar as dependências

```bash
pip install -r requirements.txt
```

### Passo 3: Configurar as variáveis de ambiente

Copie o `.env.example` para `.env` e ajuste as credenciais do seu banco:

```bash
cp .env.example .env
```

Conteúdo recomendado do `.env`:

```env
DJANGO_SECRET_KEY="chave-secreta-producao-substitua-aqui"
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS="localhost,127.0.0.1"

# Conexão MySQL
DB_ENGINE=django.db.backends.mysql
DB_NAME=receituario_db
DB_USER=receituario_user
DB_PASSWORD=sua_senha_forte_do_mysql
DB_HOST=127.0.0.1
DB_PORT=3306

CORS_ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
CSRF_TRUSTED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
```

### Passo 4: Aplicar migrações e semear o banco (Seed)

```bash
python manage.py makemigrations recipes
python manage.py migrate
python manage.py seed
```

O comando `python manage.py seed` cria automaticamente:
- As 6 categorias cromáticas: **Doces**, **Massas**, **Carnes**, **Lanches**, **Saladas**, **Bebidas**.
- O superusuário administrador:
  - **Usuário**: `admin`
  - **Senha**: `Admin12345!`
- Os alunos demonstrados nos prints:
  - `marina` (senha: `Aluno12345!`)
  - `pedrolima` (senha: `Aluno12345!`)
  - `anacosta`, `joaoreis`, `liviaalves`, `caionunes`, `brunosilva`, `helenavaz`
- As receitas completas com ingredientes, tempos e etapas fiéis aos prints.

### Passo 5: Rodar os testes automatizados de permissão

```bash
python manage.py test recipes.tests.test_permissions
```

Testes cobertos:
- Aluno A tentando editar receita do Aluno B (retorna `403 Forbidden`).
- Aluno A tentando excluir receita do Aluno B (retorna `403 Forbidden`).
- Aluno comum tentando acessar `/api/admin/overview/` ou redefinir senha (retorna `403 Forbidden`).
- Administrador editando e excluindo qualquer receita com sucesso (`200 OK` / `204 No Content`).
- Visitante não autenticado tentando criar receita (retorna `401 Unauthorized`).
- Injeção maliciosa de `author_id` ou `user_id` em payloads (servidor preserva a identidade real de `request.user`).

### Passo 6: Iniciar o servidor Django

```bash
python manage.py runserver 0.0.0.0:8000
```

---

## 5. Como Executar o Front-end

Para executar somente o front-end:

```bash
cd frontend
npm install
npm run dev
```

A aplicação estará disponível no endereço informado pelo Vite (normalmente `http://localhost:5173`).

Para executar o servidor local com a API de fallback, use a raiz do projeto:

```bash
npm install --legacy-peer-deps
npm run dev
```

Nesse modo, a aplicação fica disponível em `http://localhost:3000`.

---

## 6. Execução Local via Docker Compose

O Compose é destinado apenas a desenvolvimento local. Defina `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no `.env` da raiz (o Compose usa essas variáveis na compilação do front) e então execute:

```bash
docker compose up --build
```

O site ficará disponível em `http://localhost:3000`; MySQL e Django também serão iniciados nas portas `3306` e `8000`. O backend Django é uma alternativa legada e não é o backend chamado pelo front-end: para uso normal, configure Supabase. Sem credenciais Supabase, o servidor Node local usa armazenamento em memória, que não deve ser usado para dados reais.

---

## 7. Checklist de Deploy em Produção

Antes de colocar o livro da turma online publicamente:

- [ ] **Desativar Debug**: Definir `DJANGO_DEBUG=False` no `.env`.
- [ ] **Chave Secreta Forte**: Gerar uma `DJANGO_SECRET_KEY` criptograficamente segura.
- [ ] **Cookies Seguros**:
  - `JWT_COOKIE_SECURE=True` (obriga transmissão exclusiva via HTTPS).
  - `JWT_COOKIE_SAMESITE="Lax"`.
  - `JWT_COOKIE_HTTPONLY=True`.
- [ ] **Configuração de Domínio**: Adicionar o domínio nos `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` e `CSRF_TRUSTED_ORIGINS`.
- [ ] **Banco de Dados**: Assegurar backups diários do banco MySQL e conferir permissões mínimas do usuário `receituario_user`.
- [ ] **Servidor WSGI/ASGI**: Utilizar Gunicorn ou Uvicorn com processo supervisionado (Systemd ou Supervisor).
- [ ] **Reverse Proxy Nginx**: Configurar terminação SSL/TLS com Let's Encrypt (Certbot), cabeçalhos de segurança (`X-Frame-Options`, `Content-Security-Policy`, `X-Content-Type-Options`) e compressão Gzip/Brotli.
- [ ] **Coleta de Arquivos Estáticos**: Executar `python manage.py collectstatic --noinput` para servir CSS/JS do admin via Nginx ou bucket.
- [ ] **Auditoria de Contas**: Alterar a senha padrão inicial do superusuário `admin`.

---

## 8. Onde Hospedar o Front-end Gratuitamente

Para colocar a interface no ar sem pagar nada e com SSL (HTTPS) automático:

1. **Vercel (Recomendação #1)**:
   - Plano Hobby 100% gratuito para sempre.
   - Deploy automático ao dar `git push` no GitHub.
   - Como fazer:
     1. Suba o projeto para um repositório no GitHub.
     2. Acesse [vercel.com](https://vercel.com) e faça login com seu GitHub.
     3. Clique em **Add New Project** e selecione o repositório.
     4. Em **Environment Variables**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
     5. Clique em **Deploy**. Em menos de 2 minutos você terá uma URL pública gratuita (ex: `receituario.vercel.app`).

2. **Cloudflare Pages**:
   - Tráfego e requisições ilimitadas no plano gratuito.
   - Conecte ao GitHub, defina build command `npm run build` e output directory `dist`.

3. **Netlify**:
   - 100 GB/mês de banda no plano gratuito, com deploy contínuo via GitHub.
