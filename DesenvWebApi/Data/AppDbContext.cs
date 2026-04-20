// AppDbContext.cs — mapeamento EF Core (Fluent API) e carimbos de data em UTC ao gravar.
using DesenvWebApi.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DesenvWebApi.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<Filme> Filmes { get; set; }
    public DbSet<FilmeDescricao> FilmeDescricoes { get; set; }
    public DbSet<Genero> Generos { get; set; }
    public DbSet<Favorito> Favoritos { get; set; }
    public DbSet<Comentario> Comentarios { get; set; }

    // Centraliza CriadoEm/AtualizadoEm/SincronizadoEm para não depender de cada controlador (sempre UTC).
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var utc = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    switch (entry.Entity)
                    {
                        case Filme f:
                            f.CriadoEm = utc;
                            f.AtualizadoEm = utc;
                            f.SincronizadoEm = utc;
                            break;
                        case Genero g:
                            g.SincronizadoEm = utc;
                            break;
                        case Favorito fav:
                            fav.AdicionadoEm = utc;
                            break;
                        case Comentario c:
                            c.CriadoEm = utc;
                            c.EditadoEm = utc;
                            break;
                        case FilmeDescricao d:
                            d.CriadoEm = utc;
                            d.AtualizadoEm = utc;
                            break;
                    }

                    break;
                case EntityState.Modified:
                    switch (entry.Entity)
                    {
                        case Filme f:
                            f.AtualizadoEm = utc;
                            f.SincronizadoEm = utc;
                            break;
                        case Genero g:
                            g.SincronizadoEm = utc;
                            break;
                        case Comentario c:
                            c.EditadoEm = utc;
                            break;
                        case FilmeDescricao d:
                            d.AtualizadoEm = utc;
                            break;
                    }

                    break;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Um utilizador local por identidade Keycloak (sub).
        modelBuilder.Entity<Usuario>(e =>
        {
            e.HasIndex(u => u.KeycloakSub).IsUnique();
            e.Property(u => u.KeycloakSub).HasMaxLength(64).IsRequired();
            e.Property(u => u.Email).HasMaxLength(320);
            e.Property(u => u.NomeExibicao).HasMaxLength(256);
        });

        // Filme: género obrigatório (Restrict ao apagar género com filmes) + detalhe 1:1 (Cascade).
        modelBuilder.Entity<Filme>(e =>
        {
            e.HasIndex(f => f.TmdbId).IsUnique();
            e.Property(f => f.Titulo).HasMaxLength(512).IsRequired();
            e.Property(f => f.PosterPath).HasMaxLength(512);

            e.HasOne(f => f.Genero)
                .WithMany(g => g.Filmes)
                .HasForeignKey(f => f.GeneroId)
                .OnDelete(DeleteBehavior.Restrict);

            // 1:1 — detalhe sem filme principal não faz sentido: cascade ao apagar filme
            e.HasOne(f => f.FilmeDescricao)
                .WithOne(d => d.Filme)
                .HasForeignKey<FilmeDescricao>(d => d.FilmeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Tipos e tamanhos explícitos para PostgreSQL (jsonb, precisão decimal).
        modelBuilder.Entity<FilmeDescricao>(e =>
        {
            e.HasIndex(d => d.FilmeId).IsUnique();
            e.Property(d => d.TituloOriginal).HasMaxLength(512);
            e.Property(d => d.BackdropPath).HasMaxLength(512);
            e.Property(d => d.IdiomaOriginal).HasMaxLength(16);
            e.Property(d => d.ImdbId).HasMaxLength(32);
            e.Property(d => d.NotaMediaTmdb).HasPrecision(4, 2);
            e.Property(d => d.MetadadosTmdbJson).HasColumnType("jsonb");
        });

        modelBuilder.Entity<Genero>(e =>
        {
            e.HasIndex(g => g.TmdbId).IsUnique();
            e.Property(g => g.Nome).HasMaxLength(128).IsRequired();
        });

        // Par (utilizador, filme) único — evita favoritos duplicados.
        modelBuilder.Entity<Favorito>(e =>
        {
            e.HasIndex(f => new { f.UsuarioId, f.FilmeId }).IsUnique();
            e.HasOne(f => f.Usuario)
                .WithMany(u => u.Favoritos)
                .HasForeignKey(f => f.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(f => f.Filme)
                .WithMany(fm => fm.Favoritos)
                .HasForeignKey(f => f.FilmeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Comentário ligado ao utilizador e ao filme; apagar pai remove filhos (Cascade).
        modelBuilder.Entity<Comentario>(e =>
        {
            e.Property(c => c.Corpo).IsRequired();
            e.HasOne(c => c.Usuario)
                .WithMany(u => u.Comentarios)
                .HasForeignKey(c => c.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(c => c.Filme)
                .WithMany(f => f.Comentarios)
                .HasForeignKey(c => c.FilmeId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
