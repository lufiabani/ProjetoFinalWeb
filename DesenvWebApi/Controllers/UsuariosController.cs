using DesenvWebApi.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DesenvWebApi.Api.Controllers;

// UsuariosController — perfil mínimo do utilizador local após login Keycloak.
[ApiController]
[Route("api/[controller]")]
public class UsuariosController : ControllerBase
{
    private readonly IUsuarioLocalService _usuarios;

    public UsuariosController(IUsuarioLocalService usuarios)
    {
        _usuarios = usuarios;
    }

    // GET /api/usuarios/me — cria/atualiza o registo local e devolve id, email e nome de exibição.
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
