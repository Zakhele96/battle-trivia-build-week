namespace Bts.Api.Models.Domain;

public sealed class UserProgress
{
    public Guid UserId { get; set; }
    public int XpTotal { get; set; }
    public int Level { get; set; }
    public DateTime UpdatedAt { get; set; }
}