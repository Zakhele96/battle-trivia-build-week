using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Bts.Api.Models.Responses;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class ChallengeInviteRepository : IChallengeInviteRepository
{
    private readonly DapperContext _context;

    public ChallengeInviteRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task<ChallengeInvite?> GetPendingAsync(Guid challengerUserId, Guid rivalUserId, string mode, string period)
    {
        const string sql = """
            SELECT
                id,
                challenger_user_id AS ChallengerUserId,
                rival_user_id AS RivalUserId,
                mode,
                period,
                status,
                created_at AS CreatedAt,
                responded_at AS RespondedAt
            FROM challenge_invites
            WHERE challenger_user_id = @ChallengerUserId
              AND rival_user_id = @RivalUserId
              AND mode = @Mode
              AND period = @Period
              AND status = 'pending'
            ORDER BY created_at DESC
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<ChallengeInvite>(sql, new
        {
            ChallengerUserId = challengerUserId,
            RivalUserId = rivalUserId,
            Mode = mode,
            Period = period
        });
    }

    public async Task CreateAsync(ChallengeInvite invite)
    {
        const string sql = """
            INSERT INTO challenge_invites (
                id,
                challenger_user_id,
                rival_user_id,
                mode,
                period,
                status,
                created_at,
                responded_at
            )
            VALUES (
                @Id,
                @ChallengerUserId,
                @RivalUserId,
                @Mode,
                @Period,
                @Status,
                @CreatedAt,
                @RespondedAt
            );
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, invite);
    }

    public async Task<IReadOnlyList<ChallengeInviteResponse>> GetForRivalAsync(Guid rivalUserId)
    {
        const string sql = """
            SELECT
                ci.id AS Id,
                ci.challenger_user_id AS ChallengerUserId,
                COALESCE(NULLIF(u.display_name, ''), u.username) AS ChallengerName,
                u.username AS ChallengerUsername,
                ci.rival_user_id AS RivalUserId,
                ci.mode AS Mode,
                ci.period AS Period,
                ci.status AS Status,
                ci.created_at AS CreatedAt,
                ci.responded_at AS RespondedAt
            FROM challenge_invites ci
            INNER JOIN users u ON u.id = ci.challenger_user_id
            WHERE ci.rival_user_id = @RivalUserId
            ORDER BY
                CASE WHEN ci.status = 'pending' THEN 0 ELSE 1 END,
                ci.created_at DESC;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<ChallengeInviteResponse>(sql, new
        {
            RivalUserId = rivalUserId
        });

        return rows.ToList();
    }

    public async Task<ChallengeInvite?> GetByIdAsync(Guid id)
    {
        const string sql = """
            SELECT
                id,
                challenger_user_id AS ChallengerUserId,
                rival_user_id AS RivalUserId,
                mode,
                period,
                status,
                created_at AS CreatedAt,
                responded_at AS RespondedAt
            FROM challenge_invites
            WHERE id = @Id
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<ChallengeInvite>(sql, new { Id = id });
    }

    public async Task UpdateStatusAsync(Guid id, string status, DateTime respondedAtUtc)
    {
        const string sql = """
            UPDATE challenge_invites
            SET status = @Status,
                responded_at = @RespondedAtUtc
            WHERE id = @Id;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            Id = id,
            Status = status,
            RespondedAtUtc = respondedAtUtc
        });
    }
}
