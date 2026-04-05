using DesenvWebApi.Api.Data;
using DesenvWebApi.Api.Models;
using DesenvWebApi.Api.Models.Dtos;
using DesenvWebApi.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DesenvWebApi.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FavoritosController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IUsuarioLocalService _usuarios;

    public FavoritosController(AppDbContext db, IUsuarioLocalService usuarios)
    {
        _db = db;
        _usuarios = usuarios;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<FavoritoListagemDto>>> MeusFavoritos(CancellationToken cancellationToken)
    {
        var usuario = await _usuarios.GarantirUsuarioAsync(User, cancellationToken);

        var lista = await _db.Favoritos
            .AsNoTracking()
            .Where(f => f.UsuarioId == usuario.Id)
            .OrderByDescending(f => f.AdicionadoEm)
            .Select(f => new FavoritoListagemDto
            {
                FavoritoId = f.Id,
                AdicionadoEm = f.AdicionadoEm,
                Filme = new FilmeResumoDto
                {
                    Id = f.Filme.Id,
                    TmdbId = f.Filme.TmdbId,
                    Titulo = f.Filme.Titulo,
                    TituloOriginal = f.Filme.TituloOriginal,
                    PosterPath = f.Filme.PosterPath,
                    DataLancamento = f.Filme.DataLancamento,
                    NotaMediaTmdb = f.Filme.NotaMediaTmdb
                }
            })
            .ToListAsync(cancellationToken);

        return Ok(lista);
    }

    [HttpPost]
    public async Task<ActionResult<Favorito>> Adicionar([FromBody] FavoritoCriarDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var existeFilme = await _db.Filmes.AnyAsync(f => f.Id == dto.FilmeId, cancellationToken);
        if (!existeFilme)
            return BadRequest(new { mensagem = "Filme não encontrado. Grave o filme em cache primeiro (POST /api/filmes/cache)." });

        var usuario = await _usuarios.GarantirUsuarioAsync(User, cancellationToken);

        var jaTem = await _db.Favoritos.AnyAsync(
            f => f.UsuarioId == usuario.Id && f.FilmeId == dto.FilmeId,
            cancellationToken);
        if (jaTem)
            return Conflict(new { mensagem = "Filme já está nos favoritos." });

        var favorito = new Favorito
        {
            UsuarioId = usuario.Id,
            FilmeId = dto.FilmeId
        };
        _db.Favoritos.Add(favorito);
        await _db.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(MeusFavoritos), null, favorito);
    }

    [HttpDelete("{filmeId:long}")]
    public async Task<IActionResult> Remover(long filmeId, CancellationToken cancellationToken)
    {
        var usuario = await _usuarios.GarantirUsuarioAsync(User, cancellationToken);

        var favorito = await _db.Favoritos.FirstOrDefaultAsync(
            f => f.UsuarioId == usuario.Id && f.FilmeId == filmeId,
            cancellationToken);
        if (favorito is null)
            return NotFound();

        _db.Favoritos.Remove(favorito);
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
