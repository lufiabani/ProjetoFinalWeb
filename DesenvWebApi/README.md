# DesenvWebApi

Projeto de Desenvolvimento de Sistemas Web — UFSC 2026.1

Documentação detalhada de **tabelas, models, DTOs e métodos dos controladores**: ver [`DOCUMENTACAO_DOMINIO.md`](./DOCUMENTACAO_DOMINIO.md).

## Modelo de dados (PostgreSQL)

- **Usuarios** — vínculo ao Keycloak (`KeycloakSub` = claim `sub`)
- **Filmes** — cache TMDB (`TmdbId` único)
- **Generos** / **FilmeGeneros**
- **Favoritos**, **AvaliacoesUsuario**, **Comentarios**

Datas de auditoria em **Filme**, **Genero**, **Favorito**, **AvaliacaoUsuario** e **Comentario** são preenchidas em `SaveChangesAsync`.

## Migrações

```bash
dotnet ef database update
```

## Endpoints principais (JWT no Swagger: Authorize)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/usuarios/me` | Sim | Perfil local + sync Keycloak |
| GET | `/api/filmes` | Não | Lista paginada (cache) |
| GET | `/api/filmes/{id}` | Não | Detalhe por ID interno |
| GET | `/api/filmes/tmdb/{tmdbId}` | Não | Cache por TMDB; `null` se ainda não importado (HTTP 200) |
| POST | `/api/filmes/cache` | Sim | Cria/atualiza filme no cache |
| GET | `/api/favoritos` | Sim | Favoritos do utilizador |
| POST | `/api/favoritos` | Sim | Corpo: `{ "filmeId": n }` |
| DELETE | `/api/favoritos/{filmeId}` | Sim | Remove favorito |
| GET | `/api/avaliacoes/minhas` | Sim | Notas do utilizador |
| PUT | `/api/avaliacoes` | Sim | Corpo: `{ "filmeId", "nota" }` (1–10) |
| GET | `/api/comentarios?filmeId=` | Não | Comentários visíveis |
| POST | `/api/comentarios` | Sim | Novo comentário |
| PUT | `/api/comentarios/{id}` | Sim | Editar próprio |
| DELETE | `/api/comentarios/{id}` | Sim | Apagar próprio |
| GET | `/api/generos` | Não | Lista géneros |
| POST | `/api/generos/sync` | Sim | Corpo: array `{ tmdbId, nome }` |

Fluxo típico: **POST /api/filmes/cache** (dados TMDB) → **POST /api/favoritos** com o `id` devolvido.
