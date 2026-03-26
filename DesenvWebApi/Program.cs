// Program.cs



using Microsoft.EntityFrameworkCore;

using DesenvWebApi.Api.Data;



// =====================================================================

// BUILDER — fase de configuração

// Aqui registramos todos os serviços que a aplicação vai usar.

// =====================================================================

var builder = WebApplication.CreateBuilder(args);



// Registra os Controllers no sistema de Injeção de Dependência.

// Sem isso, o .NET não sabe que existem Controllers na aplicação.

builder.Services.AddControllers();



// Registra o AppDbContext no sistema de Injeção de Dependência.

// Isso permite que os Controllers recebam o AppDbContext automaticamente

// no construtor (isso é chamado de Injeção de Dependência).

//

// options.UseNpgsql(...) diz ao EF para usar o PostgreSQL como banco.

// builder.Configuration.GetConnectionString("DefaultConnection") lê

// a connection string do appsettings.json.

builder.Services.AddDbContext<AppDbContext>(options =>

    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));



// Adiciona o Swagger/OpenAPI — interface web para testar a API.

// AddEndpointsApiExplorer() descobre os endpoints disponíveis.

// AddSwaggerGen() gera a documentação interativa da API.

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen();



// Configura CORS (Cross-Origin Resource Sharing).

// Isso permite que o frontend React (que roda em outra porta)

// faça requisições para a API sem ser bloqueado pelo navegador.

builder.Services.AddCors(options =>

{

    options.AddPolicy("PermitirTudo", policy =>

    {

        policy.AllowAnyOrigin()   // Permite qualquer origem (domínio/porta)

              .AllowAnyMethod()   // Permite GET, POST, PUT, DELETE, etc.

              .AllowAnyHeader();  // Permite qualquer cabeçalho HTTP

    });

});



// =====================================================================

// APP — fase de execução

// Aqui configuramos o pipeline de middlewares (o que acontece com cada

// requisição HTTP antes de chegar no Controller).

// =====================================================================

var app = builder.Build();



// Ativa o Swagger apenas no ambiente de desenvolvimento.

// Em produção, a documentação seria protegida ou desativada.

if (app.Environment.IsDevelopment())

{

    app.UseSwagger();

    app.UseSwaggerUI();

}



// Ativa o CORS com a política que definimos acima.

// IMPORTANTE: deve vir ANTES do MapControllers().

app.UseCors("PermitirTudo");



// Ativa o roteamento de requisições para os Controllers.

// É aqui que o .NET olha para a URL da requisição e decide

// qual Controller e qual método deve ser chamado.

app.MapControllers();



// Inicia a aplicação e fica escutando requisições HTTP.

app.Run();
