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
    public async Task<IActionResult> GetMe(CancellationToken cancellationToken)
    {
        try
        {
            var usuario = await _usuarios.GarantirUsuarioAsync(User, cancellationToken);
            return Ok(new
            {
                usuario.Id,
                usuario.KeycloakSub,
                usuario.Email,
                usuario.NomeExibicao
            });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
    }
}
