using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Bts.Api.Models.Dtos;
using Bts.Api.Models.Responses;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class FriendRepository : IFriendRepository
{
    private readonly DapperContext _context;

    public FriendRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task<Friendship?> GetRelationshipAsync(Guid userId, Guid otherUserId)
    {
        const string sql = """
            SELECT
                id,
                requester_user_id AS RequesterUserId,
                addressee_user_id AS AddresseeUserId,
                status,
                responded_at AS RespondedAt,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt
            FROM friendships
            WHERE (requester_user_id = @UserId AND addressee_user_id = @OtherUserId)
               OR (requester_user_id = @OtherUserId AND addressee_user_id = @UserId)
            ORDER BY updated_at DESC
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<Friendship>(sql, new
        {
            UserId = userId,
            OtherUserId = otherUserId
        });
    }

    public async Task CreateRequestAsync(Friendship friendship)
    {
        const string sql = """
            INSERT INTO friendships (
                id,
                requester_user_id,
                addressee_user_id,
                status,
                responded_at,
                created_at,
                updated_at
            )
            VALUES (
                @Id,
                @RequesterUserId,
                @AddresseeUserId,
                @Status,
                @RespondedAt,
                @CreatedAt,
                @UpdatedAt
            );
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, friendship);
    }

    public async Task<bool> AcceptAsync(Guid friendshipId, Guid userId)
    {
        const string sql = """
            UPDATE friendships
            SET status = 'accepted',
                responded_at = NOW(),
                updated_at = NOW()
            WHERE id = @FriendshipId
              AND addressee_user_id = @UserId
              AND status = 'pending';
            """;

        using var connection = _context.CreateConnection();
        var changed = await connection.ExecuteAsync(sql, new { FriendshipId = friendshipId, UserId = userId });
        return changed > 0;
    }

    public async Task<bool> DeclineAsync(Guid friendshipId, Guid userId)
    {
        const string sql = """
            UPDATE friendships
            SET status = 'declined',
                responded_at = NOW(),
                updated_at = NOW()
            WHERE id = @FriendshipId
              AND addressee_user_id = @UserId
              AND status = 'pending';
            """;

        using var connection = _context.CreateConnection();
        var changed = await connection.ExecuteAsync(sql, new { FriendshipId = friendshipId, UserId = userId });
        return changed > 0;
    }

    public async Task<IReadOnlyList<Guid>> GetAcceptedFriendIdsAsync(Guid userId)
    {
        const string sql = """
            SELECT CASE
                WHEN requester_user_id = @UserId THEN addressee_user_id
                ELSE requester_user_id
            END AS FriendUserId
            FROM friendships
            WHERE status = 'accepted'
              AND (requester_user_id = @UserId OR addressee_user_id = @UserId)
            ORDER BY updated_at DESC;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<Guid>(sql, new { UserId = userId });
        return rows.ToList();
    }

    public async Task<IReadOnlyList<FriendUserResponse>> GetFriendsAsync(Guid userId)
    {
        const string sql = """
            SELECT
                CASE
                    WHEN f.requester_user_id = @UserId THEN f.addressee_user_id
                    ELSE f.requester_user_id
                END AS UserId,
                f.id AS FriendshipId,
                u.username AS Username,
                u.display_name AS DisplayName,
                u.avatar_url AS AvatarUrl,
                u.status_message AS StatusMessage,
                'accepted' AS Status,
                (f.requester_user_id = @UserId) AS InitiatedByMe,
                f.updated_at AS UpdatedAt
            FROM friendships f
            INNER JOIN users u
                ON u.id = CASE
                    WHEN f.requester_user_id = @UserId THEN f.addressee_user_id
                    ELSE f.requester_user_id
                END
            WHERE f.status = 'accepted'
              AND (f.requester_user_id = @UserId OR f.addressee_user_id = @UserId)
            ORDER BY COALESCE(u.display_name, u.username), u.username;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<FriendUserResponse>(sql, new { UserId = userId });
        return rows.ToList();
    }

    public async Task<IReadOnlyList<FriendUserResponse>> GetIncomingRequestsAsync(Guid userId)
    {
        const string sql = """
            SELECT
                f.requester_user_id AS UserId,
                f.id AS FriendshipId,
                u.username AS Username,
                u.display_name AS DisplayName,
                u.avatar_url AS AvatarUrl,
                u.status_message AS StatusMessage,
                f.status AS Status,
                FALSE AS InitiatedByMe,
                f.updated_at AS UpdatedAt
            FROM friendships f
            INNER JOIN users u
                ON u.id = f.requester_user_id
            WHERE f.addressee_user_id = @UserId
              AND f.status = 'pending'
            ORDER BY f.created_at DESC;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<FriendUserResponse>(sql, new { UserId = userId });
        return rows.ToList();
    }

    public async Task<IReadOnlyList<FriendUserResponse>> GetOutgoingRequestsAsync(Guid userId)
    {
        const string sql = """
            SELECT
                f.addressee_user_id AS UserId,
                f.id AS FriendshipId,
                u.username AS Username,
                u.display_name AS DisplayName,
                u.avatar_url AS AvatarUrl,
                u.status_message AS StatusMessage,
                f.status AS Status,
                TRUE AS InitiatedByMe,
                f.updated_at AS UpdatedAt
            FROM friendships f
            INNER JOIN users u
                ON u.id = f.addressee_user_id
            WHERE f.requester_user_id = @UserId
              AND f.status = 'pending'
            ORDER BY f.created_at DESC;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<FriendUserResponse>(sql, new { UserId = userId });
        return rows.ToList();
    }

    public async Task<HeadToHeadGameRecordDto> GetTriviaHeadToHeadAsync(Guid userId, Guid otherUserId)
    {
        const string sql = """
            SELECT
                COUNT(*)::int AS Matches,
                COUNT(*) FILTER (
                    WHERE self.rank < other.rank
                       OR (self.rank = other.rank AND self.score > other.score)
                )::int AS Wins,
                COUNT(*) FILTER (
                    WHERE self.rank > other.rank
                       OR (self.rank = other.rank AND self.score < other.score)
                )::int AS Losses,
                COUNT(*) FILTER (
                    WHERE self.rank = other.rank AND self.score = other.score
                )::int AS Ties
            FROM trivia_session_results self
            INNER JOIN trivia_session_results other
                ON other.session_id = self.session_id
               AND other.user_id = @OtherUserId
            WHERE self.user_id = @UserId;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleAsync<HeadToHeadGameRecordDto>(sql, new
        {
            UserId = userId,
            OtherUserId = otherUserId
        });
    }

    public async Task<HeadToHeadGameRecordDto> GetWordScrambleHeadToHeadAsync(Guid userId, Guid otherUserId)
    {
        const string sql = """
            SELECT
                COUNT(*)::int AS Matches,
                COUNT(*) FILTER (
                    WHERE self.rank < other.rank
                       OR (self.rank = other.rank AND self.score > other.score)
                )::int AS Wins,
                COUNT(*) FILTER (
                    WHERE self.rank > other.rank
                       OR (self.rank = other.rank AND self.score < other.score)
                )::int AS Losses,
                COUNT(*) FILTER (
                    WHERE self.rank = other.rank AND self.score = other.score
                )::int AS Ties
            FROM word_scramble_session_results self
            INNER JOIN word_scramble_session_results other
                ON other.session_id = self.session_id
               AND other.user_id = @OtherUserId
            WHERE self.user_id = @UserId;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleAsync<HeadToHeadGameRecordDto>(sql, new
        {
            UserId = userId,
            OtherUserId = otherUserId
        });
    }
}
