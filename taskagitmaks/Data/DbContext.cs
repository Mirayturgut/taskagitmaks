using Microsoft.EntityFrameworkCore;
using taskagıtmaks.Models;

namespace taskagıtmaks.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<GameResult> GameResults => Set<GameResult>();
}

