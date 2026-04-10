using DesenvWebApi.Api.Data;
using DesenvWebApi.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DesenvWebApi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FilmesController : ControllerBase
{
    private readonly AppDbContext _db;

    public FilmesController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/filmes
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
            .OrderByDescending(f => f.AtualizadoEm)
            .Skip((pagina - 1) * tamanho)
            .Take(tamanho);

        var lista = await query.ToListAsync(cancellationToken);
        return Ok(lista);
    }

    /// <summary>Busca filmes na base (título, título original ou sinopse; sem distinção de maiúsculas).</summary>
    [HttpGet("buscar", Order = -10)]
    public async Task<ActionResult<IEnumerable<Filme>>> Buscar(
        [FromQuery] string q,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 2)
            return BadRequest(new { mensagem = "Indique pelo menos 2 caracteres." });

        // ToLower + Contains: não trata %/_ como curingas (comportamento esperado numa caixa de pesquisa)
        var term = q.Trim().ToLowerInvariant();

        var lista = await _db.Filmes
            .AsNoTracking()
            .Where(f =>
                f.Titulo.ToLower().Contains(term) ||
                (f.TituloOriginal != null && f.TituloOriginal.ToLower().Contains(term)) ||
                (f.Sinopse != null && f.Sinopse.ToLower().Contains(term)))
            .OrderByDescending(f => f.AtualizadoEm)
            .Take(50)
            .ToListAsync(cancellationToken);

        return Ok(lista);
    }

    /// <summary>
    /// Filmes já gravados na base, com quantos utilizadores os têm nos favoritos
    /// (espelha a ideia da “biblioteca” partilhada na comunidade).
    /// Order menor que a rota por id, para "feed" nunca ser confundido com {id}.
    /// </summary>
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
                f.Titulo,
                f.TituloOriginal,
                f.Sinopse,
                f.PosterPath,
                f.BackdropPath,
                f.DataLancamento,
                f.DuracaoMinutos,
                f.NotaMediaTmdb,
                f.TotalVotosTmdb,
                f.IdiomaOriginal,
                f.ImdbId,
                f.MetadadosTmdbJson,
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

    [HttpGet("{id:long}")]
    public async Task<ActionResult<Filme>> Obter(long id, CancellationToken cancellationToken)
    {
        var filme = await _db.Filmes.AsNoTracking().FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
        if (filme is null)
            return NotFound(new { mensagem = $"Filme com ID {id} não encontrado." });
        return Ok(filme);
    }

    [HttpGet("tmdb/{tmdbId:int}")]
    public async Task<ActionResult<Filme>> ObterPorTmdb(int tmdbId, CancellationToken cancellationToken)
    {
        var filme = await _db.Filmes.AsNoTracking().FirstOrDefaultAsync(f => f.TmdbId == tmdbId, cancellationToken);
        if (filme is null)
            return NotFound(new { mensagem = $"Filme com TMDB ID {tmdbId} não encontrado." });
        return Ok(filme);
    }

    /// <summary>Grava ou atualiza cache local do filme (após dados do TMDB).</summary>
    [Authorize]
    [HttpPost("cache")]
    public async Task<ActionResult<Filme>> UpsertCache([FromBody] Filme entrada, CancellationToken cancellationToken)
    {
        if (entrada.TmdbId <= 0)
            return BadRequest(new { mensagem = "TmdbId inválido." });
        if (string.IsNullOrWhiteSpace(entrada.Titulo))
            return BadRequest(new { mensagem = "O título é obrigatório." });

        var filme = await _db.Filmes.FirstOrDefaultAsync(f => f.TmdbId == entrada.TmdbId, cancellationToken);
        if (filme is null)
        {
            filme = new Filme { TmdbId = entrada.TmdbId, Titulo = entrada.Titulo.Trim() };
            _db.Filmes.Add(filme);
        }

        filme.Titulo = entrada.Titulo.Trim();
        filme.TituloOriginal = entrada.TituloOriginal;
        filme.Sinopse = entrada.Sinopse;
        filme.PosterPath = entrada.PosterPath;
        filme.BackdropPath = entrada.BackdropPath;
        filme.DataLancamento = entrada.DataLancamento;
        filme.DuracaoMinutos = entrada.DuracaoMinutos;
        filme.NotaMediaTmdb = entrada.NotaMediaTmdb;
        filme.TotalVotosTmdb = entrada.TotalVotosTmdb;
        filme.IdiomaOriginal = entrada.IdiomaOriginal;
        filme.ImdbId = entrada.ImdbId;
        filme.MetadadosTmdbJson = entrada.MetadadosTmdbJson;

        await _db.SaveChangesAsync(cancellationToken);
        return Ok(filme);
    }
}
