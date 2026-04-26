using Bts.Api.Data;
using Dapper;
using Npgsql;

namespace Bts.Api.Services;

public sealed class SquadSchemaService
{
    private readonly DapperContext _context;

    public SquadSchemaService(DapperContext context)
    {
        _context = context;
    }

    public async Task EnsureAsync()
    {
        const string sql = """
            CREATE TABLE IF NOT EXISTS squads (
                id UUID PRIMARY KEY,
                name VARCHAR(80) NOT NULL,
                invite_code VARCHAR(16) NOT NULL UNIQUE,
                created_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS squad_memberships (
                squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                is_owner BOOLEAN NOT NULL DEFAULT FALSE,
                joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
                PRIMARY KEY (squad_id, user_id)
            );

            CREATE INDEX IF NOT EXISTS ix_squad_memberships_user_id
            ON squad_memberships(user_id, joined_at DESC);
            """;

        await using var connection = (NpgsqlConnection)_context.CreateConnection();
        await connection.OpenAsync();
        await connection.ExecuteAsync(sql);
    }
}
