using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Bts.Api.Models.Responses;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class ArenaRepository : IArenaRepository
{
    private readonly DapperContext _context;

    public ArenaRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task CreateChallengeAsync(ArenaChallenge challenge)
    {
        const string sql = """
            INSERT INTO arena_challenges (
                id,
                room_id,
                created_by_user_id,
                title,
                challenge_type,
                theme,
                rules,
                max_entries,
                status,
                submission_ends_at,
                voting_starts_at,
                voting_ends_at,
                winner_entry_id,
                created_at,
                updated_at
            )
            VALUES (
                @Id,
                @RoomId,
                @CreatedByUserId,
                @Title,
                @ChallengeType,
                @Theme,
                @Rules,
                @MaxEntries,
                @Status,
                @SubmissionEndsAt,
                @VotingStartsAt,
                @VotingEndsAt,
                @WinnerEntryId,
                @CreatedAt,
                @UpdatedAt
            );
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, challenge);
    }

    public async Task<ArenaChallenge?> GetChallengeByIdAsync(Guid challengeId)
    {
        const string sql = """
            SELECT
                id,
                room_id AS RoomId,
                created_by_user_id AS CreatedByUserId,
                title,
                challenge_type AS ChallengeType,
                theme,
                rules,
                max_entries AS MaxEntries,
                status,
                submission_ends_at AS SubmissionEndsAt,
                voting_starts_at AS VotingStartsAt,
                voting_ends_at AS VotingEndsAt,
                winner_entry_id AS WinnerEntryId,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt
            FROM arena_challenges
            WHERE id = @ChallengeId;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<ArenaChallenge>(sql, new { ChallengeId = challengeId });
    }

    public async Task<IReadOnlyList<ArenaChallengeResponse>> GetChallengesAsync(Guid roomId, Guid currentUserId, string bucket, int take)
    {
        var normalizedBucket = (bucket ?? "all").Trim().ToLowerInvariant();

        const string sql = """
            WITH filtered AS (
                SELECT *
                FROM arena_challenges
                WHERE room_id = @RoomId
                  AND (
                      @Bucket = 'all'
                      OR (@Bucket = 'open' AND status = 'open')
                      OR (@Bucket = 'voting' AND status = 'voting')
                      OR (@Bucket = 'winners' AND status = 'closed')
                  )
            ),
            entry_counts AS (
                SELECT challenge_id, COUNT(*)::int AS EntryCount
                FROM arena_entries
                WHERE challenge_id IN (SELECT id FROM filtered)
                GROUP BY challenge_id
            ),
            vote_counts AS (
                SELECT v.challenge_id, COUNT(*)::int AS VoteCount
                FROM arena_votes v
                WHERE v.challenge_id IN (SELECT id FROM filtered)
                GROUP BY v.challenge_id
            ),
            my_entries AS (
                SELECT challenge_id, TRUE AS UserHasSubmitted
                FROM arena_entries
                WHERE user_id = @CurrentUserId
                  AND challenge_id IN (SELECT id FROM filtered)
                GROUP BY challenge_id
            ),
            my_votes AS (
                SELECT challenge_id, TRUE AS UserHasVoted
                FROM arena_votes
                WHERE user_id = @CurrentUserId
                  AND challenge_id IN (SELECT id FROM filtered)
                GROUP BY challenge_id
            )
            SELECT
                c.id AS Id,
                c.room_id AS RoomId,
                c.created_by_user_id AS CreatedByUserId,
                creator.username AS CreatedByUsername,
                creator.display_name AS CreatedByDisplayName,
                c.title AS Title,
                c.challenge_type AS ChallengeType,
                c.theme AS Theme,
                c.rules AS Rules,
                c.max_entries AS MaxEntries,
                c.status AS Status,
                c.submission_ends_at AS SubmissionEndsAt,
                c.voting_starts_at AS VotingStartsAt,
                c.voting_ends_at AS VotingEndsAt,
                c.winner_entry_id AS WinnerEntryId,
                winner.display_name AS WinnerDisplayName,
                COALESCE(ec.EntryCount, 0) AS EntryCount,
                COALESCE(vc.VoteCount, 0) AS VoteCount,
                COALESCE(me.UserHasSubmitted, FALSE) AS UserHasSubmitted,
                COALESCE(mv.UserHasVoted, FALSE) AS UserHasVoted,
                c.created_at AS CreatedAt
            FROM filtered c
            INNER JOIN users creator
                ON creator.id = c.created_by_user_id
            LEFT JOIN arena_entries winning_entry
                ON winning_entry.id = c.winner_entry_id
            LEFT JOIN users winner
                ON winner.id = winning_entry.user_id
            LEFT JOIN entry_counts ec
                ON ec.challenge_id = c.id
            LEFT JOIN vote_counts vc
                ON vc.challenge_id = c.id
            LEFT JOIN my_entries me
                ON me.challenge_id = c.id
            LEFT JOIN my_votes mv
                ON mv.challenge_id = c.id
            ORDER BY
                CASE c.status
                    WHEN 'open' THEN 0
                    WHEN 'voting' THEN 1
                    WHEN 'closed' THEN 2
                    ELSE 3
                END,
                c.created_at DESC
            LIMIT @Take;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<ArenaChallengeResponse>(sql, new
        {
            RoomId = roomId,
            CurrentUserId = currentUserId,
            Bucket = normalizedBucket,
            Take = Math.Clamp(take, 1, 100)
        });

        return rows.ToList();
    }

    public async Task<IReadOnlyList<ArenaEntryResponse>> GetEntriesAsync(Guid challengeId, Guid currentUserId, Guid? winnerEntryId)
    {
        const string sql = """
            WITH vote_counts AS (
                SELECT entry_id, COUNT(*)::int AS VoteCount
                FROM arena_votes
                WHERE challenge_id = @ChallengeId
                GROUP BY entry_id
            ),
            my_votes AS (
                SELECT entry_id, TRUE AS HasCurrentUserVoted
                FROM arena_votes
                WHERE challenge_id = @ChallengeId
                  AND user_id = @CurrentUserId
            )
            SELECT
                e.id AS Id,
                e.challenge_id AS ChallengeId,
                e.user_id AS UserId,
                u.username AS Username,
                u.display_name AS DisplayName,
                u.avatar_url AS AvatarUrl,
                e.content AS Content,
                COALESCE(vc.VoteCount, 0) AS VoteCount,
                COALESCE(mv.HasCurrentUserVoted, FALSE) AS HasCurrentUserVoted,
                CASE WHEN e.id = @WinnerEntryId THEN TRUE ELSE FALSE END AS IsWinner,
                e.submitted_at AS SubmittedAt
            FROM arena_entries e
            INNER JOIN users u
                ON u.id = e.user_id
            LEFT JOIN vote_counts vc
                ON vc.entry_id = e.id
            LEFT JOIN my_votes mv
                ON mv.entry_id = e.id
            WHERE e.challenge_id = @ChallengeId
            ORDER BY COALESCE(vc.VoteCount, 0) DESC, e.submitted_at ASC;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<ArenaEntryResponse>(sql, new
        {
            ChallengeId = challengeId,
            CurrentUserId = currentUserId,
            WinnerEntryId = winnerEntryId
        });

        return rows.ToList();
    }

    public async Task<IReadOnlyList<ArenaCommentResponse>> GetCommentsAsync(Guid challengeId)
    {
        const string sql = """
            SELECT
                c.id AS Id,
                c.challenge_id AS ChallengeId,
                c.user_id AS UserId,
                u.username AS Username,
                u.display_name AS DisplayName,
                u.avatar_url AS AvatarUrl,
                c.content AS Content,
                c.created_at AS CreatedAt
            FROM arena_comments c
            INNER JOIN users u
                ON u.id = c.user_id
            WHERE c.challenge_id = @ChallengeId
            ORDER BY c.created_at ASC;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<ArenaCommentResponse>(sql, new { ChallengeId = challengeId });
        return rows.ToList();
    }

    public async Task<bool> HasEntryAsync(Guid challengeId, Guid userId)
    {
        const string sql = """
            SELECT EXISTS(
                SELECT 1
                FROM arena_entries
                WHERE challenge_id = @ChallengeId
                  AND user_id = @UserId
            );
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteScalarAsync<bool>(sql, new { ChallengeId = challengeId, UserId = userId });
    }

    public async Task<int> GetEntryCountAsync(Guid challengeId)
    {
        const string sql = """
            SELECT COUNT(*)::int
            FROM arena_entries
            WHERE challenge_id = @ChallengeId;
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteScalarAsync<int>(sql, new { ChallengeId = challengeId });
    }

    public async Task CreateEntryAsync(ArenaEntry entry)
    {
        const string sql = """
            INSERT INTO arena_entries (
                id,
                challenge_id,
                user_id,
                content,
                submitted_at
            )
            VALUES (
                @Id,
                @ChallengeId,
                @UserId,
                @Content,
                @SubmittedAt
            );
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, entry);
    }

    public async Task CreateCommentAsync(ArenaComment comment)
    {
        const string sql = """
            INSERT INTO arena_comments (
                id,
                challenge_id,
                user_id,
                content,
                created_at
            )
            VALUES (
                @Id,
                @ChallengeId,
                @UserId,
                @Content,
                @CreatedAt
            );
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, comment);
    }

    public async Task<bool> HasVoteAsync(Guid challengeId, Guid userId)
    {
        const string sql = """
            SELECT EXISTS(
                SELECT 1
                FROM arena_votes
                WHERE challenge_id = @ChallengeId
                  AND user_id = @UserId
            );
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteScalarAsync<bool>(sql, new { ChallengeId = challengeId, UserId = userId });
    }

    public async Task<bool> EntryBelongsToChallengeAsync(Guid challengeId, Guid entryId)
    {
        const string sql = """
            SELECT EXISTS(
                SELECT 1
                FROM arena_entries
                WHERE challenge_id = @ChallengeId
                  AND id = @EntryId
            );
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteScalarAsync<bool>(sql, new { ChallengeId = challengeId, EntryId = entryId });
    }

    public async Task<bool> EntryBelongsToUserAsync(Guid entryId, Guid userId)
    {
        const string sql = """
            SELECT EXISTS(
                SELECT 1
                FROM arena_entries
                WHERE id = @EntryId
                  AND user_id = @UserId
            );
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteScalarAsync<bool>(sql, new { EntryId = entryId, UserId = userId });
    }

    public async Task CreateVoteAsync(ArenaVote vote)
    {
        const string sql = """
            INSERT INTO arena_votes (
                id,
                challenge_id,
                entry_id,
                user_id,
                created_at
            )
            VALUES (
                @Id,
                @ChallengeId,
                @EntryId,
                @UserId,
                @CreatedAt
            );
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, vote);
    }

    public async Task<IReadOnlyList<ArenaChallenge>> GetChallengesReadyForVotingAsync(DateTime nowUtc)
    {
        const string sql = """
            SELECT
                id,
                room_id AS RoomId,
                created_by_user_id AS CreatedByUserId,
                title,
                challenge_type AS ChallengeType,
                theme,
                rules,
                max_entries AS MaxEntries,
                status,
                submission_ends_at AS SubmissionEndsAt,
                voting_starts_at AS VotingStartsAt,
                voting_ends_at AS VotingEndsAt,
                winner_entry_id AS WinnerEntryId,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt
            FROM arena_challenges
            WHERE status = 'open'
              AND submission_ends_at <= @NowUtc
            ORDER BY submission_ends_at ASC;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<ArenaChallenge>(sql, new { NowUtc = nowUtc });
        return rows.ToList();
    }

    public async Task<bool> MoveChallengeToVotingAsync(Guid challengeId, DateTime votingStartsAtUtc, DateTime votingEndsAtUtc)
    {
        const string sql = """
            UPDATE arena_challenges
            SET status = 'voting',
                submission_ends_at = @VotingStartsAtUtc,
                voting_starts_at = COALESCE(voting_starts_at, @VotingStartsAtUtc),
                voting_ends_at = @VotingEndsAtUtc,
                updated_at = @VotingStartsAtUtc
            WHERE id = @ChallengeId
              AND status = 'open';
            """;

        using var connection = _context.CreateConnection();
        var affected = await connection.ExecuteAsync(sql, new
        {
            ChallengeId = challengeId,
            VotingStartsAtUtc = votingStartsAtUtc,
            VotingEndsAtUtc = votingEndsAtUtc
        });

        return affected > 0;
    }

    public async Task<IReadOnlyList<ArenaChallenge>> GetChallengesReadyToCloseAsync(DateTime nowUtc)
    {
        const string sql = """
            SELECT
                id,
                room_id AS RoomId,
                created_by_user_id AS CreatedByUserId,
                title,
                challenge_type AS ChallengeType,
                theme,
                rules,
                max_entries AS MaxEntries,
                status,
                submission_ends_at AS SubmissionEndsAt,
                voting_starts_at AS VotingStartsAt,
                voting_ends_at AS VotingEndsAt,
                winner_entry_id AS WinnerEntryId,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt
            FROM arena_challenges
            WHERE status = 'voting'
              AND voting_ends_at <= @NowUtc
            ORDER BY voting_ends_at ASC;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<ArenaChallenge>(sql, new { NowUtc = nowUtc });
        return rows.ToList();
    }

    public async Task<(Guid? WinnerEntryId, bool IsDraw)> CalculateWinnerAsync(Guid challengeId)
    {
        const string sql = """
            WITH scores AS (
                SELECT
                    e.id AS EntryId,
                    COUNT(v.id)::int AS VoteCount,
                    e.submitted_at AS SubmittedAt
                FROM arena_entries e
                LEFT JOIN arena_votes v
                    ON v.entry_id = e.id
                WHERE e.challenge_id = @ChallengeId
                GROUP BY e.id, e.submitted_at
            ),
            ranked AS (
                SELECT
                    EntryId,
                    VoteCount,
                    SubmittedAt,
                    DENSE_RANK() OVER (ORDER BY VoteCount DESC) AS VoteRank
                FROM scores
            ),
            top_ranked AS (
                SELECT EntryId, VoteCount, SubmittedAt
                FROM ranked
                WHERE VoteRank = 1
            )
            SELECT
                CASE WHEN (SELECT COUNT(*) FROM top_ranked) = 1
                    THEN (
                        SELECT EntryId
                        FROM top_ranked
                        ORDER BY VoteCount DESC, SubmittedAt ASC, EntryId
                        LIMIT 1
                    )
                    ELSE NULL
                END AS WinnerEntryId,
                CASE WHEN (SELECT COUNT(*) FROM top_ranked) > 1
                    THEN TRUE
                    ELSE FALSE
                END AS IsDraw
            FROM top_ranked
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        var result = await connection.QuerySingleAsync<WinnerRow>(sql, new { ChallengeId = challengeId });
        return (result.WinnerEntryId, result.IsDraw);
    }

    public async Task CloseChallengeAsync(Guid challengeId, Guid? winnerEntryId, DateTime updatedAtUtc)
    {
        const string sql = """
            UPDATE arena_challenges
            SET status = 'closed',
                winner_entry_id = @WinnerEntryId,
                updated_at = @UpdatedAtUtc
            WHERE id = @ChallengeId;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            ChallengeId = challengeId,
            WinnerEntryId = winnerEntryId,
            UpdatedAtUtc = updatedAtUtc
        });
    }

    public async Task<IReadOnlyList<HallOfBarsItemResponse>> GetHallOfBarsAsync(Guid roomId, int take)
    {
        const string sql = """
            WITH vote_counts AS (
                SELECT entry_id, COUNT(*)::int AS VoteCount
                FROM arena_votes
                GROUP BY entry_id
            )
            SELECT
                c.id AS ChallengeId,
                e.id AS EntryId,
                c.title AS Title,
                c.challenge_type AS ChallengeType,
                c.theme AS Theme,
                u.username AS WinnerUsername,
                u.display_name AS WinnerDisplayName,
                e.content AS Content,
                COALESCE(vc.VoteCount, 0) AS VoteCount,
                c.updated_at AS ClosedAt
            FROM arena_challenges c
            INNER JOIN arena_entries e
                ON e.id = c.winner_entry_id
            INNER JOIN users u
                ON u.id = e.user_id
            LEFT JOIN vote_counts vc
                ON vc.entry_id = e.id
            WHERE c.room_id = @RoomId
              AND c.status = 'closed'
              AND c.winner_entry_id IS NOT NULL
            ORDER BY c.updated_at DESC
            LIMIT @Take;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<HallOfBarsItemResponse>(sql, new
        {
            RoomId = roomId,
            Take = Math.Clamp(take, 1, 50)
        });

        return rows.ToList();
    }

    public async Task<IReadOnlyList<ArenaLeaderboardRowResponse>> GetLeaderboardAsync(Guid roomId, int take)
    {
        const string sql = """
            WITH windowed_challenges AS (
                SELECT id, winner_entry_id
                FROM arena_challenges
                WHERE room_id = @RoomId
                  AND created_at >= NOW() - INTERVAL '7 days'
            ),
            entry_stats AS (
                SELECT
                    e.user_id AS UserId,
                    COUNT(*)::int AS EntriesSubmitted
                FROM arena_entries e
                INNER JOIN windowed_challenges c
                    ON c.id = e.challenge_id
                GROUP BY e.user_id
            ),
            vote_stats AS (
                SELECT
                    e.user_id AS UserId,
                    COUNT(v.id)::int AS VotesReceived
                FROM arena_entries e
                INNER JOIN windowed_challenges c
                    ON c.id = e.challenge_id
                LEFT JOIN arena_votes v
                    ON v.entry_id = e.id
                GROUP BY e.user_id
            ),
            win_stats AS (
                SELECT
                    e.user_id AS UserId,
                    COUNT(*)::int AS BattlesWon
                FROM arena_entries e
                INNER JOIN windowed_challenges c
                    ON c.winner_entry_id = e.id
                GROUP BY e.user_id
            )
            SELECT
                u.id AS UserId,
                u.username AS Username,
                u.display_name AS DisplayName,
                u.avatar_url AS AvatarUrl,
                COALESCE(w.BattlesWon, 0) AS BattlesWon,
                COALESCE(v.VotesReceived, 0) AS VotesReceived,
                COALESCE(es.EntriesSubmitted, 0) AS EntriesSubmitted
            FROM users u
            INNER JOIN entry_stats es
                ON es.UserId = u.id
            LEFT JOIN vote_stats v
                ON v.UserId = u.id
            LEFT JOIN win_stats w
                ON w.UserId = u.id
            ORDER BY COALESCE(w.BattlesWon, 0) DESC,
                     COALESCE(v.VotesReceived, 0) DESC,
                     COALESCE(es.EntriesSubmitted, 0) DESC,
                     u.display_name ASC
            LIMIT @Take;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<ArenaLeaderboardRowResponse>(sql, new
        {
            RoomId = roomId,
            Take = Math.Clamp(take, 1, 50)
        });

        return rows.ToList();
    }

    private sealed class WinnerRow
    {
        public Guid? WinnerEntryId { get; set; }
        public bool IsDraw { get; set; }
    }
}
