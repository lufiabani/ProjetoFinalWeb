using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace DesenvWebApi.Api.Migrations
{
    /// <inheritdoc />
    public partial class InicialSistemaFilmesKeycloak : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Filmes",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TmdbId = table.Column<int>(type: "integer", nullable: false),
                    Titulo = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    TituloOriginal = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    Sinopse = table.Column<string>(type: "text", nullable: true),
                    PosterPath = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    BackdropPath = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    DataLancamento = table.Column<DateOnly>(type: "date", nullable: true),
                    DuracaoMinutos = table.Column<int>(type: "integer", nullable: true),
                    NotaMediaTmdb = table.Column<decimal>(type: "numeric(4,2)", precision: 4, scale: 2, nullable: true),
                    TotalVotosTmdb = table.Column<int>(type: "integer", nullable: true),
                    IdiomaOriginal = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    ImdbId = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    MetadadosTmdbJson = table.Column<string>(type: "jsonb", nullable: true),
                    SincronizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Filmes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Generos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TmdbId = table.Column<int>(type: "integer", nullable: false),
                    Nome = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    SincronizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Generos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    KeycloakSub = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: true),
                    NomeExibicao = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FilmeGeneros",
                columns: table => new
                {
                    FilmeId = table.Column<long>(type: "bigint", nullable: false),
                    GeneroId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FilmeGeneros", x => new { x.FilmeId, x.GeneroId });
                    table.ForeignKey(
                        name: "FK_FilmeGeneros_Filmes_FilmeId",
                        column: x => x.FilmeId,
                        principalTable: "Filmes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FilmeGeneros_Generos_GeneroId",
                        column: x => x.GeneroId,
                        principalTable: "Generos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AvaliacoesUsuario",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UsuarioId = table.Column<long>(type: "bigint", nullable: false),
                    FilmeId = table.Column<long>(type: "bigint", nullable: false),
                    Nota = table.Column<short>(type: "smallint", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AvaliacoesUsuario", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AvaliacoesUsuario_Filmes_FilmeId",
                        column: x => x.FilmeId,
                        principalTable: "Filmes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AvaliacoesUsuario_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Comentarios",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UsuarioId = table.Column<long>(type: "bigint", nullable: false),
                    FilmeId = table.Column<long>(type: "bigint", nullable: false),
                    Corpo = table.Column<string>(type: "text", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EditadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Visivel = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Comentarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Comentarios_Filmes_FilmeId",
                        column: x => x.FilmeId,
                        principalTable: "Filmes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Comentarios_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Favoritos",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UsuarioId = table.Column<long>(type: "bigint", nullable: false),
                    FilmeId = table.Column<long>(type: "bigint", nullable: false),
                    AdicionadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Favoritos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Favoritos_Filmes_FilmeId",
                        column: x => x.FilmeId,
                        principalTable: "Filmes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Favoritos_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AvaliacoesUsuario_FilmeId",
                table: "AvaliacoesUsuario",
                column: "FilmeId");

            migrationBuilder.CreateIndex(
                name: "IX_AvaliacoesUsuario_UsuarioId_FilmeId",
                table: "AvaliacoesUsuario",
                columns: new[] { "UsuarioId", "FilmeId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Comentarios_FilmeId",
                table: "Comentarios",
                column: "FilmeId");

            migrationBuilder.CreateIndex(
                name: "IX_Comentarios_UsuarioId",
                table: "Comentarios",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Favoritos_FilmeId",
                table: "Favoritos",
                column: "FilmeId");

            migrationBuilder.CreateIndex(
                name: "IX_Favoritos_UsuarioId_FilmeId",
                table: "Favoritos",
                columns: new[] { "UsuarioId", "FilmeId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FilmeGeneros_GeneroId",
                table: "FilmeGeneros",
                column: "GeneroId");

            migrationBuilder.CreateIndex(
                name: "IX_Filmes_TmdbId",
                table: "Filmes",
                column: "TmdbId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Generos_TmdbId",
                table: "Generos",
                column: "TmdbId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_KeycloakSub",
                table: "Usuarios",
                column: "KeycloakSub",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AvaliacoesUsuario");

            migrationBuilder.DropTable(
                name: "Comentarios");

            migrationBuilder.DropTable(
                name: "Favoritos");

            migrationBuilder.DropTable(
                name: "FilmeGeneros");

            migrationBuilder.DropTable(
                name: "Usuarios");

            migrationBuilder.DropTable(
                name: "Filmes");

            migrationBuilder.DropTable(
                name: "Generos");
        }
    }
}
