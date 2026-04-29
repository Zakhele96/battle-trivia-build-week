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
    private readonly GrowthAnalyticsService _growthAnalyticsService;
    private readonly DapperContext _context;
    private readonly UserPresenceService _userPresenceService;

    public ProfileService(
        IUserRepository userRepository,
        BattleTriviaProfileStatsService battleTriviaProfileStatsService,
        GrowthAnalyticsService growthAnalyticsService,
        DapperContext context,
        UserPresenceService userPresenceService)
    {
        _userRepository = userRepository;
        _battleTriviaProfileStatsService = battleTriviaProfileStatsService;
        _growthAnalyticsService = growthAnalyticsService;
        _context = context;
        _userPresenceService = userPresenceService;
    }

    public async Task<ProfileMeResponse?> GetMeAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null || !user.IsActive)
            return null;

        var stats = await BuildStatsAsync(userId);
        var growth = await _growthAnalyticsService.GetUserSummaryAsync(userId);

        return new ProfileMeResponse
        {
            Username = user.Username,
            DisplayName = user.DisplayName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            AvatarUrl = user.AvatarUrl,
            StatusMessage = user.StatusMessage,
            IsSupporter = user.IsSupporter,
            SupporterTier = user.SupporterTier,
            SupporterBadgeLabel = GetSupporterBadgeLabel(user.SupporterTier),
            SupporterExpiresAt = user.SupporterExpiresAt,
            IsAdmin = user.IsAdmin,
            Stats = stats,
            Growth = growth
        };
    }

    public async Task<ProfileUserResponse?> GetUserAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null || !user.IsActive)
            return null;

        var lastSeenMap = await _userPresenceService.GetLastSeenManyAsync([userId]);

        return new ProfileUserResponse
        {
            UserId = user.Id,
            Username = user.Username,
            DisplayName = user.DisplayName,
            AvatarUrl = user.AvatarUrl,
            StatusMessage = user.StatusMessage,
            IsSupporter = user.IsSupporter,
            SupporterTier = user.SupporterTier,
            SupporterBadgeLabel = GetSupporterBadgeLabel(user.SupporterTier),
            IsOnline = await _userPresenceService.IsOnlineAsync(userId),
            LastSeenAt = lastSeenMap.TryGetValue(userId, out var lastSeenAt) ? lastSeenAt : null,
            Stats = await BuildStatsAsync(userId)
        };
    }

    public async Task<ProfileMeResponse?> UpdateAsync(Guid userId, UpdateProfileRequest request)
    {
        var displayName = request.DisplayName?.Trim() ?? "";
        if (string.IsNullOrWhiteSpace(displayName))
            throw new InvalidOperationException("Display name is required.");

        if (displayName.Length > 50)
            throw new InvalidOperationException("Display name must be 50 characters or fewer.");

        var statusMessage = string.IsNullOrWhiteSpace(request.StatusMessage)
            ? null
            : request.StatusMessage.Trim();
        if (statusMessage?.Length > 120)
            throw new InvalidOperationException("Status must be 120 characters or fewer.");

        var avatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl)
            ? null
            : request.AvatarUrl.Trim();
        if (avatarUrl?.Length > 1_000_000)
            throw new InvalidOperationException("Profile picture is too large.");

        await _userRepository.UpdateProfileAsync(
            userId,
            displayName,
            string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim(),
            avatarUrl,
            statusMessage);

        return await GetMeAsync(userId);
    }

    private async Task<ProfileStatsResponse> BuildStatsAsync(Guid userId)
    {
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

        return new ProfileStatsResponse
        {
            TotalCorrectAnswers = stats.TotalCorrectAnswers,
            WordScrambleCorrectAnswers = wordScrambleCorrectAnswers,
            BestStreak = stats.BestStreak,
            WeeklyWins = stats.WeeklyWins,
            FastestCorrectAnswerMs = stats.FastestCorrectAnswerMs
        };
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

    private static string? GetSupporterBadgeLabel(string? tier)
    {
        if (string.IsNullOrWhiteSpace(tier))
            return null;

        return string.Equals(tier, "supporter", StringComparison.OrdinalIgnoreCase)
            ? "Supporter"
            : "Member";
    }
}
