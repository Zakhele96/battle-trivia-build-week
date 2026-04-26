namespace Bts.Api.Models.Domain;

public sealed class LeaderboardSponsor
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
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
