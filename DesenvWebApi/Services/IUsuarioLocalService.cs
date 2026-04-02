using System.Security.Claims;
using DesenvWebApi.Api.Models;

namespace DesenvWebApi.Api.Services;

public interface IUsuarioLocalService
{
    /// <summary>Garante <see cref="Usuario"/> na BD a partir das claims do Keycloak e persiste alterações de perfil.</summary>
    Task<Usuario> GarantirUsuarioAsync(ClaimsPrincipal principal, CancellationToken cancellationToken = default);
}
