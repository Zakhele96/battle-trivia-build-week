using Bts.Api.Data;
using Dapper;

namespace Bts.Api.Services;

public sealed class UserSchemaService
{
    private readonly DapperContext _context;

    public UserSchemaService(DapperContext context)
    {
        _context = context;
    }

    public async Task EnsureAsync()
    {
        const string sql = """
            ALTER TABLE users
                ADD COLUMN IF NOT EXISTS google_sub TEXT NULL;

            ALTER TABLE users
                ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'local';

            ALTER TABLE users
                ADD COLUMN IF NOT EXISTS avatar_url TEXT NULL;

            ALTER TABLE users
                ADD COLUMN IF NOT EXISTS status_message VARCHAR(120) NULL;

            ALTER TABLE users
                ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

            CREATE UNIQUE INDEX IF NOT EXISTS ux_users_google_sub
                ON users(google_sub)
                WHERE google_sub IS NOT NULL;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql);
    }
}
