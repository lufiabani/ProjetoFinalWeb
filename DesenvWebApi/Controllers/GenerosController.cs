using DesenvWebApi.Api.Data;
using DesenvWebApi.Api.Models;
using DesenvWebApi.Api.Models.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DesenvWebApi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GenerosController : ControllerBase
{
    private readonly AppDbContext _db;

    public GenerosController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<GeneroRespostaDto>>> Listar(CancellationToken cancellationToken)
    {
        var lista = await _db.Generos
            .AsNoTracking()
            .OrderBy(g => g.Nome)
            .Select(g => new GeneroRespostaDto { Id = g.Id, TmdbId = g.TmdbId, Nome = g.Nome })
            .ToListAsync(cancellationToken);

        return Ok(lista);
    }

    /// <summary>Sincroniza géneros (ex.: lista /genre/movie do TMDB).</summary>
    [Authorize]
    [HttpPost("sync")]
    public async Task<ActionResult> Sincronizar([FromBody] List<GeneroSyncDto> itens, CancellationToken cancellationToken)
    {
        if (itens is null || itens.Count == 0)
            return BadRequest(new { mensagem = "Envie uma lista não vazia." });

        foreach (var item in itens)
        {
            var genero = await _db.Generos.FirstOrDefaultAsync(g => g.TmdbId == item.TmdbId, cancellationToken);
            if (genero is null)
            {
                genero = new Genero { TmdbId = item.TmdbId, Nome = item.Nome };
                _db.Generos.Add(genero);
            }
            else
            {
                genero.Nome = item.Nome;
            }
        }

        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
