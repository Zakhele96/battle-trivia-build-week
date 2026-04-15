namespace Bts.Api.Models.Dtos;

public sealed class TriviaPlayerRankDto
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public int Score { get; set; }
    public int Rank { get; set; }
}