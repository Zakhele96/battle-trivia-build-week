using Bts.Api.Models.Domain;
using Bts.Api.Models.Dtos;

namespace Bts.Api.Repositories;

public interface ISquadRepository
{
    Task CreateAsync(Squad squad);
    Task<Squad?> GetByIdAsync(Guid squadId);
    Task<Squad?> GetByInviteCodeAsync(string inviteCode);
    Task<IReadOnlyList<Squad>> GetAllActiveAsync();
    Task<IReadOnlyList<SquadSummaryDto>> GetForUserAsync(Guid userId);
    Task<IReadOnlyList<SquadMemberDto>> GetMembersAsync(Guid squadId);
    Task<bool> IsMemberAsync(Guid squadId, Guid userId);
    Task AddMemberAsync(Guid squadId, Guid userId, bool isOwner);
}
