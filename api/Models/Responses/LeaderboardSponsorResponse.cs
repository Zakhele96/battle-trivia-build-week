namespace Bts.Api.Models.Responses;

public sealed class LeaderboardSponsorPlacementResponse
{
    public string PlacementKey { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
}

public sealed class LeaderboardSponsorResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string LeaderboardMode { get; set; } = string.Empty;
    public string SponsorText { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? BadgeImageUrl { get; set; }
    public string? CallToActionLabel { get; set; }
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
    public bool IsActive { get; set; }
    public int DisplayPriority { get; set; }
    public IReadOnlyList<LeaderboardSponsorPlacementResponse> Placements { get; set; } =
        Array.Empty<LeaderboardSponsorPlacementResponse>();
}
