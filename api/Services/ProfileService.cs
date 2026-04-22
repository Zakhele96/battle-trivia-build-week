using Bts.Api.Data;
using Bts.Api.Models.Requests;
using Bts.Api.Models.Responses;
using Bts.Api.Repositories;
using Dapper;

namespace Bts.Api.Services;

public sealed class ProfileService
{
    private readonly IUserRepository _userRepository;
    private readonly BattleTriviaProfileStatsService _battleTriviaProfileStatsService;
    private readonly DapperContext _context;

    public ProfileService(
        IUserRepository userRepository,
        BattleTriviaProfileStatsService battleTriviaProfileStatsService,
        DapperContext context)
    {
        _userRepository = userRepository;
        _battleTriviaProfileStatsService = battleTriviaProfileStatsService;
        _context = context;
    }

    public async Task<ProfileMeResponse?> GetMeAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null || !user.IsActive)
            return null;

        var stats = await _battleTriviaProfileStatsService.GetForUserAsync(userId);
        const string wordScrambleCorrectSql = """
            SELECT COUNT(*)::int
            FROM word_scramble_answers a
            INNER JOIN word_scramble_rounds r
                ON r.id = a.round_id
            INNER JOIN word_scramble_sessions s
                ON s.id = r.session_id
            INNER JOIN rooms ro
                ON ro.id = s.room_id
            WHERE a.user_id = @UserId
              AND a.is_correct = TRUE
              AND ro.slug = 'word-scramble';
            """;

        using var connection = _context.CreateConnection();
        var wordScrambleCorrectAnswers = await connection.ExecuteScalarAsync<int>(
            wordScrambleCorrectSql,
            new { UserId = userId });

        return new ProfileMeResponse
        {
            Username = user.Username,
            DisplayName = user.DisplayName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            IsAdmin = user.IsAdmin,
            Stats = new ProfileStatsResponse
            {
                TotalCorrectAnswers = stats.TotalCorrectAnswers,
                WordScrambleCorrectAnswers = wordScrambleCorrectAnswers,
                BestStreak = stats.BestStreak,
                WeeklyWins = stats.WeeklyWins,
                FastestCorrectAnswerMs = stats.FastestCorrectAnswerMs
            }
        };
    }

    public async Task<ProfileMeResponse?> UpdateAsync(Guid userId, UpdateProfileRequest request)
    {
        var displayName = request.DisplayName?.Trim() ?? "";
        if (string.IsNullOrWhiteSpace(displayName))
            throw new InvalidOperationException("Display name is required.");

        await _userRepository.UpdateProfileAsync(
            userId,
            displayName,
            string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim());

        return await GetMeAsync(userId);
    }

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CurrentPassword))
            throw new InvalidOperationException("Current password is required.");

        if (string.IsNullOrWhiteSpace(request.NewPassword))
            throw new InvalidOperationException("New password is required.");

        if (request.NewPassword.Length < 6)
            throw new InvalidOperationException("New password must be at least 6 characters.");

        if (!string.Equals(request.NewPassword, request.ConfirmPassword, StringComparison.Ordinal))
            throw new InvalidOperationException("New password and confirmation do not match.");

        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null || !user.IsActive)
            throw new InvalidOperationException("User not found.");

        var currentMatches = BCrypt.Net.BCrypt.Verify(
            request.CurrentPassword,
            user.PasswordHash);

        if (!currentMatches)
            throw new InvalidOperationException("Current password is incorrect.");

        var newHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _userRepository.UpdatePasswordHashAsync(userId, newHash);
    }

    public async Task<ProfileHistoryPageResponse> GetHistoryAsync(Guid userId, int page, int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        const string countSql = """
            SELECT COUNT(*)
            FROM trivia_session_results r
            INNER JOIN trivia_game_sessions s
                ON s.id = r.session_id
            INNER JOIN rooms ro
                ON ro.id = s.room_id
            WHERE r.user_id = @UserId
              AND ro.slug = 'battle-trivia'
              AND s.status = 'ended';
            """;

        const string itemsSql = """
            SELECT
                r.session_id AS Id,
                'Battle Trivia session' AS Title,
                COALESCE(s.ended_at, s.period_end, s.started_at) AS EndedAt,
                r.score AS Score,
                r.rank AS Rank
            FROM trivia_session_results r
            INNER JOIN trivia_game_sessions s
                ON s.id = r.session_id
            INNER JOIN rooms ro
                ON ro.id = s.room_id
            WHERE r.user_id = @UserId
              AND ro.slug = 'battle-trivia'
              AND s.status = 'ended'
            ORDER BY COALESCE(s.ended_at, s.period_end, s.started_at) DESC, r.created_at DESC
            LIMIT @PageSize
            OFFSET @Offset;
            """;

        using var connection = _context.CreateConnection();

        var totalItems = await connection.ExecuteScalarAsync<int>(countSql, new
        {
            UserId = userId
        });

        var offset = (page - 1) * pageSize;

        var items = await connection.QueryAsync<ProfileHistoryItemResponse>(itemsSql, new
        {
            UserId = userId,
            PageSize = pageSize,
            Offset = offset
        });

        var totalPages = totalItems == 0
            ? 1
            : (int)Math.Ceiling(totalItems / (double)pageSize);

        return new ProfileHistoryPageResponse
        {
            Items = items.ToList(),
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = totalPages
        };
    }
}
