using DesenvWebApi.Api.Data;
using DesenvWebApi.Api.Models;
using DesenvWebApi.Api.Models.Dtos;
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

    [HttpGet]
    public async Task<ActionResult<IEnumerable<FilmeResumoDto>>> Listar(
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

        var lista = await query
            .Select(f => new FilmeResumoDto
            {
                Id = f.Id,
                TmdbId = f.TmdbId,
                Titulo = f.Titulo,
                PosterPath = f.PosterPath,
                DataLancamento = f.DataLancamento,
                NotaMediaTmdb = f.NotaMediaTmdb
            })
            .ToListAsync(cancellationToken);

        return Ok(lista);
    }

    /// <summary>Busca filmes já gravados na base (título ou título original, sem distinção de maiúsculas).</summary>
    [HttpGet("buscar")]
    public async Task<ActionResult<IEnumerable<FilmeResumoDto>>> Buscar(
        [FromQuery] string q,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 2)
            return BadRequest(new { mensagem = "Indique pelo menos 2 caracteres." });

        var term = q.Trim();
        var pattern = $"%{term}%";

        var lista = await _db.Filmes
            .AsNoTracking()
            .Where(f =>
                EF.Functions.ILike(f.Titulo, pattern) ||
                (f.TituloOriginal != null && EF.Functions.ILike(f.TituloOriginal, pattern)))
            .OrderByDescending(f => f.AtualizadoEm)
            .Take(25)
            .Select(f => new FilmeResumoDto
            {
                Id = f.Id,
                TmdbId = f.TmdbId,
                Titulo = f.Titulo,
                PosterPath = f.PosterPath,
                DataLancamento = f.DataLancamento,
                NotaMediaTmdb = f.NotaMediaTmdb
            })
            .ToListAsync(cancellationToken);

        return Ok(lista);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<Filme>> Obter(long id, CancellationToken cancellationToken)
    {
        var filme = await _db.Filmes.AsNoTracking().FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
        if (filme is null)
            return NotFound();
        return Ok(filme);
    }

    [HttpGet("tmdb/{tmdbId:int}")]
    public async Task<ActionResult<Filme>> ObterPorTmdb(int tmdbId, CancellationToken cancellationToken)
    {
        var filme = await _db.Filmes.AsNoTracking().FirstOrDefaultAsync(f => f.TmdbId == tmdbId, cancellationToken);
        if (filme is null)
            return NotFound();
        return Ok(filme);
    }

    /// <summary>Grava ou atualiza cache local do filme (após dados do TMDB).</summary>
    [Authorize]
    [HttpPost("cache")]
    public async Task<ActionResult<Filme>> UpsertCache([FromBody] FilmeUpsertDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var filme = await _db.Filmes.FirstOrDefaultAsync(f => f.TmdbId == dto.TmdbId, cancellationToken);
        if (filme is null)
        {
            filme = new Filme { TmdbId = dto.TmdbId, Titulo = dto.Titulo };
            _db.Filmes.Add(filme);
        }

        filme.Titulo = dto.Titulo;
        filme.TituloOriginal = dto.TituloOriginal;
        filme.Sinopse = dto.Sinopse;
        filme.PosterPath = dto.PosterPath;
        filme.BackdropPath = dto.BackdropPath;
        filme.DataLancamento = dto.DataLancamento;
        filme.DuracaoMinutos = dto.DuracaoMinutos;
        filme.NotaMediaTmdb = dto.NotaMediaTmdb;
        filme.TotalVotosTmdb = dto.TotalVotosTmdb;
        filme.IdiomaOriginal = dto.IdiomaOriginal;
        filme.ImdbId = dto.ImdbId;
        filme.MetadadosTmdbJson = dto.MetadadosTmdbJson;

        await _db.SaveChangesAsync(cancellationToken);
        return Ok(filme);
    }
}
