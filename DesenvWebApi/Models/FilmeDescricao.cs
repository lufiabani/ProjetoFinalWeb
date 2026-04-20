namespace DesenvWebApi.Api.Models;

// Texto e metadados “pesados” do TMDB — um registo por filme (relação 1:1; índice UNIQUE em FilmeId).
public class FilmeDescricao
{
    public long Id { get; set; }

    public long FilmeId { get; set; }
    // Opcional no JSON de entrada; o EF preenche FilmeId quando vem do pai.
    public Filme? Filme { get; set; }

    public string? TituloOriginal { get; set; }
    public string? Resumo { get; set; }
    public string? BackdropPath { get; set; }

    public int? DuracaoMinutos { get; set; }

    public decimal? NotaMediaTmdb { get; set; }
    public int? TotalVotosTmdb { get; set; }

    public string? IdiomaOriginal { get; set; }
    public string? ImdbId { get; set; }

    // Snapshot JSON (jsonb) para campos raros ou futuros sem alterar o esquema relacional.
    public string? MetadadosTmdbJson { get; set; }

    public DateTime CriadoEm { get; set; }
    public DateTime AtualizadoEm { get; set; }
}
