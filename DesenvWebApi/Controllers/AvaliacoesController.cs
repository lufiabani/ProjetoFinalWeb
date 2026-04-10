using DesenvWebApi.Api.Data;
using DesenvWebApi.Api.Models;
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
    public async Task<ActionResult<IEnumerable<AvaliacaoUsuario>>> Minhas(CancellationToken cancellationToken)
    {
        var usuario = await _usuarios.GarantirUsuarioAsync(User, cancellationToken);

        var lista = await _db.AvaliacoesUsuario
            .AsNoTracking()
            .Where(a => a.UsuarioId == usuario.Id)
            .OrderByDescending(a => a.AtualizadoEm)
            .ToListAsync(cancellationToken);

        return Ok(lista);
    }

    /// <summary>Cria ou atualiza a nota (1–10) do utilizador para o filme.</summary>
    [HttpPut]
    public async Task<ActionResult<AvaliacaoUsuario>> Upsert([FromBody] AvaliacaoUsuario entrada, CancellationToken cancellationToken)
    {
        if (entrada.FilmeId <= 0)
            return BadRequest(new { mensagem = "FilmeId inválido." });
        if (entrada.Nota < 1 || entrada.Nota > 10)
            return BadRequest(new { mensagem = "A nota deve estar entre 1 e 10." });

        var existeFilme = await _db.Filmes.AnyAsync(f => f.Id == entrada.FilmeId, cancellationToken);
        if (!existeFilme)
            return BadRequest(new { mensagem = "Filme não encontrado." });

        var usuario = await _usuarios.GarantirUsuarioAsync(User, cancellationToken);

        var avaliacao = await _db.AvaliacoesUsuario.FirstOrDefaultAsync(
            a => a.UsuarioId == usuario.Id && a.FilmeId == entrada.FilmeId,
            cancellationToken);

        if (avaliacao is null)
        {
            avaliacao = new AvaliacaoUsuario
            {
                UsuarioId = usuario.Id,
                FilmeId = entrada.FilmeId,
                Nota = entrada.Nota
            };
            _db.AvaliacoesUsuario.Add(avaliacao);
        }
        else
        {
            avaliacao.Nota = entrada.Nota;
        }

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(avaliacao);
    }
}
