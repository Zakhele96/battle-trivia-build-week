using Bts.Api.Models.Domain;

namespace Bts.Api.Repositories;

public interface IRoomRepository
{
    Task<IEnumerable<Room>> GetAllAsync();
    Task<Room?> GetByIdAsync(Guid id);
    Task<Room?> GetBySlugAsync(string slug);
    Task UpdateSlowModeAsync(Guid roomId, int slowModeSeconds);
}