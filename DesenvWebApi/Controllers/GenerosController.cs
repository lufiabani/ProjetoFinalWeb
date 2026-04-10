using DesenvWebApi.Api.Data;
using DesenvWebApi.Api.Models;
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
    public async Task<ActionResult<IEnumerable<Genero>>> Listar(CancellationToken cancellationToken)
    {
        var lista = await _db.Generos
            .AsNoTracking()
            .OrderBy(g => g.Nome)
            .ToListAsync(cancellationToken);

        return Ok(lista);
    }

    /// <summary>Sincroniza géneros (ex.: lista /genre/movie do TMDB).</summary>
    [Authorize]
    [HttpPost("sync")]
    public async Task<IActionResult> Sincronizar([FromBody] List<Genero> itens, CancellationToken cancellationToken)
    {
        if (itens is null || itens.Count == 0)
            return BadRequest(new { mensagem = "Envie uma lista não vazia." });

        foreach (var item in itens)
        {
            if (item.TmdbId <= 0 || string.IsNullOrWhiteSpace(item.Nome))
                return BadRequest(new { mensagem = "Cada género precisa de TmdbId e Nome válidos." });

            var genero = await _db.Generos.FirstOrDefaultAsync(g => g.TmdbId == item.TmdbId, cancellationToken);
            if (genero is null)
            {
                genero = new Genero { TmdbId = item.TmdbId, Nome = item.Nome.Trim() };
                _db.Generos.Add(genero);
            }
            else
            {
                genero.Nome = item.Nome.Trim();
            }
        }

        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
