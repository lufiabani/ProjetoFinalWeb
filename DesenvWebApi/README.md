# DesenvWeb API — Backend

API **ASP.NET Core 8** para o projeto de **Desenvolvimento de Sistemas Web (UFSC)**. Expõe endpoints REST para **filmes em cache (TMDB)**, **géneros**, **favoritos** e **comentários**, com autenticação **JWT** validada contra **Keycloak** (OpenID Connect). A persistência é em **PostgreSQL** via **Entity Framework Core 8**.

---

## Índice

1. [Stack tecnológica](#stack-tecnológica)
2. [Pré-requisitos](#pré-requisitos)
3. [Instalação do projeto](#instalação-do-projeto)
4. [Docker Compose (PostgreSQL, pgAdmin, Keycloak)](#docker-compose-postgresql-pgadmin-keycloak)
5. [Utilizadores e acesso à base de dados](#utilizadores-e-acesso-à-base-de-dados)
6. [Configuração da API (`appsettings`)](#configuração-da-api-appsettings)
7. [Migrações EF Core](#migrações-ef-core)
8. [Executar a API](#executar-a-api)
9. [Swagger e JWT](#swagger-e-jwt)
10. [Arquitetura e controladores](#arquitetura-e-controladores)
11. [Rotas e funcionalidades](#rotas-e-funcionalidades)
12. [Modelo de dados e diagrama](#modelo-de-dados-e-diagrama)
13. [Fluxos típicos](#fluxos-típicos)
14. [Saúde da API](#saúde-da-api)
15. [Resolução de problemas](#resolução-de-problemas)

---

## Stack tecnológica

| Componente | Versão / notas |
|------------|----------------|
| .NET | 8.0 |
| ASP.NET Core Web API | Controllers |
| Entity Framework Core | 8.0.0 |
| Npgsql | 8.0.0 |
| PostgreSQL (Docker) | 16 (porta host **5433**) |
| Autenticação | JWT Bearer (`Microsoft.AspNetCore.Authentication.JwtBearer` 8.0.0) |
| Keycloak | 26.0 (`start-dev`, import de realm) |
| Documentação HTTP | Swashbuckle (SwaggerGen + SwaggerUI) 8.0.0 |

---

## Pré-requisitos

- [.NET SDK 8](https://dotnet.microsoft.com/download)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (ou Docker Engine + Compose v2)
- (Opcional) [EF Core tools](https://learn.microsoft.com/en-us/ef/core/cli/dotnet) para comandos `dotnet ef`:

```bash
dotnet tool install --global dotnet-ef
```

---

## Instalação do projeto

Na raiz do repositório (onde está `ProjetoFinalWeb.sln`) ou diretamente na pasta da API:

```bash
cd DesenvWebApi
dotnet restore
dotnet build
```

O ficheiro de projeto é `DesenvWebApi.Api.csproj` (namespace e pastas seguem `DesenvWebApi.Api.*`).

---

## Docker Compose (PostgreSQL, pgAdmin, Keycloak)

O ficheiro [`docker-compose.yml`](./docker-compose.yml) está na pasta **`DesenvWebApi`**. Os volumes de inicialização apontam para **`../docker/`** na raiz do repositório (`postgres-init.sql` e import do Keycloak).

### Subir a stack

```bash
cd DesenvWebApi
docker compose up -d
```

Serviços definidos em `name: projetofinalweb`:

| Serviço | Descrição | URL / porta (host) |
|---------|-----------|---------------------|
| **postgres** | Base `cataneofilmes` + criação da BD `keycloak` no primeiro arranque | `localhost:5433` → 5432 no contentor |
| **pgadmin** | Interface web para PostgreSQL | `http://localhost:5050` |
| **keycloak** | IdP / OIDC em modo dev | `http://localhost:8080` (**usar HTTP**, não HTTPS na 8080) |

Comandos úteis:

```bash
docker compose ps
docker compose logs -f postgres
docker compose down
```

Comentários no próprio `docker-compose.yml` explicam o utilizador **admin** do Keycloak, utilizador **demo** e credenciais do pgAdmin.

---

## Utilizadores e acesso à base de dados

### PostgreSQL (dados da API)

| Campo | Valor (padrão no compose e `appsettings.json`) |
|--------|--------------------------------------------------|
| Host | `localhost` |
| Porta | **5433** (mapeamento do contentor) |
| Base de dados da API | `cataneofilmes` |
| Utilizador | `postgres` |
| Palavra-passe | `postgres123` |

String de ligação equivalente:

`Host=localhost;Port=5433;Database=cataneofilmes;Username=postgres;Password=postgres123`

> A API **não** gere palavras-passe de utilizadores da aplicação: a autenticação é no **Keycloak**. A tabela `Usuarios` guarda apenas o vínculo ao `sub` do token.

### Base `keycloak`

Criada pelo script [`../docker/postgres-init.sql`](../docker/postgres-init.sql) na primeira inicialização do volume. O Keycloak usa a mesma credencial `postgres` / `postgres123` (URL JDBC interna: `jdbc:postgresql://postgres:5432/keycloak`).

### pgAdmin

| Campo | Valor |
|--------|--------|
| URL | `http://localhost:5050` |
| Email | `admin@admin.com` |
| Palavra-passe | `admin123` |

Para registar o servidor PostgreSQL no pgAdmin: host `host.docker.internal` (macOS/Windows) ou o IP da bridge Docker; porta **5433**; utilizador `postgres`; base `cataneofilmes`.

### Keycloak — consola de administração

| Campo | Valor |
|--------|--------|
| URL | `http://localhost:8080` |
| Administrador | `admin` / `admin` |

**Realm:** `desenvweb` (importado a partir de [`../docker/keycloak/desenvweb-realm.json`](../docker/keycloak/desenvweb-realm.json)).

**Cliente público (SPA):** `desenvweb-spa` — fluxos OpenID Connect (código de autorização) + Direct Access Grants (útil para testes com palavra-passe).

### Utilizador de demonstração (Keycloak)

Definido em [`../docker/keycloak/desenvweb-users-0.json`](../docker/keycloak/desenvweb-users-0.json):

| Utilizador | Palavra-passe | Email |
|------------|---------------|--------|
| `demo` | `demo123` | `demo@example.com` |

---

## Configuração da API (`appsettings`)

Ficheiros: [`appsettings.json`](./appsettings.json) e [`appsettings.Development.json`](./appsettings.Development.json).

- **`ConnectionStrings:DefaultConnection`** — deve coincidir com o Postgres em execução (porta **5433** quando usa o compose deste projeto).
- **`Authentication:Keycloak`**:
  - **`Authority`**: `http://localhost:8080/realms/desenvweb`
  - **`Audience`**: vazio por omissão (a API não exige audience se não estiver configurada no token)
  - **`RequireHttpsMetadata`**: `false` em desenvolvimento (Keycloak em HTTP local)

O arranque (`Program.cs`) regista **CORS** permitindo origens `http(s)://localhost`, `127.0.0.1` e `[::1]` (qualquer porta), adequado ao **Vite** (ex.: `http://localhost:5173`).

---

## Migrações EF Core

As migrações estão na pasta [`Migrations/`](./Migrations/). Exemplos de migrações já existentes:

- `InicialSistemaFilmesKeycloak`
- `ReestruturarFilmeDescricaoGeneroUnicoRemoverAvaliacao`

Aplicar o esquema à base **após** o Postgres estar a correr:

```bash
cd DesenvWebApi
dotnet ef database update --project DesenvWebApi.Api.csproj
```

Criar uma **nova** migração (quando alterar modelos / `AppDbContext`):

```bash
dotnet ef migrations add NomeDescritivoDaAlteração --project DesenvWebApi.Api.csproj
dotnet ef database update --project DesenvWebApi.Api.csproj
```

> Use nomes descritivos nas migrações, conforme as regras da disciplina.

---

## Executar a API

```bash
cd DesenvWebApi
dotnet run --project DesenvWebApi.Api.csproj
```

URLs por omissão (ver [`Properties/launchSettings.json`](./Properties/launchSettings.json)):

- **HTTP:** `http://localhost:5113`
- **HTTPS (perfil https):** `https://localhost:7062`

O perfil `http` abre o Swagger automaticamente em desenvolvimento.

---

## Swagger e JWT

Em ambiente **Development**, a API expõe:

- Swagger UI: `/swagger`
- OpenAPI JSON: `/swagger/v1/swagger.json`

No Swagger, use **Authorize** e indique o header: `Bearer {access_token}` obtido no Keycloak (realm `desenvweb`, cliente `desenvweb-spa`).

O `Program.cs` configura o esquema de segurança **Bearer** para testar rotas com `[Authorize]`.

---

## Arquitetura e controladores

Estrutura principal:

```text
DesenvWebApi/
├── Controllers/          # Endpoints REST
├── Data/
│   └── AppDbContext.cs   # EF Core, Fluent API, carimbos UTC em SaveChangesAsync
├── Models/               # Entidades de domínio
├── Migrations/
├── Services/
│   └── UsuarioLocalService.cs   # Sincroniza ClaimsPrincipal → tabela Usuarios (KeycloakSub)
├── Program.cs
├── appsettings.json
└── docker-compose.yml
```

| Controlador | Ficheiro | Papel resumido |
|-------------|----------|----------------|
| **Health** | `HealthController.cs` | Verificação pública de arranque + ligação à BD |
| **Usuarios** | `UsuariosController.cs` | Perfil local do utilizador autenticado (`/me`) |
| **Filmes** | `FilmesController.cs` | Lista, feed, busca, detalhe, cache TMDB (upsert) |
| **Generos** | `GenerosController.cs` | Lista pública; sincronização em massa (TMDB) autenticada |
| **Favoritos** | `FavoritosController.cs` | CRUD de favoritos do utilizador da sessão |
| **Comentarios** | `ComentariosController.cs` | Leitura pública por filme + destaques; escrita só do autor |

---

## Rotas e funcionalidades

Prefixo base dos controllers: **`/api/{nomeDoController}`** (nome sem sufixo `Controller`, em inglês camelCase na URL padrão do ASP.NET Core: `Filmes` → `/api/Filmes` — no cliente costuma usar-se o mesmo casing que o Swagger mostra).

### Health (`/api/Health`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/Health` | Não | Estado `healthy` / `degraded` / `unhealthy` e teste `CanConnect` à BD |

### Usuarios (`/api/Usuarios`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/Usuarios/me` | **Sim** | Garante registo local (`Usuarios`) a partir do token e devolve `id`, `keycloakSub`, `email`, `nomeExibicao` |

### Filmes (`/api/Filmes`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/Filmes` | Não | Lista paginada (`pagina`, `tamanho`); inclui `Genero` e `FilmeDescricao` |
| GET | `/api/Filmes/buscar` | Não | Pesquisa `q` (mín. 2 caracteres) em título, título original e resumo |
| GET | `/api/Filmes/feed` | Não | Feed plano para SPA (inclui `totalFavoritos`, campos da descrição) |
| GET | `/api/Filmes/{id}` | Não | Detalhe por ID interno; **404** se não existir |
| GET | `/api/Filmes/tmdb/{tmdbId}` | Não | Filme em cache por TMDB; devolve **`null` com 200** se ainda não existir (evita ruído no browser) |
| POST | `/api/Filmes/cache` | **Sim** | Upsert de filme + descrição opcional; aceita `generoId` ou `generoTmdbId` (+ `generoNome`) |

Corpo típico do **POST cache** (JSON): `tmdbId`, `titulo`, `generoId` **ou** `generoTmdbId` / `generoNome`, `posterPath`, `dataLancamento`, objeto aninhado `filmeDescricao` (campos como `tituloOriginal`, `resumo`, `backdropPath`, `duracaoMinutos`, `notaMediaTmdb`, `totalVotosTmdb`, etc.).

### Generos (`/api/Generos`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/Generos` | Não | Lista todos os géneros ordenados por nome |
| POST | `/api/Generos/sync` | **Sim** | Upsert em massa: array de géneros ou objeto estilo TMDB `{ "genres": [...] }`; resposta **204 No Content** |

### Favoritos (`/api/Favoritos`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/Favoritos` | **Sim** | Lista favoritos do utilizador com `Filme`, `Genero`, `FilmeDescricao` |
| POST | `/api/Favoritos` | **Sim** | Corpo: `{ "filmeId": <long> }`; **409** se duplicado; **400** se filme não existir |
| DELETE | `/api/Favoritos/{filmeId}` | **Sim** | Remove pelo ID do **filme**; **200** com `{ "mensagem": "..." }` |

### Comentarios (`/api/Comentarios`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/Comentarios?filmeId=` | Não (anónimo) | Lista comentários visíveis do filme; se o token for válido, inclui `souAutor` |
| GET | `/api/Comentarios/destaque` | Não | Comentários recentes (`limite` 1–40) com título/poster do filme |
| POST | `/api/Comentarios` | **Sim** | Novo comentário (`filmeId`, `corpo`) |
| PUT | `/api/Comentarios/{id}` | **Sim** | Editar apenas o próprio comentário; **204** |
| DELETE | `/api/Comentarios/{id}` | **Sim** | Apagar apenas o próprio; **200** com mensagem |

> O **GET** por `filmeId` aceita pedido **anónimo** (`[AllowAnonymous]`); se enviar um token válido, o campo `souAutor` é calculado com base no utilizador da sessão.

Mensagens de erro seguem o padrão `{ "mensagem": "..." }` em português, alinhado às convenções do projeto.

---

## Modelo de dados e diagrama

Tabelas (nomes físicos no PostgreSQL, conforme o EF Core): **`Usuarios`**, **`Generos`**, **`Filmes`**, **`FilmeDescricoes`**, **`Favoritos`**, **`Comentarios`**.

A tabela **`FilmeDescricoes`** declara **`FilmeId`** como **chave estrangeira** para **`Filmes` (`Id`)** (`FOREIGN KEY`), configurada no `AppDbContext` com `HasForeignKey<FilmeDescricao>(d => d.FilmeId)` na relação um-para-um com `Filme`. O **índice único** em `FilmeId` reforça a cardinalidade 1:1 (uma linha de descrição por filme).

Relações principais:

- **Género** (`Generos`) **1 — N** **Filme** (`Filmes`): chave estrangeira `GeneroId`; **Restrict** na eliminação do género quando existem filmes associados.
- **Filme** (`Filmes`) **1 — 1** **descrição** (`FilmeDescricoes`): ver FK **`FilmeDescricoes.FilmeId` → `Filmes.Id`** acima; **Cascade** ao apagar o filme.
- **Utilizador** (`Usuarios`) **1 — N** **Favorito** **N — 1** **Filme** (tabela `Favoritos`; índice único em `(UsuarioId, FilmeId)`).
- **Utilizador** e **Filme** **1 — N** **Comentário** (`Comentarios`); **Cascade** em relação aos pais.

Carimbos de data: `SaveChangesAsync` no `AppDbContext` preenche ou atualiza campos como `CriadoEm`, `AtualizadoEm`, `SincronizadoEm`, `AdicionadoEm`, `EditadoEm` em **UTC**.

### Diagrama ER (Mermaid)

```mermaid
erDiagram
    Usuarios ||--o{ Favoritos : "tem"
    Filmes ||--o{ Favoritos : "recebido"
    Usuarios ||--o{ Comentarios : "escreve"
    Filmes ||--o{ Comentarios : "sobre"
    Generos ||--o{ Filmes : "classifica"
    Filmes ||--|| FilmeDescricoes : "FilmeId FK para Filmes.Id"

    Usuarios {
        bigint Id PK
        string KeycloakSub UK
        string Email
        string NomeExibicao
        timestamptz CriadoEm
        timestamptz AtualizadoEm
    }

    Generos {
        int Id PK
        int TmdbId UK
        string Nome
        timestamptz SincronizadoEm
    }

    Filmes {
        bigint Id PK
        int TmdbId UK
        int GeneroId FK
        string Titulo
        string PosterPath
        date DataLancamento
        timestamptz SincronizadoEm
        timestamptz CriadoEm
        timestamptz AtualizadoEm
    }

    FilmeDescricoes {
        bigint Id PK
        bigint FilmeId FK UK
        string TituloOriginal
        text Resumo
        string BackdropPath
        int DuracaoMinutos
        numeric NotaMediaTmdb
        int TotalVotosTmdb
        string IdiomaOriginal
        string ImdbId
        jsonb MetadadosTmdbJson
        timestamptz CriadoEm
        timestamptz AtualizadoEm
    }

    Favoritos {
        bigint Id PK
        bigint UsuarioId FK
        bigint FilmeId FK
        timestamptz AdicionadoEm
    }

    Comentarios {
        bigint Id PK
        bigint UsuarioId FK
        bigint FilmeId FK
        text Corpo
        timestamptz CriadoEm
        timestamptz EditadoEm
        boolean Visivel
    }
```

---

## Fluxos típicos

1. **Subir** Postgres + Keycloak (`docker compose up -d`).
2. **Aplicar migrações** (`dotnet ef database update`).
3. **Arrancar** a API (`dotnet run`).
4. Obter **token** no Keycloak (ex.: utilizador `demo` / `demo123`, cliente `desenvweb-spa`).
5. **Sincronizar géneros** (opcional): `POST /api/Generos/sync` com payload TMDB.
6. **Importar/cache de filme**: `POST /api/Filmes/cache` com dados do TMDB.
7. **Favoritar**: `POST /api/Favoritos` com o `id` interno do filme devolvido pelo cache.
8. **Comentar**: `GET /api/Usuarios/me` (opcional, para confirmar utilizador local) → `POST /api/Comentarios`.

---

## Saúde da API

Use **`GET /api/Health`** para confirmar que a API responde e que a ligação ao PostgreSQL está OK (resposta **503** se a BD não estiver acessível).

---

## Resolução de problemas

- **Keycloak “Page not found” ou realm em falta:** verifique `http://localhost:8080/realms/desenvweb/.well-known/openid-configuration` (deve devolver JSON). O `docker-compose.yml` inclui notas para recriar só a BD `keycloak` se o import falhar em volumes já inicializados.
- **API não liga à BD:** confirme que o Postgres está saudável (`docker compose ps`), porta **5433** e nome da base `cataneofilmes`.
- **401 nas rotas protegidas:** confirme `Authority` no `appsettings`, relógio do sistema e se o header `Authorization: Bearer ...` está correto no Swagger ou no cliente HTTP.
- **Caminhos do Compose:** o `docker-compose.yml` assume execução a partir da pasta **`DesenvWebApi`**, com artefactos em **`../docker/`** na raiz do repositório.

---

## Licença e contexto académico

Projeto no âmbito da disciplina de **Desenvolvimento de Sistemas Web** — UFSC 2026.1.
