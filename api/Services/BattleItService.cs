using System.Text.Json;
using Bts.Api.Hubs;
using Bts.Api.Models.Domain;
using Bts.Api.Models.Requests;
using Bts.Api.Models.Responses;
using Bts.Api.Repositories;
using Microsoft.AspNetCore.SignalR;
using System.Security.Cryptography;

namespace Bts.Api.Services;

public sealed class BattleItService
{
    public const string RoomSlug = "battle-it";
    public const int MaxTextLength = 12_000;
    public const int MaxImages = 2;
    public const long MaxImageBytes = 5 * 1024 * 1024;

    private static readonly HashSet<string> AllowedImageTypes =
    [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    private readonly IBattleItRepository _battleItRepository;
    private readonly IRoomRepository _roomRepository;
    private readonly ITriviaRoundRepository _roundRepository;
    private readonly ITriviaSessionResultRepository _sessionResultRepository;
    private readonly BattleItGenerationService _generationService;
    private readonly IHubContext<ChatHub> _hubContext;
    private readonly ChatService _chatService;

    public BattleItService(
        IBattleItRepository battleItRepository,
        IRoomRepository roomRepository,
        ITriviaRoundRepository roundRepository,
        ITriviaSessionResultRepository sessionResultRepository,
        BattleItGenerationService generationService,
        IHubContext<ChatHub> hubContext,
        ChatService chatService)
    {
        _battleItRepository = battleItRepository;
        _roomRepository = roomRepository;
        _roundRepository = roundRepository;
        _sessionResultRepository = sessionResultRepository;
        _generationService = generationService;
        _hubContext = hubContext;
        _chatService = chatService;
    }

    public async Task<BattleItStateResponse> GetStateAsync(Guid roomId, Guid userId)
    {
        var room = await RequireBattleItRoomAsync(roomId);
        var session = await _battleItRepository.GetVisibleSessionAsync(roomId, userId);
        if (session is null)
            return new BattleItStateResponse { RoomId = room.Id };

        session = await EnsureJoinCodeAsync(session, userId);

        return await MapStateAsync(session, userId);
    }

    public async Task<IReadOnlyList<BattleItPublicSessionResponse>> GetPublicSessionsAsync(Guid roomId)
    {
        await RequireBattleItRoomAsync(roomId);
        return await _battleItRepository.GetPublicSessionsAsync(roomId);
    }

    public async Task<BattleItStateResponse> GenerateAsync(
        Guid roomId,
        Guid userId,
        string? sourceText,
        IReadOnlyList<BattleItUploadedImage> images,
        string difficulty,
        string answerMode,
        string visibility,
        int questionDurationSeconds,
        int revealDelaySeconds,
        CancellationToken cancellationToken)
    {
        await RequireBattleItRoomAsync(roomId);
        ValidateSource(sourceText, images);

        var existingSession = await _battleItRepository.GetVisibleSessionAsync(roomId, userId);
        if (existingSession is not null && existingSession.Status is "lobby" or "active")
        {
            throw new InvalidOperationException(
                "A Battle It session is already open in this room. Join that battle before creating another one.");
        }

        var normalizedDifficulty = NormalizeDifficulty(difficulty);
        var normalizedAnswerMode = NormalizeAnswerMode(answerMode);
        var normalizedVisibility = NormalizeVisibility(visibility);
        var duration = Math.Clamp(questionDurationSeconds, 10, 60);
        var revealDelay = Math.Clamp(revealDelaySeconds, 3, 15);
        var imageInputs = images.Select(image => new BattleItImageInput
        {
            ContentType = image.ContentType,
            Bytes = image.Bytes
        }).ToList();

        var generated = await _generationService.GenerateAsync(
            sourceText,
            imageInputs,
            normalizedDifficulty,
            normalizedAnswerMode,
            userId,
            cancellationToken);

        var sourceType = images.Count > 0
            ? string.IsNullOrWhiteSpace(sourceText) ? "image" : "mixed"
            : "text";
        var sourceLabel = images.Count > 0
            ? images.Count == 1 ? "1 note image" : $"{images.Count} note images"
            : "Pasted notes";

        var joinCode = await CreateJoinCodeAsync();
        var session = await _battleItRepository.CreateDraftAsync(
            roomId,
            userId,
            sourceType,
            sourceLabel,
            generated.SourceHash,
            normalizedDifficulty,
            normalizedAnswerMode,
            normalizedVisibility,
            duration,
            revealDelay,
            joinCode,
            generated.Model,
            generated.Pack);

        await NotifyChangedAsync(roomId);
        return await MapStateAsync(session, userId);
    }

    public async Task<BattleItStateResponse> UpdateDraftAsync(
        Guid roomId,
        Guid sessionId,
        Guid userId,
        UpdateBattleItDraftRequest request)
    {
        await RequireBattleItRoomAsync(roomId);
        ValidateDraft(request);

        var updated = await _battleItRepository.UpdateDraftAsync(sessionId, userId, request);
        if (!updated)
            throw new InvalidOperationException("This Battle It draft cannot be updated.");

        await NotifyChangedAsync(roomId);
        return await GetOwnedStateAsync(sessionId, userId);
    }

    public async Task<BattleItStateResponse> JoinAsync(
        Guid roomId,
        Guid userId,
        JoinBattleItRequest request)
    {
        await RequireBattleItRoomAsync(roomId);
        var code = NormalizeJoinCode(request.Code);
        var session = await _battleItRepository.JoinByCodeAsync(roomId, userId, code);
        if (session is null)
            throw new InvalidOperationException("That Battle It code is invalid or has expired.");

        await NotifyChangedAsync(roomId);
        return await MapStateAsync(session, userId);
    }

    public async Task<BattleItStateResponse> JoinPublicAsync(
        Guid roomId,
        Guid sessionId,
        Guid userId)
    {
        await RequireBattleItRoomAsync(roomId);
        var session = await _battleItRepository.JoinPublicAsync(roomId, sessionId, userId);
        if (session is null)
            throw new InvalidOperationException("This public battle is no longer open.");

        await NotifyChangedAsync(roomId);
        return await MapStateAsync(session, userId);
    }

    public async Task<BattleItStateResponse> OpenLobbyAsync(Guid roomId, Guid sessionId, Guid userId)
    {
        await RequireBattleItRoomAsync(roomId);
        var existing = await _battleItRepository.GetByIdAsync(sessionId)
            ?? throw new KeyNotFoundException("Battle It session not found.");
        if (existing.CreatorUserId != userId)
            throw new UnauthorizedAccessException("Only the battle creator can control this session.");
        var joinCode = existing.JoinCode ?? await CreateJoinCodeAsync();
        var opened = await _battleItRepository.OpenLobbyAsync(sessionId, userId, joinCode);
        if (!opened)
            throw new InvalidOperationException("Another Battle It session is already open, or this draft is not ready.");

        var state = await GetOwnedStateAsync(sessionId, userId);
        var message = await _chatService.CreateSystemMessageAsync(
            roomId,
            $"{state.CreatorDisplayName} opened “{state.Title}”. Join now — the battle is about to start!");
        await _hubContext.Clients.Group(roomId.ToString()).SendAsync("ReceiveMessage", message);
        await NotifyChangedAsync(roomId);
        return state;
    }

    public async Task<BattleItStateResponse> StartAsync(Guid roomId, Guid sessionId, Guid userId)
    {
        await RequireBattleItRoomAsync(roomId);
        var gameSession = await _battleItRepository.StartAsync(sessionId, userId);
        if (gameSession is null)
            throw new InvalidOperationException("This Battle It session cannot be started right now.");

        var state = await GetOwnedStateAsync(sessionId, userId);
        var message = await _chatService.CreateSystemMessageAsync(
            roomId,
            $"Battle It is live: {state.Title}. Get ready for {state.QuestionCount} questions!");
        await _hubContext.Clients.Group(roomId.ToString()).SendAsync("ReceiveMessage", message);
        await NotifyChangedAsync(roomId);
        return state;
    }

    public async Task<BattleItStateResponse> ReplayAsync(Guid roomId, Guid sessionId, Guid userId)
    {
        await RequireBattleItRoomAsync(roomId);
        var joinCode = await CreateJoinCodeAsync();
        var replayed = await _battleItRepository.ReplayAsync(sessionId, userId, joinCode);
        if (!replayed)
            throw new InvalidOperationException("This battle cannot be replayed right now.");

        await NotifyChangedAsync(roomId);
        return await GetOwnedStateAsync(sessionId, userId);
    }

    public Task NotifyChangedAsync(Guid roomId)
    {
        return _hubContext.Clients.Group(roomId.ToString())
            .SendAsync("BattleItChanged", new { roomId });
    }

    public static string GetSessionGroupName(Guid sessionId) => $"battle-it:{sessionId}";

    private async Task<BattleItStateResponse> GetOwnedStateAsync(Guid sessionId, Guid userId)
    {
        var session = await _battleItRepository.GetByIdAsync(sessionId)
            ?? throw new KeyNotFoundException("Battle It session not found.");
        if (session.CreatorUserId != userId)
            throw new UnauthorizedAccessException("Only the battle creator can control this session.");
        return await MapStateAsync(session, userId);
    }

    private async Task<BattleItStateResponse> MapStateAsync(BattleItSession session, Guid userId)
    {
        var questions = await _battleItRepository.GetQuestionsAsync(session.Id);
        var isCreator = session.CreatorUserId == userId;
        var currentQuestionNumber = session.GameSessionId.HasValue
            ? await _roundRepository.GetLatestRoundNumberAsync(session.GameSessionId.Value)
            : 0;

        IReadOnlyList<BattleItPodiumRowResponse> podium = [];
        if (string.Equals(session.Status, "completed", StringComparison.OrdinalIgnoreCase) && session.GameSessionId.HasValue)
        {
            var rows = await _sessionResultRepository.GetBySessionIdAsync(session.GameSessionId.Value, 3);
            podium = rows.Select(row => new BattleItPodiumRowResponse
            {
                UserId = row.UserId,
                Username = row.Username,
                DisplayName = row.DisplayName,
                Score = row.Score,
                Rank = row.Rank
            }).ToList();
        }

        var canSeeDraftQuestions = isCreator && string.Equals(session.Status, "draft", StringComparison.OrdinalIgnoreCase);
        var playerCount = await _battleItRepository.GetMemberCountAsync(session.Id);
        return new BattleItStateResponse
        {
            RoomId = session.RoomId,
            SessionId = session.Id,
            GameSessionId = session.GameSessionId,
            Status = session.Status,
            Title = session.Title,
            CreatorUserId = session.CreatorUserId,
            CreatorDisplayName = session.CreatorDisplayName,
            IsCreator = isCreator,
            SourceType = session.SourceType,
            SourceLabel = session.SourceLabel,
            Difficulty = session.Difficulty,
            AnswerMode = session.AnswerMode,
            Visibility = session.Visibility,
            QuestionDurationSeconds = session.QuestionDurationSeconds,
            RevealDelaySeconds = session.RevealDelaySeconds,
            JoinCode = session.JoinCode,
            PlayerCount = playerCount,
            QuestionCount = questions.Count,
            CurrentQuestionNumber = currentQuestionNumber,
            CoveredConceptCount = questions
                .Select(question => question.Concept)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Count(),
            Model = session.Model,
            CreatedAt = session.CreatedAt,
            StartedAt = session.StartedAt,
            CompletedAt = session.CompletedAt,
            Questions = canSeeDraftQuestions
                ? questions.Select(MapQuestion).ToList()
                : [],
            Podium = podium
        };
    }

    private static BattleItQuestionResponse MapQuestion(BattleItQuestion question)
    {
        IReadOnlyList<string> acceptedAnswers;
        IReadOnlyList<string> answerOptions;
        try
        {
            acceptedAnswers = JsonSerializer.Deserialize<List<string>>(question.AcceptedAnswersJson) ?? [];
        }
        catch
        {
            acceptedAnswers = [];
        }

        try
        {
            answerOptions = JsonSerializer.Deserialize<List<string>>(question.AnswerOptionsJson) ?? [];
        }
        catch
        {
            answerOptions = [];
        }

        return new BattleItQuestionResponse
        {
            QuestionId = question.QuestionId,
            Position = question.Position,
            Concept = question.Concept,
            QuestionText = question.QuestionText,
            CorrectAnswer = question.CorrectAnswer,
            AcceptedAnswers = acceptedAnswers,
            AnswerOptions = answerOptions,
            Difficulty = question.Difficulty,
            AnswerExplanation = question.AnswerExplanation,
            SourceExcerpt = question.SourceExcerpt
        };
    }

    private async Task<Room> RequireBattleItRoomAsync(Guid roomId)
    {
        var room = await _roomRepository.GetByIdAsync(roomId);
        if (room is null || !string.Equals(room.Slug, RoomSlug, StringComparison.OrdinalIgnoreCase))
            throw new KeyNotFoundException("Battle It room not found.");
        if (!room.IsActive)
            throw new InvalidOperationException("Battle It is not available right now.");
        return room;
    }

    private static void ValidateSource(string? sourceText, IReadOnlyList<BattleItUploadedImage> images)
    {
        if (string.IsNullOrWhiteSpace(sourceText) && images.Count == 0)
            throw new InvalidOperationException("Paste notes or upload at least one image.");
        if ((sourceText?.Length ?? 0) > MaxTextLength)
            throw new InvalidOperationException($"Pasted notes must be {MaxTextLength:N0} characters or fewer.");
        if (images.Count > MaxImages)
            throw new InvalidOperationException($"Upload no more than {MaxImages} note images.");

        foreach (var image in images)
        {
            if (!AllowedImageTypes.Contains(image.ContentType))
                throw new InvalidOperationException("Note images must be JPEG, PNG, or WebP files.");
            if (image.Bytes.Length == 0 || image.Bytes.LongLength > MaxImageBytes)
                throw new InvalidOperationException("Each note image must be between 1 byte and 5 MB.");
            if (!HasValidImageSignature(image.ContentType, image.Bytes))
                throw new InvalidOperationException("One of the uploaded files is not a valid JPEG, PNG, or WebP image.");
        }
    }

    private static bool HasValidImageSignature(string contentType, byte[] bytes)
    {
        return contentType switch
        {
            "image/jpeg" => bytes.Length >= 3 &&
                            bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF,
            "image/png" => bytes.Length >= 8 &&
                           bytes.AsSpan(0, 8).SequenceEqual(new byte[]
                           {
                               0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
                           }),
            "image/webp" => bytes.Length >= 12 &&
                            bytes.AsSpan(0, 4).SequenceEqual("RIFF"u8) &&
                            bytes.AsSpan(8, 4).SequenceEqual("WEBP"u8),
            _ => false
        };
    }

    private static void ValidateDraft(UpdateBattleItDraftRequest request)
    {
        request.Title = (request.Title ?? string.Empty).Trim();
        if (request.Title.Length is < 3 or > 120)
            throw new InvalidOperationException("Battle title must be between 3 and 120 characters.");
        if (request.Questions.Count is < 4 or > 20)
            throw new InvalidOperationException("A Battle It session must contain between 4 and 20 questions.");

        request.Difficulty = NormalizeDifficulty(request.Difficulty);
        request.AnswerMode = NormalizeAnswerMode(request.AnswerMode);
        request.Visibility = NormalizeVisibility(request.Visibility);
        request.QuestionDurationSeconds = Math.Clamp(request.QuestionDurationSeconds, 10, 60);
        request.RevealDelaySeconds = Math.Clamp(request.RevealDelaySeconds, 3, 15);
        var ids = new HashSet<Guid>();
        var normalizedQuestions = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var questionNumber = 0;

        foreach (var question in request.Questions)
        {
            questionNumber++;
            if (question.QuestionId == Guid.Empty || !ids.Add(question.QuestionId))
                throw new InvalidOperationException("The question list contains an invalid duplicate.");

            question.QuestionText = RequireText(question.QuestionText, "Question", 8, 500);
            question.CorrectAnswer = RequireText(question.CorrectAnswer, "Correct answer", 1, 160);
            question.Concept = RequireText(question.Concept, "Concept", 2, 160);
            question.AnswerExplanation = RequireText(question.AnswerExplanation, "Explanation", 5, 600);
            question.SourceExcerpt = RequireText(question.SourceExcerpt, "Source excerpt", 3, 500);
            question.Difficulty = NormalizeDifficulty(question.Difficulty);
            question.AcceptedAnswers = (question.AcceptedAnswers ?? [])
                .Select(answer => answer?.Trim() ?? string.Empty)
                .Where(answer => answer.Length > 0 &&
                    !string.Equals(answer, question.CorrectAnswer, StringComparison.OrdinalIgnoreCase))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(8)
                .ToList();
            question.AnswerOptions = (question.AnswerOptions ?? [])
                .Select(answer => answer?.Trim() ?? string.Empty)
                .Where(answer => answer.Length > 0)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (request.AnswerMode == "multiple-choice")
            {
                if (question.AnswerOptions.Count != 4)
                    throw new InvalidOperationException(
                        $"Question {questionNumber} must have exactly four distinct options.");
                if (question.AnswerOptions.Count(answer =>
                        string.Equals(answer, question.CorrectAnswer, StringComparison.OrdinalIgnoreCase)) != 1)
                {
                    throw new InvalidOperationException(
                        $"Question {questionNumber} must include its correct answer exactly once.");
                }
                if (question.AnswerOptions.Any(option =>
                        question.AcceptedAnswers.Contains(option, StringComparer.OrdinalIgnoreCase)))
                {
                    throw new InvalidOperationException(
                        $"Question {questionNumber} has an accepted answer variant duplicated among its choices.");
                }
            }
            else
            {
                question.AnswerOptions = [];
            }

            var normalized = string.Join(' ', question.QuestionText.ToLowerInvariant().Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
            if (!normalizedQuestions.Add(normalized))
                throw new InvalidOperationException("Remove duplicate questions before opening the lobby.");
        }
    }

    private static string RequireText(string? value, string label, int minLength, int maxLength)
    {
        var result = (value ?? string.Empty).Trim();
        if (result.Length < minLength || result.Length > maxLength)
            throw new InvalidOperationException($"{label} must be between {minLength} and {maxLength} characters.");
        return result;
    }

    private static string NormalizeDifficulty(string? value)
    {
        return (value ?? string.Empty).Trim().ToLowerInvariant() switch
        {
            "easy" => "easy",
            "hard" => "hard",
            _ => "medium"
        };
    }

    private static string NormalizeAnswerMode(string? value)
    {
        return string.Equals(value?.Trim(), "multiple-choice", StringComparison.OrdinalIgnoreCase)
            ? "multiple-choice"
            : "text";
    }

    private static string NormalizeVisibility(string? value)
    {
        return string.Equals(value?.Trim(), "public", StringComparison.OrdinalIgnoreCase)
            ? "public"
            : "code-only";
    }

    private async Task<string> CreateJoinCodeAsync()
    {
        for (var attempt = 0; attempt < 10; attempt++)
        {
            var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
            if (!await _battleItRepository.JoinCodeExistsAsync(code))
                return code;
        }

        throw new InvalidOperationException("Could not create a unique Battle It join code. Please try again.");
    }

    private async Task<BattleItSession> EnsureJoinCodeAsync(BattleItSession session, Guid userId)
    {
        if (!string.IsNullOrWhiteSpace(session.JoinCode) ||
            session.CreatorUserId != userId ||
            session.Status is not ("draft" or "lobby" or "active"))
        {
            return session;
        }

        var joinCode = await CreateJoinCodeAsync();
        await _battleItRepository.SetJoinCodeIfMissingAsync(session.Id, userId, joinCode);
        return await _battleItRepository.GetByIdAsync(session.Id) ?? session;
    }

    private static string NormalizeJoinCode(string? value)
    {
        var code = new string((value ?? string.Empty).Where(char.IsDigit).ToArray());
        if (code.Length != 6)
            throw new InvalidOperationException("Enter the six-digit Battle It code.");
        return code;
    }
}

public sealed class BattleItUploadedImage
{
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public byte[] Bytes { get; init; } = [];
}
