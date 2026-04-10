using DesenvWebApi.Api.Data;
using DesenvWebApi.Api.Models;
using DesenvWebApi.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DesenvWebApi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ComentariosController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IUsuarioLocalService _usuarios;

    public ComentariosController(AppDbContext db, IUsuarioLocalService usuarios)
    {
        _db = db;
        _usuarios = usuarios;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> PorFilme(
        [FromQuery] long filmeId,
        CancellationToken cancellationToken)
    {
        long? meuUsuarioId = null;
        if (User.Identity?.IsAuthenticated == true)
        {
            try
            {
                var eu = await _usuarios.GarantirUsuarioAsync(User, cancellationToken);
                meuUsuarioId = eu.Id;
            }
            catch (UnauthorizedAccessException)
            {
                // Lista pública: sem marcar souAutor
            }
        }

        var linhas = await _db.Comentarios
            .AsNoTracking()
            .Where(c => c.FilmeId == filmeId && c.Visivel)
            .OrderByDescending(c => c.CriadoEm)
            .Select(c => new
            {
                c.Id,
                c.Corpo,
                c.CriadoEm,
                c.EditadoEm,
                AutorNome = c.Usuario!.NomeExibicao ?? c.Usuario.Email,
                c.UsuarioId
            })
            .ToListAsync(cancellationToken);

        // Mantém o mesmo contrato JSON que o front espera (sem classe DTO dedicada)
        var lista = linhas.Select(x => new
        {
            x.Id,
            x.Corpo,
            x.CriadoEm,
            x.EditadoEm,
            x.AutorNome,
            SouAutor = meuUsuarioId.HasValue && x.UsuarioId == meuUsuarioId.Value
        }).ToList();

        return Ok(lista);
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] Comentario entrada, CancellationToken cancellationToken)
    {
        if (entrada.FilmeId <= 0)
            return BadRequest(new { mensagem = "FilmeId inválido." });
        if (string.IsNullOrWhiteSpace(entrada.Corpo))
            return BadRequest(new { mensagem = "O texto do comentário é obrigatório." });

        var existeFilme = await _db.Filmes.AnyAsync(f => f.Id == entrada.FilmeId, cancellationToken);
        if (!existeFilme)
            return BadRequest(new { mensagem = "Filme não encontrado." });

        var usuario = await _usuarios.GarantirUsuarioAsync(User, cancellationToken);

        var comentario = new Comentario
        {
            UsuarioId = usuario.Id,
            FilmeId = entrada.FilmeId,
            Corpo = entrada.Corpo.Trim(),
            Visivel = true
        };
        _db.Comentarios.Add(comentario);
        await _db.SaveChangesAsync(cancellationToken);

        var resposta = new
        {
            comentario.Id,
            comentario.Corpo,
            comentario.CriadoEm,
            comentario.EditadoEm,
            AutorNome = usuario.NomeExibicao ?? usuario.Email,
            SouAutor = true
        };

        return CreatedAtAction(nameof(PorFilme), new { filmeId = entrada.FilmeId }, resposta);
    }

    [Authorize]
    [HttpPut("{id:long}")]
    public async Task<IActionResult> Editar(long id, [FromBody] Comentario entrada, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(entrada.Corpo))
            return BadRequest(new { mensagem = "O texto do comentário é obrigatório." });

        var usuario = await _usuarios.GarantirUsuarioAsync(User, cancellationToken);

        var comentario = await _db.Comentarios.FirstOrDefaultAsync(
            c => c.Id == id && c.UsuarioId == usuario.Id,
            cancellationToken);
        if (comentario is null)
            return NotFound(new { mensagem = "Comentário não encontrado." });

        comentario.Corpo = entrada.Corpo.Trim();
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [Authorize]
    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Apagar(long id, CancellationToken cancellationToken)
    {
        var usuario = await _usuarios.GarantirUsuarioAsync(User, cancellationToken);

        var comentario = await _db.Comentarios.FirstOrDefaultAsync(
            c => c.Id == id && c.UsuarioId == usuario.Id,
            cancellationToken);
        if (comentario is null)
            return NotFound(new { mensagem = "Comentário não encontrado." });

        _db.Comentarios.Remove(comentario);
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
