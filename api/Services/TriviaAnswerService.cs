using System.Data.Common;
using System.Text;
using System.Text.Json;
using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Bts.Api.Models.Dtos;
using Bts.Api.Repositories;
using Npgsql;
using Npgsql.PostgresTypes;

namespace Bts.Api.Services;

public sealed class TriviaAnswerService
{
    private const int MaxCorrectInsertAttempts = 3;
    private const int AnswerCooldownSeconds = 1;
    private const int MaxWrongAttemptsPerRound = 5;

    private readonly DapperContext _context;
    private readonly ITriviaRoundRepository _triviaRoundRepository;
    private readonly ITriviaAnswerRepository _triviaAnswerRepository;
    private readonly ITriviaScoreLedgerRepository _triviaScoreLedgerRepository;
    private readonly IUserRepository _userRepository;
    private readonly ProgressionService _progressionService;
    private readonly ProgressionRealtimeService _progressionRealtimeService;

    public TriviaAnswerService(
        DapperContext context,
        ITriviaRoundRepository triviaRoundRepository,
        ITriviaAnswerRepository triviaAnswerRepository,
        ITriviaScoreLedgerRepository triviaScoreLedgerRepository,
        IUserRepository userRepository,
        ProgressionService progressionService,
        ProgressionRealtimeService progressionRealtimeService)
    {
        _context = context;
        _triviaRoundRepository = triviaRoundRepository;
        _triviaAnswerRepository = triviaAnswerRepository;
        _triviaScoreLedgerRepository = triviaScoreLedgerRepository;
        _userRepository = userRepository;
        _progressionService = progressionService;
        _progressionRealtimeService = progressionRealtimeService;
    }

    public async Task<SubmitTriviaAnswerResult> SubmitAnswerAsync(
        Guid roomId,
        Guid userId,
        string answerText)
    {
        var trimmedAnswer = (answerText ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(trimmedAnswer))
        {
            return new SubmitTriviaAnswerResult
            {
                Success = false,
                UserId = userId,
                SubmittedAnswer = trimmedAnswer,
                Message = "Answer cannot be empty."
            };
        }

        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null || !user.IsActive)
        {
            return new SubmitTriviaAnswerResult
            {
                Success = false,
                UserId = userId,
                SubmittedAnswer = trimmedAnswer,
                Message = "User not found."
            };
        }

        var activeRound = await _triviaRoundRepository.GetActiveRoundDetailsByRoomIdAsync(roomId);
        if (activeRound is null)
        {
            return new SubmitTriviaAnswerResult
            {
                Success = false,
                UserId = userId,
                DisplayName = user.DisplayName,
                SubmittedAnswer = trimmedAnswer,
                Message = "There is no active trivia round right now."
            };
        }

        var nowUtc = DateTime.UtcNow;
        if (activeRound.EndsAt <= nowUtc || !string.Equals(activeRound.Status, "active", StringComparison.OrdinalIgnoreCase))
        {
            return new SubmitTriviaAnswerResult
            {
                Success = false,
                UserId = userId,
                DisplayName = user.DisplayName,
                SessionId = activeRound.SessionId,
                RoundId = activeRound.RoundId,
                SubmittedAnswer = trimmedAnswer,
                Message = "This round has already ended."
            };
        }

        var normalizedAnswer = NormalizeAnswer(trimmedAnswer);

        var latestSubmissionAt = await _triviaAnswerRepository.GetLatestSubmissionAtAsync(
            activeRound.RoundId,
            userId);

        var wrongAttemptCount = await _triviaAnswerRepository.GetWrongAttemptCountAsync(
            activeRound.RoundId,
            userId);

        if (latestSubmissionAt.HasValue)
        {
            var nextAllowedAt = latestSubmissionAt.Value.AddSeconds(AnswerCooldownSeconds);
            if (nextAllowedAt > nowUtc)
            {
                return new SubmitTriviaAnswerResult
                {
                    Success = false,
                    UserId = userId,
                    DisplayName = user.DisplayName,
                    SessionId = activeRound.SessionId,
                    RoundId = activeRound.RoundId,
                    SubmittedAnswer = trimmedAnswer,
                    NormalizedAnswer = normalizedAnswer,
                    WrongAttemptsUsed = wrongAttemptCount,
                    WrongAttemptsLeft = Math.Max(0, MaxWrongAttemptsPerRound - wrongAttemptCount),
                    MaxWrongAttempts = MaxWrongAttemptsPerRound,
                    Message = "Slow down a bit before answering again."
                };
            }
        }

        if (wrongAttemptCount >= MaxWrongAttemptsPerRound)
        {
            return new SubmitTriviaAnswerResult
            {
                Success = false,
                UserId = userId,
                DisplayName = user.DisplayName,
                SessionId = activeRound.SessionId,
                RoundId = activeRound.RoundId,
                SubmittedAnswer = trimmedAnswer,
                NormalizedAnswer = normalizedAnswer,
                WrongAttemptsUsed = wrongAttemptCount,
                WrongAttemptsLeft = 0,
                MaxWrongAttempts = MaxWrongAttemptsPerRound,
                Message = "You have used all your wrong attempts for this round."
            };
        }

        var acceptedAnswers = BuildAcceptedAnswers(activeRound);
        var isCorrect = acceptedAnswers.Contains(normalizedAnswer);

        if (!isCorrect)
        {
            await SaveIncorrectAnswerAsync(
                activeRound.RoundId,
                userId,
                trimmedAnswer,
                normalizedAnswer);

            var wrongAttemptsUsed = wrongAttemptCount + 1;
            var wrongAttemptsLeft = Math.Max(0, MaxWrongAttemptsPerRound - wrongAttemptsUsed);

            return new SubmitTriviaAnswerResult
            {
                Success = true,
                IsCorrect = false,
                UserId = userId,
                DisplayName = user.DisplayName,
                SessionId = activeRound.SessionId,
                RoundId = activeRound.RoundId,
                SubmittedAnswer = trimmedAnswer,
                NormalizedAnswer = normalizedAnswer,
                WrongAttemptsUsed = wrongAttemptsUsed,
                WrongAttemptsLeft = wrongAttemptsLeft,
                MaxWrongAttempts = MaxWrongAttemptsPerRound,
                Message = wrongAttemptsLeft > 0
                    ? $"Incorrect answer. {wrongAttemptsLeft} wrong attempts left."
                    : "Incorrect answer. You have used all your wrong attempts for this round."
            };
        }

        return await SaveCorrectAnswerWithRetryAsync(
            roomId,
            userId,
            user.DisplayName,
            activeRound,
            trimmedAnswer,
            normalizedAnswer);
    }

    private async Task SaveIncorrectAnswerAsync(
        Guid roundId,
        Guid userId,
        string submittedAnswer,
        string normalizedAnswer)
    {
        using var connection = _context.CreateConnection();
        await OpenConnectionAsync(connection);

        var answer = new TriviaAnswer
        {
            Id = Guid.NewGuid(),
            RoundId = roundId,
            UserId = userId,
            SubmittedAnswer = submittedAnswer,
            NormalizedAnswer = normalizedAnswer,
            IsCorrect = false,
            CorrectRank = null,
            PointsAwarded = 0,
            SubmittedAt = DateTime.UtcNow
        };

        await _triviaAnswerRepository.CreateAsync(connection, answer);
    }

    private async Task<SubmitTriviaAnswerResult> SaveCorrectAnswerWithRetryAsync(
        Guid roomId,
        Guid userId,
        string displayName,
        TriviaRoundDetails activeRound,
        string submittedAnswer,
        string normalizedAnswer)
    {
        for (var attempt = 1; attempt <= MaxCorrectInsertAttempts; attempt++)
        {
            using var connection = _context.CreateConnection();
            await OpenConnectionAsync(connection);

            await using var transaction = await BeginTransactionAsync(connection);

            try
            {
                var alreadyCorrect = await _triviaAnswerRepository.HasUserCorrectAnswerAsync(
                    connection,
                    activeRound.RoundId,
                    userId,
                    transaction);

                if (alreadyCorrect)
                {
                    await RollbackSafelyAsync(transaction);

                    return new SubmitTriviaAnswerResult
                    {
                        Success = true,
                        IsCorrect = true,
                        AlreadyAnsweredCorrectly = true,
                        UserId = userId,
                        DisplayName = displayName,
                        SessionId = activeRound.SessionId,
                        RoundId = activeRound.RoundId,
                        SubmittedAnswer = submittedAnswer,
                        NormalizedAnswer = normalizedAnswer,
                        Message = "You already answered this round correctly."
                    };
                }

                var currentCorrectCount = await _triviaAnswerRepository.GetCorrectCountAsync(
                    connection,
                    activeRound.RoundId,
                    transaction);

                var correctRank = currentCorrectCount + 1;
                var points = GetPointsForRank(correctRank);
                var submittedAtUtc = DateTime.UtcNow;

                var answer = new TriviaAnswer
                {
                    Id = Guid.NewGuid(),
                    RoundId = activeRound.RoundId,
                    UserId = userId,
                    SubmittedAnswer = submittedAnswer,
                    NormalizedAnswer = normalizedAnswer,
                    IsCorrect = true,
                    CorrectRank = correctRank,
                    PointsAwarded = points,
                    SubmittedAt = submittedAtUtc
                };

                var scoreEntry = new TriviaScoreLedgerEntry
                {
                    Id = Guid.NewGuid(),
                    RoomId = roomId,
                    SessionId = activeRound.SessionId,
                    RoundId = activeRound.RoundId,
                    UserId = userId,
                    Points = points,
                    Reason = "correct_answer",
                    CreatedAt = submittedAtUtc
                };

                await _triviaAnswerRepository.CreateAsync(connection, answer, transaction);
                await _triviaScoreLedgerRepository.CreateAsync(connection, scoreEntry, transaction);

                await CommitAsync(transaction);

                var progressionResult = await _progressionService.EvaluateAndAwardAsync(userId);
                await _progressionRealtimeService.NotifyAsync(userId, progressionResult);

                return new SubmitTriviaAnswerResult
                {
                    Success = true,
                    IsCorrect = true,
                    AlreadyAnsweredCorrectly = false,
                    UserId = userId,
                    DisplayName = displayName,
                    SessionId = activeRound.SessionId,
                    RoundId = activeRound.RoundId,
                    SubmittedAnswer = submittedAnswer,
                    NormalizedAnswer = normalizedAnswer,
                    CorrectRank = correctRank,
                    PointsAwarded = points,
                    Message = $"{displayName} got {points} points!"
                };
            }
            catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UniqueViolation)
            {
                await RollbackSafelyAsync(transaction);

                if (attempt == MaxCorrectInsertAttempts)
                {
                    return new SubmitTriviaAnswerResult
                    {
                        Success = false,
                        IsCorrect = true,
                        UserId = userId,
                        DisplayName = displayName,
                        SessionId = activeRound.SessionId,
                        RoundId = activeRound.RoundId,
                        SubmittedAnswer = submittedAnswer,
                        NormalizedAnswer = normalizedAnswer,
                        Message = "Please try again."
                    };
                }
            }
            catch
            {
                await RollbackSafelyAsync(transaction);
                throw;
            }
        }

        return new SubmitTriviaAnswerResult
        {
            Success = false,
            IsCorrect = true,
            UserId = userId,
            DisplayName = displayName,
            SessionId = activeRound.SessionId,
            RoundId = activeRound.RoundId,
            SubmittedAnswer = submittedAnswer,
            NormalizedAnswer = normalizedAnswer,
            Message = "Please try again."
        };
    }

    private static HashSet<string> BuildAcceptedAnswers(TriviaRoundDetails round)
    {
        var values = new HashSet<string>(StringComparer.Ordinal);

        var normalizedCorrectAnswer = NormalizeAnswer(round.CorrectAnswer);
        if (!string.IsNullOrWhiteSpace(normalizedCorrectAnswer))
        {
            values.Add(normalizedCorrectAnswer);
        }

        if (!string.IsNullOrWhiteSpace(round.AcceptedAnswersJson))
        {
            try
            {
                var aliases = JsonSerializer.Deserialize<List<string>>(round.AcceptedAnswersJson) ?? new();

                foreach (var alias in aliases)
                {
                    var normalized = NormalizeAnswer(alias);
                    if (!string.IsNullOrWhiteSpace(normalized))
                    {
                        values.Add(normalized);
                    }
                }
            }
            catch
            {
            }
        }

        return values;
    }

    public static string NormalizeAnswer(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        var builder = new StringBuilder(input.Length);

        foreach (var ch in input.Trim().ToLowerInvariant())
        {
            if (char.IsLetterOrDigit(ch) || char.IsWhiteSpace(ch))
            {
                builder.Append(ch);
            }
        }

        var cleaned = builder.ToString();
        return CollapseWhitespace(cleaned);
    }

    private static string CollapseWhitespace(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        var builder = new StringBuilder(value.Length);
        var previousWasSpace = false;

        foreach (var ch in value)
        {
            if (char.IsWhiteSpace(ch))
            {
                if (!previousWasSpace)
                {
                    builder.Append(' ');
                    previousWasSpace = true;
                }
            }
            else
            {
                builder.Append(ch);
                previousWasSpace = false;
            }
        }

        return builder.ToString().Trim();
    }

    private static int GetPointsForRank(int rank)
    {
        return rank switch
        {
            1 => 7,
            2 => 5,
            3 => 3,
            _ => 2
        };
    }

    private static async Task OpenConnectionAsync(System.Data.IDbConnection connection)
    {
        if (connection is DbConnection dbConnection)
        {
            if (dbConnection.State != System.Data.ConnectionState.Open)
            {
                await dbConnection.OpenAsync();
            }

            return;
        }

        if (connection.State != System.Data.ConnectionState.Open)
        {
            connection.Open();
        }
    }

    private static async Task<DbTransaction> BeginTransactionAsync(System.Data.IDbConnection connection)
    {
        if (connection is not DbConnection dbConnection)
            throw new InvalidOperationException("Connection must be a DbConnection.");

        return await dbConnection.BeginTransactionAsync();
    }

    private static async Task CommitAsync(DbTransaction transaction)
    {
        await transaction.CommitAsync();
    }

    private static async Task RollbackSafelyAsync(DbTransaction transaction)
    {
        try
        {
            await transaction.RollbackAsync();
        }
        catch
        {
        }
    }
}