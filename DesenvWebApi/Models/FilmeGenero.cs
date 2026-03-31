namespace DesenvWebApi.Api.Models;

public class FilmeGenero
{
    public long FilmeId { get; set; }
    public Filme Filme { get; set; } = null!;

    public int GeneroId { get; set; }
    public Genero Genero { get; set; } = null!;
}
