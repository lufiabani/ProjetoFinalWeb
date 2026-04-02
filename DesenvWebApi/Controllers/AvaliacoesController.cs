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
public class AvaliacoesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IUsuarioLocalService _usuarios;

    public AvaliacoesController(AppDbContext db, IUsuarioLocalService usuarios)
    {
        _db = db;
        _usuarios = usuarios;
    }

    [HttpGet("minhas")]
    public async Task<ActionResult<IEnumerable<AvaliacaoRespostaDto>>> Minhas(CancellationToken cancellationToken)
    {
        var usuario = await _usuarios.GarantirUsuarioAsync(User, cancellationToken);

        var lista = await _db.AvaliacoesUsuario
            .AsNoTracking()
            .Where(a => a.UsuarioId == usuario.Id)
            .OrderByDescending(a => a.AtualizadoEm)
            .Select(a => new AvaliacaoRespostaDto
            {
                Id = a.Id,
                FilmeId = a.FilmeId,
                Nota = a.Nota,
                AtualizadoEm = a.AtualizadoEm
            })
            .ToListAsync(cancellationToken);

        return Ok(lista);
    }

    /// <summary>Cria ou atualiza a nota (1–10) do utilizador para o filme.</summary>
    [HttpPut]
    public async Task<ActionResult<AvaliacaoRespostaDto>> Upsert([FromBody] AvaliacaoUpsertDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var existeFilme = await _db.Filmes.AnyAsync(f => f.Id == dto.FilmeId, cancellationToken);
        if (!existeFilme)
            return BadRequest(new { mensagem = "Filme não encontrado." });

        var usuario = await _usuarios.GarantirUsuarioAsync(User, cancellationToken);

        var avaliacao = await _db.AvaliacoesUsuario.FirstOrDefaultAsync(
            a => a.UsuarioId == usuario.Id && a.FilmeId == dto.FilmeId,
            cancellationToken);

        if (avaliacao is null)
        {
            avaliacao = new AvaliacaoUsuario
            {
                UsuarioId = usuario.Id,
                FilmeId = dto.FilmeId,
                Nota = dto.Nota
            };
            _db.AvaliacoesUsuario.Add(avaliacao);
        }
        else
        {
            avaliacao.Nota = dto.Nota;
        }

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new AvaliacaoRespostaDto
        {
            Id = avaliacao.Id,
            FilmeId = avaliacao.FilmeId,
            Nota = avaliacao.Nota,
            AtualizadoEm = avaliacao.AtualizadoEm
        });
    }
}
