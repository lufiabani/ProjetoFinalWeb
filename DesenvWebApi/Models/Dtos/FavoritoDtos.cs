using System.ComponentModel.DataAnnotations;

namespace DesenvWebApi.Api.Models.Dtos;

public class FavoritoCriarDto
{
    [Required]
    public long FilmeId { get; set; }
}

public class FavoritoListagemDto
{
    public long FavoritoId { get; set; }
    public DateTime AdicionadoEm { get; set; }
    public FilmeResumoDto Filme { get; set; } = null!;
}
