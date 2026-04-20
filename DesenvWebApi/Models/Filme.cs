namespace DesenvWebApi.Api.Models;

// Cache local do filme (dados “leves” + TMDB). Sinopse e metadados longos ficam em FilmeDescricao (1:1).
public class Filme
{
    public long Id { get; set; }

    public int TmdbId { get; set; }

    // Um género principal por filme (alinhado ao fluxo de importação TMDB).
    public int GeneroId { get; set; }
    // Só para serialização/leitura com Include — na gravação basta GeneroId.
    public Genero? Genero { get; set; }

    public required string Titulo { get; set; }
    public string? PosterPath { get; set; }

    public DateOnly? DataLancamento { get; set; }

    public DateTime SincronizadoEm { get; set; }
    public DateTime CriadoEm { get; set; }
    public DateTime AtualizadoEm { get; set; }

    public FilmeDescricao? FilmeDescricao { get; set; }

    public ICollection<Favorito> Favoritos { get; set; } = new List<Favorito>();
    public ICollection<Comentario> Comentarios { get; set; } = new List<Comentario>();
}
