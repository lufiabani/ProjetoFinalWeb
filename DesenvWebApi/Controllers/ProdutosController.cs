// Controllers/ProdutosController.cs



using Microsoft.AspNetCore.Mvc;

using Microsoft.EntityFrameworkCore;

using DesenvWebApi.Api.Data;

using DesenvWebApi.Api.Models;



namespace DesenvWebApi.Api.Controllers;



// [ApiController] adiciona comportamentos automáticos úteis:

//   - Valida automaticamente o ModelState (dados recebidos)

//   - Retorna 400 automaticamente se dados obrigatórios faltarem

//   - Lê o body da requisição como JSON automaticamente

[ApiController]



// [Route("api/[controller]")] define o prefixo da URL para todos os endpoints.

// [controller] é substituído pelo nome da classe sem "Controller":

// ProdutosController → "Produtos"

// Resultado: todos os endpoints começam com /api/produtos

[Route("api/[controller]")]

public class ProdutosController : ControllerBase

{

    // _context é nossa instância do AppDbContext.

    // É através dele que fazemos todas as operações no banco.

    // O "readonly" garante que não podemos reatribuir _context depois do construtor.

    private readonly AppDbContext _context;



    // Construtor com Injeção de Dependência.

    // O .NET vê que o construtor precisa de um AppDbContext

    // e automaticamente cria e injeta um (porque registramos no Program.cs).

    // Você nunca vai chamar "new ProdutosController()" manualmente.

    public ProdutosController(AppDbContext context)

    {

        _context = context;

    }



    // =====================================================================

    // GET /api/produtos

    // Retorna todos os produtos cadastrados.

    //

    // HTTP GET é usado para LEITURA — não modifica dados no servidor.

    // IEnumerable<Produto> indica que retornamos uma coleção de produtos.

    // async/await permite que o servidor atenda outras requisições

    // enquanto espera o banco de dados responder.

    // =====================================================================

    [HttpGet]

    public async Task<ActionResult<IEnumerable<Produto>>> GetProdutos()

    {

        // _context.Produtos é o DbSet<Produto> — representa a tabela "Produtos".

        // .ToListAsync() executa: SELECT * FROM "Produtos"

        // e retorna o resultado como uma List<Produto>.

        var produtos = await _context.Produtos.ToListAsync();



        // Ok(produtos) retorna HTTP 200 com os produtos serializados em JSON.

        return Ok(produtos);

    }



    // =====================================================================

    // GET /api/produtos/5

    // Retorna um único produto pelo ID.

    //

    // {id} na rota é um parâmetro dinâmico — o valor da URL é capturado

    // e passado como parâmetro para o método.

    // Exemplo: GET /api/produtos/3 → id = 3

    // =====================================================================

    [HttpGet("{id}")]

    public async Task<ActionResult<Produto>> GetProduto(int id)

    {

        // FindAsync busca pelo valor da chave primária.

        // Equivalente a: SELECT * FROM "Produtos" WHERE "Id" = @id LIMIT 1

        // Retorna null se não encontrar.

        var produto = await _context.Produtos.FindAsync(id);



        // Se o produto não foi encontrado, retornamos HTTP 404 Not Found

        // com uma mensagem explicativa em JSON.

        if (produto == null)

        {

            return NotFound(new { mensagem = $"Produto com ID {id} não encontrado." });

        }



        // HTTP 200 com o produto encontrado

        return Ok(produto);

    }



    // =====================================================================

    // POST /api/produtos

    // Cria um novo produto.

    //

    // [FromBody] indica que o objeto Produto vem no corpo (body) da requisição

    // em formato JSON. O .NET desserializa automaticamente.

    //

    // Exemplo de body JSON:

    // {

    //   "nome": "Notebook Dell XPS",

    //   "descricao": "16GB RAM, SSD 512GB",

    //   "preco": 4500.00,

    //   "quantidade": 10

    // }

    // =====================================================================

    [HttpPost]

    public async Task<ActionResult<Produto>> PostProduto(Produto produto)

    {

        // Garante que a data de criação seja sempre definida pelo servidor,

        // independente do que o cliente enviou.

        produto.DataCriacao = DateTime.UtcNow;



        // Adiciona o produto à "fila de inserção" do EF.

        // O produto ainda NÃO foi salvo no banco aqui.

        _context.Produtos.Add(produto);



        // SaveChangesAsync() executa o INSERT no banco de dados:

        // INSERT INTO "Produtos" ("Nome", "Descricao", "Preco", "Quantidade", "DataCriacao")

        // VALUES (@nome, @desc, @preco, @qtd, @data)

        // Após o SaveChanges, o objeto produto.Id é preenchido com o ID gerado pelo banco.

        await _context.SaveChangesAsync();



        // CreatedAtAction retorna HTTP 201 Created.

        // - nameof(GetProduto): referência ao método que busca por ID

        // - new { id = produto.Id }: parâmetro para montar a URL de localização

        // - produto: o objeto criado (com o Id preenchido pelo banco)

        //

        // O HTTP 201 inclui um header "Location" com a URL do recurso criado:

        // Location: https://localhost:5217/api/produtos/1

        return CreatedAtAction(nameof(GetProduto), new { id = produto.Id }, produto);

    }



    // =====================================================================

    // PUT /api/produtos/5

    // Atualiza um produto existente.

    //

    // PUT substitui o recurso completo — você deve enviar todos os campos.

    // Diferente do PATCH, que atualiza apenas campos específicos.

    //

    // O ID vem tanto na URL (/api/produtos/5) quanto no body do JSON ({"id": 5}).

    // Verificamos se são iguais para evitar atualizações acidentais.

    // =====================================================================

    [HttpPut("{id}")]

    public async Task<IActionResult> PutProduto([FromRoute]int id, [FromBody] Produto produto)

    {

        // Verifica se o ID da URL corresponde ao ID do produto no body.

        // Evita bugs onde o cliente envia o ID errado no body.

        if (id != produto.Id)

        {

            return BadRequest(new { mensagem = "O ID da URL não corresponde ao ID do produto no body." });

        }



        // Verificamos se o produto existe antes de tentar atualizar.

        var produtoExistente = await _context.Produtos.FindAsync(id);



        if (produtoExistente == null)

        {

            return NotFound(new { mensagem = $"Produto com ID {id} não encontrado." });

        }



        // Atualizamos apenas os campos que fazem sentido mudar.

        // Não alteramos o Id (chave primária) nem a DataCriacao.

        produtoExistente.Nome = produto.Nome;

        produtoExistente.Descricao = produto.Descricao;

        produtoExistente.Preco = produto.Preco;

        produtoExistente.Quantidade = produto.Quantidade;



        // SaveChangesAsync executa o UPDATE no banco:

        // UPDATE "Produtos"

        // SET "Nome" = @nome, "Descricao" = @desc, "Preco" = @preco, "Quantidade" = @qtd

        // WHERE "Id" = @id

        await _context.SaveChangesAsync();



        // NoContent() retorna HTTP 204 — operação bem-sucedida, sem body de resposta.

        // É o padrão REST para respostas de PUT/DELETE bem-sucedidos.

        return NoContent();

    }



    // =====================================================================

    // DELETE /api/produtos/5

    // Remove um produto pelo ID.

    // =====================================================================

    [HttpDelete("{id}")]

    public async Task<IActionResult> DeleteProduto(int id)

    {

        // Busca o produto antes de tentar deletar.

        var produto = await _context.Produtos.FindAsync(id);



        // Se não existe, retorna 404.

        if (produto == null)

        {

            return NotFound(new { mensagem = $"Produto com ID {id} não encontrado." });

        }



        // Marca o produto para remoção na "fila de operações" do EF.

        _context.Produtos.Remove(produto);



        // Executa o DELETE no banco:

        // DELETE FROM "Produtos" WHERE "Id" = @id

        await _context.SaveChangesAsync();



        // HTTP 204 — produto deletado com sucesso, sem body de resposta.

        return NoContent();

    }

}