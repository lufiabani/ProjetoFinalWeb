using System.ComponentModel.DataAnnotations;

namespace DesenvWebApi.Api.Models.Dtos;

public class ComentarioCriarDto
{
    [Required]
    public long FilmeId { get; set; }

    [Required]
    [MinLength(1)]
    [MaxLength(8000)]
    public string Corpo { get; set; } = string.Empty;
}

public class ComentarioEdicaoDto
{
    [Required]
    [MinLength(1)]
    [MaxLength(8000)]
    public string Corpo { get; set; } = string.Empty;
}

public class ComentarioListagemDto
{
    public long Id { get; set; }
    public string Corpo { get; set; } = string.Empty;
    public DateTime CriadoEm { get; set; }
    public DateTime EditadoEm { get; set; }
    public string? AutorNome { get; set; }

    /// <summary>True se o token JWT corresponde ao autor do comentário.</summary>
    public bool SouAutor { get; set; }
}
