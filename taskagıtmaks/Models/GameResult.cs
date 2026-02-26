namespace taskagıtmaks.Models;

public class GameResult
{
    public int Id { get; set; }
    public string PlayerName { get; set; } = "";
    public int PlayerScore { get; set; }
    public int CpuScore { get; set; }
    public int Draws { get; set; }
    public int Target { get; set; }
    public string Winner { get; set; } = ""; // "player" | "cpu"
    public DateTime PlayedAt { get; set; } = DateTime.UtcNow;
    
}