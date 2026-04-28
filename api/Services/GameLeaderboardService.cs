using Bts.Api.Models.Dtos;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class GameLeaderboardService
{
    private const string BattleTriviaSlug = "battle-trivia";
    private const string WordScrambleSlug = "word-scramble";

    private readonly IRoomRepository _roomRepository;
    private readonly ITriviaSessionRepository _triviaSessionRepository;
    private readonly ITriviaLeaderboardRepository _triviaLeaderboardRepository;
    private readonly ITriviaSessionResultRepository _triviaSessionResultRepository;
    private readonly IWordScrambleSessionRepository _wordScrambleSessionRepository;
    private readonly IWordScrambleLeaderboardRepository _wordScrambleLeaderboardRepository;
    private readonly IWordScrambleSessionResultRepository _wordScrambleSessionResultRepository;
    private readonly UserPresenceService _userPresenceService;

    public GameLeaderboardService(
        IRoomRepository roomRepository,
        ITriviaSessionRepository triviaSessionRepository,
        ITriviaLeaderboardRepository triviaLeaderboardRepository,
        ITriviaSessionResultRepository triviaSessionResultRepository,
        IWordScrambleSessionRepository wordScrambleSessionRepository,
        IWordScrambleLeaderboardRepository wordScrambleLeaderboardRepository,
        IWordScrambleSessionResultRepository wordScrambleSessionResultRepository,
        UserPresenceService userPresenceService)
    {
        _roomRepository = roomRepository;
        _triviaSessionRepository = triviaSessionRepository;
        _triviaLeaderboardRepository = triviaLeaderboardRepository;
        _triviaSessionResultRepository = triviaSessionResultRepository;
        _wordScrambleSessionRepository = wordScrambleSessionRepository;
        _wordScrambleLeaderboardRepository = wordScrambleLeaderboardRepository;
        _wordScrambleSessionResultRepository = wordScrambleSessionResultRepository;
        _userPresenceService = userPresenceService;
    }

    public async Task<GameLeaderboardDto> GetAsync(string mode, string period, int take = 100)
    {
        mode = (mode ?? string.Empty).Trim().ToLowerInvariant();
        period = (period ?? "current").Trim().ToLowerInvariant();

        return (mode, period) switch
        {
            ("battle-trivia", "current") => await GetBattleTriviaCurrentAsync(take),
            ("battle-trivia", "previous") => await GetBattleTriviaPreviousAsync(take),
            ("word-scramble", "current") => await GetWordScrambleCurrentAsync(take),
            ("word-scramble", "previous") => await GetWordScramblePreviousAsync(take),
            ("combined", "current") => await GetCombinedCurrentAsync(take),
            ("combined", "previous") => await GetCombinedPreviousAsync(take),
            _ => throw new InvalidOperationException("Unsupported leaderboard mode or period.")
        };
    }

    private async Task<GameLeaderboardDto> GetBattleTriviaCurrentAsync(int take)
    {
        var room = await _roomRepository.GetBySlugAsync(BattleTriviaSlug);
        if (room is null)
            return Empty("battle-trivia", "current", "Battle Trivia · Current week");

        var session = await _triviaSessionRepository.GetActiveByRoomIdAsync(room.Id);
        if (session is null)
            return Empty("battle-trivia", "current", "Battle Trivia · Current week");

        var rows = await _triviaLeaderboardRepository.GetSessionLeaderboardAsync(session.Id, take);

        return new GameLeaderboardDto
        {
            Mode = "battle-trivia",
            Period = "current",
            Label = "Battle Trivia · Current week",
            Rows = rows.Select(x => new GameLeaderboardRowDto
            {
                UserId = x.UserId,
                Username = x.Username,
                DisplayName = x.DisplayName,
                AvatarUrl = x.AvatarUrl,
                IsOnline = _userPresenceService.IsOnline(x.UserId),
                Rank = x.Rank,
                Score = x.Score,
                BattleTriviaScore = x.Score,
                WordScrambleScore = 0
            }).ToList()
        };
    }

    private async Task<GameLeaderboardDto> GetBattleTriviaPreviousAsync(int take)
    {
        var room = await _roomRepository.GetBySlugAsync(BattleTriviaSlug);
        if (room is null)
            return Empty("battle-trivia", "previous", "Battle Trivia · Previous week");

        var session = await _triviaSessionRepository.GetLatestEndedByRoomIdAsync(room.Id);
        if (session is null)
            return Empty("battle-trivia", "previous", "Battle Trivia · Previous week");

        var rows = await _triviaSessionResultRepository.GetBySessionIdAsync(session.Id, take);

        return new GameLeaderboardDto
        {
            Mode = "battle-trivia",
            Period = "previous",
            Label = "Battle Trivia · Previous week",
            EndedAt = session.EndedAt,
            Rows = rows.Select(x => new GameLeaderboardRowDto
            {
                UserId = x.UserId,
                Username = x.Username,
                DisplayName = x.DisplayName,
                AvatarUrl = x.AvatarUrl,
                IsOnline = _userPresenceService.IsOnline(x.UserId),
                Rank = x.Rank,
                Score = x.Score,
                BattleTriviaScore = x.Score,
                WordScrambleScore = 0
            }).ToList()
        };
    }

    private async Task<GameLeaderboardDto> GetWordScrambleCurrentAsync(int take)
    {
        var room = await _roomRepository.GetBySlugAsync(WordScrambleSlug);
        if (room is null)
            return Empty("word-scramble", "current", "Word Scramble · Current week");

        var session = await _wordScrambleSessionRepository.GetActiveByRoomIdAsync(room.Id);
        if (session is null)
            return Empty("word-scramble", "current", "Word Scramble · Current week");

        var rows = await _wordScrambleLeaderboardRepository.GetSessionLeaderboardAsync(session.Id, take);

        return new GameLeaderboardDto
        {
            Mode = "word-scramble",
            Period = "current",
            Label = "Word Scramble · Current week",
            Rows = rows.Select(x => new GameLeaderboardRowDto
            {
                UserId = x.UserId,
                Username = x.Username,
                DisplayName = x.DisplayName,
                AvatarUrl = x.AvatarUrl,
                IsOnline = _userPresenceService.IsOnline(x.UserId),
                Rank = x.Rank,
                Score = x.Score,
                BattleTriviaScore = 0,
                WordScrambleScore = x.Score
            }).ToList()
        };
    }

    private async Task<GameLeaderboardDto> GetWordScramblePreviousAsync(int take)
    {
        var room = await _roomRepository.GetBySlugAsync(WordScrambleSlug);
        if (room is null)
            return Empty("word-scramble", "previous", "Word Scramble · Previous week");

        var session = await _wordScrambleSessionRepository.GetLatestEndedByRoomIdAsync(room.Id);
        if (session is null)
            return Empty("word-scramble", "previous", "Word Scramble · Previous week");

        var rows = await _wordScrambleSessionResultRepository.GetBySessionIdAsync(session.Id, take);

        return new GameLeaderboardDto
        {
            Mode = "word-scramble",
            Period = "previous",
            Label = "Word Scramble · Previous week",
            EndedAt = session.EndedAt,
            Rows = rows.Select(x => new GameLeaderboardRowDto
            {
                UserId = x.UserId,
                Username = x.Username,
                DisplayName = x.DisplayName,
                AvatarUrl = x.AvatarUrl,
                IsOnline = _userPresenceService.IsOnline(x.UserId),
                Rank = x.Rank,
                Score = x.Score,
                BattleTriviaScore = 0,
                WordScrambleScore = x.Score
            }).ToList()
        };
    }

    private async Task<GameLeaderboardDto> GetCombinedCurrentAsync(int take)
    {
        var battle = await GetBattleTriviaCurrentAsync(1000);
        var scramble = await GetWordScrambleCurrentAsync(1000);

        return new GameLeaderboardDto
        {
            Mode = "combined",
            Period = "current",
            Label = "Combined · Current week",
            Rows = MergeRows(battle.Rows, scramble.Rows, take)
        };
    }

    private async Task<GameLeaderboardDto> GetCombinedPreviousAsync(int take)
    {
        var battle = await GetBattleTriviaPreviousAsync(1000);
        var scramble = await GetWordScramblePreviousAsync(1000);

        return new GameLeaderboardDto
        {
            Mode = "combined",
            Period = "previous",
            Label = "Combined · Previous week",
            EndedAt = battle.EndedAt ?? scramble.EndedAt,
            Rows = MergeRows(battle.Rows, scramble.Rows, take)
        };
    }

    private static IReadOnlyList<GameLeaderboardRowDto> MergeRows(
        IEnumerable<GameLeaderboardRowDto> battleRows,
        IEnumerable<GameLeaderboardRowDto> scrambleRows,
        int take)
    {
        var map = new Dictionary<Guid, GameLeaderboardRowDto>();

        foreach (var row in battleRows)
        {
            if (!map.TryGetValue(row.UserId, out var entry))
            {
                entry = new GameLeaderboardRowDto
                {
                    UserId = row.UserId,
                    Username = row.Username,
                    DisplayName = row.DisplayName,
                    AvatarUrl = row.AvatarUrl,
                    IsOnline = row.IsOnline
                };
                map[row.UserId] = entry;
            }

            entry.AvatarUrl ??= row.AvatarUrl;
            entry.IsOnline = entry.IsOnline || row.IsOnline;
            entry.BattleTriviaScore += row.BattleTriviaScore > 0 ? row.BattleTriviaScore : row.Score;
        }

        foreach (var row in scrambleRows)
        {
            if (!map.TryGetValue(row.UserId, out var entry))
            {
                entry = new GameLeaderboardRowDto
                {
                    UserId = row.UserId,
                    Username = row.Username,
                    DisplayName = row.DisplayName,
                    AvatarUrl = row.AvatarUrl,
                    IsOnline = row.IsOnline
                };
                map[row.UserId] = entry;
            }

            entry.AvatarUrl ??= row.AvatarUrl;
            entry.IsOnline = entry.IsOnline || row.IsOnline;
            entry.WordScrambleScore += row.WordScrambleScore > 0 ? row.WordScrambleScore : row.Score;
        }

        var merged = map.Values
            .Select(x =>
            {
                x.Score = x.BattleTriviaScore + x.WordScrambleScore;
                return x;
            })
            .OrderByDescending(x => x.Score)
            .ThenBy(x => x.DisplayName)
            .ThenBy(x => x.Username)
            .Take(take)
            .ToList();

        for (var i = 0; i < merged.Count; i++)
        {
            merged[i].Rank = i + 1;
        }

        return merged;
    }

    private static GameLeaderboardDto Empty(string mode, string period, string label) =>
        new()
        {
            Mode = mode,
            Period = period,
            Label = label,
            Rows = Array.Empty<GameLeaderboardRowDto>()
        };
}
