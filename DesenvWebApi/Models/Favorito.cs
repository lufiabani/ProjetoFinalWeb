namespace DesenvWebApi.Api.Models;

// Liga utilizador a filme (N:N materializada); índice único (UsuarioId, FilmeId) impede duplicados.
public class Favorito
{
    public long Id { get; set; }

    public long UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }

    public long FilmeId { get; set; }
    public Filme? Filme { get; set; }

    public DateTime AdicionadoEm { get; set; }
}
