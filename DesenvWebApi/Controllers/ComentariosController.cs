using DesenvWebApi.Api.Data;
using DesenvWebApi.Api.Models;
using DesenvWebApi.Api.Models.Dtos;
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
    public async Task<ActionResult<IEnumerable<ComentarioListagemDto>>> PorFilme(
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
                // Lista pública: sem marcar SouAutor
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
                AutorNome = c.Usuario.NomeExibicao ?? c.Usuario.Email,
                c.UsuarioId
            })
            .ToListAsync(cancellationToken);

        var lista = linhas.Select(x => new ComentarioListagemDto
        {
            Id = x.Id,
            Corpo = x.Corpo,
            CriadoEm = x.CriadoEm,
            EditadoEm = x.EditadoEm,
            AutorNome = x.AutorNome,
            SouAutor = meuUsuarioId.HasValue && x.UsuarioId == meuUsuarioId.Value
        }).ToList();

        return Ok(lista);
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ComentarioListagemDto>> Criar(
        [FromBody] ComentarioCriarDto dto,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var existeFilme = await _db.Filmes.AnyAsync(f => f.Id == dto.FilmeId, cancellationToken);
        if (!existeFilme)
            return BadRequest(new { mensagem = "Filme não encontrado." });

        var usuario = await _usuarios.GarantirUsuarioAsync(User, cancellationToken);

        var comentario = new Comentario
        {
            UsuarioId = usuario.Id,
            FilmeId = dto.FilmeId,
            Corpo = dto.Corpo.Trim(),
            Visivel = true
        };
        _db.Comentarios.Add(comentario);
        await _db.SaveChangesAsync(cancellationToken);

        var resposta = new ComentarioListagemDto
        {
            Id = comentario.Id,
            Corpo = comentario.Corpo,
            CriadoEm = comentario.CriadoEm,
            EditadoEm = comentario.EditadoEm,
            AutorNome = usuario.NomeExibicao ?? usuario.Email,
            SouAutor = true
        };

        return CreatedAtAction(nameof(PorFilme), new { filmeId = dto.FilmeId }, resposta);
    }

    [Authorize]
    [HttpPut("{id:long}")]
    public async Task<IActionResult> Editar(long id, [FromBody] ComentarioEdicaoDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var usuario = await _usuarios.GarantirUsuarioAsync(User, cancellationToken);

        var comentario = await _db.Comentarios.FirstOrDefaultAsync(
            c => c.Id == id && c.UsuarioId == usuario.Id,
            cancellationToken);
        if (comentario is null)
            return NotFound();

        comentario.Corpo = dto.Corpo.Trim();
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
            return NotFound();

        _db.Comentarios.Remove(comentario);
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
