namespace DesenvWebApi.Api.Models;

// Perfil na nossa base ligado ao Keycloak (sub). Passwords e MFA ficam no IdP.
public class Usuario
{
    public long Id { get; set; }

    // Identificador estável do Keycloak (claim "sub").
    public required string KeycloakSub { get; set; }

    public string? Email { get; set; }
    public string? NomeExibicao { get; set; }

    public DateTime CriadoEm { get; set; }
    public DateTime AtualizadoEm { get; set; }

    public ICollection<Favorito> Favoritos { get; set; } = new List<Favorito>();
    public ICollection<Comentario> Comentarios { get; set; } = new List<Comentario>();
}
