namespace Bts.Api.Models.Responses;

public sealed class ProfileHistoryItemResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = "Battle Trivia session";
    public DateTime? EndedAt { get; set; }
    public int Score { get; set; }
    public int Rank { get; set; }
}