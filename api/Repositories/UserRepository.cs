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
            SELECT
                id,
                username,
                display_name AS DisplayName,
                email,
                phone_number AS PhoneNumber,
                password_hash AS PasswordHash,
                google_sub AS GoogleSub,
                facebook_user_id AS FacebookUserId,
                auth_provider AS AuthProvider,
                avatar_url AS AvatarUrl,
                status_message AS StatusMessage,
                email_verified AS EmailVerified,
                email_verification_code_hash AS EmailVerificationCodeHash,
                email_verification_expires_at AS EmailVerificationExpiresAt,
                email_verification_sent_at AS EmailVerificationSentAt,
                is_active AS IsActive,
                is_admin AS IsAdmin,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt
            FROM users
            WHERE id = @Id;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<User>(sql, new { Id = id });
    }

    public async Task<IReadOnlyList<User>> SearchAsync(string? query, int take = 50)
    {
        const string sql = """
            SELECT
                id,
                username,
                display_name AS DisplayName,
                email,
                phone_number AS PhoneNumber,
                password_hash AS PasswordHash,
                google_sub AS GoogleSub,
                facebook_user_id AS FacebookUserId,
                auth_provider AS AuthProvider,
                avatar_url AS AvatarUrl,
                status_message AS StatusMessage,
                email_verified AS EmailVerified,
                email_verification_code_hash AS EmailVerificationCodeHash,
                email_verification_expires_at AS EmailVerificationExpiresAt,
                email_verification_sent_at AS EmailVerificationSentAt,
                is_active AS IsActive,
                is_admin AS IsAdmin,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt
            FROM users
            WHERE is_active = TRUE
              AND (
                  @Query IS NULL
                  OR username ILIKE @QueryPattern
                  OR display_name ILIKE @QueryPattern
                  OR email ILIKE @QueryPattern
              )
            ORDER BY is_admin DESC, updated_at DESC
            LIMIT @Take;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<User>(sql, new
        {
            Query = string.IsNullOrWhiteSpace(query) ? null : query.Trim(),
            QueryPattern = $"%{query?.Trim()}%",
            Take = Math.Clamp(take, 1, 100)
        });

        return rows.ToList();
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        const string sql = """
            SELECT
                id,
                username,
                display_name AS DisplayName,
                email,
                phone_number AS PhoneNumber,
                password_hash AS PasswordHash,
                google_sub AS GoogleSub,
                facebook_user_id AS FacebookUserId,
                auth_provider AS AuthProvider,
                avatar_url AS AvatarUrl,
                status_message AS StatusMessage,
                email_verified AS EmailVerified,
                email_verification_code_hash AS EmailVerificationCodeHash,
                email_verification_expires_at AS EmailVerificationExpiresAt,
                email_verification_sent_at AS EmailVerificationSentAt,
                is_active AS IsActive,
                is_admin AS IsAdmin,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt
            FROM users
            WHERE LOWER(email) = LOWER(@Email);
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<User>(sql, new { Email = email });
    }

    public async Task<User?> GetByUsernameAsync(string username)
    {
        const string sql = """
            SELECT
                id,
                username,
                display_name AS DisplayName,
                email,
                phone_number AS PhoneNumber,
                password_hash AS PasswordHash,
                google_sub AS GoogleSub,
                facebook_user_id AS FacebookUserId,
                auth_provider AS AuthProvider,
                avatar_url AS AvatarUrl,
                status_message AS StatusMessage,
                email_verified AS EmailVerified,
                email_verification_code_hash AS EmailVerificationCodeHash,
                email_verification_expires_at AS EmailVerificationExpiresAt,
                email_verification_sent_at AS EmailVerificationSentAt,
                is_active AS IsActive,
                is_admin AS IsAdmin,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt
            FROM users
            WHERE LOWER(username) = LOWER(@Username);
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<User>(sql, new { Username = username });
    }

    public async Task<User?> GetByEmailOrUsernameAsync(string emailOrUsername)
    {
        const string sql = """
            SELECT
                id,
                username,
                display_name AS DisplayName,
                email,
                phone_number AS PhoneNumber,
                password_hash AS PasswordHash,
                google_sub AS GoogleSub,
                facebook_user_id AS FacebookUserId,
                auth_provider AS AuthProvider,
                avatar_url AS AvatarUrl,
                status_message AS StatusMessage,
                email_verified AS EmailVerified,
                email_verification_code_hash AS EmailVerificationCodeHash,
                email_verification_expires_at AS EmailVerificationExpiresAt,
                email_verification_sent_at AS EmailVerificationSentAt,
                is_active AS IsActive,
                is_admin AS IsAdmin,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt
            FROM users
            WHERE LOWER(email) = LOWER(@Value)
               OR LOWER(username) = LOWER(@Value);
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<User>(sql, new { Value = emailOrUsername });
    }

    public async Task<User?> GetByGoogleSubAsync(string googleSub)
    {
        const string sql = """
            SELECT
                id,
                username,
                display_name AS DisplayName,
                email,
                phone_number AS PhoneNumber,
                password_hash AS PasswordHash,
                google_sub AS GoogleSub,
                auth_provider AS AuthProvider,
                avatar_url AS AvatarUrl,
                status_message AS StatusMessage,
                email_verified AS EmailVerified,
                email_verification_code_hash AS EmailVerificationCodeHash,
                email_verification_expires_at AS EmailVerificationExpiresAt,
                email_verification_sent_at AS EmailVerificationSentAt,
                is_active AS IsActive,
                is_admin AS IsAdmin,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt
            FROM users
            WHERE google_sub = @GoogleSub;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<User>(sql, new { GoogleSub = googleSub });
    }

    public async Task CreateAsync(User user)
    {
        const string sql = """
            INSERT INTO users (
                id,
                username,
                display_name,
                email,
                phone_number,
                password_hash,
                google_sub,
                facebook_user_id,
                auth_provider,
                avatar_url,
                status_message,
                email_verified,
                email_verification_code_hash,
                email_verification_expires_at,
                email_verification_sent_at,
                is_active,
                is_admin,
                created_at,
                updated_at
            )
            VALUES (
                @Id,
                @Username,
                @DisplayName,
                @Email,
                @PhoneNumber,
                @PasswordHash,
                @GoogleSub,
                @FacebookUserId,
                @AuthProvider,
                @AvatarUrl,
                @StatusMessage,
                @EmailVerified,
                @EmailVerificationCodeHash,
                @EmailVerificationExpiresAt,
                @EmailVerificationSentAt,
                @IsActive,
                @IsAdmin,
                @CreatedAt,
                @UpdatedAt
            );
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, user);
    }

    public async Task LinkGoogleAsync(User user)
    {
        const string sql = """
            UPDATE users
            SET google_sub = @GoogleSub,
                auth_provider = @AuthProvider,
                avatar_url = @AvatarUrl,
                status_message = @StatusMessage,
                email_verified = @EmailVerified,
                email_verification_code_hash = NULL,
                email_verification_expires_at = NULL,
                email_verification_sent_at = NULL,
                updated_at = NOW()
            WHERE id = @Id;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            user.Id,
            user.GoogleSub,
            user.AuthProvider,
            user.AvatarUrl,
            user.StatusMessage,
            user.EmailVerified
        });
    }

    public async Task<User?> GetByFacebookUserIdAsync(string facebookUserId)
    {
        const string sql = """
            SELECT
                id,
                username,
                display_name AS DisplayName,
                email,
                phone_number AS PhoneNumber,
                password_hash AS PasswordHash,
                google_sub AS GoogleSub,
                facebook_user_id AS FacebookUserId,
                auth_provider AS AuthProvider,
                avatar_url AS AvatarUrl,
                status_message AS StatusMessage,
                email_verified AS EmailVerified,
                is_active AS IsActive,
                is_admin AS IsAdmin,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt
            FROM users
            WHERE facebook_user_id = @FacebookUserId;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<User>(sql, new { FacebookUserId = facebookUserId });
    }

    public async Task LinkFacebookAsync(User user)
    {
        const string sql = """
            UPDATE users
            SET facebook_user_id = @FacebookUserId,
                auth_provider = @AuthProvider,
                avatar_url = @AvatarUrl,
                status_message = @StatusMessage,
                email_verified = @EmailVerified,
                email_verification_code_hash = NULL,
                email_verification_expires_at = NULL,
                email_verification_sent_at = NULL,
                updated_at = NOW()
            WHERE id = @Id;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            user.Id,
            user.FacebookUserId,
            user.AuthProvider,
            user.AvatarUrl,
            user.StatusMessage,
            user.EmailVerified
        });
    }

    public async Task UpdateEmailVerificationAsync(Guid userId, string? codeHash, DateTime? expiresAt, DateTime? sentAt, bool emailVerified)
    {
        const string sql = """
            UPDATE users
            SET email_verification_code_hash = @CodeHash,
                email_verification_expires_at = @ExpiresAt,
                email_verification_sent_at = @SentAt,
                email_verified = @EmailVerified,
                updated_at = NOW()
            WHERE id = @UserId;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            UserId = userId,
            CodeHash = codeHash,
            ExpiresAt = expiresAt,
            SentAt = sentAt,
            EmailVerified = emailVerified
        });
    }

    public async Task UpdateProfileAsync(Guid userId, string displayName, string? phoneNumber, string? avatarUrl, string? statusMessage)
    {
        const string sql = """
            UPDATE users
            SET display_name = @DisplayName,
                phone_number = @PhoneNumber,
                avatar_url = @AvatarUrl,
                status_message = @StatusMessage,
                updated_at = NOW()
            WHERE id = @UserId;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            UserId = userId,
            DisplayName = displayName,
            PhoneNumber = phoneNumber,
            AvatarUrl = avatarUrl,
            StatusMessage = statusMessage
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

    public async Task SetAdminAsync(Guid userId, bool isAdmin)
    {
        const string sql = """
            UPDATE users
            SET is_admin = @IsAdmin,
                updated_at = NOW()
            WHERE id = @UserId;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new
        {
            UserId = userId,
            IsAdmin = isAdmin
        });
    }
}
