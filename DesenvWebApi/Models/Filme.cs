namespace DesenvWebApi.Api.Models;

/// <summary>Cache local de filme TMDB para reduzir chamadas à API externa.</summary>
public class Filme
{
    public long Id { get; set; }

    public int TmdbId { get; set; }

    public required string Titulo { get; set; }
    public string? TituloOriginal { get; set; }
    public string? Sinopse { get; set; }
    public string? PosterPath { get; set; }
    public string? BackdropPath { get; set; }

    public DateOnly? DataLancamento { get; set; }
    public int? DuracaoMinutos { get; set; }

    public decimal? NotaMediaTmdb { get; set; }
    public int? TotalVotosTmdb { get; set; }

    public string? IdiomaOriginal { get; set; }
    public string? ImdbId { get; set; }

    /// <summary>Snapshot JSON opcional (npgsql jsonb) para campos raros.</summary>
    public string? MetadadosTmdbJson { get; set; }

    public DateTime SincronizadoEm { get; set; }
    public DateTime CriadoEm { get; set; }
    public DateTime AtualizadoEm { get; set; }

    public ICollection<FilmeGenero> FilmeGeneros { get; set; } = new List<FilmeGenero>();
    public ICollection<Favorito> Favoritos { get; set; } = new List<Favorito>();
    public ICollection<AvaliacaoUsuario> Avaliacoes { get; set; } = new List<AvaliacaoUsuario>();
    public ICollection<Comentario> Comentarios { get; set; } = new List<Comentario>();
}
