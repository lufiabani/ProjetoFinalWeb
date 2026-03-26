// Models/Produto.cs

namespace DesenvWebApi.Api.Models;

// A classe Produto representa a tabela "Produtos" no banco de dados.
// O Entity Framework usa esta classe para:
//   1. Criar a tabela via Migration
//   2. Ler e escrever dados na tabela
//   3. Mapear resultados de queries para objetos C#
//
// Convenção de nomenclatura do EF:
//   - O nome da tabela no banco será o nome da classe no plural: "Produtos"
//   - A propriedade "Id" é automaticamente reconhecida como chave primária
public class Produto
{
    // Chave primária — identificador único do produto.
    // O EF reconhece "Id" automaticamente como PK.
    // No banco: coluna "Id" INTEGER PRIMARY KEY AUTOINCREMENT
    public int Id { get; set; }

    // Nome do produto — campo obrigatório.
    // "required" garante que o C# não permite criar um Produto sem Nome.
    // No banco: coluna "Nome" TEXT NOT NULL
    public required string Nome { get; set; }

    // Descrição do produto — campo opcional.
    // "?" indica que a propriedade pode ser nula (nullable).
    // No banco: coluna "Descricao" TEXT NULL
    public string? Descricao { get; set; }

    // Preço do produto.
    // "decimal" é o tipo C# para valores monetários — evita erros de ponto flutuante.
    // No banco: coluna "Preco" NUMERIC
    public decimal Preco { get; set; }

    // Quantidade em estoque.
    // No banco: coluna "Quantidade" INTEGER
    public int Quantidade { get; set; }

    // Data e hora de criação do produto.
    // Inicializado automaticamente com a data/hora atual em UTC.
    // UTC (Coordinated Universal Time) é o padrão para armazenar datas em bancos.
    // No banco: coluna "DataCriacao" TIMESTAMP WITH TIME ZONE
    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
}