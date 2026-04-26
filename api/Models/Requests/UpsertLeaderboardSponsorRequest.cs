namespace Bts.Api.Models.Requests;

public sealed class LeaderboardSponsorPlacementRequest
{
    public string PlacementKey { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int DisplayOrder { get; set; }
}

public sealed class UpsertLeaderboardSponsorRequest
{
    public string Name { get; set; } = string.Empty;
    public string LeaderboardMode { get; set; } = "battle-trivia";
    public string SponsorText { get; set; } = "This week's competition is sponsored by";
    public string? Description { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? BadgeImageUrl { get; set; }
    public string? CallToActionLabel { get; set; }
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayPriority { get; set; }
    public List<LeaderboardSponsorPlacementRequest> Placements { get; set; } = new();
}
