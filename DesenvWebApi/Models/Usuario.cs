namespace DesenvWebApi.Api.Models;

/// <summary>Perfil local vinculado ao utilizador do Keycloak (claim "sub"). Credenciais ficam no IdP.</summary>
public class Usuario
{
    public long Id { get; set; }

    /// <summary>Identificador único do Keycloak (UUID na claim "sub").</summary>
    public required string KeycloakSub { get; set; }

    public string? Email { get; set; }
    public string? NomeExibicao { get; set; }

    public DateTime CriadoEm { get; set; }
    public DateTime AtualizadoEm { get; set; }

    public ICollection<Favorito> Favoritos { get; set; } = new List<Favorito>();
    public ICollection<AvaliacaoUsuario> Avaliacoes { get; set; } = new List<AvaliacaoUsuario>();
    public ICollection<Comentario> Comentarios { get; set; } = new List<Comentario>();
}
