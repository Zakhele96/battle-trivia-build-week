using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Bts.Api.Models.Responses;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class AchievementRepository : IAchievementRepository
{
    private readonly DapperContext _context;

    public AchievementRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<AchievementDefinition>> GetActiveDefinitionsAsync()
    {
        const string sql = """
            SELECT
                id,
                code,
                name,
                description,
                badge_label AS BadgeLabel,
                icon_key AS IconKey,
                xp_reward AS XpReward,
                is_active AS IsActive,
                created_at AS CreatedAt
            FROM achievement_definitions
            WHERE is_active = TRUE
            ORDER BY created_at, code;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<AchievementDefinition>(sql);
        return rows.ToList();
    }

    public async Task<IReadOnlyList<string>> GetEarnedCodesAsync(Guid userId)
    {
        const string sql = """
            SELECT d.code
            FROM user_achievements ua
            INNER JOIN achievement_definitions d
                ON d.id = ua.achievement_definition_id
            WHERE ua.user_id = @UserId;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<string>(sql, new { UserId = userId });
        return rows.ToList();
    }

    public async Task AddUserAchievementAsync(UserAchievement achievement)
    {
        const string sql = """
            INSERT INTO user_achievements (
                id,
                user_id,
                achievement_definition_id,
                earned_at,
                context_json
            )
            VALUES (
                @Id,
                @UserId,
                @AchievementDefinitionId,
                @EarnedAt,
                @ContextJson
            )
            ON CONFLICT (user_id, achievement_definition_id) DO NOTHING;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, achievement);
    }

    public async Task<UserProgress?> GetUserProgressAsync(Guid userId)
    {
        const string sql = """
            SELECT
                user_id AS UserId,
                xp_total AS XpTotal,
                level AS Level,
                updated_at AS UpdatedAt
            FROM user_progress
            WHERE user_id = @UserId
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<UserProgress>(sql, new { UserId = userId });
    }

    public async Task UpsertUserProgressAsync(UserProgress progress)
    {
        const string sql = """
            INSERT INTO user_progress (
                user_id,
                xp_total,
                level,
                updated_at
            )
            VALUES (
                @UserId,
                @XpTotal,
                @Level,
                @UpdatedAt
            )
            ON CONFLICT (user_id)
            DO UPDATE SET
                xp_total = EXCLUDED.xp_total,
                level = EXCLUDED.level,
                updated_at = EXCLUDED.updated_at;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, progress);
    }

    public async Task<IReadOnlyList<ProfileAchievementResponse>> GetRecentAchievementsAsync(Guid userId, int take = 6)
    {
        const string sql = """
            SELECT
                d.code AS Code,
                d.name AS Name,
                d.description AS Description,
                d.badge_label AS BadgeLabel,
                d.icon_key AS IconKey,
                d.xp_reward AS XpReward,
                ua.earned_at AS EarnedAt
            FROM user_achievements ua
            INNER JOIN achievement_definitions d
                ON d.id = ua.achievement_definition_id
            WHERE ua.user_id = @UserId
            ORDER BY ua.earned_at DESC
            LIMIT @Take;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<ProfileAchievementResponse>(sql, new
        {
            UserId = userId,
            Take = take
        });

        return rows.ToList();
    }
}