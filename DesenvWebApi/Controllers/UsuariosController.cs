using DesenvWebApi.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DesenvWebApi.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsuariosController : ControllerBase
{
    private readonly IUsuarioLocalService _usuarios;

    public UsuariosController(IUsuarioLocalService usuarios)
    {
        _usuarios = usuarios;
    }

    /// <summary>Garante o registo local do utilizador (Keycloak) e devolve o perfil.</summary>
    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(UsuarioPerfilResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<UsuarioPerfilResponse>> GetMe(CancellationToken cancellationToken)
    {
        try
        {
            var usuario = await _usuarios.GarantirUsuarioAsync(User, cancellationToken);
            return Ok(new UsuarioPerfilResponse(
                usuario.Id,
                usuario.KeycloakSub,
                usuario.Email,
                usuario.NomeExibicao));
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
    }

    public record UsuarioPerfilResponse(long Id, string KeycloakSub, string? Email, string? NomeExibicao);
}
