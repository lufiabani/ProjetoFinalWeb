namespace DesenvWebApi.Api.Models;

// Comentário público num filme; Visivel reserva espaço para moderação futura sem apagar o registo.
public class Comentario
{
    public long Id { get; set; }

    public long UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }

    public long FilmeId { get; set; }
    public Filme? Filme { get; set; }

    public required string Corpo { get; set; }

    public DateTime CriadoEm { get; set; }
    public DateTime EditadoEm { get; set; }

    public bool Visivel { get; set; } = true;
}
