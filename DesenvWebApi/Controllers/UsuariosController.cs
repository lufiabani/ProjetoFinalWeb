using System.IdentityModel.Tokens.Jwt;
using DesenvWebApi.Api.Data;
using DesenvWebApi.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DesenvWebApi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsuariosController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsuariosController(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>Garante o registo local do utilizador (Keycloak) e devolve o perfil.</summary>
    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(UsuarioPerfilResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<UsuarioPerfilResponse>> GetMe(CancellationToken cancellationToken)
    {
        var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(sub))
            return Unauthorized();

        var email = User.FindFirst(JwtRegisteredClaimNames.Email)?.Value
            ?? User.FindFirst("email")?.Value;
        var nome = User.FindFirst("name")?.Value
            ?? User.FindFirst("given_name")?.Value
            ?? User.FindFirst("preferred_username")?.Value;

        var agora = DateTime.UtcNow;
        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.KeycloakSub == sub, cancellationToken);

        if (usuario is null)
        {
            usuario = new Usuario
            {
                KeycloakSub = sub,
                Email = email,
                NomeExibicao = nome,
                CriadoEm = agora,
                AtualizadoEm = agora
            };
            _db.Usuarios.Add(usuario);
        }
        else
        {
            usuario.Email = email;
            usuario.NomeExibicao = nome;
            usuario.AtualizadoEm = agora;
        }

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new UsuarioPerfilResponse(
            usuario.Id,
            usuario.KeycloakSub,
            usuario.Email,
            usuario.NomeExibicao));
    }

    public record UsuarioPerfilResponse(long Id, string KeycloakSub, string? Email, string? NomeExibicao);
}
