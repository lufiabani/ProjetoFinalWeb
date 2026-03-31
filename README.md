# Projeto Final Web — Filmoteca (UFSC)

Aplicação **full stack** para gestão de filmes com autenticação **Keycloak**, **API ASP.NET Core 8**, **PostgreSQL** e **React (Vite)**. Este documento explica, passo a passo, como instalar e executar o projeto em ambiente de desenvolvimento.

---

## Visão geral da arquitetura

| Componente | Tecnologia | Função |
|------------|------------|--------|
| Base de dados da API | PostgreSQL (`cataneofilmes`) | Dados da aplicação (utilizadores locais, filmes em cache, favoritos, etc.) |
| Base do Keycloak | PostgreSQL (`keycloak`) | Utilizadores e configuração do IdP (separada da aplicação) |
| IdP | Keycloak 26 (Docker) | Login, emissão de JWT (`realm` **desenvweb**) |
| API | .NET 8 | Expõe REST, valida JWT do Keycloak, EF Core + Npgsql |
| Frontend | React 19 + Vite | `keycloak-js`, chamadas à API com `Bearer` |

---

## Pré-requisitos

No computador de desenvolvimento deve ter instalado:

- **Docker Desktop** (ou Docker Engine + Docker Compose v2) — para PostgreSQL, pgAdmin e Keycloak  
- **.NET SDK 8** — para compilar e executar a API  
- **Node.js 20+** (recomendado) e **npm** — para o frontend  
- **Git** — para clonar o repositório  

Opcional:

- **EF Core CLI** (`dotnet tool install --global dotnet-ef`) — para criar ou aplicar migrações manualmente  

---

## 1. Clonar e estrutura do repositório

```bash
git clone <url-do-repositório>
cd ProjetoFinalWeb
```

Pastas principais:

- **`docker-compose.yml`** — stack de infraestrutura (raiz do projeto)  
- **`docker/`** — scripts e ficheiros auxiliares (Postgres + import Keycloak)  
- **`DesenvWebApi/`** — projeto da API .NET  
- **`DesenvWebFront/`** — projeto React (Vite)  

---

## 2. Infraestrutura com Docker

### 2.1. O que o `docker-compose` sobe

Na **raiz** do repositório existe o ficheiro `docker-compose.yml` com três serviços:

1. **postgres** — PostgreSQL 16  
   - Porta no *host*: **5433** (mapeada para 5432 dentro do contentor)  
   - Utilizador: `postgres`  
   - Palavra-passe: `postgres123`  
   - Base **principal da aplicação** criada automaticamente: **`cataneofilmes`** (`POSTGRES_DB`)  

2. **pgadmin** — Interface web para administrar o Postgres  
   - URL: **http://localhost:5050**  

3. **keycloak** — Servidor de identidade (modo **desenvolvimento**)  
   - URL base: **http://localhost:8080** (usar **HTTP**, não HTTPS, neste modo)  
   - Importa o *realm* **desenvweb** a partir dos JSON em `docker/keycloak/`  

### 2.2. Bases de dados PostgreSQL — o que é criado e quando

Existem **duas** bases lógicas no **mesmo** servidor Postgres:

| Base | Finalidade |
|------|------------|
| **`cataneofilmes`** | Dados da API (tabelas EF Core: `Usuarios`, `Filmes`, `Favoritos`, etc.) |
| **`keycloak`** | Dados internos do Keycloak |

- A base **`cataneofilmes`** é criada automaticamente na **primeira** subida do contentor, por causa da variável `POSTGRES_DB=cataneofilmes`.  
- A base **`keycloak`** é criada pelo script montado em `docker/postgres-init.sql`, que o Postgres executa **apenas na primeira inicialização do volume** de dados (primeira vez que o volume `pgdata` é criado). O script contém:

  ```sql
  CREATE DATABASE keycloak;
  ```

**Se o volume `pgdata` já existir** de uma execução anterior **sem** esse script, a base `keycloak` pode **não existir**. Nesse caso o Keycloak falha ou não arranca corretamente. Solução: criar manualmente a base (ver secção [Problemas frequentes](#8-problemas-frequentes-e-soluções)).

### 2.3. Subir os contentores

Na raiz do projeto:

```bash
docker compose up -d
```

Verificar estado:

```bash
docker compose ps
```

Logs (exemplo Keycloak):

```bash
docker compose logs -f keycloak
```

### 2.4. Credenciais de acesso (resumo)

| Serviço | URL | Utilizador | Palavra-passe |
|---------|-----|------------|----------------|
| **PostgreSQL** (API) | `Host=localhost;Port=5433;Database=cataneofilmes` | `postgres` | `postgres123` |
| **pgAdmin** | http://localhost:5050 | `admin@admin.com` | `admin123` |
| **Keycloak (consola admin)** | http://localhost:8080/admin | `admin` | `admin` |
| **Utilizador demo (realm desenvweb)** | Login no SPA / Keycloak | `demo` | `demo123` |

> **IMPORTANTE:** A consola de administração do Keycloak é **http://localhost:8080/admin** (não confundir com o *realm*). O login da aplicação usa o *realm* **desenvweb** (cliente `desenvweb-spa`).

### 2.5. Keycloak — realm e cliente SPA

Na primeira subida com sucesso, o Keycloak importa:

- **`docker/keycloak/desenvweb-realm.json`** — definição do realm e do cliente público **`desenvweb-spa`** (redirects para Vite em `http://localhost:5173` e `http://127.0.0.1:5173`)  
- **`docker/keycloak/desenvweb-users-0.json`** — utilizador de demonstração  

Confirmar que o realm existe: abrir no browser:

**http://localhost:8080/realms/desenvweb/.well-known/openid-configuration**

Deve devolver um documento JSON (OpenID Discovery). Se obtiver **404** ou página de erro, o import pode ter falhado ou a base `keycloak` estar incorreta — ver [Problemas frequentes](#8-problemas-frequentes-e-soluções).

### 2.6. Avisos sobre HTTP vs HTTPS

Em **modo dev**, o Keycloak expõe **HTTP** na porta **8080**. Use sempre **`http://`** nas URLs. Se o browser tentar **https://localhost:8080**, pode aparecer erro do tipo *invalid response*.

A variável `KC_HOSTNAME=http://localhost:8080` no compose evita que o Keycloak gere redirecionamentos incorretos para HTTPS em desenvolvimento.

---

## 3. API .NET (`DesenvWebApi`)

### 3.1. Requisitos

- .NET **8.0 SDK**  

### 3.2. Connection string e Keycloak

O ficheiro `DesenvWebApi/appsettings.json` está alinhado com o Docker:

- **Postgres:** `localhost:5433`, base `cataneofilmes`, utilizador `postgres`, palavra-passe `postgres123`  
- **Authority JWT:** `http://localhost:8080/realms/desenvweb`  
- **`RequireHttpsMetadata`:** `false` em desenvolvimento (Keycloak em HTTP)  
- **`Audience`:** vazio — a API não valida *audience* estrita por predefinição (ajustável conforme o client no Keycloak)  

Para desenvolvimento, `appsettings.Development.json` pode repetir estas chaves.

### 3.3. Base de dados da API e migrações (Entity Framework Core)

A API usa **EF Core** com **PostgreSQL**. As tabelas **não** têm de ser criadas manualmente se aplicar as migrações.

**Na primeira instalação** (com Docker Postgres a correr e base `cataneofilmes` acessível):

```bash
cd DesenvWebApi
dotnet restore
dotnet ef database update
```

> **Nota:** É necessário a ferramenta global `dotnet-ef`. Se não tiver:  
> `dotnet tool install --global dotnet-ef`

Se o comando `dotnet ef` não for encontrado, feche e reabra o terminal ou adicione `%USERPROFILE%\.dotnet\tools` ao `PATH` (Windows) / `~/.dotnet/tools` (macOS/Linux).

O `database update` cria as tabelas (`Usuarios`, `Filmes`, `Generos`, etc.) e o histórico `__EFMigrationsHistory` na base **`cataneofilmes`**.

### 3.4. Executar a API

```bash
cd DesenvWebApi
dotnet run
```

Por defeito o perfil **http** em `Properties/launchSettings.json` usa **http://localhost:5113**. O Swagger abre em:

**http://localhost:5113/swagger**

Endpoints protegidos requerem cabeçalho `Authorization: Bearer <token>` emitido pelo Keycloak (pode testar no Swagger com **Authorize** após copiar um token válido).

### 3.5. Sincronização de utilizador local

O endpoint **`GET /api/usuarios/me`** (autenticado) faz *upsert* do registo em `Usuarios` com base na claim **`sub`** do JWT. Isto liga o utilizador Keycloak ao ID interno usado em favoritos e avaliações.

---

## 4. Frontend React (`DesenvWebFront`)

### 4.1. Instalação

```bash
cd DesenvWebFront
npm install
```

### 4.2. Variáveis de ambiente (desenvolvimento)

O ficheiro **`.env.development`** define:

| Variável | Significado |
|----------|-------------|
| `VITE_KEYCLOAK_URL` | URL do Keycloak (ex.: `http://localhost:8080`) |
| `VITE_KEYCLOAK_REALM` | Nome do realm (`desenvweb`) |
| `VITE_KEYCLOAK_CLIENT_ID` | Cliente público (`desenvweb-spa`) |
| `VITE_API_URL` | URL base da API **sem** sufixo `/api` (ex.: `http://localhost:5113`) |

Se mudar a porta da API ou do Vite, atualize também os **Redirect URIs** e **Web Origins** do cliente no Keycloak (ou no JSON de import, antes de recriar a base `keycloak`).

### 4.3. Executar o frontend

```bash
npm run dev
```

O Vite usa normalmente **http://localhost:5173**. Ao abrir a aplicação, o **keycloak-js** inicia com `login-required` e redireciona para o Keycloak. Após login, o token é enviado nas chamadas à API via Axios (`src/services/api.js`).

### 4.4. Build de produção (referência)

```bash
npm run build
```

Para produção, defina variáveis `VITE_*` adequadas ao ambiente (URLs públicas HTTPS, etc.).

---

## 5. Ordem recomendada no primeiro dia

1. `docker compose up -d` (aguardar Postgres saudável e Keycloak importar o realm)  
2. Verificar **http://localhost:8080/realms/desenvweb/.well-known/openid-configuration**  
3. `cd DesenvWebApi && dotnet ef database update && dotnet run`  
4. `cd DesenvWebFront && npm install && npm run dev`  
5. Abrir o browser no endereço do Vite e fazer login (ex.: `demo` / `demo123`)  
6. Confirmar que a página inicial chama a API autenticada (perfil em `/api/usuarios/me`)  

---

## 6. Alternativa: Postgres já existente

Se já tiver PostgreSQL **fora** deste `docker-compose`:

1. Crie manualmente as bases **`cataneofilmes`** e **`keycloak`** (ou só `cataneofilmes` se o Keycloak também for externo).  
2. Ajuste `DesenvWebApi/appsettings.json` e o `.env` do Keycloak (ou compose) para o *host*, porta e credenciais corretos.  
3. No Keycloak em Docker apontando para um Postgres no *host*, use por exemplo `host.docker.internal` (macOS/Windows) na `KC_DB_URL`.  

Este repositório assume o cenário **único compose na raiz** com Postgres incluído.

---

## 7. Portas utilizadas (predefinições)

| Porta | Serviço |
|------|---------|
| **5433** | PostgreSQL (host → contentor) |
| **5050** | pgAdmin |
| **8080** | Keycloak (HTTP) |
| **5113** | API .NET (perfil http) |
| **5173** | Vite (frontend) |

Confirme que nenhuma outra aplicação ocupa estas portas.

---

## 8. Problemas frequentes e soluções

### 8.1. Base `keycloak` inexistente

Sintoma: Keycloak não arranca ou logs referem falha de ligação à base.

Com o compose em execução:

```bash
docker compose exec postgres psql -U postgres -c "\l"
```

Se `keycloak` não aparecer:

```bash
docker compose exec postgres psql -U postgres -c "CREATE DATABASE keycloak;"
docker compose restart keycloak
```

### 8.2. Realm `desenvweb` não importado (404 no login ou `.well-known`)

O import na arranquedada **ignora** se o realm já existir com outro estado problemático. Pode recriar só a base `keycloak` (**apaga** dados do IdP; a base `cataneofilmes` mantém-se se estiver no mesmo servidor mas em outra BD — no compose atual, `DROP DATABASE keycloak` não apaga `cataneofilmes`):

```bash
docker compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS keycloak WITH (FORCE);" -c "CREATE DATABASE keycloak;"
docker compose restart keycloak
```

Aguarde o Keycloak concluir o import e teste de novo o `.well-known`.

### 8.3. Erro “invalid response” no browser (HTTPS em porta HTTP)

Use **http://** explicitamente. Limpe HSTS para `localhost` se necessário (avançado) ou experimente **http://127.0.0.1:8080/admin**.

### 8.4. API não conecta ao Postgres

- Confirme Docker: `docker compose ps`  
- Teste: `Host=localhost;Port=5433;Database=cataneofilmes;Username=postgres;Password=postgres123`  
- Firewall ou VPN podem bloquear `localhost` mapeado  

### 8.5. `dotnet ef` não encontrado

```bash
dotnet tool install --global dotnet-ef
```

Reabra o terminal e garanta que `dotnet ef` está no `PATH`.

---

## 9. Segurança (desenvolvimento vs produção)

As credenciais neste README (**postgres123**, **admin/admin**, utilizador **demo**) são **apenas para desenvolvimento local**.  

Em **produção** deve:

- Usar palavras-passe fortes e segredos em variáveis de ambiente ou cofre  
- Servir Keycloak e a API com **HTTPS**  
- Rever `Audience` e políticas de CORS  
- Não expor pgAdmin publicamente  

---

## 10. Referências rápidas de ficheiros

| Ficheiro | Conteúdo relevante |
|---------|---------------------|
| `docker-compose.yml` | Serviços, portas, variáveis Keycloak/Postgres |
| `docker/postgres-init.sql` | `CREATE DATABASE keycloak` (primeira inicialização do volume) |
| `docker/keycloak/desenvweb-realm.json` | Realm + cliente SPA |
| `docker/keycloak/desenvweb-users-0.json` | Utilizador demo |
| `DesenvWebApi/appsettings.json` | Connection string + Authority Keycloak |
| `DesenvWebFront/.env.development` | URLs para Vite |

---

**Projeto de Desenvolvimento de Sistemas Web — UFSC 2026.1**
