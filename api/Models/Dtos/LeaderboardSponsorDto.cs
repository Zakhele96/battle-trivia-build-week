namespace Bts.Api.Models.Dtos;

public sealed class LeaderboardSponsorPlacementDto
{
    public string PlacementKey { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
}

public sealed class LeaderboardSponsorDto
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
    public IReadOnlyList<LeaderboardSponsorPlacementDto> Placements { get; set; } =
        Array.Empty<LeaderboardSponsorPlacementDto>();
}
