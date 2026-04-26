using Bts.Api.Models.Dtos;
using Bts.Api.Models.Responses;

namespace Bts.Api.Services;

internal static class LeaderboardSponsorMapping
{
    public static LeaderboardSponsorResponse ToResponse(this LeaderboardSponsorDto sponsor)
    {
        return new LeaderboardSponsorResponse
        {
            Id = sponsor.Id,
            Name = sponsor.Name,
            LeaderboardMode = sponsor.LeaderboardMode,
            SponsorText = sponsor.SponsorText,
            Description = sponsor.Description,
            WebsiteUrl = sponsor.WebsiteUrl,
            BadgeImageUrl = sponsor.BadgeImageUrl,
            CallToActionLabel = sponsor.CallToActionLabel,
            StartsAt = sponsor.StartsAt,
            EndsAt = sponsor.EndsAt,
            IsActive = sponsor.IsActive,
            DisplayPriority = sponsor.DisplayPriority,
            Placements = sponsor.Placements.Select(placement => new LeaderboardSponsorPlacementResponse
            {
                PlacementKey = placement.PlacementKey,
                DisplayOrder = placement.DisplayOrder,
                IsActive = placement.IsActive
            }).ToList()
        };
    }
}
