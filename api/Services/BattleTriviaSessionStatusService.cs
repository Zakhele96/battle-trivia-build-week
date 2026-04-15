using Bts.Api.Models.Domain;
using Bts.Api.Models.Dtos;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class BattleTriviaSessionStatusService
{
    private readonly ITriviaSessionRepository _triviaSessionRepository;
    private readonly ITriviaSessionWindowRepository _triviaSessionWindowRepository;
    private readonly ITriviaRoundRepository _triviaRoundRepository;

    public BattleTriviaSessionStatusService(
        ITriviaSessionRepository triviaSessionRepository,
        ITriviaSessionWindowRepository triviaSessionWindowRepository,
        ITriviaRoundRepository triviaRoundRepository)
    {
        _triviaSessionRepository = triviaSessionRepository;
        _triviaSessionWindowRepository = triviaSessionWindowRepository;
        _triviaRoundRepository = triviaRoundRepository;
    }

    public async Task<BattleTriviaSessionStatusDto> GetRoomStatusAsync(Guid roomId)
    {
        var session = await _triviaSessionRepository.GetActiveByRoomIdAsync(roomId);
        if (session is null)
        {
            return new BattleTriviaSessionStatusDto
            {
                IsLiveNow = false,
                HasActiveRound = false,
                StatusText = "No active session"
            };
        }

        var nowUtc = DateTime.UtcNow;

        var dto = new BattleTriviaSessionStatusDto
        {
            SessionId = session.Id,
            SessionType = session.SessionType,
            RunMode = session.RunMode,
            PeriodStart = session.PeriodStart,
            PeriodEnd = session.PeriodEnd
        };

        var activeRound = await _triviaRoundRepository.GetActiveRoundDetailsByRoomIdAsync(roomId);
        if (activeRound is not null)
        {
            dto.HasActiveRound = true;
            dto.CurrentRoundEndsAt = activeRound.EndsAt;
        }

        if (session.PeriodStart.HasValue && nowUtc < session.PeriodStart.Value)
        {
            dto.IsLiveNow = false;
            dto.StatusText = "Session not started";
            return dto;
        }

        if (session.PeriodEnd.HasValue && nowUtc >= session.PeriodEnd.Value)
        {
            dto.IsLiveNow = false;
            dto.StatusText = "Session ended";
            return dto;
        }

        if (string.Equals(session.RunMode, "continuous", StringComparison.OrdinalIgnoreCase))
        {
            dto.IsLiveNow = true;
            dto.StatusText = "Live now";
            return dto;
        }

        if (!string.Equals(session.RunMode, "scheduled", StringComparison.OrdinalIgnoreCase))
        {
            dto.IsLiveNow = false;
            dto.StatusText = "Unavailable";
            return dto;
        }

        var windows = await _triviaSessionWindowRepository.GetActiveBySessionIdAsync(session.Id);
        if (windows.Count == 0)
        {
            dto.IsLiveNow = false;
            dto.StatusText = "Scheduled mode";
            return dto;
        }

        var zone = GetGameTimeZone();
        var localNow = TimeZoneInfo.ConvertTimeFromUtc(nowUtc, zone);

        var currentWindow = FindCurrentWindow(windows, localNow, zone);
        if (currentWindow is not null)
        {
            dto.IsLiveNow = true;
            dto.CurrentWindowEnd = currentWindow.Value.EndUtc;
            dto.StatusText = "Live now";
        }
        else
        {
            dto.IsLiveNow = false;
            dto.NextWindowStart = FindNextWindowStart(windows, localNow, zone, session.PeriodEnd);
            dto.StatusText = "Scheduled mode";
        }

        if (dto.HasActiveRound)
        {
            dto.IsLiveNow = true;
            dto.CurrentWindowEnd ??= dto.CurrentRoundEndsAt;
            dto.StatusText = "Live now";
        }

        return dto;
    }

    private static (DateTime StartUtc, DateTime EndUtc)? FindCurrentWindow(
        IReadOnlyList<TriviaSessionWindow> windows,
        DateTime localNow,
        TimeZoneInfo zone)
    {
        var today = localNow.Date;
        var dayOfWeek = (int)localNow.DayOfWeek;
        var localTime = TimeOnly.FromDateTime(localNow);

        var window = windows
            .Where(w => w.IsActive && w.DayOfWeek == dayOfWeek)
            .OrderBy(w => w.StartTime)
            .FirstOrDefault(w => localTime >= w.StartTime && localTime < w.EndTime);

        if (window is null)
            return null;

        var localStart = DateTime.SpecifyKind(
            today.Add(window.StartTime.ToTimeSpan()),
            DateTimeKind.Unspecified);

        var localEnd = DateTime.SpecifyKind(
            today.Add(window.EndTime.ToTimeSpan()),
            DateTimeKind.Unspecified);

        return (
            TimeZoneInfo.ConvertTimeToUtc(localStart, zone),
            TimeZoneInfo.ConvertTimeToUtc(localEnd, zone)
        );
    }

    private static DateTime? FindNextWindowStart(
        IReadOnlyList<TriviaSessionWindow> windows,
        DateTime localNow,
        TimeZoneInfo zone,
        DateTime? periodEndUtc)
    {
        DateTime? bestUtc = null;

        for (var dayOffset = 0; dayOffset <= 7; dayOffset++)
        {
            var localDate = localNow.Date.AddDays(dayOffset);
            var dayOfWeek = (int)localDate.DayOfWeek;

            var dayWindows = windows
                .Where(w => w.IsActive && w.DayOfWeek == dayOfWeek)
                .OrderBy(w => w.StartTime)
                .ToList();

            foreach (var window in dayWindows)
            {
                var localStart = DateTime.SpecifyKind(
                    localDate.Add(window.StartTime.ToTimeSpan()),
                    DateTimeKind.Unspecified);

                if (localStart <= localNow)
                    continue;

                var utcStart = TimeZoneInfo.ConvertTimeToUtc(localStart, zone);

                if (periodEndUtc.HasValue && utcStart >= periodEndUtc.Value)
                    continue;

                if (!bestUtc.HasValue || utcStart < bestUtc.Value)
                {
                    bestUtc = utcStart;
                }
            }
        }

        return bestUtc;
    }

    private static TimeZoneInfo GetGameTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Africa/Johannesburg");
        }
        catch
        {
            return TimeZoneInfo.FindSystemTimeZoneById("South Africa Standard Time");
        }
    }
}