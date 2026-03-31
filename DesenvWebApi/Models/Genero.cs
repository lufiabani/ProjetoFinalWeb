namespace DesenvWebApi.Api.Models;

public class Genero
{
    public int Id { get; set; }
    public int TmdbId { get; set; }
    public required string Nome { get; set; }
    public DateTime SincronizadoEm { get; set; }

    public ICollection<FilmeGenero> FilmeGeneros { get; set; } = new List<FilmeGenero>();
}
