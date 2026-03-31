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
    public DbSet<Genero> Generos { get; set; }
    public DbSet<FilmeGenero> FilmeGeneros { get; set; }
    public DbSet<Favorito> Favoritos { get; set; }
    public DbSet<AvaliacaoUsuario> AvaliacoesUsuario { get; set; }
    public DbSet<Comentario> Comentarios { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Usuario>(e =>
        {
            e.HasIndex(u => u.KeycloakSub).IsUnique();
            e.Property(u => u.KeycloakSub).HasMaxLength(64).IsRequired();
            e.Property(u => u.Email).HasMaxLength(320);
            e.Property(u => u.NomeExibicao).HasMaxLength(256);
        });

        modelBuilder.Entity<Filme>(e =>
        {
            e.HasIndex(f => f.TmdbId).IsUnique();
            e.Property(f => f.Titulo).HasMaxLength(512).IsRequired();
            e.Property(f => f.TituloOriginal).HasMaxLength(512);
            e.Property(f => f.PosterPath).HasMaxLength(512);
            e.Property(f => f.BackdropPath).HasMaxLength(512);
            e.Property(f => f.IdiomaOriginal).HasMaxLength(16);
            e.Property(f => f.ImdbId).HasMaxLength(32);
            e.Property(f => f.NotaMediaTmdb).HasPrecision(4, 2);
            e.Property(f => f.MetadadosTmdbJson).HasColumnType("jsonb");
        });

        modelBuilder.Entity<Genero>(e =>
        {
            e.HasIndex(g => g.TmdbId).IsUnique();
            e.Property(g => g.Nome).HasMaxLength(128).IsRequired();
        });

        modelBuilder.Entity<FilmeGenero>(e =>
        {
            e.HasKey(fg => new { fg.FilmeId, fg.GeneroId });
            e.HasOne(fg => fg.Filme)
                .WithMany(f => f.FilmeGeneros)
                .HasForeignKey(fg => fg.FilmeId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(fg => fg.Genero)
                .WithMany(g => g.FilmeGeneros)
                .HasForeignKey(fg => fg.GeneroId)
                .OnDelete(DeleteBehavior.Cascade);
        });

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

        modelBuilder.Entity<AvaliacaoUsuario>(e =>
        {
            e.HasIndex(a => new { a.UsuarioId, a.FilmeId }).IsUnique();
            e.HasOne(a => a.Usuario)
                .WithMany(u => u.Avaliacoes)
                .HasForeignKey(a => a.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(a => a.Filme)
                .WithMany(f => f.Avaliacoes)
                .HasForeignKey(a => a.FilmeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

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
