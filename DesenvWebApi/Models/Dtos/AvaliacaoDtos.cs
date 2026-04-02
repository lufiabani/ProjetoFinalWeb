using System.ComponentModel.DataAnnotations;

namespace DesenvWebApi.Api.Models.Dtos;

public class AvaliacaoUpsertDto
{
    [Required]
    public long FilmeId { get; set; }

    /// <summary>Nota de 1 a 10.</summary>
    [Range(1, 10)]
    public short Nota { get; set; }
}

public class AvaliacaoRespostaDto
{
    public long Id { get; set; }
    public long FilmeId { get; set; }
    public short Nota { get; set; }
    public DateTime AtualizadoEm { get; set; }
}
