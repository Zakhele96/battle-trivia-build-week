using Bts.Api.Models.Domain;
using Bts.Api.Models.Requests;
using Bts.Api.Models.Responses;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class AdminLeaderboardSponsorService
{
    private static readonly HashSet<string> AllowedPlacements = new(StringComparer.OrdinalIgnoreCase)
    {
        "leaderboard-header",
        "leaderboard-podium",
        "lobby-featured",
        "lobby-standings",
        "room-sidebar"
    };

    private readonly ILeaderboardSponsorRepository _leaderboardSponsorRepository;

    public AdminLeaderboardSponsorService(ILeaderboardSponsorRepository leaderboardSponsorRepository)
    {
        _leaderboardSponsorRepository = leaderboardSponsorRepository;
    }

    public async Task<IReadOnlyList<LeaderboardSponsorResponse>> GetAllAsync()
    {
        var sponsors = await _leaderboardSponsorRepository.GetAllAsync();
        return sponsors.Select(x => x.ToResponse()).ToList();
    }

    public async Task<LeaderboardSponsorResponse> CreateAsync(UpsertLeaderboardSponsorRequest request)
    {
        var nowUtc = DateTime.UtcNow;
        var sponsor = BuildSponsor(Guid.NewGuid(), request, nowUtc, nowUtc);
        var placements = BuildPlacements(sponsor.Id, request.Placements, nowUtc);

        await _leaderboardSponsorRepository.CreateAsync(sponsor, placements);

        var created = await _leaderboardSponsorRepository.GetByIdAsync(sponsor.Id)
            ?? throw new InvalidOperationException("Sponsor could not be loaded after creation.");

        return created.ToResponse();
    }

    public async Task<LeaderboardSponsorResponse> UpdateAsync(Guid id, UpsertLeaderboardSponsorRequest request)
    {
        var existing = await _leaderboardSponsorRepository.GetByIdAsync(id);
        if (existing is null)
            throw new KeyNotFoundException("Sponsor not found.");

        var sponsor = BuildSponsor(id, request, DateTime.UtcNow, DateTime.UtcNow);
        var placements = BuildPlacements(id, request.Placements, DateTime.UtcNow);

        await _leaderboardSponsorRepository.UpdateAsync(sponsor, placements);

        var updated = await _leaderboardSponsorRepository.GetByIdAsync(id)
            ?? throw new InvalidOperationException("Sponsor could not be loaded after update.");

        return updated.ToResponse();
    }

    public async Task<LeaderboardSponsorResponse> SetActiveAsync(Guid id, bool isActive)
    {
        var existing = await _leaderboardSponsorRepository.GetByIdAsync(id);
        if (existing is null)
            throw new KeyNotFoundException("Sponsor not found.");

        await _leaderboardSponsorRepository.SetActiveAsync(id, isActive);

        var updated = await _leaderboardSponsorRepository.GetByIdAsync(id)
            ?? throw new InvalidOperationException("Sponsor could not be loaded after update.");

        return updated.ToResponse();
    }

    private static LeaderboardSponsor BuildSponsor(
        Guid id,
        UpsertLeaderboardSponsorRequest request,
        DateTime createdAt,
        DateTime updatedAt)
    {
        if (request.StartsAt == default || request.EndsAt == default)
            throw new InvalidOperationException("Start and end dates are required.");

        if (string.IsNullOrWhiteSpace(request.Name))
            throw new InvalidOperationException("Sponsor name is required.");

        if (request.EndsAt <= request.StartsAt)
            throw new InvalidOperationException("End date must be after the start date.");

        return new LeaderboardSponsor
        {
            Id = id,
            Name = (request.Name ?? string.Empty).Trim(),
            LeaderboardMode = LeaderboardSponsorService.NormalizeMode(request.LeaderboardMode),
            SponsorText = string.IsNullOrWhiteSpace(request.SponsorText)
                ? "This week's competition is sponsored by"
                : request.SponsorText.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description)
                ? null
                : request.Description.Trim(),
            WebsiteUrl = string.IsNullOrWhiteSpace(request.WebsiteUrl)
                ? null
                : request.WebsiteUrl.Trim(),
            BadgeImageUrl = string.IsNullOrWhiteSpace(request.BadgeImageUrl)
                ? null
                : request.BadgeImageUrl.Trim(),
            CallToActionLabel = string.IsNullOrWhiteSpace(request.CallToActionLabel)
                ? null
                : request.CallToActionLabel.Trim(),
            StartsAt = DateTime.SpecifyKind(request.StartsAt, DateTimeKind.Utc),
            EndsAt = DateTime.SpecifyKind(request.EndsAt, DateTimeKind.Utc),
            IsActive = request.IsActive,
            DisplayPriority = Math.Max(0, request.DisplayPriority),
            CreatedAt = createdAt,
            UpdatedAt = updatedAt
        };
    }

    private static List<LeaderboardSponsorPlacement> BuildPlacements(
        Guid sponsorId,
        IEnumerable<LeaderboardSponsorPlacementRequest> requests,
        DateTime nowUtc)
    {
        return (requests ?? Array.Empty<LeaderboardSponsorPlacementRequest>())
            .Where(item => AllowedPlacements.Contains(item.PlacementKey))
            .GroupBy(item => item.PlacementKey.Trim(), StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First())
            .Select(item => new LeaderboardSponsorPlacement
            {
                Id = Guid.NewGuid(),
                SponsorId = sponsorId,
                PlacementKey = item.PlacementKey.Trim().ToLowerInvariant(),
                DisplayOrder = Math.Max(0, item.DisplayOrder),
                IsActive = item.IsActive,
                CreatedAt = nowUtc
            })
            .ToList();
    }
}
