using Bts.Api.Models.Domain;
using Bts.Api.Models.Requests;
using Bts.Api.Models.Responses;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class AdminWordScrambleSettingsService
{
    private const string WordScrambleSlug = "word-scramble";

    private readonly IRoomRepository _roomRepository;

    public AdminWordScrambleSettingsService(IRoomRepository roomRepository)
    {
        _roomRepository = roomRepository;
    }

    public async Task<WordScrambleSettingsResponse> GetAsync()
    {
        var room = await GetWordScrambleRoomAsync();
        return new WordScrambleSettingsResponse
        {
            RoomId = room.Id,
            RoundDurationSeconds = NormalizeRoundDurationSeconds(room.WordScrambleRoundDurationSeconds),
            RevealDurationSeconds = NormalizeRevealDurationSeconds(room.WordScrambleRevealDurationSeconds)
        };
    }

    public async Task<WordScrambleSettingsResponse> UpdateAsync(UpdateWordScrambleSettingsRequest request)
    {
        if (request.RoundDurationSeconds is < 5 or > 180)
            throw new InvalidOperationException("Word Scramble round duration must be between 5 and 180 seconds.");

        if (request.RevealDurationSeconds is < 1 or > 30)
            throw new InvalidOperationException("Word Scramble reveal duration must be between 1 and 30 seconds.");

        var room = await GetWordScrambleRoomAsync();
        await _roomRepository.UpdateGameTimingAsync(
            room.Id,
            wordScrambleRoundDurationSeconds: request.RoundDurationSeconds,
            wordScrambleRevealDurationSeconds: request.RevealDurationSeconds);

        return await GetAsync();
    }

    private async Task<Room> GetWordScrambleRoomAsync()
    {
        var room = await _roomRepository.GetBySlugAsync(WordScrambleSlug);
        if (room is null)
            throw new InvalidOperationException("Word Scramble room not found.");

        return room;
    }

    private static int NormalizeRoundDurationSeconds(int value) =>
        value is >= 5 and <= 180 ? value : 30;

    private static int NormalizeRevealDurationSeconds(int value) =>
        value is >= 1 and <= 30 ? value : 5;
}
