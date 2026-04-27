using Bts.Api.Models.Domain;

namespace Bts.Api.Repositories;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id);
    Task<IReadOnlyList<User>> SearchAsync(string? query, int take = 50);
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> GetByEmailOrUsernameAsync(string emailOrUsername);
    Task CreateAsync(User user);
    Task UpdateProfileAsync(Guid userId, string displayName, string? phoneNumber, string? avatarUrl, string? statusMessage);
    Task UpdatePasswordHashAsync(Guid userId, string passwordHash);
    Task SetAdminAsync(Guid userId, bool isAdmin);
    Task<User?> GetByGoogleSubAsync(string googleSub);
    Task<User?> GetByFacebookUserIdAsync(string facebookUserId);
    Task LinkGoogleAsync(User user);
    Task LinkFacebookAsync(User user);
    Task UpdateEmailVerificationAsync(Guid userId, string? codeHash, DateTime? expiresAt, DateTime? sentAt, bool emailVerified);
}
