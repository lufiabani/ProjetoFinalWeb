namespace DesenvWebApi.Api.Models;

/// <summary>Uma avaliação numérica por utilizador e filme (ex.: escala 1–10).</summary>
public class AvaliacaoUsuario
{
    public long Id { get; set; }

    public long UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;

    public long FilmeId { get; set; }
    public Filme Filme { get; set; } = null!;

    public short Nota { get; set; }

    public DateTime CriadoEm { get; set; }
    public DateTime AtualizadoEm { get; set; }
}
