using System.Text.Json;
using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Bts.Api.Models.Requests;
using Bts.Api.Models.Responses;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class BattleItRepository : IBattleItRepository
{
    private readonly DapperContext _context;

    public BattleItRepository(DapperContext context)
    {
        _context = context;
    }

    private const string SessionSelect = """
        SELECT
            bis.id,
            bis.room_id AS RoomId,
            bis.creator_user_id AS CreatorUserId,
            u.display_name AS CreatorDisplayName,
            bis.game_session_id AS GameSessionId,
            bis.title,
            bis.status,
            bis.source_type AS SourceType,
            bis.source_label AS SourceLabel,
            bis.difficulty,
            bis.answer_mode AS AnswerMode,
            bis.visibility,
            bis.question_duration_seconds AS QuestionDurationSeconds,
            bis.reveal_delay_seconds AS RevealDelaySeconds,
            bis.join_code AS JoinCode,
            bis.model,
            bis.created_at AS CreatedAt,
            bis.updated_at AS UpdatedAt,
            bis.started_at AS StartedAt,
            bis.completed_at AS CompletedAt
        FROM battle_it_sessions bis
        INNER JOIN users u ON u.id = bis.creator_user_id
        """;

    public async Task<BattleItSession?> GetVisibleSessionAsync(Guid roomId, Guid userId)
    {
        var sql = SessionSelect + "\n" + """
            WHERE bis.room_id = @RoomId
              AND (
                    (bis.status = 'draft' AND bis.creator_user_id = @UserId)
                    OR (
                        bis.status IN ('draft', 'lobby', 'active', 'completed')
                        AND EXISTS (
                            SELECT 1
                            FROM battle_it_session_members bim
                            WHERE bim.session_id = bis.id
                              AND bim.user_id = @UserId
                        )
                        AND (bis.status <> 'completed' OR bis.completed_at >= NOW() - INTERVAL '30 minutes')
                    )
                  )
            ORDER BY
                CASE bis.status
                    WHEN 'active' THEN 0
                    WHEN 'lobby' THEN 1
                    WHEN 'draft' THEN 2
                    ELSE 3
                END,
                bis.updated_at DESC
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<BattleItSession>(sql, new { RoomId = roomId, UserId = userId });
    }

    public async Task<BattleItSession?> GetByIdAsync(Guid sessionId)
    {
        var sql = SessionSelect + " WHERE bis.id = @SessionId;";
        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<BattleItSession>(sql, new { SessionId = sessionId });
    }

    public async Task<BattleItSession?> JoinByCodeAsync(Guid roomId, Guid userId, string joinCode)
    {
        const string insertSql = """
            INSERT INTO battle_it_session_members (session_id, user_id, joined_at)
            SELECT id, @UserId, NOW()
            FROM battle_it_sessions
            WHERE room_id = @RoomId
              AND join_code = @JoinCode
              AND status IN ('draft', 'lobby', 'active')
            ON CONFLICT (session_id, user_id) DO NOTHING;
            """;

        using (var connection = _context.CreateConnection())
        {
            await connection.ExecuteAsync(insertSql, new { RoomId = roomId, UserId = userId, JoinCode = joinCode });
        }

        var sql = SessionSelect + "\n" + """
            WHERE bis.room_id = @RoomId
              AND bis.join_code = @JoinCode
              AND bis.status IN ('draft', 'lobby', 'active')
              AND EXISTS (
                    SELECT 1
                    FROM battle_it_session_members bim
                    WHERE bim.session_id = bis.id
                      AND bim.user_id = @UserId
                  )
            LIMIT 1;
            """;

        using var lookupConnection = _context.CreateConnection();
        return await lookupConnection.QuerySingleOrDefaultAsync<BattleItSession>(
            sql,
            new { RoomId = roomId, UserId = userId, JoinCode = joinCode });
    }

    public async Task<BattleItSession?> JoinPublicAsync(
        Guid roomId,
        Guid sessionId,
        Guid userId)
    {
        const string insertSql = """
            INSERT INTO battle_it_session_members (session_id, user_id, joined_at)
            SELECT id, @UserId, NOW()
            FROM battle_it_sessions
            WHERE id = @SessionId
              AND room_id = @RoomId
              AND visibility = 'public'
              AND status IN ('lobby', 'active')
            ON CONFLICT (session_id, user_id) DO NOTHING;
            """;

        using (var connection = _context.CreateConnection())
        {
            await connection.ExecuteAsync(insertSql, new { RoomId = roomId, SessionId = sessionId, UserId = userId });
        }

        var sql = SessionSelect + "\n" + """
            WHERE bis.id = @SessionId
              AND bis.room_id = @RoomId
              AND bis.visibility = 'public'
              AND bis.status IN ('lobby', 'active')
              AND EXISTS (
                    SELECT 1
                    FROM battle_it_session_members bim
                    WHERE bim.session_id = bis.id
                      AND bim.user_id = @UserId
                  )
            LIMIT 1;
            """;

        using var lookupConnection = _context.CreateConnection();
        return await lookupConnection.QuerySingleOrDefaultAsync<BattleItSession>(
            sql,
            new { RoomId = roomId, SessionId = sessionId, UserId = userId });
    }

    public async Task<IReadOnlyList<BattleItPublicSessionResponse>> GetPublicSessionsAsync(Guid roomId)
    {
        const string sql = """
            SELECT
                bis.id AS SessionId,
                bis.title,
                u.display_name AS CreatorDisplayName,
                bis.status,
                bis.difficulty,
                bis.answer_mode AS AnswerMode,
                bis.question_duration_seconds AS QuestionDurationSeconds,
                COUNT(DISTINCT biq.question_id)::INT AS QuestionCount,
                COUNT(DISTINCT bim.user_id)::INT AS PlayerCount,
                bis.started_at AS StartedAt
            FROM battle_it_sessions bis
            INNER JOIN users u ON u.id = bis.creator_user_id
            LEFT JOIN battle_it_session_questions biq ON biq.session_id = bis.id
            LEFT JOIN battle_it_session_members bim ON bim.session_id = bis.id
            WHERE bis.room_id = @RoomId
              AND bis.visibility = 'public'
              AND bis.status IN ('lobby', 'active')
            GROUP BY bis.id, u.display_name
            ORDER BY
                CASE bis.status WHEN 'lobby' THEN 0 ELSE 1 END,
                bis.updated_at DESC
            LIMIT 20;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<BattleItPublicSessionResponse>(sql, new { RoomId = roomId });
        return rows.ToList();
    }

    public async Task<bool> IsMemberAsync(Guid sessionId, Guid userId)
    {
        const string sql = """
            SELECT EXISTS (
                SELECT 1
                FROM battle_it_session_members
                WHERE session_id = @SessionId
                  AND user_id = @UserId
            );
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteScalarAsync<bool>(sql, new { SessionId = sessionId, UserId = userId });
    }

    public async Task<int> GetMemberCountAsync(Guid sessionId)
    {
        const string sql = "SELECT COUNT(*) FROM battle_it_session_members WHERE session_id = @SessionId;";
        using var connection = _context.CreateConnection();
        return await connection.ExecuteScalarAsync<int>(sql, new { SessionId = sessionId });
    }

    public async Task<bool> JoinCodeExistsAsync(string joinCode)
    {
        const string sql = """
            SELECT EXISTS (
                SELECT 1
                FROM battle_it_sessions
                WHERE join_code = @JoinCode
                  AND status IN ('draft', 'lobby', 'active')
            );
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteScalarAsync<bool>(sql, new { JoinCode = joinCode });
    }

    public async Task<bool> SetJoinCodeIfMissingAsync(
        Guid sessionId,
        Guid creatorUserId,
        string joinCode)
    {
        const string sql = """
            UPDATE battle_it_sessions
            SET join_code = @JoinCode,
                updated_at = NOW()
            WHERE id = @SessionId
              AND creator_user_id = @CreatorUserId
              AND join_code IS NULL
              AND status IN ('draft', 'lobby', 'active');
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteAsync(
            sql,
            new { SessionId = sessionId, CreatorUserId = creatorUserId, JoinCode = joinCode }) == 1;
    }

    public async Task<BattleItSession?> GetActiveByRoomIdAsync(Guid roomId)
    {
        var sql = SessionSelect + "\n" + """
            WHERE bis.room_id = @RoomId
              AND bis.status = 'active'
            ORDER BY bis.started_at DESC
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<BattleItSession>(sql, new { RoomId = roomId });
    }

    public async Task<IReadOnlyList<BattleItQuestion>> GetQuestionsAsync(Guid sessionId)
    {
        const string sql = """
            SELECT
                biq.session_id AS SessionId,
                biq.question_id AS QuestionId,
                biq.position,
                biq.concept,
                biq.source_excerpt AS SourceExcerpt,
                biq.answer_options::text AS AnswerOptionsJson,
                q.question_text AS QuestionText,
                q.correct_answer AS CorrectAnswer,
                q.accepted_answers::text AS AcceptedAnswersJson,
                q.answer_explanation AS AnswerExplanation,
                q.difficulty
            FROM battle_it_session_questions biq
            INNER JOIN trivia_questions q ON q.id = biq.question_id
            WHERE biq.session_id = @SessionId
            ORDER BY biq.position;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<BattleItQuestion>(sql, new { SessionId = sessionId });
        return rows.ToList();
    }

    public Task<BattleItQuestion?> GetQuestionAtPositionAsync(Guid sessionId, int position)
    {
        return GetQuestionAsync(sessionId, null, position);
    }

    public Task<BattleItQuestion?> GetQuestionByIdAsync(Guid sessionId, Guid questionId)
    {
        return GetQuestionAsync(sessionId, questionId, null);
    }

    public async Task<BattleItSession> CreateDraftAsync(
        Guid roomId,
        Guid creatorUserId,
        string sourceType,
        string? sourceLabel,
        string sourceHash,
        string difficulty,
        string answerMode,
        string visibility,
        int questionDurationSeconds,
        int revealDelaySeconds,
        string joinCode,
        string model,
        BattleItGeneratedPack pack)
    {
        var now = DateTime.UtcNow;
        var sessionId = Guid.NewGuid();

        using var connection = _context.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        await connection.ExecuteAsync(
            """
            UPDATE battle_it_sessions
            SET status = 'cancelled', updated_at = @Now
            WHERE room_id = @RoomId
              AND creator_user_id = @CreatorUserId
              AND status = 'draft';
            """,
            new { RoomId = roomId, CreatorUserId = creatorUserId, Now = now },
            transaction);

        await connection.ExecuteAsync(
            """
            INSERT INTO battle_it_sessions (
                id, room_id, creator_user_id, title, status, source_type,
                source_label, source_hash, difficulty, question_duration_seconds,
                answer_mode, visibility, reveal_delay_seconds, join_code, model, created_at, updated_at
            )
            VALUES (
                @Id, @RoomId, @CreatorUserId, @Title, 'draft', @SourceType,
                @SourceLabel, @SourceHash, @Difficulty, @QuestionDurationSeconds,
                @AnswerMode, @Visibility, @RevealDelaySeconds, @JoinCode, @Model, @Now, @Now
            );
            """,
            new
            {
                Id = sessionId,
                RoomId = roomId,
                CreatorUserId = creatorUserId,
                Title = pack.Title,
                SourceType = sourceType,
                SourceLabel = sourceLabel,
                SourceHash = sourceHash,
                Difficulty = difficulty,
                AnswerMode = answerMode,
                Visibility = visibility,
                QuestionDurationSeconds = questionDurationSeconds,
                RevealDelaySeconds = revealDelaySeconds,
                JoinCode = joinCode,
                Model = model,
                Now = now
            },
            transaction);

        for (var index = 0; index < pack.Questions.Count; index++)
        {
            var generated = pack.Questions[index];
            var questionId = Guid.NewGuid();

            await connection.ExecuteAsync(
                """
                INSERT INTO trivia_questions (
                    id, question_text, correct_answer, accepted_answers,
                    answer_explanation, category, difficulty, is_active,
                    origin, created_by_user_id, created_at
                )
                VALUES (
                    @Id, @QuestionText, @CorrectAnswer, CAST(@AcceptedAnswersJson AS jsonb),
                    @AnswerExplanation, @Category, @Difficulty, FALSE,
                    'battle-it', @CreatorUserId, @Now
                );
                """,
                new
                {
                    Id = questionId,
                    generated.QuestionText,
                    generated.CorrectAnswer,
                    AcceptedAnswersJson = JsonSerializer.Serialize(generated.AcceptedAnswers),
                    generated.AnswerExplanation,
                    Category = generated.Concept,
                    generated.Difficulty,
                    CreatorUserId = creatorUserId,
                    Now = now
                },
                transaction);

            await connection.ExecuteAsync(
                """
                INSERT INTO battle_it_session_questions (
                    session_id, question_id, position, concept, source_excerpt, answer_options
                )
                VALUES (
                    @SessionId, @QuestionId, @Position, @Concept, @SourceExcerpt,
                    CAST(@AnswerOptionsJson AS jsonb)
                );
                """,
                new
                {
                    SessionId = sessionId,
                    QuestionId = questionId,
                    Position = index + 1,
                    generated.Concept,
                    generated.SourceExcerpt,
                    AnswerOptionsJson = JsonSerializer.Serialize(generated.AnswerOptions)
                },
                transaction);
        }

        await connection.ExecuteAsync(
            """
            INSERT INTO battle_it_session_members (session_id, user_id, joined_at)
            VALUES (@SessionId, @CreatorUserId, @Now)
            ON CONFLICT (session_id, user_id) DO NOTHING;
            """,
            new { SessionId = sessionId, CreatorUserId = creatorUserId, Now = now },
            transaction);

        transaction.Commit();
        return (await GetByIdAsync(sessionId))!;
    }

    public async Task<bool> UpdateDraftAsync(
        Guid sessionId,
        Guid creatorUserId,
        UpdateBattleItDraftRequest request)
    {
        using var connection = _context.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        var lockedDraftId = await connection.QuerySingleOrDefaultAsync<Guid?>(
            """
            SELECT id
            FROM battle_it_sessions
            WHERE id = @SessionId
              AND creator_user_id = @CreatorUserId
              AND status = 'draft'
            FOR UPDATE;
            """,
            new { SessionId = sessionId, CreatorUserId = creatorUserId },
            transaction);

        if (!lockedDraftId.HasValue)
            return false;

        var existingQuestionIds = (await connection.QueryAsync<Guid>(
            "SELECT question_id FROM battle_it_session_questions WHERE session_id = @SessionId;",
            new { SessionId = sessionId },
            transaction)).ToHashSet();

        if (request.Questions.Count == 0 || request.Questions.Any(q => !existingQuestionIds.Contains(q.QuestionId)))
            return false;

        await connection.ExecuteAsync(
            """
            UPDATE battle_it_sessions
            SET title = @Title,
                difficulty = @Difficulty,
                answer_mode = @AnswerMode,
                visibility = @Visibility,
                question_duration_seconds = @QuestionDurationSeconds,
                reveal_delay_seconds = @RevealDelaySeconds,
                updated_at = @Now
            WHERE id = @SessionId;
            """,
            new
            {
                SessionId = sessionId,
                request.Title,
                request.Difficulty,
                request.AnswerMode,
                request.Visibility,
                request.QuestionDurationSeconds,
                request.RevealDelaySeconds,
                Now = DateTime.UtcNow
            },
            transaction);

        var retainedIds = request.Questions.Select(q => q.QuestionId).ToArray();
        var removedIds = existingQuestionIds.Except(retainedIds).ToArray();
        await connection.ExecuteAsync(
            "DELETE FROM battle_it_session_questions WHERE session_id = @SessionId;",
            new { SessionId = sessionId },
            transaction);

        if (removedIds.Length > 0)
        {
            await connection.ExecuteAsync(
                "DELETE FROM trivia_questions WHERE id = ANY(@RemovedIds) AND origin = 'battle-it';",
                new { RemovedIds = removedIds },
                transaction);
        }

        for (var index = 0; index < request.Questions.Count; index++)
        {
            var question = request.Questions[index];
            await connection.ExecuteAsync(
                """
                UPDATE trivia_questions
                SET question_text = @QuestionText,
                    correct_answer = @CorrectAnswer,
                    accepted_answers = CAST(@AcceptedAnswersJson AS jsonb),
                    answer_explanation = @AnswerExplanation,
                    category = @Concept,
                    difficulty = @Difficulty
                WHERE id = @QuestionId
                  AND origin = 'battle-it'
                  AND created_by_user_id = @CreatorUserId;

                INSERT INTO battle_it_session_questions (
                    session_id, question_id, position, concept, source_excerpt, answer_options
                )
                VALUES (
                    @SessionId, @QuestionId, @Position, @Concept, @SourceExcerpt,
                    CAST(@AnswerOptionsJson AS jsonb)
                );
                """,
                new
                {
                    SessionId = sessionId,
                    question.QuestionId,
                    question.QuestionText,
                    question.CorrectAnswer,
                    AcceptedAnswersJson = JsonSerializer.Serialize(question.AcceptedAnswers),
                    question.AnswerExplanation,
                    question.Concept,
                    question.Difficulty,
                    question.SourceExcerpt,
                    AnswerOptionsJson = JsonSerializer.Serialize(question.AnswerOptions),
                    CreatorUserId = creatorUserId,
                    Position = index + 1
                },
                transaction);
        }

        transaction.Commit();
        return true;
    }

    public async Task<bool> OpenLobbyAsync(Guid sessionId, Guid creatorUserId, string joinCode)
    {
        const string sql = """
            UPDATE battle_it_sessions
            SET status = 'lobby', join_code = COALESCE(join_code, @JoinCode), updated_at = @Now
            WHERE id = @SessionId
              AND creator_user_id = @CreatorUserId
              AND status = 'draft'
              AND EXISTS (
                    SELECT 1 FROM battle_it_session_questions
                    WHERE session_id = @SessionId
                  );
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteAsync(sql, new
        {
            SessionId = sessionId,
            CreatorUserId = creatorUserId,
            JoinCode = joinCode,
            Now = DateTime.UtcNow
        }) == 1;
    }

    public async Task<TriviaGameSession?> StartAsync(Guid sessionId, Guid creatorUserId)
    {
        using var connection = _context.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        var battle = await connection.QuerySingleOrDefaultAsync<BattleItSession>(
            """
            SELECT
                id, room_id AS RoomId, creator_user_id AS CreatorUserId,
                game_session_id AS GameSessionId, title, status,
                source_type AS SourceType, source_label AS SourceLabel,
                difficulty, question_duration_seconds AS QuestionDurationSeconds,
                answer_mode AS AnswerMode,
                visibility,
                reveal_delay_seconds AS RevealDelaySeconds, model,
                created_at AS CreatedAt, updated_at AS UpdatedAt,
                started_at AS StartedAt, completed_at AS CompletedAt
            FROM battle_it_sessions
            WHERE id = @SessionId
              AND creator_user_id = @CreatorUserId
            FOR UPDATE;
            """,
            new { SessionId = sessionId, CreatorUserId = creatorUserId },
            transaction);

        if (battle is null || !string.Equals(battle.Status, "lobby", StringComparison.OrdinalIgnoreCase))
            return null;

        var hasActiveGame = await connection.ExecuteScalarAsync<bool>(
            "SELECT EXISTS (SELECT 1 FROM trivia_game_sessions WHERE room_id = @RoomId AND status = 'active');",
            new { battle.RoomId },
            transaction);

        if (hasActiveGame)
            return null;

        var now = DateTime.UtcNow;
        var gameSession = new TriviaGameSession
        {
            Id = Guid.NewGuid(),
            RoomId = battle.RoomId,
            Status = "active",
            // The shared table also constrains session_type to its legacy value.
            // Battle It identity lives in battle_it_sessions and the dedicated room.
            SessionType = "weekly",
            // The shared table currently constrains run_mode to continuous/scheduled.
            // Battle It remains finite through its ordered session-question count.
            RunMode = "continuous",
            StartedAt = now,
            PeriodStart = now,
            PeriodEnd = now.AddHours(2),
            WinnersAnnounced = false
        };

        await connection.ExecuteAsync(
            """
            INSERT INTO trivia_game_sessions (
                id, room_id, status, session_type, run_mode, started_at,
                ended_at, period_start, period_end, winners_announced
            )
            VALUES (
                @Id, @RoomId, @Status, @SessionType, @RunMode, @StartedAt,
                @EndedAt, @PeriodStart, @PeriodEnd, @WinnersAnnounced
            );
            """,
            gameSession,
            transaction);

        await connection.ExecuteAsync(
            """
            UPDATE battle_it_sessions
            SET status = 'active',
                game_session_id = @GameSessionId,
                started_at = @Now,
                completed_at = NULL,
                updated_at = @Now
            WHERE id = @SessionId;
            """,
            new { SessionId = sessionId, GameSessionId = gameSession.Id, Now = now },
            transaction);

        transaction.Commit();
        return gameSession;
    }

    public async Task<bool> ReplayAsync(Guid sessionId, Guid creatorUserId, string joinCode)
    {
        const string sql = """
            UPDATE battle_it_sessions
            SET status = 'lobby',
                game_session_id = NULL,
                join_code = @JoinCode,
                started_at = NULL,
                completed_at = NULL,
                updated_at = @Now
            WHERE id = @SessionId
              AND creator_user_id = @CreatorUserId
              AND status = 'completed';
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteAsync(sql, new
        {
            SessionId = sessionId,
            CreatorUserId = creatorUserId,
            JoinCode = joinCode,
            Now = DateTime.UtcNow
        }) == 1;
    }

    public async Task CompleteAsync(Guid sessionId, DateTime completedAtUtc)
    {
        const string sql = """
            UPDATE battle_it_sessions
            SET status = 'completed',
                completed_at = @CompletedAtUtc,
                updated_at = @CompletedAtUtc
            WHERE id = @SessionId
              AND status = 'active';
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new { SessionId = sessionId, CompletedAtUtc = completedAtUtc });
    }

    private async Task<BattleItQuestion?> GetQuestionAsync(
        Guid sessionId,
        Guid? questionId,
        int? position)
    {
        const string sql = """
            SELECT
                biq.session_id AS SessionId,
                biq.question_id AS QuestionId,
                biq.position,
                biq.concept,
                biq.source_excerpt AS SourceExcerpt,
                biq.answer_options::text AS AnswerOptionsJson,
                q.question_text AS QuestionText,
                q.correct_answer AS CorrectAnswer,
                q.accepted_answers::text AS AcceptedAnswersJson,
                q.answer_explanation AS AnswerExplanation,
                q.difficulty
            FROM battle_it_session_questions biq
            INNER JOIN trivia_questions q ON q.id = biq.question_id
            WHERE biq.session_id = @SessionId
              AND (@QuestionId IS NULL OR biq.question_id = @QuestionId)
              AND (@Position IS NULL OR biq.position = @Position)
            LIMIT 1;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<BattleItQuestion>(sql, new
        {
            SessionId = sessionId,
            QuestionId = questionId,
            Position = position
        });
    }
}
