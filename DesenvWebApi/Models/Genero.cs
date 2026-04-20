namespace DesenvWebApi.Api.Models;

// Género de filme espelhado do TMDB (TmdbId único) para ligar filmes importados sem lista fixa manual.
public class Genero
{
    public int Id { get; set; }
    public int TmdbId { get; set; }
    public required string Nome { get; set; }
    public DateTime SincronizadoEm { get; set; }

    public ICollection<Filme> Filmes { get; set; } = new List<Filme>();
}
