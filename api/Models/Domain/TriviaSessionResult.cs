namespace Bts.Api.Models.Domain;

public sealed class TriviaSessionResult
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public Guid UserId { get; set; }
    public int Rank { get; set; }
    public int Score { get; set; }
    public DateTime CreatedAt { get; set; }
}