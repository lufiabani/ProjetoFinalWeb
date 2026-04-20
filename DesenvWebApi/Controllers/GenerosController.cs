using System.Text.Json;
using DesenvWebApi.Api.Data;
using DesenvWebApi.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DesenvWebApi.Api.Controllers;

// GenerosController — leitura pública da lista; sincronização em massa protegida (POST sync) aceita JSON do TMDB.
[ApiController]
[Route("api/[controller]")]
public class GenerosController : ControllerBase
{
    private readonly AppDbContext _db;

    public GenerosController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/generos — lista para selects e para o SPA saber o que já está na base.
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

    // POST /api/generos/sync — upsert por TmdbId; JsonElement aceita resposta crua do TMDB ({ genres }) ou array direto.
    [Authorize]
    [HttpPost("sync")]
    public async Task<IActionResult> Sincronizar([FromBody] JsonElement corpo, CancellationToken cancellationToken)
    {
        // Corpo pode ser um array de géneros ou o objeto raiz do TMDB com propriedade "genres".
        var arr = corpo.ValueKind == JsonValueKind.Array
            ? corpo
            : corpo.TryGetProperty("genres", out var g) && g.ValueKind == JsonValueKind.Array
                ? g
                : default;

        if (arr.ValueKind != JsonValueKind.Array)
            return BadRequest(new { mensagem = "Envie um array JSON de géneros ou um objeto com propriedade \"genres\" (formato TMDB)." });

        var extraidos = new List<(int TmdbId, string Nome)>();
        foreach (var el in arr.EnumerateArray())
        {
            if (el.ValueKind != JsonValueKind.Object)
                return BadRequest(new { mensagem = "Cada item da lista tem de ser um objeto." });

            var tmdbId = 0;
            if (el.TryGetProperty("tmdbId", out var tp) && tp.TryGetInt32(out var tv))
                tmdbId = tv;
            else if (el.TryGetProperty("id", out var idp) && idp.TryGetInt32(out var idv))
                tmdbId = idv;

            string? nome = null;
            if (el.TryGetProperty("nome", out var np) && np.ValueKind == JsonValueKind.String)
                nome = np.GetString();
            else if (el.TryGetProperty("name", out var n2) && n2.ValueKind == JsonValueKind.String)
                nome = n2.GetString();

            if (tmdbId <= 0 || string.IsNullOrWhiteSpace(nome))
                return BadRequest(new
                {
                    mensagem = "Cada género precisa de id (ou tmdbId) > 0 e de name (ou nome) não vazio."
                });

            extraidos.Add((tmdbId, nome.Trim()));
        }

        if (extraidos.Count == 0)
            return BadRequest(new { mensagem = "Envie uma lista não vazia." });

        foreach (var (tmdbId, nome) in extraidos)
        {
            var genero = await _db.Generos.FirstOrDefaultAsync(g => g.TmdbId == tmdbId, cancellationToken);
            if (genero is null)
            {
                genero = new Genero { TmdbId = tmdbId, Nome = nome };
                _db.Generos.Add(genero);
            }
            else
            {
                genero.Nome = nome;
            }
        }

        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
