using System.Text.RegularExpressions;
using Bts.Api.Models.Domain;
using Bts.Api.Models.Requests;
using Bts.Api.Models.Responses;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class AdminRoomService
{
    private static readonly HashSet<string> AllowedRoomTypes =
    [
        "chat",
        "trivia",
        "game"
    ];

    private static readonly Regex SlugRegex =
        new("^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.Compiled);

    private readonly IRoomRepository _roomRepository;
    private readonly IRoomModerationRepository _roomModerationRepository;

    public AdminRoomService(
        IRoomRepository roomRepository,
        IRoomModerationRepository roomModerationRepository)
    {
        _roomRepository = roomRepository;
        _roomModerationRepository = roomModerationRepository;
    }

    public async Task<IReadOnlyList<AdminRoomResponse>> GetAllAsync()
    {
        var rooms = await _roomRepository.GetAllIncludingInactiveAsync();
        return rooms.Select(Map).ToList();
    }

    public async Task<AdminRoomResponse> CreateAsync(Guid adminUserId, CreateAdminRoomRequest request)
    {
        var name = request.Name?.Trim() ?? "";
        if (string.IsNullOrWhiteSpace(name))
            throw new InvalidOperationException("Room name is required.");

        if (name.Length > 80)
            throw new InvalidOperationException("Room name must be 80 characters or fewer.");

        var slug = (request.Slug?.Trim() ?? "").ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(slug))
            throw new InvalidOperationException("Room slug is required.");

        if (slug.Length > 80)
            throw new InvalidOperationException("Room slug must be 80 characters or fewer.");

        if (!SlugRegex.IsMatch(slug))
            throw new InvalidOperationException("Room slug must use lowercase letters, numbers, and hyphens only.");

        var roomType = (request.RoomType?.Trim() ?? "").ToLowerInvariant();
        if (!AllowedRoomTypes.Contains(roomType))
            throw new InvalidOperationException("Room type must be chat, trivia, or game.");

        var existing = await _roomRepository.GetBySlugIncludingInactiveAsync(slug);
        if (existing is not null)
            throw new InvalidOperationException("A room with that slug already exists.");

        var room = new Room
        {
            Id = Guid.NewGuid(),
            Name = name,
            Slug = slug,
            Description = string.IsNullOrWhiteSpace(request.Description)
                ? null
                : request.Description.Trim(),
            RoomType = roomType,
            IsActive = request.IsActive,
            SlowModeSeconds = Math.Clamp(request.SlowModeSeconds, 0, 120),
            BattleTriviaQuestionDurationSeconds = 20,
            BattleTriviaRevealDelaySeconds = 5,
            WordScrambleRoundDurationSeconds = 30,
            WordScrambleRevealDurationSeconds = 5,
            CreatedAt = DateTime.UtcNow
        };

        await _roomRepository.CreateAsync(room);
        await _roomModerationRepository.AddActionAsync(new RoomModerationAction
        {
            Id = Guid.NewGuid(),
            RoomId = room.Id,
            ActionType = "room_created",
            CreatedByUserId = adminUserId,
            CreatedAt = DateTime.UtcNow,
            MetadataJson = $$"""{"slug":"{{room.Slug}}","roomType":"{{room.RoomType}}","isActive":{{room.IsActive.ToString().ToLowerInvariant()}}}"""
        });

        return Map(room);
    }

    public async Task<AdminRoomResponse?> SetActiveAsync(Guid adminUserId, Guid roomId, bool isActive)
    {
        var room = await _roomRepository.GetByIdIncludingInactiveAsync(roomId);
        if (room is null) return null;

        await _roomRepository.SetActiveAsync(roomId, isActive);
        await _roomModerationRepository.AddActionAsync(new RoomModerationAction
        {
            Id = Guid.NewGuid(),
            RoomId = roomId,
            ActionType = isActive ? "room_enabled" : "room_disabled",
            CreatedByUserId = adminUserId,
            CreatedAt = DateTime.UtcNow
        });

        room.IsActive = isActive;
        return Map(room);
    }

    private static AdminRoomResponse Map(Room room)
    {
        return new AdminRoomResponse
        {
            Id = room.Id,
            Name = room.Name,
            Slug = room.Slug,
            Description = room.Description,
            RoomType = room.RoomType,
            IsActive = room.IsActive,
            SlowModeSeconds = room.SlowModeSeconds,
            CreatedAt = room.CreatedAt
        };
    }
}
