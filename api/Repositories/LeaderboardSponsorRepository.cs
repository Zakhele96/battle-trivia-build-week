using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Bts.Api.Models.Dtos;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class LeaderboardSponsorRepository : ILeaderboardSponsorRepository
{
    private readonly DapperContext _context;

    public LeaderboardSponsorRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task<LeaderboardSponsorDto?> GetActiveAsync(string leaderboardMode, DateTime nowUtc)
    {
        const string sponsorSql = """
            SELECT
                id,
                name,
                leaderboard_mode AS LeaderboardMode,
                sponsor_text AS SponsorText,
                description,
                website_url AS WebsiteUrl,
                badge_image_url AS BadgeImageUrl,
                call_to_action_label AS CallToActionLabel,
                starts_at AS StartsAt,
                ends_at AS EndsAt,
                is_active AS IsActive,
                display_priority AS DisplayPriority
            FROM leaderboard_sponsors
            WHERE leaderboard_mode = @LeaderboardMode
              AND is_active = TRUE
              AND starts_at <= @NowUtc
              AND ends_at >= @NowUtc
            ORDER BY display_priority DESC, starts_at DESC
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        var sponsor = await connection.QuerySingleOrDefaultAsync<LeaderboardSponsorDto>(
            sponsorSql,
            new
            {
                LeaderboardMode = leaderboardMode,
                NowUtc = nowUtc
            });

        if (sponsor is null)
            return null;

        sponsor.Placements = await GetPlacementsAsync(connection, sponsor.Id);
        return sponsor;
    }

    public async Task<IReadOnlyList<LeaderboardSponsorDto>> GetAllAsync()
    {
        const string sponsorSql = """
            SELECT
                id,
                name,
                leaderboard_mode AS LeaderboardMode,
                sponsor_text AS SponsorText,
                description,
                website_url AS WebsiteUrl,
                badge_image_url AS BadgeImageUrl,
                call_to_action_label AS CallToActionLabel,
                starts_at AS StartsAt,
                ends_at AS EndsAt,
                is_active AS IsActive,
                display_priority AS DisplayPriority
            FROM leaderboard_sponsors
            ORDER BY is_active DESC, starts_at DESC, display_priority DESC, name;
            """;

        using var connection = _context.CreateConnection();
        var sponsors = (await connection.QueryAsync<LeaderboardSponsorDto>(sponsorSql)).ToList();

        foreach (var sponsor in sponsors)
        {
            sponsor.Placements = await GetPlacementsAsync(connection, sponsor.Id);
        }

        return sponsors;
    }

    public async Task<LeaderboardSponsorDto?> GetByIdAsync(Guid id)
    {
        const string sponsorSql = """
            SELECT
                id,
                name,
                leaderboard_mode AS LeaderboardMode,
                sponsor_text AS SponsorText,
                description,
                website_url AS WebsiteUrl,
                badge_image_url AS BadgeImageUrl,
                call_to_action_label AS CallToActionLabel,
                starts_at AS StartsAt,
                ends_at AS EndsAt,
                is_active AS IsActive,
                display_priority AS DisplayPriority
            FROM leaderboard_sponsors
            WHERE id = @Id
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        var sponsor = await connection.QuerySingleOrDefaultAsync<LeaderboardSponsorDto>(
            sponsorSql,
            new { Id = id });

        if (sponsor is null)
            return null;

        sponsor.Placements = await GetPlacementsAsync(connection, sponsor.Id);
        return sponsor;
    }

    public async Task CreateAsync(
        LeaderboardSponsor sponsor,
        IReadOnlyList<LeaderboardSponsorPlacement> placements)
    {
        const string sponsorSql = """
            INSERT INTO leaderboard_sponsors (
                id,
                name,
                leaderboard_mode,
                sponsor_text,
                description,
                website_url,
                badge_image_url,
                call_to_action_label,
                starts_at,
                ends_at,
                is_active,
                display_priority,
                created_at,
                updated_at
            )
            VALUES (
                @Id,
                @Name,
                @LeaderboardMode,
                @SponsorText,
                @Description,
                @WebsiteUrl,
                @BadgeImageUrl,
                @CallToActionLabel,
                @StartsAt,
                @EndsAt,
                @IsActive,
                @DisplayPriority,
                @CreatedAt,
                @UpdatedAt
            );
            """;

        const string placementSql = """
            INSERT INTO leaderboard_sponsor_placements (
                id,
                sponsor_id,
                placement_key,
                display_order,
                is_active,
                created_at
            )
            VALUES (
                @Id,
                @SponsorId,
                @PlacementKey,
                @DisplayOrder,
                @IsActive,
                @CreatedAt
            );
            """;

        using var connection = _context.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        await connection.ExecuteAsync(sponsorSql, sponsor, transaction);

        if (placements.Count > 0)
        {
            await connection.ExecuteAsync(placementSql, placements, transaction);
        }

        transaction.Commit();
    }

    public async Task UpdateAsync(
        LeaderboardSponsor sponsor,
        IReadOnlyList<LeaderboardSponsorPlacement> placements)
    {
        const string sponsorSql = """
            UPDATE leaderboard_sponsors
            SET name = @Name,
                leaderboard_mode = @LeaderboardMode,
                sponsor_text = @SponsorText,
                description = @Description,
                website_url = @WebsiteUrl,
                badge_image_url = @BadgeImageUrl,
                call_to_action_label = @CallToActionLabel,
                starts_at = @StartsAt,
                ends_at = @EndsAt,
                is_active = @IsActive,
                display_priority = @DisplayPriority,
                updated_at = @UpdatedAt
            WHERE id = @Id;
            """;

        const string deletePlacementsSql = """
            DELETE FROM leaderboard_sponsor_placements
            WHERE sponsor_id = @SponsorId;
            """;

        const string placementSql = """
            INSERT INTO leaderboard_sponsor_placements (
                id,
                sponsor_id,
                placement_key,
                display_order,
                is_active,
                created_at
            )
            VALUES (
                @Id,
                @SponsorId,
                @PlacementKey,
                @DisplayOrder,
                @IsActive,
                @CreatedAt
            );
            """;

        using var connection = _context.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        await connection.ExecuteAsync(sponsorSql, sponsor, transaction);
        await connection.ExecuteAsync(
            deletePlacementsSql,
            new { SponsorId = sponsor.Id },
            transaction);

        if (placements.Count > 0)
        {
            await connection.ExecuteAsync(placementSql, placements, transaction);
        }

        transaction.Commit();
    }

    public async Task SetActiveAsync(Guid id, bool isActive)
    {
        const string sql = """
            UPDATE leaderboard_sponsors
            SET is_active = @IsActive,
                updated_at = @UpdatedAt
            WHERE id = @Id;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            Id = id,
            IsActive = isActive,
            UpdatedAt = DateTime.UtcNow
        });
    }

    private static async Task<IReadOnlyList<LeaderboardSponsorPlacementDto>> GetPlacementsAsync(
        System.Data.IDbConnection connection,
        Guid sponsorId)
    {
        const string placementSql = """
            SELECT
                placement_key AS PlacementKey,
                display_order AS DisplayOrder,
                is_active AS IsActive
            FROM leaderboard_sponsor_placements
            WHERE sponsor_id = @SponsorId
            ORDER BY display_order, placement_key;
            """;

        var placements = await connection.QueryAsync<LeaderboardSponsorPlacementDto>(
            placementSql,
            new { SponsorId = sponsorId });

        return placements.ToList();
    }
}
