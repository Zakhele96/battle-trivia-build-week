using Bts.Api.Models.Domain;

namespace Bts.Api.Repositories;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id);
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> GetByEmailOrUsernameAsync(string emailOrUsername);
    Task CreateAsync(User user);
    Task UpdateProfileAsync(Guid userId, string displayName, string? phoneNumber);
    Task UpdatePasswordHashAsync(Guid userId, string passwordHash);
}