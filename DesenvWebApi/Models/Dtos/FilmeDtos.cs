using System.ComponentModel.DataAnnotations;

namespace DesenvWebApi.Api.Models.Dtos;

public class FilmeUpsertDto
{
    [Required]
    public int TmdbId { get; set; }

    [Required]
    [MaxLength(512)]
    public string Titulo { get; set; } = string.Empty;

    [MaxLength(512)]
    public string? TituloOriginal { get; set; }

    public string? Sinopse { get; set; }

    [MaxLength(512)]
    public string? PosterPath { get; set; }

    [MaxLength(512)]
    public string? BackdropPath { get; set; }

    public DateOnly? DataLancamento { get; set; }
    public int? DuracaoMinutos { get; set; }

    [Range(0, 10)]
    public decimal? NotaMediaTmdb { get; set; }

    public int? TotalVotosTmdb { get; set; }

    [MaxLength(16)]
    public string? IdiomaOriginal { get; set; }

    [MaxLength(32)]
    public string? ImdbId { get; set; }

    public string? MetadadosTmdbJson { get; set; }
}

public class FilmeResumoDto
{
    public long Id { get; set; }
    public int TmdbId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? TituloOriginal { get; set; }
    public string? PosterPath { get; set; }
    public DateOnly? DataLancamento { get; set; }
    public decimal? NotaMediaTmdb { get; set; }
}
