using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class UserRepository : IUserRepository
{
    private readonly DapperContext _context;

    public UserRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByIdAsync(Guid id)
    {
        const string sql = """
            SELECT id, username, display_name AS DisplayName, email, phone_number AS PhoneNumber,
                   password_hash AS PasswordHash, is_active AS IsActive, is_admin AS IsAdmin,
                   created_at AS CreatedAt, updated_at AS UpdatedAt
            FROM users
            WHERE id = @Id;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<User>(sql, new { Id = id });
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        const string sql = """
            SELECT id, username, display_name AS DisplayName, email, phone_number AS PhoneNumber,
                   password_hash AS PasswordHash, is_active AS IsActive, is_admin AS IsAdmin,
                   created_at AS CreatedAt, updated_at AS UpdatedAt
            FROM users
            WHERE LOWER(email) = LOWER(@Email);
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<User>(sql, new { Email = email });
    }

    public async Task<User?> GetByUsernameAsync(string username)
    {
        const string sql = """
            SELECT id, username, display_name AS DisplayName, email, phone_number AS PhoneNumber,
                   password_hash AS PasswordHash, is_active AS IsActive, is_admin AS IsAdmin,
                   created_at AS CreatedAt, updated_at AS UpdatedAt
            FROM users
            WHERE LOWER(username) = LOWER(@Username);
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<User>(sql, new { Username = username });
    }

    public async Task<User?> GetByEmailOrUsernameAsync(string emailOrUsername)
    {
        const string sql = """
            SELECT id, username, display_name AS DisplayName, email, phone_number AS PhoneNumber,
                   password_hash AS PasswordHash, is_active AS IsActive, is_admin AS IsAdmin,
                   created_at AS CreatedAt, updated_at AS UpdatedAt
            FROM users
            WHERE LOWER(email) = LOWER(@Value) OR LOWER(username) = LOWER(@Value);
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<User>(sql, new { Value = emailOrUsername });
    }

    public async Task CreateAsync(User user)
    {
        const string sql = """
            INSERT INTO users (
                id, username, display_name, email, phone_number,
                password_hash, is_active, is_admin, created_at, updated_at
            )
            VALUES (
                @Id, @Username, @DisplayName, @Email, @PhoneNumber,
                @PasswordHash, @IsActive, @IsAdmin, @CreatedAt, @UpdatedAt
            );
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, user);
    }

    public async Task UpdateProfileAsync(Guid userId, string displayName, string? phoneNumber)
    {
        const string sql = """
            UPDATE users
            SET display_name = @DisplayName,
                phone_number = @PhoneNumber,
                updated_at = NOW()
            WHERE id = @UserId;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            UserId = userId,
            DisplayName = displayName,
            PhoneNumber = phoneNumber
        });
    }

    public async Task UpdatePasswordHashAsync(Guid userId, string passwordHash)
    {
        const string sql = """
            UPDATE users
            SET password_hash = @PasswordHash,
                updated_at = NOW()
            WHERE id = @UserId;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            UserId = userId,
            PasswordHash = passwordHash
        });
    }
}