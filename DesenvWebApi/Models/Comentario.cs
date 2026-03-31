namespace DesenvWebApi.Api.Models;

public class Comentario
{
    public long Id { get; set; }

    public long UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;

    public long FilmeId { get; set; }
    public Filme Filme { get; set; } = null!;

    public required string Corpo { get; set; }

    public DateTime CriadoEm { get; set; }
    public DateTime EditadoEm { get; set; }

    public bool Visivel { get; set; } = true;
}
