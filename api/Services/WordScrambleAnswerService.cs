using System.Data.Common;
using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Bts.Api.Models.Dtos;
using Bts.Api.Repositories;
using Npgsql;
using Npgsql.PostgresTypes;

namespace Bts.Api.Services;

public sealed class WordScrambleAnswerService
{
    private const int MaxCorrectInsertAttempts = 3;
    private const int GuessCooldownSeconds = 1;
    private const int MaxWrongAttemptsPerRound = 5;

    private readonly DapperContext _context;
    private readonly IWordScrambleRoundRepository _roundRepository;
    private readonly IWordScrambleAnswerRepository _answerRepository;
    private readonly IWordScrambleScoreLedgerRepository _scoreLedgerRepository;
    private readonly IUserRepository _userRepository;
    private readonly ProgressionService _progressionService;
    private readonly ProgressionRealtimeService _progressionRealtimeService;

    public WordScrambleAnswerService(
        DapperContext context,
        IWordScrambleRoundRepository roundRepository,
        IWordScrambleAnswerRepository answerRepository,
        IWordScrambleScoreLedgerRepository scoreLedgerRepository,
        IUserRepository userRepository,
        ProgressionService progressionService,
        ProgressionRealtimeService progressionRealtimeService)
    {
        _context = context;
        _roundRepository = roundRepository;
        _answerRepository = answerRepository;
        _scoreLedgerRepository = scoreLedgerRepository;
        _userRepository = userRepository;
        _progressionService = progressionService;
        _progressionRealtimeService = progressionRealtimeService;
    }

    public async Task<SubmitWordScrambleGuessResultDto> SubmitGuessAsync(
        Guid roomId,
        Guid userId,
        string guessText)
    {
        var trimmedGuess = (guessText ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(trimmedGuess))
        {
            return new SubmitWordScrambleGuessResultDto
            {
                Success = false,
                UserId = userId,
                SubmittedAnswer = trimmedGuess,
                Message = "Guess cannot be empty."
            };
        }

        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null || !user.IsActive)
        {
            return new SubmitWordScrambleGuessResultDto
            {
                Success = false,
                UserId = userId,
                SubmittedAnswer = trimmedGuess,
                Message = "User not found."
            };
        }

        var activeRound = await _roundRepository.GetActiveRoundDetailsByRoomIdAsync(roomId);
        if (activeRound is null)
        {
            return new SubmitWordScrambleGuessResultDto
            {
                Success = false,
                UserId = userId,
                DisplayName = user.DisplayName,
                SubmittedAnswer = trimmedGuess,
                Message = "There is no active word scramble round right now."
            };
        }

        var nowUtc = DateTime.UtcNow;
        if (activeRound.EndsAt <= nowUtc || !string.Equals(activeRound.Status, "active", StringComparison.OrdinalIgnoreCase))
        {
            return new SubmitWordScrambleGuessResultDto
            {
                Success = false,
                UserId = userId,
                DisplayName = user.DisplayName,
                SessionId = activeRound.SessionId,
                RoundId = activeRound.RoundId,
                SubmittedAnswer = trimmedGuess,
                Message = "This round has already ended."
            };
        }

        var normalizedGuess = WordScrambleTextNormalizer.Normalize(trimmedGuess);

        var latestSubmissionAt = await _answerRepository.GetLatestSubmissionAtAsync(
            activeRound.RoundId,
            userId);

        var wrongAttemptCount = await _answerRepository.GetWrongAttemptCountAsync(
            activeRound.RoundId,
            userId);

        if (latestSubmissionAt.HasValue)
        {
            var nextAllowedAt = latestSubmissionAt.Value.AddSeconds(GuessCooldownSeconds);
            if (nextAllowedAt > nowUtc)
            {
                return new SubmitWordScrambleGuessResultDto
                {
                    Success = false,
                    UserId = userId,
                    DisplayName = user.DisplayName,
                    SessionId = activeRound.SessionId,
                    RoundId = activeRound.RoundId,
                    SubmittedAnswer = trimmedGuess,
                    NormalizedAnswer = normalizedGuess,
                    WrongAttemptsUsed = wrongAttemptCount,
                    WrongAttemptsLeft = Math.Max(0, MaxWrongAttemptsPerRound - wrongAttemptCount),
                    MaxWrongAttempts = MaxWrongAttemptsPerRound,
                    Message = "Slow down a bit before guessing again."
                };
            }
        }

        if (wrongAttemptCount >= MaxWrongAttemptsPerRound)
        {
            return new SubmitWordScrambleGuessResultDto
            {
                Success = false,
                UserId = userId,
                DisplayName = user.DisplayName,
                SessionId = activeRound.SessionId,
                RoundId = activeRound.RoundId,
                SubmittedAnswer = trimmedGuess,
                NormalizedAnswer = normalizedGuess,
                WrongAttemptsUsed = wrongAttemptCount,
                WrongAttemptsLeft = 0,
                MaxWrongAttempts = MaxWrongAttemptsPerRound,
                Message = "You have used all your wrong attempts for this round."
            };
        }

        var isCorrect = string.Equals(
            normalizedGuess,
            activeRound.NormalizedAnswer,
            StringComparison.Ordinal);

        if (!isCorrect)
        {
            await SaveIncorrectGuessAsync(
                activeRound.RoundId,
                userId,
                trimmedGuess,
                normalizedGuess);

            var wrongAttemptsUsed = wrongAttemptCount + 1;
            var wrongAttemptsLeft = Math.Max(0, MaxWrongAttemptsPerRound - wrongAttemptsUsed);

            return new SubmitWordScrambleGuessResultDto
            {
                Success = true,
                IsCorrect = false,
                UserId = userId,
                DisplayName = user.DisplayName,
                SessionId = activeRound.SessionId,
                RoundId = activeRound.RoundId,
                SubmittedAnswer = trimmedGuess,
                NormalizedAnswer = normalizedGuess,
                WrongAttemptsUsed = wrongAttemptsUsed,
                WrongAttemptsLeft = wrongAttemptsLeft,
                MaxWrongAttempts = MaxWrongAttemptsPerRound,
                Message = wrongAttemptsLeft > 0
                    ? $"Incorrect guess. {wrongAttemptsLeft} wrong attempts left."
                    : "Incorrect guess. You have used all your wrong attempts for this round."
            };
        }

        return await SaveCorrectGuessWithRetryAsync(
            roomId,
            userId,
            user.DisplayName,
            activeRound,
            trimmedGuess,
            normalizedGuess);
    }

    private async Task SaveIncorrectGuessAsync(
        Guid roundId,
        Guid userId,
        string submittedAnswer,
        string normalizedAnswer)
    {
        using var connection = _context.CreateConnection();
        await OpenConnectionAsync(connection);

        var answer = new WordScrambleAnswer
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

        await _answerRepository.CreateAsync(connection, answer);
    }

    private async Task<SubmitWordScrambleGuessResultDto> SaveCorrectGuessWithRetryAsync(
        Guid roomId,
        Guid userId,
        string displayName,
        WordScrambleRoundDetailsDto activeRound,
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
                var alreadyCorrect = await _answerRepository.HasUserCorrectAnswerAsync(
                    connection,
                    activeRound.RoundId,
                    userId,
                    transaction);

                if (alreadyCorrect)
                {
                    await RollbackSafelyAsync(transaction);

                    return new SubmitWordScrambleGuessResultDto
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
                        Message = "You already solved this round."
                    };
                }

                var currentCorrectCount = await _answerRepository.GetCorrectCountAsync(
                    connection,
                    activeRound.RoundId,
                    transaction);

                var correctRank = currentCorrectCount + 1;
                var points = GetPointsForRank(correctRank);
                var submittedAtUtc = DateTime.UtcNow;
                var solveSeconds = Math.Max(
                    0,
                    Math.Round((submittedAtUtc - activeRound.StartsAt).TotalSeconds, 2));

                var answer = new WordScrambleAnswer
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

                var scoreEntry = new WordScrambleScoreLedgerEntry
                {
                    Id = Guid.NewGuid(),
                    RoomId = roomId,
                    SessionId = activeRound.SessionId,
                    RoundId = activeRound.RoundId,
                    UserId = userId,
                    Points = points,
                    Reason = "correct_guess",
                    CreatedAt = submittedAtUtc
                };

                await _answerRepository.CreateAsync(connection, answer, transaction);
                await _scoreLedgerRepository.CreateAsync(connection, scoreEntry, transaction);

                await CommitAsync(transaction);

                var progressionResult = await _progressionService.EvaluateAndAwardAsync(userId);
                await _progressionRealtimeService.NotifyAsync(userId, progressionResult);
                var playerStats = await _answerRepository.GetPlayerStatsAsync(
                    activeRound.SessionId,
                    userId);

                return new SubmitWordScrambleGuessResultDto
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
                    SolveSeconds = solveSeconds,
                    PlayerStats = playerStats,
                    Message = $"{displayName} got {points} points in {solveSeconds:0.##}s!"
                };
            }
            catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UniqueViolation)
            {
                await RollbackSafelyAsync(transaction);

                if (attempt == MaxCorrectInsertAttempts)
                {
                    return new SubmitWordScrambleGuessResultDto
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

        return new SubmitWordScrambleGuessResultDto
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
