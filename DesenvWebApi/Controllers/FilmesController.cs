using System.Globalization;
using System.Text.Json;
using DesenvWebApi.Api.Data;
using DesenvWebApi.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DesenvWebApi.Api.Controllers;

// FilmesController — leitura pública (lista, feed, busca) e escrita autenticada do cache TMDB (POST cache).
[ApiController]
[Route("api/[controller]")]
public class FilmesController : ControllerBase
{
    private readonly AppDbContext _db;

    public FilmesController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/filmes — paginação simples; AsNoTracking porque é só leitura para listagens.
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Filme>>> Listar(
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanho = 20,
        CancellationToken cancellationToken = default)
    {
        if (pagina < 1) pagina = 1;
        if (tamanho is < 1 or > 100) tamanho = 20;

        var query = _db.Filmes
            .AsNoTracking()
            .Include(f => f.Genero)
            .Include(f => f.FilmeDescricao)
            .OrderByDescending(f => f.AtualizadoEm)
            .Skip((pagina - 1) * tamanho)
            .Take(tamanho);

        var lista = await query.ToListAsync(cancellationToken);
        return Ok(lista);
    }

    // GET /api/filmes/buscar — pesquisa textual na base (título, título original, resumo), case-insensitive.
    [HttpGet("buscar", Order = -10)]
    public async Task<ActionResult<IEnumerable<Filme>>> Buscar(
        [FromQuery] string q,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 2)
            return BadRequest(new { mensagem = "Indique pelo menos 2 caracteres." });

        var term = q.Trim().ToLowerInvariant();

        var lista = await _db.Filmes
            .AsNoTracking()
            .Include(f => f.Genero)
            .Include(f => f.FilmeDescricao)
            .Where(f =>
                f.Titulo.ToLower().Contains(term) ||
                (f.FilmeDescricao != null && f.FilmeDescricao.TituloOriginal != null &&
                 f.FilmeDescricao.TituloOriginal.ToLower().Contains(term)) ||
                (f.FilmeDescricao != null && f.FilmeDescricao.Resumo != null &&
                 f.FilmeDescricao.Resumo.ToLower().Contains(term)))
            .OrderByDescending(f => f.AtualizadoEm)
            .Take(50)
            .ToListAsync(cancellationToken);

        return Ok(lista);
    }

    // GET /api/filmes/feed — projeção plana para o SPA (inclui totalFavoritos e campos da descrição).
    [HttpGet("feed", Order = -10)]
    public async Task<ActionResult<IEnumerable<object>>> Feed(
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanho = 20,
        CancellationToken cancellationToken = default)
    {
        if (pagina < 1) pagina = 1;
        if (tamanho is < 1 or > 100) tamanho = 20;

        var lista = await _db.Filmes
            .AsNoTracking()
            .Select(f => new
            {
                f.Id,
                f.TmdbId,
                f.GeneroId,
                GeneroNome = f.Genero!.Nome,
                f.Titulo,
                TituloOriginal = f.FilmeDescricao != null ? f.FilmeDescricao.TituloOriginal : null,
                Resumo = f.FilmeDescricao != null ? f.FilmeDescricao.Resumo : null,
                f.PosterPath,
                BackdropPath = f.FilmeDescricao != null ? f.FilmeDescricao.BackdropPath : null,
                f.DataLancamento,
                DuracaoMinutos = f.FilmeDescricao != null ? f.FilmeDescricao.DuracaoMinutos : null,
                NotaMediaTmdb = f.FilmeDescricao != null ? f.FilmeDescricao.NotaMediaTmdb : null,
                TotalVotosTmdb = f.FilmeDescricao != null ? f.FilmeDescricao.TotalVotosTmdb : null,
                IdiomaOriginal = f.FilmeDescricao != null ? f.FilmeDescricao.IdiomaOriginal : null,
                ImdbId = f.FilmeDescricao != null ? f.FilmeDescricao.ImdbId : null,
                MetadadosTmdbJson = f.FilmeDescricao != null ? f.FilmeDescricao.MetadadosTmdbJson : null,
                f.SincronizadoEm,
                f.CriadoEm,
                f.AtualizadoEm,
                TotalFavoritos = f.Favoritos.Count()
            })
            .OrderByDescending(x => x.TotalFavoritos)
            .ThenByDescending(x => x.AtualizadoEm)
            .Skip((pagina - 1) * tamanho)
            .Take(tamanho)
            .ToListAsync(cancellationToken);

        return Ok(lista);
    }

    // GET /api/filmes/{id} — detalhe completo por chave primária local.
    [HttpGet("{id:long}")]
    public async Task<ActionResult<Filme>> Obter(long id, CancellationToken cancellationToken)
    {
        var filme = await _db.Filmes
            .AsNoTracking()
            .Include(f => f.Genero)
            .Include(f => f.FilmeDescricao)
            .FirstOrDefaultAsync(f => f.Id == id, cancellationToken);

        if (filme is null)
            return NotFound(new { mensagem = $"Filme com ID {id} não encontrado." });
        return Ok(filme);
    }

    // GET /api/filmes/tmdb/{tmdbId} — importação verifica duplicados; ausência na base é situação normal (não usamos 404 para não poluir a consola do browser).
    [HttpGet("tmdb/{tmdbId:int}")]
    public async Task<ActionResult<Filme?>> ObterPorTmdb(int tmdbId, CancellationToken cancellationToken)
    {
        var filme = await _db.Filmes
            .AsNoTracking()
            .Include(f => f.Genero)
            .Include(f => f.FilmeDescricao)
            .FirstOrDefaultAsync(f => f.TmdbId == tmdbId, cancellationToken);

        if (filme is null)
            return Ok((Filme?)null);
        return Ok(filme);
    }

    // POST /api/filmes/cache — upsert do filme + descrição; JsonElement evita model binding frágil em objetos aninhados.
    // Aceita generoId (PK) ou generoTmdbId (+ generoNome opcional) para criar o género se ainda não existir.
    [Authorize]
    [HttpPost("cache")]
    public async Task<ActionResult<Filme>> UpsertCache([FromBody] JsonElement corpo, CancellationToken cancellationToken)
    {
        if (corpo.ValueKind != JsonValueKind.Object)
            return BadRequest(new { mensagem = "Envie um objeto JSON." });

        if (!TryGetInt32(corpo, "tmdbId", out var tmdbId) || tmdbId <= 0)
            return BadRequest(new { mensagem = "TmdbId inválido." });

        var titulo = TryGetString(corpo, "titulo");
        if (string.IsNullOrWhiteSpace(titulo))
            return BadRequest(new { mensagem = "O título é obrigatório." });

        var generoIdFinal = await ResolverOuCriarGeneroIdAsync(corpo, cancellationToken);
        if (generoIdFinal <= 0)
        {
            return BadRequest(new
            {
                mensagem =
                    "Indique generoId (existente na base) ou generoTmdbId (número do género no TMDB). " +
                    "Com generoTmdbId podes enviar generoNome para o rótulo."
            });
        }

        var posterPath = TryGetString(corpo, "posterPath");
        var dataLancamento = TryGetDateOnly(corpo, "dataLancamento");

        FilmeDescricao? patchDesc = null;
        if (corpo.TryGetProperty("filmeDescricao", out var fd) && fd.ValueKind == JsonValueKind.Object)
            patchDesc = ParseFilmeDescricao(fd);

        var filme = await _db.Filmes
            .Include(f => f.FilmeDescricao)
            .FirstOrDefaultAsync(f => f.TmdbId == tmdbId, cancellationToken);

        if (filme is null)
        {
            filme = new Filme
            {
                TmdbId = tmdbId,
                Titulo = titulo.Trim(),
                GeneroId = generoIdFinal,
                PosterPath = string.IsNullOrWhiteSpace(posterPath) ? null : posterPath.Trim(),
                DataLancamento = dataLancamento
            };
            _db.Filmes.Add(filme);

            if (patchDesc is not null)
                filme.FilmeDescricao = patchDesc;
        }
        else
        {
            filme.Titulo = titulo.Trim();
            filme.GeneroId = generoIdFinal;
            filme.PosterPath = string.IsNullOrWhiteSpace(posterPath) ? null : posterPath.Trim();
            filme.DataLancamento = dataLancamento;

            if (patchDesc is not null)
            {
                if (filme.FilmeDescricao is null)
                    filme.FilmeDescricao = patchDesc;
                else
                    CopiarDescricao(filme.FilmeDescricao, patchDesc);
            }
        }

        await _db.SaveChangesAsync(cancellationToken);

        // Recarrega com Includes para devolver o mesmo formato que GET por id (tracking limpo).
        var idGravado = filme.Id;
        var resultado = await _db.Filmes
            .AsNoTracking()
            .Include(f => f.Genero)
            .Include(f => f.FilmeDescricao)
            .FirstAsync(f => f.Id == idGravado, cancellationToken);

        return Ok(resultado);
    }

    // Resolve género por PK local ou cria/reutiliza pelo TmdbId (fluxo de importação sem sync prévio de géneros).
    private async Task<int> ResolverOuCriarGeneroIdAsync(JsonElement corpo, CancellationToken cancellationToken)
    {
        if (TryGetInt32(corpo, "generoId", out var gid) && gid > 0 &&
            await _db.Generos.AnyAsync(g => g.Id == gid, cancellationToken))
            return gid;

        if (!TryGetInt32(corpo, "generoTmdbId", out var gtmdb) || gtmdb <= 0)
            return 0;

        var genero = await _db.Generos.FirstOrDefaultAsync(g => g.TmdbId == gtmdb, cancellationToken);
        if (genero is not null)
            return genero.Id;

        var nome = TryGetString(corpo, "generoNome");
        if (string.IsNullOrWhiteSpace(nome))
            nome = $"Género TMDB {gtmdb}";

        genero = new Genero { TmdbId = gtmdb, Nome = nome.Trim() };
        _db.Generos.Add(genero);
        await _db.SaveChangesAsync(cancellationToken);
        return genero.Id;
    }

    private static FilmeDescricao ParseFilmeDescricao(JsonElement fd)
    {
        var d = new FilmeDescricao
        {
            TituloOriginal = TryGetString(fd, "tituloOriginal"),
            Resumo = TryGetString(fd, "resumo"),
            BackdropPath = TryGetString(fd, "backdropPath"),
            IdiomaOriginal = TryGetString(fd, "idiomaOriginal"),
            ImdbId = TryGetString(fd, "imdbId"),
            MetadadosTmdbJson = TryGetJsonRawString(fd, "metadadosTmdbJson")
        };

        if (TryGetInt32(fd, "duracaoMinutos", out var dur) && dur > 0)
            d.DuracaoMinutos = dur;

        if (fd.TryGetProperty("notaMediaTmdb", out var nm) && nm.ValueKind == JsonValueKind.Number)
            d.NotaMediaTmdb = nm.GetDecimal();

        if (fd.TryGetProperty("totalVotosTmdb", out var tv) && tv.ValueKind == JsonValueKind.Number)
            d.TotalVotosTmdb = tv.GetInt32();

        return d;
    }

    private static string? TryGetJsonRawString(JsonElement parent, string name)
    {
        if (!parent.TryGetProperty(name, out var p))
            return null;
        return p.ValueKind switch
        {
            JsonValueKind.String => p.GetString(),
            JsonValueKind.Object or JsonValueKind.Array => p.GetRawText(),
            _ => null
        };
    }

    private static bool TryGetInt32(JsonElement parent, string name, out int value)
    {
        value = 0;
        if (!parent.TryGetProperty(name, out var p))
            return false;
        if (p.ValueKind == JsonValueKind.Number && p.TryGetInt32(out value))
            return true;
        if (p.ValueKind == JsonValueKind.String && int.TryParse(p.GetString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
            return true;
        return false;
    }

    private static string? TryGetString(JsonElement parent, string name)
    {
        if (!parent.TryGetProperty(name, out var p) || p.ValueKind != JsonValueKind.String)
            return null;
        return p.GetString();
    }

    private static DateOnly? TryGetDateOnly(JsonElement parent, string name)
    {
        var s = TryGetString(parent, name);
        if (string.IsNullOrWhiteSpace(s) || s.Length < 10)
            return null;
        return DateOnly.TryParse(s.AsSpan(0, 10), CultureInfo.InvariantCulture, DateTimeStyles.None, out var d)
            ? d
            : null;
    }

    // Atualização campo a campo da descrição (evita EntityState.Modified, alinhado ao modelo da disciplina).
    private static void CopiarDescricao(FilmeDescricao destino, FilmeDescricao origem)
    {
        destino.TituloOriginal = origem.TituloOriginal;
        destino.Resumo = origem.Resumo;
        destino.BackdropPath = origem.BackdropPath;
        destino.DuracaoMinutos = origem.DuracaoMinutos;
        destino.NotaMediaTmdb = origem.NotaMediaTmdb;
        destino.TotalVotosTmdb = origem.TotalVotosTmdb;
        destino.IdiomaOriginal = origem.IdiomaOriginal;
        destino.ImdbId = origem.ImdbId;
        destino.MetadadosTmdbJson = origem.MetadadosTmdbJson;
    }
}
