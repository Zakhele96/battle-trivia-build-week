using Bts.Api.Models.Responses;
using Bts.Api.Repositories;

namespace Bts.Api.Services;

public sealed class AdminUserService
{
    private readonly IUserRepository _userRepository;

    public AdminUserService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<IEnumerable<UserResponse>> SearchAsync(string? query, int take)
    {
        var users = await _userRepository.SearchAsync(query, take);
        return users.Select(Map);
    }

    public async Task<UserResponse?> SetAdminAsync(Guid currentAdminUserId, Guid targetUserId, bool isAdmin)
    {
        var target = await _userRepository.GetByIdAsync(targetUserId);
        if (target is null || !target.IsActive) return null;

        if (targetUserId == currentAdminUserId && !isAdmin)
            throw new InvalidOperationException("You cannot remove your own admin access.");

        await _userRepository.SetAdminAsync(targetUserId, isAdmin);

        target.IsAdmin = isAdmin;
        return Map(target);
    }

    private static UserResponse Map(Models.Domain.User user)
    {
        return new UserResponse
        {
            Id = user.Id,
            Username = user.Username,
            DisplayName = user.DisplayName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            IsAdmin = user.IsAdmin,
            AvatarUrl = user.AvatarUrl,
            AuthProvider = string.IsNullOrWhiteSpace(user.AuthProvider) ? "local" : user.AuthProvider,
            HasPassword = !string.IsNullOrWhiteSpace(user.PasswordHash)
        };
    }
}
