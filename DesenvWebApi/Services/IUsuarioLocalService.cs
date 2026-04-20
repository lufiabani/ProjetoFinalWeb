using System.Security.Claims;
using DesenvWebApi.Api.Models;

namespace DesenvWebApi.Api.Services;

public interface IUsuarioLocalService
{
    // Cria ou atualiza o Utilizador local a partir do token (sub, email, nome) antes de favoritos/comentários.
    Task<Usuario> GarantirUsuarioAsync(ClaimsPrincipal principal, CancellationToken cancellationToken = default);
}
