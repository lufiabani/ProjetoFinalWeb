# Documentação do domínio — DesenvWebApi

Este documento descreve as **tabelas** do PostgreSQL, as **classes de modelo** (EF Core), os **DTOs** usados nas APIs e os **métodos de cada controlador**, incluindo autenticação e respostas HTTP esperadas.

---

## Contexto: `AppDbContext` e auditoria

O ficheiro `Data/AppDbContext.cs` define os `DbSet` e o mapeamento relacional (`OnModelCreating`). Além disso, **`SaveChangesAsync` está sobrescrito** para preencher automaticamente campos de data/hora em entidades novas ou alteradas:

| Entidade           | Inserção (`Added`)                         | Atualização (`Modified`)      |
|--------------------|--------------------------------------------|-------------------------------|
| `Filme`            | `CriadoEm`, `AtualizadoEm`, `SincronizadoEm` | `AtualizadoEm`, `SincronizadoEm` |
| `Genero`           | `SincronizadoEm`                           | `SincronizadoEm`              |
| `Favorito`         | `AdicionadoEm`                             | —                             |
| `AvaliacaoUsuario` | `CriadoEm`, `AtualizadoEm`                 | `AtualizadoEm`                |
| `Comentario`       | `CriadoEm`, `EditadoEm` (iguais na criação) | `EditadoEm`                   |

**Exceção:** o modelo **`Usuario`** não é tratado neste override. As datas **`CriadoEm`** e **`AtualizadoEm`** do utilizador são definidas em **`UsuarioLocalService.GarantirUsuarioAsync`**, que também persiste o registo.

---

## 1. Tabelas no PostgreSQL

Nomes das tabelas geradas pela migração (PascalCase com aspas no Npgsql). Tipos abaixo refletem o mapeamento EF Core + PostgreSQL.

### 1.1. `Usuarios`

| Coluna           | Tipo PG              | Restrições / índices        |
|------------------|----------------------|-----------------------------|
| `Id`             | `bigint` identity    | PK                          |
| `KeycloakSub`    | `varchar(64)`        | NOT NULL, **único**         |
| `Email`          | `varchar(320)`       | NULL                        |
| `NomeExibicao`   | `varchar(256)`       | NULL                        |
| `CriadoEm`       | `timestamptz`        | NOT NULL                    |
| `AtualizadoEm`   | `timestamptz`        | NOT NULL                    |

**Relação:** um utilizador tem muitos favoritos, avaliações e comentários (FKs nas outras tabelas).

---

### 1.2. `Filmes`

Cache local de filmes (identificador externo TMDB: `TmdbId`).

| Coluna               | Tipo PG              | Restrições / índices     |
|----------------------|----------------------|--------------------------|
| `Id`                 | `bigint` identity    | PK                       |
| `TmdbId`             | `integer`          | NOT NULL, **único**      |
| `Titulo`             | `varchar(512)`     | NOT NULL                 |
| `TituloOriginal`     | `varchar(512)`     | NULL                     |
| `Sinopse`            | `text`             | NULL                     |
| `PosterPath`         | `varchar(512)`     | NULL                     |
| `BackdropPath`       | `varchar(512)`     | NULL                     |
| `DataLancamento`     | `date`             | NULL                     |
| `DuracaoMinutos`     | `integer`          | NULL                     |
| `NotaMediaTmdb`      | `numeric(4,2)`     | NULL                     |
| `TotalVotosTmdb`     | `integer`          | NULL                     |
| `IdiomaOriginal`     | `varchar(16)`      | NULL                     |
| `ImdbId`             | `varchar(32)`      | NULL                     |
| `MetadadosTmdbJson`  | `jsonb`            | NULL                     |
| `SincronizadoEm`     | `timestamptz`      | NOT NULL                 |
| `CriadoEm`           | `timestamptz`      | NOT NULL                 |
| `AtualizadoEm`       | `timestamptz`      | NOT NULL                 |

---

### 1.3. `Generos`

Género cinematográfico (catálogo alinhado ao TMDB).

| Coluna           | Tipo PG           | Restrições / índices |
|------------------|-------------------|----------------------|
| `Id`             | `integer` identity | PK                  |
| `TmdbId`         | `integer`         | NOT NULL, **único**  |
| `Nome`           | `varchar(128)`    | NOT NULL             |
| `SincronizadoEm` | `timestamptz`     | NOT NULL             |

---

### 1.4. `FilmeGeneros`

Tabela de junção **N:N** entre filmes e géneros.

| Coluna    | Tipo PG  | Restrições                          |
|-----------|----------|-------------------------------------|
| `FilmeId` | `bigint` | PK (composta), FK → `Filmes` CASCADE |
| `GeneroId`| `integer`| PK (composta), FK → `Generos` CASCADE|

---

### 1.5. `Favoritos`

| Coluna        | Tipo PG      | Restrições |
|---------------|--------------|------------|
| `Id`          | `bigint` identity | PK    |
| `UsuarioId`   | `bigint`     | FK → `Usuarios` CASCADE |
| `FilmeId`     | `bigint`     | FK → `Filmes` CASCADE   |
| `AdicionadoEm`| `timestamptz`| NOT NULL |

**Índice único:** (`UsuarioId`, `FilmeId`) — um par utilizador/filme só pode existir uma vez.

---

### 1.6. `AvaliacoesUsuario`

| Coluna         | Tipo PG      | Restrições |
|----------------|--------------|------------|
| `Id`           | `bigint` identity | PK    |
| `UsuarioId`    | `bigint`     | FK → `Usuarios` CASCADE |
| `FilmeId`      | `bigint`     | FK → `Filmes` CASCADE   |
| `Nota`         | `smallint`   | NOT NULL (validação API: 1–10) |
| `CriadoEm`     | `timestamptz`| NOT NULL |
| `AtualizadoEm` | `timestamptz`| NOT NULL |

**Índice único:** (`UsuarioId`, `FilmeId`).

---

### 1.7. `Comentarios`

| Coluna       | Tipo PG      | Restrições |
|--------------|--------------|------------|
| `Id`         | `bigint` identity | PK    |
| `UsuarioId`  | `bigint`     | FK → `Usuarios` CASCADE |
| `FilmeId`    | `bigint`     | FK → `Filmes` CASCADE   |
| `Corpo`      | `text`       | NOT NULL |
| `CriadoEm`   | `timestamptz`| NOT NULL |
| `EditadoEm`  | `timestamptz`| NOT NULL |
| `Visivel`    | `boolean`    | NOT NULL (listagens públicas filtram `true`) |

---

## 2. Modelos C# (`Models/`)

Cada classe corresponde a uma entidade EF Core; propriedades de navegação permitem `Include`/projeções.

### 2.1. `Usuario`

- **Ficheiro:** `Models/Usuario.cs`
- **Papel:** perfil local ligado ao Keycloak pela claim **`sub`** (`KeycloakSub`).
- **Propriedades:** `Id`, `KeycloakSub`, `Email`, `NomeExibicao`, `CriadoEm`, `AtualizadoEm`.
- **Navegação:** coleções `Favoritos`, `Avaliacoes`, `Comentarios`.

### 2.2. `Filme`

- **Ficheiro:** `Models/Filme.cs`
- **Papel:** cópia local dos dados do filme (TMDB e campos auxiliares).
- **Propriedades principais:** `TmdbId`, textos e paths, datas, métricas TMDB, `MetadadosTmdbJson`, timestamps de sincronização.
- **Navegação:** `FilmeGeneros`, `Favoritos`, `Avaliacoes`, `Comentarios`.

### 2.3. `Genero`

- **Ficheiro:** `Models/Genero.cs`
- **Propriedades:** `Id`, `TmdbId`, `Nome`, `SincronizadoEm`.
- **Navegação:** `FilmeGeneros`.

### 2.4. `FilmeGenero`

- **Ficheiro:** `Models/FilmeGenero.cs`
- **Papel:** chave composta (`FilmeId`, `GeneroId`) com navegação para `Filme` e `Genero`.

### 2.5. `Favorito`

- **Ficheiro:** `Models/Favorito.cs`
- **Propriedades:** `Id`, `UsuarioId`, `FilmeId`, `AdicionadoEm`.
- **Navegação:** `Usuario`, `Filme`.

### 2.6. `AvaliacaoUsuario`

- **Ficheiro:** `Models/AvaliacaoUsuario.cs`
- **Propriedades:** `Id`, `UsuarioId`, `FilmeId`, `Nota` (`short`), `CriadoEm`, `AtualizadoEm`.
- **Navegação:** `Usuario`, `Filme`.

### 2.7. `Comentario`

- **Ficheiro:** `Models/Comentario.cs`
- **Propriedades:** `Id`, `UsuarioId`, `FilmeId`, `Corpo`, `CriadoEm`, `EditadoEm`, `Visivel` (predefinição `true`).
- **Navegação:** `Usuario`, `Filme`.

---

## 3. DTOs (`Models/Dtos/`)

Objetos de transferência para corpo de pedido ou formatação de resposta (não são tabelas).

| Ficheiro / tipos | Uso |
|------------------|-----|
| `FilmeUpsertDto`, `FilmeResumoDto` | `POST /api/filmes/cache`; listagens resumidas |
| `FavoritoCriarDto`, `FavoritoListagemDto` | Criar favorito; resposta da lista |
| `AvaliacaoUpsertDto`, `AvaliacaoRespostaDto` | `PUT /api/avaliacoes`; resposta |
| `ComentarioCriarDto`, `ComentarioEdicaoDto`, `ComentarioListagemDto` | Criar/editar/listar comentários |
| `GeneroSyncDto`, `GeneroRespostaDto` | `POST /api/generos/sync`; `GET` |

---

## 4. Serviço auxiliar: `IUsuarioLocalService`

- **Interface:** `Services/IUsuarioLocalService.cs`
- **Implementação:** `Services/UsuarioLocalService.cs`
- **Método:** `Task<Usuario> GarantirUsuarioAsync(ClaimsPrincipal principal, CancellationToken cancellationToken)`
  - Lê `sub`, `email`, nome (várias claims possíveis).
  - Se não existir `sub`, lança `UnauthorizedAccessException`.
  - Insere ou atualiza `Usuario` na BD e chama `SaveChangesAsync`.
- **Uso:** controladores autenticados que precisam do **`Usuario.Id`** interno (favoritos, avaliações, comentários, e indiretamente o fluxo de `/api/usuarios/me`).

---

## 5. Controladores e métodos

Prefixo global da API: **`/api`** + nome do controlador sem sufixo `Controller` (ex.: `Filmes` → `/api/filmes`).

Legenda de autenticação:

- **JWT:** cabeçalho `Authorization: Bearer <access_token>` (Keycloak).
- **`[Authorize]`** no controlador ou ação exige token válido.
- **`[AllowAnonymous]`** permite acesso sem token.

---

### 5.1. `UsuariosController`

- **Rota base:** `/api/usuarios`
- **Dependências:** `IUsuarioLocalService`

| Método HTTP | Rota relativa | Autenticação | Nome do método | Descrição |
|-------------|---------------|--------------|----------------|-----------|
| GET | `me` | `[Authorize]` | `GetMe` | Chama `GarantirUsuarioAsync(User)` e devolve `UsuarioPerfilResponse` (`Id`, `KeycloakSub`, `Email`, `NomeExibicao`). Se faltar `sub` no token, responde **401 Unauthorized**. |

---

### 5.2. `FilmesController`

- **Rota base:** `/api/filmes`
- **Dependências:** `AppDbContext`

| Método HTTP | Rota relativa | Autenticação | Nome do método | Descrição |
|-------------|---------------|--------------|----------------|-----------|
| GET | `` (raiz) | Anónimo | `Listar` | Query: `pagina` (default 1), `tamanho` (default 20, máx. 100). Lista `FilmeResumoDto` por `AtualizadoEm` descendente. |
| GET | `{id:long}` | Anónimo | `Obter` | Filme completo por **ID interno**. **404** se não existir. |
| GET | `tmdb/{tmdbId:int}` | Anónimo | `ObterPorTmdb` | Filme completo por **TmdbId**. **404** se não existir. |
| POST | `cache` | `[Authorize]` | `UpsertCache` | Corpo: `FilmeUpsertDto`. Cria ou atualiza registo com o mesmo `TmdbId`; preenche campos do DTO; `SaveChangesAsync`. Devolve o `Filme` atual. **400** se modelo inválido. |

---

### 5.3. `FavoritosController`

- **Rota base:** `/api/favoritos`
- **Classe marcada com `[Authorize]`** — todas as ações exigem JWT.
- **Dependências:** `AppDbContext`, `IUsuarioLocalService`

| Método HTTP | Rota relativa | Nome do método | Descrição |
|-------------|---------------|----------------|-----------|
| GET | `` (raiz) | `MeusFavoritos` | Resolve utilizador; devolve lista de `FavoritoListagemDto` (id do favorito, data, resumo do filme). |
| POST | `` (raiz) | `Adicionar` | Corpo: `FavoritoCriarDto` (`FilmeId`). Valida existência do filme; evita duplicado (`UsuarioId`+`FilmeId`). **400** se filme inexistente; **409 Conflict** se já favoritado; **201** com `Favorito` criado. |
| DELETE | `{filmeId:long}` | `Remover` | Remove favorito do utilizador atual para esse `FilmeId`. **404** se não existir linha. **204 No Content** em sucesso. |

---

### 5.4. `AvaliacoesController`

- **Rota base:** `/api/avaliacoes`
- **`[Authorize]`** em todo o controlador.
- **Dependências:** `AppDbContext`, `IUsuarioLocalService`

| Método HTTP | Rota relativa | Nome do método | Descrição |
|-------------|---------------|----------------|-----------|
| GET | `minhas` | `Minhas` | Todas as avaliações do utilizador como `AvaliacaoRespostaDto`, ordenadas por `AtualizadoEm` descendente. |
| PUT | `` (raiz) | `Upsert` | Corpo: `AvaliacaoUpsertDto` (`FilmeId`, `Nota` entre 1 e 10). Cria linha ou atualiza `Nota`. **400** se filme não existir. Devolve `AvaliacaoRespostaDto` com **200 OK**. |

---

### 5.5. `ComentariosController`

- **Rota base:** `/api/comentarios`
- **Dependências:** `AppDbContext`, `IUsuarioLocalService`

| Método HTTP | Rota relativa | Autenticação | Nome do método | Descrição |
|-------------|---------------|--------------|----------------|-----------|
| GET | `` (raiz) | `[AllowAnonymous]` | `PorFilme` | Query obrigatória: `filmeId`. Lista `ComentarioListagemDto` com `Visivel == true`, ordenados por `CriadoEm` descendente; `AutorNome` = `NomeExibicao` ou `Email`. |
| POST | `` (raiz) | `[Authorize]` | `Criar` | Corpo: `ComentarioCriarDto`. `Corpo` com trim; `Visivel = true`. **400** se filme inexistente. **201** com entidade `Comentario`. |
| PUT | `{id:long}` | `[Authorize]` | `Editar` | Corpo: `ComentarioEdicaoDto`. Só o autor (`UsuarioId`). **404** se não for dono. **204** em sucesso. |
| DELETE | `{id:long}` | `[Authorize]` | `Apagar` | Remove apenas se o utilizador for o autor. **404** caso contrário. **204** em sucesso. |

---

### 5.6. `GenerosController`

- **Rota base:** `/api/generos`
- **Dependências:** `AppDbContext`

| Método HTTP | Rota relativa | Autenticação | Nome do método | Descrição |
|-------------|---------------|--------------|----------------|-----------|
| GET | `` (raiz) | `[AllowAnonymous]` | `Listar` | Todos os géneros como `GeneroRespostaDto`, ordenados por nome. |
| POST | `sync` | `[Authorize]` | `Sincronizar` | Corpo: lista de `GeneroSyncDto`. Para cada `TmdbId`, insere ou atualiza `Nome`. **400** se lista nula ou vazia. **204 No Content** em sucesso. |

---

## 6. Fluxo recomendado no cliente

1. Login no Keycloak (front obtém JWT).
2. Opcional: `GET /api/usuarios/me` para sincronizar perfil e obter `Id` interno.
3. `POST /api/filmes/cache` com dados do TMDB → guardar o **`Id`** interno devolvido.
4. `POST /api/favoritos` com esse `FilmeId`; `PUT /api/avaliacoes`; `POST /api/comentarios` conforme necessário.
5. `POST /api/generos/sync` quando quiser popular o catálogo de géneros (ex.: resposta de `/genre/movie` do TMDB).

---

## 7. Referência de ficheiros

| Área | Caminhos |
|------|-----------|
| Contexto EF | `Data/AppDbContext.cs` |
| Entidades | `Models/*.cs` (exceto `Dtos/`) |
| DTOs | `Models/Dtos/*.cs` |
| Controladores | `Controllers/*Controller.cs` |
| Serviço utilizador | `Services/IUsuarioLocalService.cs`, `Services/UsuarioLocalService.cs` |
| Migração inicial | `Migrations/20260327003914_InicialSistemaFilmesKeycloak.cs` |

---

*Documento gerado para o projeto DesenvWebApi — UFSC / Filmoteca.*
