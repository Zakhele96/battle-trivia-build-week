using Bts.Api.Models.Domain;
using Bts.Api.Models.Requests;
using Bts.Api.Models.Responses;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class AdminBattleTriviaSettingsService
{
    private const string BattleTriviaSlug = "battle-trivia";

    private readonly IRoomRepository _roomRepository;
    private readonly ITriviaSessionRepository _triviaSessionRepository;
    private readonly ITriviaSessionWindowRepository _triviaSessionWindowRepository;

    public AdminBattleTriviaSettingsService(
        IRoomRepository roomRepository,
        ITriviaSessionRepository triviaSessionRepository,
        ITriviaSessionWindowRepository triviaSessionWindowRepository)
    {
        _roomRepository = roomRepository;
        _triviaSessionRepository = triviaSessionRepository;
        _triviaSessionWindowRepository = triviaSessionWindowRepository;
    }

    public async Task<BattleTriviaSettingsResponse> GetAsync()
    {
        var room = await GetBattleTriviaRoomAsync();
        var session = await GetOrCreateActiveSessionAsync();
        var windows = await _triviaSessionWindowRepository.GetActiveBySessionIdAsync(session.Id);

        return new BattleTriviaSettingsResponse
        {
            SessionId = session.Id,
            SessionType = session.SessionType,
            RunMode = session.RunMode,
            QuestionDurationSeconds = NormalizeBattleTriviaQuestionDurationSeconds(room.BattleTriviaQuestionDurationSeconds),
            RevealDelaySeconds = NormalizeBattleTriviaRevealDelaySeconds(room.BattleTriviaRevealDelaySeconds),
            MediaEnabled = room.BattleTriviaMediaEnabled,
            PeriodStart = session.PeriodStart,
            PeriodEnd = session.PeriodEnd,
            Windows = BuildFullWeekWindows(windows)
        };
    }

    public async Task<BattleTriviaSettingsResponse> UpdateAsync(UpdateBattleTriviaSettingsRequest request)
    {
        var normalizedRunMode = (request.RunMode ?? "continuous").Trim().ToLowerInvariant();
        if (normalizedRunMode is not ("continuous" or "scheduled"))
        {
            throw new InvalidOperationException("Invalid run mode.");
        }

        if (request.QuestionDurationSeconds is < 5 or > 120)
            throw new InvalidOperationException("Battle Trivia question duration must be between 5 and 120 seconds.");

        if (request.RevealDelaySeconds is < 1 or > 30)
            throw new InvalidOperationException("Battle Trivia reveal delay must be between 1 and 30 seconds.");

        var session = await GetOrCreateActiveSessionAsync();
        var room = await GetBattleTriviaRoomAsync();

        await _triviaSessionRepository.UpdateRunModeAsync(session.Id, normalizedRunMode);
        await _roomRepository.UpdateGameTimingAsync(
            room.Id,
            battleTriviaQuestionDurationSeconds: request.QuestionDurationSeconds,
            battleTriviaRevealDelaySeconds: request.RevealDelaySeconds,
            battleTriviaMediaEnabled: request.MediaEnabled);

        var windows = new List<TriviaSessionWindow>();

        foreach (var item in request.Windows ?? new List<BattleTriviaWindowRequest>())
        {
            if (!item.IsActive)
                continue;

            if (item.DayOfWeek < 0 || item.DayOfWeek > 6)
                continue;

            if (!TimeOnly.TryParse(item.StartTime, out var startTime))
                continue;

            if (!TimeOnly.TryParse(item.EndTime, out var endTime))
                continue;

            if (endTime <= startTime)
                continue;

            windows.Add(new TriviaSessionWindow
            {
                Id = Guid.NewGuid(),
                SessionId = session.Id,
                DayOfWeek = item.DayOfWeek,
                StartTime = startTime,
                EndTime = endTime,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _triviaSessionWindowRepository.ReplaceAsync(session.Id, windows);

        return await GetAsync();
    }

    private async Task<Room> GetBattleTriviaRoomAsync()
    {
        var room = await _roomRepository.GetBySlugAsync(BattleTriviaSlug);
        if (room is null)
            throw new InvalidOperationException("Battle Trivia room not found.");

        return room;
    }

    private async Task<TriviaGameSession> GetOrCreateActiveSessionAsync()
    {
        var room = await GetBattleTriviaRoomAsync();

        var session = await _triviaSessionRepository.GetActiveByRoomIdAsync(room.Id);
        if (session is not null)
            return session;

        var nowUtc = DateTime.UtcNow;
        session = CreateDefaultWeeklySession(room.Id, nowUtc);
        await _triviaSessionRepository.CreateAsync(session);

        return session;
    }

    private static TriviaGameSession CreateDefaultWeeklySession(Guid roomId, DateTime nowUtc)
    {
        var weekStart = StartOfWeekUtc(nowUtc, DayOfWeek.Monday);
        var weekEnd = weekStart.AddDays(7).AddTicks(-1);

        return new TriviaGameSession
        {
            Id = Guid.NewGuid(),
            RoomId = roomId,
            Status = "active",
            SessionType = "weekly",
            RunMode = "continuous",
            StartedAt = nowUtc,
            EndedAt = null,
            PeriodStart = weekStart,
            PeriodEnd = weekEnd,
            WinnersAnnounced = false
        };
    }

    private static DateTime StartOfWeekUtc(DateTime value, DayOfWeek startOfWeek)
    {
        var diff = (7 + (value.DayOfWeek - startOfWeek)) % 7;
        var date = value.Date.AddDays(-diff);
        return DateTime.SpecifyKind(date, DateTimeKind.Utc);
    }

    private static int NormalizeBattleTriviaQuestionDurationSeconds(int value) =>
        value is >= 5 and <= 120 ? value : 20;

    private static int NormalizeBattleTriviaRevealDelaySeconds(int value) =>
        value is >= 1 and <= 30 ? value : 5;

    private static List<BattleTriviaWindowResponse> BuildFullWeekWindows(
        IReadOnlyList<TriviaSessionWindow> activeWindows)
    {
        var map = activeWindows.ToDictionary(x => x.DayOfWeek, x => x);

        var rows = new List<BattleTriviaWindowResponse>();

        for (var day = 0; day <= 6; day++)
        {
            if (map.TryGetValue(day, out var value))
            {
                rows.Add(new BattleTriviaWindowResponse
                {
                    DayOfWeek = day,
                    StartTime = value.StartTime.ToString("HH:mm"),
                    EndTime = value.EndTime.ToString("HH:mm"),
                    IsActive = value.IsActive
                });
            }
            else
            {
                rows.Add(new BattleTriviaWindowResponse
                {
                    DayOfWeek = day,
                    StartTime = "18:00",
                    EndTime = "22:00",
                    IsActive = false
                });
            }
        }

        return rows;
    }
}
