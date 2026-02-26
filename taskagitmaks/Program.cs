using Microsoft.EntityFrameworkCore;
using taskagıtmaks.Data;
using taskagıtmaks.Models;

var builder = WebApplication.CreateBuilder(args);

// ✅ SQL Server bağlantısı (appsettings.json içinden okunur)
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

// ✅ Migration varsa uygular (DB'yi hazırlar)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

// ---- Game logic ----
string CpuPick()
{
    var options = new[] { "rock", "paper", "scissors" };
    return options[Random.Shared.Next(0, 3)];
}

string Result(string player, string cpu)
{
    if (player == cpu) return "draw";

    bool win =
        (player == "rock" && cpu == "scissors") ||
        (player == "scissors" && cpu == "paper") ||
        (player == "paper" && cpu == "rock");

    return win ? "win" : "lose";
}

// ---- API: play ----
app.MapPost("/api/play", (PlayRequest req) =>
{
    var player = (req.choice ?? "").Trim().ToLowerInvariant();
    if (player is not ("rock" or "paper" or "scissors"))
        return Results.BadRequest("choice must be rock/paper/scissors");

    var cpu = CpuPick();
    var result = Result(player, cpu);

    return Results.Ok(new { player, cpu, result });
});

// ---- API: submit score (oyun bitince DB'ye kaydet) ----
app.MapPost("/api/score/submit", async (AppDbContext db, SubmitScoreRequest req) =>
{
    var name = (req.name ?? "").Trim();
    if (name.Length < 1 || name.Length > 18)
        return Results.BadRequest("name invalid");

    if (req.target <= 0 || req.target > 20)
        return Results.BadRequest("target invalid");

    // oyun bitmiş olmalı (player veya cpu target'a ulaşmış olmalı)
    if (req.playerScore < req.target && req.cpuScore < req.target)
        return Results.BadRequest("game not finished");

    var winner = req.playerScore > req.cpuScore ? "player" : "cpu";

    db.GameResults.Add(new GameResult
    {
        PlayerName = name,
        PlayerScore = req.playerScore,
        CpuScore = req.cpuScore,
        Draws = req.draws,
        Target = req.target,
        Winner = winner,
        PlayedAt = DateTime.UtcNow
    });

    await db.SaveChangesAsync();
    return Results.Ok(new { ok = true });
});

// ---- API: leaderboard (top 50) ----
app.MapGet("/api/leaderboard", async (AppDbContext db) =>
{
    var board = await db.GameResults
        .AsNoTracking()
        .GroupBy(x => x.PlayerName)
        .Select(g => new
        {
            name = g.Key,
            gamesPlayed = g.Count(),
            gamesWon = g.Count(x => x.Winner == "player"),
            winRate = Math.Round((g.Count(x => x.Winner == "player") * 100.0) / g.Count(), 1),
            totalPlayerScore = g.Sum(x => x.PlayerScore),
            totalCpuScore = g.Sum(x => x.CpuScore)
        })
        .OrderByDescending(x => x.gamesWon)
        .ThenByDescending(x => x.winRate)
        .ThenByDescending(x => x.gamesPlayed)
        .Take(50)
        .ToListAsync();

    return Results.Ok(board);
});
app.Urls.Add("http://0.0.0.0:5028");

app.Run();

record PlayRequest(string choice);

record SubmitScoreRequest(
    string name,
    int playerScore,
    int cpuScore,
    int draws,
    int target
);