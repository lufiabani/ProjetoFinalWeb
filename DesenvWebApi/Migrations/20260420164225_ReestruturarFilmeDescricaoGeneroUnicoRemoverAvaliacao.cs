using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace DesenvWebApi.Api.Migrations
{
    /// <inheritdoc />
    public partial class ReestruturarFilmeDescricaoGeneroUnicoRemoverAvaliacao : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AvaliacoesUsuario");

            migrationBuilder.CreateTable(
                name: "FilmeDescricoes",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FilmeId = table.Column<long>(type: "bigint", nullable: false),
                    TituloOriginal = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    Resumo = table.Column<string>(type: "text", nullable: true),
                    BackdropPath = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    DuracaoMinutos = table.Column<int>(type: "integer", nullable: true),
                    NotaMediaTmdb = table.Column<decimal>(type: "numeric(4,2)", precision: 4, scale: 2, nullable: true),
                    TotalVotosTmdb = table.Column<int>(type: "integer", nullable: true),
                    IdiomaOriginal = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    ImdbId = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    MetadadosTmdbJson = table.Column<string>(type: "jsonb", nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FilmeDescricoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FilmeDescricoes_Filmes_FilmeId",
                        column: x => x.FilmeId,
                        principalTable: "Filmes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FilmeDescricoes_FilmeId",
                table: "FilmeDescricoes",
                column: "FilmeId",
                unique: true);

            // Copia texto e metadados TMDB para a nova tabela antes de remover colunas em Filmes.
            migrationBuilder.Sql("""
                INSERT INTO "FilmeDescricoes" ("FilmeId", "TituloOriginal", "Resumo", "BackdropPath", "DuracaoMinutos", "NotaMediaTmdb", "TotalVotosTmdb", "IdiomaOriginal", "ImdbId", "MetadadosTmdbJson", "CriadoEm", "AtualizadoEm")
                SELECT f."Id", f."TituloOriginal", f."Sinopse", f."BackdropPath", f."DuracaoMinutos", f."NotaMediaTmdb", f."TotalVotosTmdb", f."IdiomaOriginal", f."ImdbId", f."MetadadosTmdbJson", f."CriadoEm", f."AtualizadoEm"
                FROM "Filmes" f;
                """);

            migrationBuilder.AddColumn<int>(
                name: "GeneroId",
                table: "Filmes",
                type: "integer",
                nullable: true);

            // Um género por filme: primeiro género associado em FilmeGeneros; se não houver, cai no primeiro género cadastrado.
            migrationBuilder.Sql("""
                UPDATE "Filmes" f
                SET "GeneroId" = (
                    SELECT fg."GeneroId" FROM "FilmeGeneros" fg
                    WHERE fg."FilmeId" = f."Id" ORDER BY fg."GeneroId" LIMIT 1
                );
                """);

            // Se não existir nenhum género, INSERT garante um Id para satisfazer FK e NOT NULL (bases de desenvolvimento vazias).
            migrationBuilder.Sql("""
                INSERT INTO "Generos" ("TmdbId", "Nome", "SincronizadoEm")
                SELECT -1, 'Sem género sincronizado', NOW() AT TIME ZONE 'UTC'
                WHERE NOT EXISTS (SELECT 1 FROM "Generos");
                """);

            migrationBuilder.Sql("""
                UPDATE "Filmes"
                SET "GeneroId" = (SELECT "Id" FROM "Generos" ORDER BY "Id" LIMIT 1)
                WHERE "GeneroId" IS NULL;
                """);

            migrationBuilder.AlterColumn<int>(
                name: "GeneroId",
                table: "Filmes",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.DropTable(
                name: "FilmeGeneros");

            migrationBuilder.DropColumn(
                name: "BackdropPath",
                table: "Filmes");

            migrationBuilder.DropColumn(
                name: "DuracaoMinutos",
                table: "Filmes");

            migrationBuilder.DropColumn(
                name: "IdiomaOriginal",
                table: "Filmes");

            migrationBuilder.DropColumn(
                name: "ImdbId",
                table: "Filmes");

            migrationBuilder.DropColumn(
                name: "MetadadosTmdbJson",
                table: "Filmes");

            migrationBuilder.DropColumn(
                name: "NotaMediaTmdb",
                table: "Filmes");

            migrationBuilder.DropColumn(
                name: "Sinopse",
                table: "Filmes");

            migrationBuilder.DropColumn(
                name: "TituloOriginal",
                table: "Filmes");

            migrationBuilder.DropColumn(
                name: "TotalVotosTmdb",
                table: "Filmes");

            migrationBuilder.CreateIndex(
                name: "IX_Filmes_GeneroId",
                table: "Filmes",
                column: "GeneroId");

            migrationBuilder.AddForeignKey(
                name: "FK_Filmes_Generos_GeneroId",
                table: "Filmes",
                column: "GeneroId",
                principalTable: "Generos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Filmes_Generos_GeneroId",
                table: "Filmes");

            migrationBuilder.DropIndex(
                name: "IX_Filmes_GeneroId",
                table: "Filmes");

            migrationBuilder.DropTable(
                name: "FilmeDescricoes");

            migrationBuilder.DropColumn(
                name: "GeneroId",
                table: "Filmes");

            migrationBuilder.AddColumn<string>(
                name: "BackdropPath",
                table: "Filmes",
                type: "character varying(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DuracaoMinutos",
                table: "Filmes",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IdiomaOriginal",
                table: "Filmes",
                type: "character varying(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImdbId",
                table: "Filmes",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MetadadosTmdbJson",
                table: "Filmes",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "NotaMediaTmdb",
                table: "Filmes",
                type: "numeric(4,2)",
                precision: 4,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Sinopse",
                table: "Filmes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TituloOriginal",
                table: "Filmes",
                type: "character varying(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TotalVotosTmdb",
                table: "Filmes",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AvaliacoesUsuario",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FilmeId = table.Column<long>(type: "bigint", nullable: false),
                    UsuarioId = table.Column<long>(type: "bigint", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Nota = table.Column<short>(type: "smallint", nullable: false)
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
                name: "IX_FilmeGeneros_GeneroId",
                table: "FilmeGeneros",
                column: "GeneroId");
        }
    }
}
