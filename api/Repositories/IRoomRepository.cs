using Bts.Api.Models.Domain;

namespace Bts.Api.Repositories;

public interface IRoomRepository
{
    Task<IEnumerable<Room>> GetAllAsync();
    Task<IEnumerable<Room>> GetAllIncludingInactiveAsync();
    Task<Room?> GetByIdAsync(Guid id);
    Task<Room?> GetByIdIncludingInactiveAsync(Guid id);
    Task<Room?> GetBySlugAsync(string slug);
    Task<Room?> GetBySlugIncludingInactiveAsync(string slug);
    Task<Room> CreateAsync(Room room);
    Task SetActiveAsync(Guid roomId, bool isActive);
    Task UpdateSlowModeAsync(Guid roomId, int slowModeSeconds);
    Task UpdateGameTimingAsync(
        Guid roomId,
        int? battleTriviaQuestionDurationSeconds = null,
        int? battleTriviaRevealDelaySeconds = null,
        bool? battleTriviaMediaEnabled = null,
        int? wordScrambleRoundDurationSeconds = null,
        int? wordScrambleRevealDurationSeconds = null);
}
