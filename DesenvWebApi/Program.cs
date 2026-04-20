// Program.cs — arranque da API: serviços, PostgreSQL, JWT (Keycloak), Swagger e CORS.
using DesenvWebApi.Api.Data;
using DesenvWebApi.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Evita ciclo de serialização em relacionamentos (Include + navegação inversa).
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// Liga o utilizador do token às tabelas locais (favoritos, comentários) sem duplicar lógica nos controladores.
builder.Services.AddScoped<IUsuarioLocalService, UsuarioLocalService>();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Autenticação JWT emitida pelo Keycloak — a API só valida o token; não gere passwords aqui.
var keycloak = builder.Configuration.GetSection("Authentication:Keycloak");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = keycloak["Authority"];
        options.RequireHttpsMetadata = keycloak.GetValue("RequireHttpsMetadata", false);
        options.MapInboundClaims = false;
        var audience = keycloak["Audience"];
        options.TokenValidationParameters = new TokenValidationParameters
        {
            NameClaimType = "preferred_username",
            ValidateAudience = !string.IsNullOrWhiteSpace(audience),
            ValidAudience = string.IsNullOrWhiteSpace(audience) ? null : audience
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddEndpointsApiExplorer();
// Swagger com botão "Authorize" para testar rotas protegidas com Bearer token.
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "DesenvWeb API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT do Keycloak. Ex.: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// CORS permissivo para o SPA em desenvolvimento (Vite noutra origem/porta).
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirTudo", policy =>
        policy.AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("PermitirTudo");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
