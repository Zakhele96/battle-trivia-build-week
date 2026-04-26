namespace Bts.Api.Models.Domain;

public sealed class LeaderboardSponsorPlacement
{
    public Guid Id { get; set; }
    public Guid SponsorId { get; set; }
    public string PlacementKey { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
