using System.ComponentModel.DataAnnotations;

namespace DesenvWebApi.Api.Models.Dtos;

public class GeneroSyncDto
{
    [Required]
    public int TmdbId { get; set; }

    [Required]
    [MaxLength(128)]
    public string Nome { get; set; } = string.Empty;
}

public class GeneroRespostaDto
{
    public int Id { get; set; }
    public int TmdbId { get; set; }
    public string Nome { get; set; } = string.Empty;
}
