using DesenvWebApi.Api.Data;
using DesenvWebApi.Api.Models;
using DesenvWebApi.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DesenvWebApi.Api.Controllers;

// FavoritosController — favoritos do utilizador autenticado (N:N com Filme); deduplicação na BD.
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

    // GET /api/favoritos — lista com Filme (e género/descrição) para o painel lateral do SPA.
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Favorito>>> MeusFavoritos(CancellationToken cancellationToken)
    {
        var usuario = await _usuarios.GarantirUsuarioAsync(User, cancellationToken);

        var lista = await _db.Favoritos
            .AsNoTracking()
            .Include(f => f.Filme!)
                .ThenInclude(fm => fm.Genero)
            .Include(f => f.Filme!)
                .ThenInclude(fm => fm.FilmeDescricao)
            .Where(f => f.UsuarioId == usuario.Id)
            .OrderByDescending(f => f.AdicionadoEm)
            .ToListAsync(cancellationToken);

        return Ok(lista);
    }

    // POST /api/favoritos — body mínimo { filmeId }; 409 se já existir o par (utilizador, filme).
    [HttpPost]
    public async Task<ActionResult<Favorito>> Adicionar([FromBody] Favorito entrada, CancellationToken cancellationToken)
    {
        if (entrada.FilmeId <= 0)
            return BadRequest(new { mensagem = "FilmeId inválido." });

        var existeFilme = await _db.Filmes.AnyAsync(f => f.Id == entrada.FilmeId, cancellationToken);
        if (!existeFilme)
            return BadRequest(new { mensagem = "Filme não encontrado. Grave o filme em cache primeiro (POST /api/filmes/cache)." });

        var usuario = await _usuarios.GarantirUsuarioAsync(User, cancellationToken);

        var jaTem = await _db.Favoritos.AnyAsync(
            f => f.UsuarioId == usuario.Id && f.FilmeId == entrada.FilmeId,
            cancellationToken);
        if (jaTem)
            return Conflict(new { mensagem = "Filme já está nos favoritos." });

        var favorito = new Favorito
        {
            UsuarioId = usuario.Id,
            FilmeId = entrada.FilmeId
        };
        _db.Favoritos.Add(favorito);
        await _db.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(MeusFavoritos), null, favorito);
    }

    // DELETE /api/favoritos/{filmeId} — remove pelo ID do filme (não pelo PK do favorito); 200 com { mensagem } em sucesso.
    [HttpDelete("{filmeId:long}")]
    public async Task<IActionResult> Remover(long filmeId, CancellationToken cancellationToken)
    {
        var usuario = await _usuarios.GarantirUsuarioAsync(User, cancellationToken);

        var favorito = await _db.Favoritos.FirstOrDefaultAsync(
            f => f.UsuarioId == usuario.Id && f.FilmeId == filmeId,
            cancellationToken);
        if (favorito is null)
            return NotFound(new { mensagem = "Favorito não encontrado." });

        _db.Favoritos.Remove(favorito);
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { mensagem = "Favorito removido com sucesso." });
    }
}
